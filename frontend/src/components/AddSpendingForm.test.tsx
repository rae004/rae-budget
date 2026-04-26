import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { AddSpendingForm } from "./AddSpendingForm";
import { ToastProvider } from "../contexts/ToastContext";
import type { Category } from "../types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockCategories: Category[] = [
  {
    id: 5,
    name: "Food",
    description: null,
    color: "#f59e0b",
    monthly_target: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
];

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    );
  };
}

async function renderWithCategories(categories: Category[]) {
  mockFetch.mockResolvedValueOnce(jsonResponse(200, categories));
  render(<AddSpendingForm payPeriodId={2} />, { wrapper: createWrapper() });
  await waitFor(() => {
    expect(screen.getByPlaceholderText("What did you buy?")).toBeInTheDocument();
  });
}

describe("AddSpendingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all fields across both rows", async () => {
    await renderWithCategories([]);
    expect(screen.getByPlaceholderText("What did you buy?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Optional notes")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument(); // Category select
    expect(screen.getByRole("button", { name: /Add Spending/i })).toBeInTheDocument();
  });

  it("includes categories in the dropdown when present", async () => {
    await renderWithCategories(mockCategories);
    // Wait for the async useCategories query to populate the dropdown
    expect(await screen.findByRole("option", { name: "Food" })).toBeInTheDocument();
  });

  it("submits a POST with description, amount, and date", async () => {
    await renderWithCategories([]);

    fireEvent.change(screen.getByPlaceholderText("What did you buy?"), {
      target: { value: "Coffee" },
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "4.50" },
    });

    mockFetch.mockResolvedValueOnce(jsonResponse(201, { id: 1 }));
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    fireEvent.click(screen.getByRole("button", { name: /Add Spending/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/pay-periods/2/spending",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"description":"Coffee"'),
        })
      );
    });
  });

  it("includes category_id in the payload when one is selected", async () => {
    await renderWithCategories(mockCategories);

    fireEvent.change(screen.getByPlaceholderText("What did you buy?"), {
      target: { value: "Lunch" },
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "12" },
    });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "5" } });

    mockFetch.mockResolvedValueOnce(jsonResponse(201, { id: 1 }));
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    fireEvent.click(screen.getByRole("button", { name: /Add Spending/i }));

    await waitFor(() => {
      const call = mockFetch.mock.calls.find(
        (c) => c[0] === "/api/pay-periods/2/spending"
      );
      expect(call?.[1]?.body).toContain('"category_id":5');
    });
  });

  it("does not submit when description is missing", async () => {
    await renderWithCategories([]);
    const callsBefore = mockFetch.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: /Add Spending/i }));
    await new Promise((r) => setTimeout(r, 0));
    expect(mockFetch.mock.calls.length).toBe(callsBefore);
  });
});

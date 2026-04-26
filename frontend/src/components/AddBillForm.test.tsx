import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { AddBillForm } from "./AddBillForm";
import { ToastProvider } from "../contexts/ToastContext";
import type { BillTemplate } from "../types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockTemplates: BillTemplate[] = [
  {
    id: 1,
    name: "Rent",
    default_amount: "1500.00",
    due_day_of_month: 1,
    is_recurring: true,
    category_id: null,
    notes: null,
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

async function renderWithTemplates(templates: BillTemplate[]) {
  mockFetch.mockResolvedValueOnce(jsonResponse(200, templates));
  render(<AddBillForm payPeriodId={1} />, { wrapper: createWrapper() });
  // Wait for the templates fetch to settle
  await waitFor(() => {
    expect(screen.getByPlaceholderText("Bill name")).toBeInTheDocument();
  });
}

describe("AddBillForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the core fields", async () => {
    await renderWithTemplates([]);
    expect(screen.getByPlaceholderText("Bill name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Bill/i })).toBeInTheDocument();
  });

  it("does not show the template selector when no templates exist", async () => {
    await renderWithTemplates([]);
    expect(screen.queryByText("Template")).not.toBeInTheDocument();
  });

  it("shows the template selector when templates exist", async () => {
    await renderWithTemplates(mockTemplates);
    // Wait for the async useBillTemplates query to populate the select
    expect(await screen.findByText("Template")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Rent" })).toBeInTheDocument();
  });

  it("populates name and amount when a template is selected", async () => {
    await renderWithTemplates(mockTemplates);
    const select = (await screen.findByRole("combobox")) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "1" } });

    expect((screen.getByPlaceholderText("Bill name") as HTMLInputElement).value).toBe(
      "Rent"
    );
    expect((screen.getByPlaceholderText("0.00") as HTMLInputElement).value).toBe(
      "1500.00"
    );
  });

  it("submits a POST to the pay period's bills endpoint", async () => {
    await renderWithTemplates([]);
    fireEvent.change(screen.getByPlaceholderText("Bill name"), {
      target: { value: "Internet" },
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "75" },
    });

    mockFetch.mockResolvedValueOnce(jsonResponse(201, { id: 1, name: "Internet" }));
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    fireEvent.click(screen.getByRole("button", { name: /Add Bill/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/pay-periods/1/bills",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"name":"Internet"'),
        })
      );
    });
  });

  it("does not submit when name or amount is empty", async () => {
    await renderWithTemplates([]);
    const callsBefore = mockFetch.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: /Add Bill/i }));
    await new Promise((r) => setTimeout(r, 0));
    expect(mockFetch.mock.calls.length).toBe(callsBefore);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { AddSpendingForm } from "./AddSpendingForm";
import { ToastProvider } from "../contexts/ToastContext";
import type { Category, SpendingDescriptionSuggestion } from "../types";

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
  // Catch-all for any other request (e.g., description suggestions fetched
  // by the autocomplete after a debounce tick).
  mockFetch.mockResolvedValue(jsonResponse(200, []));
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
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Spending/i })).toBeInTheDocument();
  });

  it("includes categories in the dropdown when present", async () => {
    await renderWithCategories(mockCategories);
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
      const postCall = mockFetch.mock.calls.find(
        (c) => c[0] === "/api/pay-periods/2/spending" && c[1]?.method === "POST"
      );
      expect(postCall).toBeDefined();
      expect(postCall?.[1]?.body).toContain('"description":"Coffee"');
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
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "5" } });

    mockFetch.mockResolvedValueOnce(jsonResponse(201, { id: 1 }));
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    fireEvent.click(screen.getByRole("button", { name: /Add Spending/i }));

    await waitFor(() => {
      const call = mockFetch.mock.calls.find(
        (c) => c[0] === "/api/pay-periods/2/spending" && c[1]?.method === "POST"
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

  describe("description autofill", () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    async function setup(suggestions: SpendingDescriptionSuggestion[]) {
      mockFetch.mockImplementation((url: string) => {
        if (typeof url === "string" && url.includes("/spending/description-suggestions")) {
          return Promise.resolve(jsonResponse(200, suggestions));
        }
        return Promise.resolve(jsonResponse(200, mockCategories));
      });
      render(<AddSpendingForm payPeriodId={2} />, { wrapper: createWrapper() });
      await waitFor(() => {
        expect(screen.getByPlaceholderText("What did you buy?")).toBeInTheDocument();
      });
    }

    async function typeAndOpenDropdown(text: string) {
      const input = screen.getByPlaceholderText("What did you buy?");
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: text } });
      await act(async () => {
        vi.advanceTimersByTime(250);
      });
      await waitFor(() => {
        expect(
          screen.getByTestId("description-suggestion-list")
        ).toBeInTheDocument();
      });
    }

    it("fills description when a suggestion is selected", async () => {
      await setup([{ description: "Lunch", frequency: 5, last_category_id: 5 }]);
      await typeAndOpenDropdown("L");
      fireEvent.mouseDown(screen.getByRole("button", { name: /Lunch/ }));
      expect(screen.getByPlaceholderText("What did you buy?")).toHaveValue("Lunch");
    });

    it("fills category when none is selected and suggestion carries one", async () => {
      await setup([{ description: "Lunch", frequency: 5, last_category_id: 5 }]);
      await typeAndOpenDropdown("L");
      fireEvent.mouseDown(screen.getByRole("button", { name: /Lunch/ }));
      expect(screen.getByLabelText("Category")).toHaveValue("5");
    });

    it("does not overwrite a category the user already picked", async () => {
      await setup([{ description: "Lunch", frequency: 5, last_category_id: 999 }]);
      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Food" })).toBeInTheDocument();
      });
      fireEvent.change(screen.getByLabelText("Category"), { target: { value: "5" } });
      await typeAndOpenDropdown("L");
      fireEvent.mouseDown(screen.getByRole("button", { name: /Lunch/ }));
      expect(screen.getByLabelText("Category")).toHaveValue("5");
    });

    it("leaves category empty when suggestion has null last_category_id", async () => {
      await setup([{ description: "Lunch", frequency: 5, last_category_id: null }]);
      await typeAndOpenDropdown("L");
      fireEvent.mouseDown(screen.getByRole("button", { name: /Lunch/ }));
      expect(screen.getByLabelText("Category")).toHaveValue("");
    });
  });
});

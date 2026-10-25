import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { SpendingTable } from "./SpendingTable";
import { ToastProvider } from "../contexts/ToastContext";
import type { SpendingEntry, Category, PayPeriod } from "../types";

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

const mockPayPeriods: PayPeriod[] = [
  {
    id: 5,
    start_date: "2026-04-06",
    end_date: "2026-04-20",
    expected_income: "2000.00",
    actual_income: null,
    additional_income: null,
    additional_income_description: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: 6,
    start_date: "2026-04-21",
    end_date: "2026-05-05",
    expected_income: "2000.00",
    actual_income: null,
    additional_income: null,
    additional_income_description: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
];

const baseEntry: SpendingEntry = {
  id: 1,
  pay_period_id: 5,
  category_id: 5,
  description: "Lunch",
  amount: "12.00",
  spent_date: "2026-04-08",
  notes: null,
  created_at: "2026-04-08T00:00:00Z",
  updated_at: "2026-04-08T00:00:00Z",
};

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

function noContentResponse() {
  return { ok: true, status: 204 };
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

function renderTable(entries: SpendingEntry[]) {
  // Component fetches categories and pay periods on mount
  mockFetch.mockResolvedValueOnce(jsonResponse(200, mockCategories));
  mockFetch.mockResolvedValueOnce(jsonResponse(200, mockPayPeriods));
  return render(<SpendingTable entries={entries} payPeriodId={5} />, {
    wrapper: createWrapper(),
  });
}

describe("SpendingTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the empty-state message when there are no entries", () => {
    renderTable([]);
    expect(
      screen.getByText(/No spending entries for this pay period/)
    ).toBeInTheDocument();
  });

  it("renders entries with category badge", async () => {
    renderTable([baseEntry]);
    expect(screen.getByText("Lunch")).toBeInTheDocument();
    // Category name shows up after the categories query resolves
    expect(await screen.findByText("Food")).toBeInTheDocument();
  });

  it("sorts entries by date descending (newest first)", () => {
    const older = { ...baseEntry, id: 1, spent_date: "2026-04-01", description: "Older" };
    const newer = { ...baseEntry, id: 2, spent_date: "2026-04-15", description: "Newer" };
    renderTable([older, newer]);

    const rows = screen.getAllByRole("row");
    // First data row (rows[0] is header) should be the newer entry
    expect(within(rows[1]).getByText("Newer")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Older")).toBeInTheDocument();
  });

  it("running total accumulates top-to-bottom (sorted order)", () => {
    const a = { ...baseEntry, id: 1, spent_date: "2026-04-01", amount: "10.00" };
    const b = { ...baseEntry, id: 2, spent_date: "2026-04-15", amount: "25.00" };
    renderTable([a, b]);

    // Newer (25) is row 1 → running total $25; Older (10) is row 2 → running total $35
    // Running total cell uses .font-mono to differentiate from amount.
    const rows = screen.getAllByRole("row");
    const row1RunningTotal = rows[1].querySelector(".font-mono");
    const row2RunningTotal = rows[2].querySelector(".font-mono");
    expect(row1RunningTotal).toHaveTextContent("$25.00");
    expect(row2RunningTotal).toHaveTextContent("$35.00");
  });

  it("shows footer total summing all entries", () => {
    const a = { ...baseEntry, id: 1, amount: "10.00" };
    const b = { ...baseEntry, id: 2, amount: "25.00" };
    renderTable([a, b]);
    // Footer Total = 35.00
    expect(screen.getAllByText("$35.00").length).toBeGreaterThanOrEqual(1);
  });

  it("Edit reveals inputs and Cancel exits", () => {
    renderTable([baseEntry]);
    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
    expect(screen.getByDisplayValue("Lunch")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(screen.queryByDisplayValue("Lunch")).not.toBeInTheDocument();
  });

  it("Save in edit mode PUTs the new values", async () => {
    renderTable([baseEntry]);

    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
    fireEvent.change(screen.getByDisplayValue("Lunch"), {
      target: { value: "Brunch" },
    });

    mockFetch.mockResolvedValueOnce(jsonResponse(200, { ...baseEntry, description: "Brunch" }));
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    const editingRow = screen.getByDisplayValue("Brunch").closest("tr")!;
    fireEvent.click(within(editingRow).getByRole("button", { name: /Save/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/spending/1",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"description":"Brunch"'),
        })
      );
    });
  });

  it("Save after changing the pay period PUTs the new pay_period_id", async () => {
    renderTable([baseEntry]);

    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
    const select = await screen.findByLabelText("Pay period");
    // Wait for the pay periods query to resolve so the "6" option exists.
    await waitFor(() => expect(within(select).getAllByRole("option")).toHaveLength(2));
    fireEvent.change(select, {
      target: { value: "6" },
    });

    mockFetch.mockResolvedValueOnce(jsonResponse(200, { ...baseEntry, pay_period_id: 6 }));
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/spending/1",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"pay_period_id":6'),
        })
      );
    });
  });

  it("Delete confirms then DELETEs", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderTable([baseEntry]);

    mockFetch.mockResolvedValueOnce(noContentResponse());
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    fireEvent.click(screen.getByRole("button", { name: /Delete/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/spending/1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("Delete does nothing when the user cancels the confirm", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderTable([baseEntry]);
    const before = mockFetch.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
    expect(mockFetch.mock.calls.length).toBe(before);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { BillsTable } from "./BillsTable";
import { ToastProvider } from "../contexts/ToastContext";
import type { PayPeriodBill } from "../types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const baseBill: PayPeriodBill = {
  id: 1,
  pay_period_id: 5,
  bill_template_id: null,
  name: "Rent",
  amount: "1500.00",
  due_date: "2026-04-01",
  is_paid: false,
  paid_date: null,
  notes: null,
  created_at: "2026-04-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
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

describe("BillsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the empty-state message when there are no bills", () => {
    render(<BillsTable bills={[]} payPeriodId={5} />, { wrapper: createWrapper() });
    expect(screen.getByText(/No bills for this pay period/)).toBeInTheDocument();
  });

  it("renders a row per bill with formatted amount", () => {
    render(<BillsTable bills={[baseBill]} payPeriodId={5} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getAllByText("$1,500.00").length).toBeGreaterThan(0);
  });

  it("shows a footer total summing all bills", () => {
    const bills = [
      baseBill,
      { ...baseBill, id: 2, name: "Internet", amount: "75.00" },
    ];
    render(<BillsTable bills={bills} payPeriodId={5} />, { wrapper: createWrapper() });
    // Footer total = 1500 + 75 = 1575
    expect(screen.getByText("$1,575.00")).toBeInTheDocument();
  });

  it("toggling the paid checkbox PUTs is_paid=true with today's date", async () => {
    render(<BillsTable bills={[baseBill]} payPeriodId={5} />, {
      wrapper: createWrapper(),
    });

    mockFetch.mockResolvedValueOnce(jsonResponse(200, { ...baseBill, is_paid: true }));
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/bills/1",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"is_paid":true'),
        })
      );
    });
  });

  it("Edit puts the row into edit mode with current values", () => {
    render(<BillsTable bills={[baseBill]} payPeriodId={5} />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
    expect(screen.getByDisplayValue("Rent")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1500.00")).toBeInTheDocument();
  });

  it("Save in edit mode PUTs the new values", async () => {
    render(<BillsTable bills={[baseBill]} payPeriodId={5} />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));

    fireEvent.change(screen.getByDisplayValue("Rent"), {
      target: { value: "Mortgage" },
    });
    fireEvent.change(screen.getByDisplayValue("1500.00"), {
      target: { value: "1600" },
    });

    mockFetch.mockResolvedValueOnce(jsonResponse(200, { ...baseBill, name: "Mortgage" }));
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    const editingRow = screen.getByDisplayValue("Mortgage").closest("tr")!;
    fireEvent.click(within(editingRow).getByRole("button", { name: /Save/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/bills/1",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"name":"Mortgage"'),
        })
      );
    });
  });

  it("Cancel exits edit mode without firing a PUT", () => {
    render(<BillsTable bills={[baseBill]} payPeriodId={5} />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
    const editingRow = screen.getByDisplayValue("Rent").closest("tr")!;

    const before = mockFetch.mock.calls.length;
    fireEvent.click(within(editingRow).getByRole("button", { name: /Cancel/i }));

    expect(screen.queryByDisplayValue("Rent")).not.toBeInTheDocument();
    expect(mockFetch.mock.calls.length).toBe(before);
  });

  it("Delete confirms then DELETEs", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<BillsTable bills={[baseBill]} payPeriodId={5} />, {
      wrapper: createWrapper(),
    });

    mockFetch.mockResolvedValueOnce(noContentResponse());
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    fireEvent.click(screen.getByRole("button", { name: /Delete/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/bills/1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("Delete does nothing when the user cancels the confirm dialog", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<BillsTable bills={[baseBill]} payPeriodId={5} />, {
      wrapper: createWrapper(),
    });

    const before = mockFetch.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
    expect(mockFetch.mock.calls.length).toBe(before);
  });
});

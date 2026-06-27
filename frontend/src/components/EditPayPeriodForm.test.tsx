import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { EditPayPeriodForm } from "./EditPayPeriodForm";
import { ToastProvider } from "../contexts/ToastContext";
import type { PayPeriodDetail } from "../types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

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

const samplePayPeriod: PayPeriodDetail = {
  id: 7,
  start_date: "2026-06-06",
  end_date: "2026-06-19",
  expected_income: "2000.00",
  actual_income: null,
  additional_income: null,
  additional_income_description: null,
  notes: null,
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
  summary: {
    bill_total: "0.00",
    spending_total: "0.00",
    running_total: "2000.00",
    remaining: "2000.00",
  },
};

function renderForm(onClose = vi.fn()) {
  render(<EditPayPeriodForm payPeriod={samplePayPeriod} onClose={onClose} />, {
    wrapper: createWrapper(),
  });
  return { onClose };
}

describe("EditPayPeriodForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: bill templates query returns one template, so the
    // date-change repopulate path is exercised.
    mockFetch.mockImplementation((url: string) => {
      if (String(url).startsWith("/api/bill-templates")) {
        return Promise.resolve(
          jsonResponse(200, [{ id: 1, name: "Rent", default_amount: "500" }])
        );
      }
      return Promise.resolve(jsonResponse(200, {}));
    });
  });

  it("pre-fills the existing values", () => {
    renderForm();
    expect(screen.getByDisplayValue("2026-06-06")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-06-19")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2000.00")).toBeInTheDocument();
  });

  it("Save with only income changed PUTs but does NOT repopulate bills", async () => {
    const { onClose } = renderForm();

    // Let the templates query resolve first so we're proving the date-change
    // gate (not just an empty template list) suppresses repopulate.
    await waitFor(() =>
      expect(
        mockFetch.mock.calls.some((c) =>
          String(c[0]).startsWith("/api/bill-templates")
        )
      ).toBe(true)
    );

    fireEvent.change(screen.getByDisplayValue("2000.00"), {
      target: { value: "2500" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());

    const calls = mockFetch.mock.calls.map((c) => c[0]);
    expect(
      calls.some((u) => u === "/api/pay-periods/7")
    ).toBe(true);
    expect(
      calls.some((u) => String(u).includes("repopulate-bills"))
    ).toBe(false);
  });

  it("Save after changing dates PUTs and triggers repopulate-bills", async () => {
    const { onClose } = renderForm();

    fireEvent.change(screen.getByDisplayValue("2026-06-06"), {
      target: { value: "2026-06-07" },
    });
    fireEvent.change(screen.getByDisplayValue("2026-06-19"), {
      target: { value: "2026-06-25" },
    });
    // Wait for the templates query to resolve — the hint only renders once
    // both the date has changed and templates are loaded.
    await screen.findByText(/re-add template bills/i);
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());

    const putCall = mockFetch.mock.calls.find(
      (c) => c[0] === "/api/pay-periods/7" && c[1]?.method === "PUT"
    );
    expect(putCall).toBeTruthy();
    expect(putCall?.[1]?.body).toContain('"end_date":"2026-06-25"');

    const repopCall = mockFetch.mock.calls.find((c) =>
      String(c[0]).includes("/api/pay-periods/7/repopulate-bills")
    );
    expect(repopCall).toBeTruthy();
    expect(repopCall?.[1]?.method).toBe("POST");
  });

  it("Save with end date before start date does not PUT", async () => {
    renderForm();

    fireEvent.change(screen.getByDisplayValue("2026-06-19"), {
      target: { value: "2026-06-01" },
    });

    const callsBefore = mockFetch.mock.calls.filter(
      (c) => c[1]?.method === "PUT"
    ).length;
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    await new Promise((r) => setTimeout(r, 50));
    const callsAfter = mockFetch.mock.calls.filter(
      (c) => c[1]?.method === "PUT"
    ).length;
    expect(callsAfter).toBe(callsBefore);
  });

  it("Cancel calls onClose without a PUT", () => {
    const { onClose } = renderForm();
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
    expect(
      mockFetch.mock.calls.some((c) => c[1]?.method === "PUT")
    ).toBe(false);
  });

  it("includes edited notes and actual income in the PUT body", async () => {
    const { onClose } = renderForm();

    fireEvent.change(screen.getByLabelText(/Actual Income/i), {
      target: { value: "1950.50" },
    });
    fireEvent.change(screen.getByLabelText(/Notes/i), {
      target: { value: "Short month" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());

    const putCall = mockFetch.mock.calls.find(
      (c) => c[0] === "/api/pay-periods/7" && c[1]?.method === "PUT"
    );
    expect(putCall?.[1]?.body).toContain('"actual_income":1950.5');
    expect(putCall?.[1]?.body).toContain('"notes":"Short month"');
  });

  it("clears notes and actual income to null when emptied", async () => {
    const { onClose } = renderForm();

    fireEvent.change(screen.getByLabelText(/Actual Income/i), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText(/Notes/i), {
      target: { value: "  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());

    const putCall = mockFetch.mock.calls.find(
      (c) => c[0] === "/api/pay-periods/7" && c[1]?.method === "PUT"
    );
    expect(putCall?.[1]?.body).toContain('"actual_income":null');
    expect(putCall?.[1]?.body).toContain('"notes":null');
  });

  it("keeps the form open when the PUT fails", async () => {
    const { onClose } = renderForm();
    mockFetch.mockImplementation((url: string) => {
      if (String(url) === "/api/pay-periods/7") {
        return Promise.resolve(jsonResponse(500, { error: "boom" }));
      }
      return Promise.resolve(jsonResponse(200, {}));
    });

    fireEvent.change(screen.getByDisplayValue("2000.00"), {
      target: { value: "2500" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    // Save button returns to its enabled label and onClose never fired.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Save/i })).toBeEnabled()
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("still closes when the PUT succeeds but repopulate fails", async () => {
    const { onClose } = renderForm();
    // Wait for templates so the repopulate path is taken.
    await screen.findByDisplayValue("2026-06-19");
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes("repopulate-bills")) {
        return Promise.resolve(jsonResponse(500, { error: "nope" }));
      }
      if (String(url).startsWith("/api/bill-templates")) {
        return Promise.resolve(
          jsonResponse(200, [{ id: 1, name: "Rent", default_amount: "500" }])
        );
      }
      return Promise.resolve(jsonResponse(200, {}));
    });

    fireEvent.change(screen.getByDisplayValue("2026-06-19"), {
      target: { value: "2026-06-25" },
    });
    await screen.findByText(/re-add template bills/i);
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const repopCall = mockFetch.mock.calls.find((c) =>
      String(c[0]).includes("repopulate-bills")
    );
    expect(repopCall).toBeTruthy();
  });
});

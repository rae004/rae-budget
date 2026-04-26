import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Dashboard } from "./Dashboard";
import { ToastProvider } from "../contexts/ToastContext";
import type { PayPeriod, PayPeriodDetail } from "../types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockPayPeriod: PayPeriod = {
  id: 1,
  start_date: "2026-04-06",
  end_date: "2026-04-19",
  expected_income: "2500.00",
  actual_income: null,
  additional_income: null,
  additional_income_description: null,
  notes: null,
  created_at: "2026-04-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

const mockPayPeriodDetail: PayPeriodDetail = {
  ...mockPayPeriod,
  summary: {
    bill_total: "0.00",
    spending_total: "0.00",
    running_total: "0.00",
    remaining: "2500.00",
  },
};

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

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a spinner while pay periods load", () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<Dashboard />, { wrapper: createWrapper() });
    expect(container.querySelector(".loading-spinner")).toBeInTheDocument();
  });

  it("shows the welcome message when no pay periods exist", async () => {
    // /pay-periods → empty
    mockFetch.mockResolvedValue(jsonResponse(200, []));
    render(<Dashboard />, { wrapper: createWrapper() });
    expect(
      await screen.findByText(/Welcome! Create your first pay period/)
    ).toBeInTheDocument();
  });

  it("auto-selects the first pay period and renders the summary", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/pay-periods") return Promise.resolve(jsonResponse(200, [mockPayPeriod]));
      if (url === `/api/pay-periods/1`) return Promise.resolve(jsonResponse(200, mockPayPeriodDetail));
      // bills, spending, suggest, bill-templates, categories — all empty
      return Promise.resolve(jsonResponse(200, []));
    });

    render(<Dashboard />, { wrapper: createWrapper() });
    // Summary card title
    await waitFor(() => {
      expect(screen.getByText(/Pay Period:/)).toBeInTheDocument();
    });
    // Bills section header
    expect(screen.getByText("Bills")).toBeInTheDocument();
    // Additional Spending section header
    expect(screen.getByText("Additional Spending")).toBeInTheDocument();
  });

  it("renders the New Pay Period button regardless of state", async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, []));
    render(<Dashboard />, { wrapper: createWrapper() });
    expect(
      await screen.findByRole("button", { name: /\+ New Pay Period/i })
    ).toBeInTheDocument();
  });
});

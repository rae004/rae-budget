import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { PayPeriodForm } from "./PayPeriodForm";
import { ToastProvider } from "../contexts/ToastContext";

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

describe("PayPeriodForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for the suggestion + bill-templates queries that fire on mount
    mockFetch.mockResolvedValue(
      jsonResponse(200, { start_date: "2026-04-06", end_date: "2026-04-19" })
    );
  });

  it("shows just the trigger button by default", () => {
    render(<PayPeriodForm />, { wrapper: createWrapper() });
    expect(
      screen.getByRole("button", { name: /\+ New Pay Period/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Create New Pay Period/)).not.toBeInTheDocument();
  });

  it("clicking the trigger reveals the form", () => {
    render(<PayPeriodForm />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /\+ New Pay Period/i }));
    expect(screen.getByText("Create New Pay Period")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Create$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
  });

  it("auto-fills suggested dates after the suggestion query resolves", async () => {
    render(<PayPeriodForm />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /\+ New Pay Period/i }));
    // Two date inputs — wait for the first one to populate
    await waitFor(() => {
      const dateInputs = screen
        .getAllByDisplayValue(/2026-04/)
        .filter((el) => (el as HTMLInputElement).type === "date");
      expect(dateInputs.length).toBeGreaterThan(0);
    });
  });

  it("Cancel returns to the trigger-only state", () => {
    render(<PayPeriodForm />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /\+ New Pay Period/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(screen.queryByText(/Create New Pay Period/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /\+ New Pay Period/i })
    ).toBeInTheDocument();
  });

  it("submits POST with populate_bills query param when the toggle is on", async () => {
    const { container } = render(<PayPeriodForm />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /\+ New Pay Period/i }));

    // Labels in this form aren't htmlFor-linked — query date inputs directly
    const dateInputs = container.querySelectorAll(
      'input[type="date"]'
    ) as NodeListOf<HTMLInputElement>;
    fireEvent.change(dateInputs[0], { target: { value: "2026-05-01" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-05-14" } });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "2500" },
    });

    mockFetch.mockResolvedValueOnce(jsonResponse(201, { id: 1 }));
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    fireEvent.click(screen.getByRole("button", { name: /^Create$/i }));

    await waitFor(() => {
      const createCall = mockFetch.mock.calls.find(
        (c) => c[0]?.includes("/pay-periods") && c[1]?.method === "POST"
      );
      expect(createCall).toBeTruthy();
      // populateBills defaults to true
      expect(createCall?.[0]).toContain("populate_bills=true");
    });
  });

  it("calls onSuccess after a successful create", async () => {
    const onSuccess = vi.fn();
    const { container } = render(<PayPeriodForm onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(screen.getByRole("button", { name: /\+ New Pay Period/i }));

    const dateInputs = container.querySelectorAll(
      'input[type="date"]'
    ) as NodeListOf<HTMLInputElement>;
    fireEvent.change(dateInputs[0], { target: { value: "2026-05-01" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-05-14" } });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "2500" },
    });

    mockFetch.mockResolvedValueOnce(jsonResponse(201, { id: 99 }));

    fireEvent.click(screen.getByRole("button", { name: /^Create$/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});

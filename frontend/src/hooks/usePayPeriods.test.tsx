import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { usePayPeriods, useSuggestedPayPeriod } from "./usePayPeriods";
import { api } from "../services/api";
import type { PayPeriod } from "../types";

// Mock the api module
vi.mock("../services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockPayPeriods: PayPeriod[] = [
  {
    id: 1,
    start_date: "2026-04-06",
    end_date: "2026-04-19",
    expected_income: "2500.00",
    actual_income: null,
    additional_income: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: 2,
    start_date: "2026-04-20",
    end_date: "2026-05-05",
    expected_income: "2500.00",
    actual_income: "2600.00",
    additional_income: null,
    notes: "Bonus",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("usePayPeriods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches pay periods successfully", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(mockPayPeriods);

    const { result } = renderHook(() => usePayPeriods(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPayPeriods);
    expect(api.get).toHaveBeenCalledWith("/pay-periods");
  });

  it("handles error when fetching pay periods", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => usePayPeriods(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe("useSuggestedPayPeriod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches suggested dates successfully", async () => {
    const mockSuggestion = {
      start_date: "2026-04-06",
      end_date: "2026-04-19",
    };
    vi.mocked(api.get).mockResolvedValueOnce(mockSuggestion);

    const { result } = renderHook(() => useSuggestedPayPeriod(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSuggestion);
    expect(api.get).toHaveBeenCalledWith("/pay-periods/suggest");
  });
});

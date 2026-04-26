import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Settings } from "./Settings";
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

describe("Settings page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Categories fetch from CategoryManagement
    mockFetch.mockResolvedValue(jsonResponse(200, []));
  });

  it("renders the three top-level sections", async () => {
    render(<Settings />, { wrapper: createWrapper() });
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Categories" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data Management" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "About Rae Budget" })).toBeInTheDocument();
  });

  it("renders the categories section with the management UI", async () => {
    render(<Settings />, { wrapper: createWrapper() });
    expect(
      await screen.findByText(/Categories help organize your bills/)
    ).toBeInTheDocument();
  });

  it("renders the about section with version info", () => {
    render(<Settings />, { wrapper: createWrapper() });
    expect(screen.getByText(/Version:/)).toBeInTheDocument();
    expect(screen.getByText(/Stack:/)).toBeInTheDocument();
  });
});

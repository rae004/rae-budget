import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { BillTemplates } from "./BillTemplates";
import { ToastProvider } from "../contexts/ToastContext";
import type { BillTemplate } from "../types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockTemplate: BillTemplate = {
  id: 1,
  name: "Rent",
  default_amount: "1500.00",
  due_day_of_month: 1,
  is_recurring: true,
  category_id: null,
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

describe("BillTemplates page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the empty-state message when there are no templates", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, []));
    render(<BillTemplates />, { wrapper: createWrapper() });
    expect(await screen.findByText(/No bill templates yet/)).toBeInTheDocument();
  });

  it("renders template rows with formatted amount and ordinal due day", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, [mockTemplate]));
    render(<BillTemplates />, { wrapper: createWrapper() });
    expect(await screen.findByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("$1,500.00")).toBeInTheDocument();
    expect(screen.getByText("1st")).toBeInTheDocument();
  });

  it("submits a POST when the add form is filled and submitted", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, []));
    render(<BillTemplates />, { wrapper: createWrapper() });
    await screen.findByText(/No bill templates yet/);

    fireEvent.change(screen.getByPlaceholderText("e.g., Rent, Electric"), {
      target: { value: "Internet" },
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "75" },
    });

    mockFetch.mockResolvedValueOnce(jsonResponse(201, { ...mockTemplate, name: "Internet" }));
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    fireEvent.click(screen.getByRole("button", { name: /Add Template/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/bill-templates",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"name":"Internet"'),
        })
      );
    });
  });

  it("Delete confirms then DELETEs", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockFetch.mockResolvedValueOnce(jsonResponse(200, [mockTemplate]));
    render(<BillTemplates />, { wrapper: createWrapper() });
    await screen.findByText("Rent");

    mockFetch.mockResolvedValueOnce(noContentResponse());
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    fireEvent.click(screen.getByRole("button", { name: /Delete/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/bill-templates/1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { DataManagement } from "./DataManagement";
import { ToastProvider } from "../contexts/ToastContext";
import type { DataExport, ResetResult } from "../types";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock URL methods
vi.stubGlobal("URL", {
  ...URL,
  createObjectURL: vi.fn(() => "blob:test-url"),
  revokeObjectURL: vi.fn(),
});

// Mock anchor element click to prevent jsdom navigation error
const mockClick = vi.fn();
const originalCreateElement = document.createElement.bind(document);
vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
  const element = originalCreateElement(tagName);
  if (tagName === "a") {
    element.click = mockClick;
  }
  return element;
});

const mockExportData: DataExport = {
  export_version: "1.0",
  export_date: "2026-04-05T10:00:00Z",
  data: {
    categories: [{ name: "Food", description: null, color: "#f59e0b" }],
    bill_templates: [
      {
        name: "Rent",
        default_amount: "1500.00",
        due_day_of_month: 1,
        is_recurring: true,
        category_name: null,
        notes: null,
      },
    ],
    pay_periods: [
      {
        start_date: "2026-04-06",
        end_date: "2026-04-19",
        expected_income: "2500.00",
        actual_income: null,
        notes: null,
        bills: [
          {
            name: "Rent",
            amount: "1500.00",
            due_date: "2026-04-01",
            is_paid: false,
            paid_date: null,
            notes: null,
            bill_template_name: "Rent",
          },
        ],
        spending_entries: [
          {
            description: "Groceries",
            amount: "50.00",
            spent_date: "2026-04-07",
            category_name: "Food",
            notes: null,
          },
        ],
      },
    ],
  },
};

const mockResetResult: ResetResult = {
  categories_deleted: 1,
  bill_templates_deleted: 1,
  pay_periods_deleted: 1,
  bills_deleted: 1,
  spending_entries_deleted: 1,
};

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

describe("DataManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Export Section", () => {
    it("renders export button and description", () => {
      render(<DataManagement />, { wrapper: createWrapper() });

      expect(
        screen.getByRole("button", { name: /Export Data/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Download all your data as a JSON file/)
      ).toBeInTheDocument();
    });

    it("calls export endpoint on button click", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExportData),
      });

      render(<DataManagement />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByRole("button", { name: /Export Data/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/data/export");
      });
    });

    it("disables button during export", async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(pendingPromise);

      render(<DataManagement />, { wrapper: createWrapper() });

      const exportButton = screen.getByRole("button", { name: /Export Data/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(exportButton).toBeDisabled();
      });

      // Resolve the promise to clean up
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(mockExportData),
      });
    });
  });

  describe("Import Section", () => {
    it("renders import section with file input", () => {
      render(<DataManagement />, { wrapper: createWrapper() });

      expect(
        screen.getByText(/Import data from a previously exported JSON file/)
      ).toBeInTheDocument();

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      expect(fileInput.accept).toBe(".json");
    });

    it("has disabled import button initially", () => {
      render(<DataManagement />, { wrapper: createWrapper() });

      const importButton = screen.getByRole("button", {
        name: /^Import Data$/i,
      });
      expect(importButton).toBeDisabled();
    });
  });

  describe("Reset Section", () => {
    it("renders reset button with danger styling", () => {
      render(<DataManagement />, { wrapper: createWrapper() });

      const resetButton = screen.getByRole("button", {
        name: /Reset All Data/i,
      });
      expect(resetButton).toBeInTheDocument();
      expect(resetButton).toHaveClass("btn-error");
    });

    it("shows confirmation modal when clicking reset button", () => {
      render(<DataManagement />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByRole("button", { name: /Reset All Data/i }));

      expect(screen.getByText("Warning: Data Deletion")).toBeInTheDocument();
      expect(
        screen.getByText(/This will permanently delete ALL your data/)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Type DELETE to confirm")
      ).toBeInTheDocument();
    });

    it("disables delete button until DELETE is typed", () => {
      render(<DataManagement />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByRole("button", { name: /Reset All Data/i }));

      const deleteButton = screen.getByRole("button", {
        name: /Delete All Data/i,
      });
      expect(deleteButton).toBeDisabled();

      const input = screen.getByPlaceholderText("Type DELETE to confirm");
      fireEvent.change(input, { target: { value: "DELETE" } });

      expect(deleteButton).not.toBeDisabled();
    });

    it("enables delete button only with exact DELETE text", () => {
      render(<DataManagement />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByRole("button", { name: /Reset All Data/i }));

      const deleteButton = screen.getByRole("button", {
        name: /Delete All Data/i,
      });
      const input = screen.getByPlaceholderText("Type DELETE to confirm");

      fireEvent.change(input, { target: { value: "delete" } });
      expect(deleteButton).toBeDisabled();

      fireEvent.change(input, { target: { value: "DELET" } });
      expect(deleteButton).toBeDisabled();

      fireEvent.change(input, { target: { value: "DELETE " } });
      expect(deleteButton).toBeDisabled();

      fireEvent.change(input, { target: { value: "DELETE" } });
      expect(deleteButton).not.toBeDisabled();
    });

    it("closes modal when clicking cancel", () => {
      render(<DataManagement />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByRole("button", { name: /Reset All Data/i }));
      expect(screen.getByText("Warning: Data Deletion")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

      expect(
        screen.queryByText("Warning: Data Deletion")
      ).not.toBeInTheDocument();
    });

    it("calls reset endpoint when confirmed", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResetResult),
      });

      render(<DataManagement />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByRole("button", { name: /Reset All Data/i }));

      const input = screen.getByPlaceholderText("Type DELETE to confirm");
      fireEvent.change(input, { target: { value: "DELETE" } });

      fireEvent.click(screen.getByRole("button", { name: /Delete All Data/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/data/reset", {
          method: "DELETE",
          headers: { "X-Confirm-Reset": "DELETE-ALL-DATA" },
        });
      });
    });

    it("closes modal after successful reset", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResetResult),
      });

      render(<DataManagement />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByRole("button", { name: /Reset All Data/i }));

      const input = screen.getByPlaceholderText("Type DELETE to confirm");
      fireEvent.change(input, { target: { value: "DELETE" } });

      fireEvent.click(screen.getByRole("button", { name: /Delete All Data/i }));

      await waitFor(() => {
        expect(
          screen.queryByText("Warning: Data Deletion")
        ).not.toBeInTheDocument();
      });
    });
  });
});

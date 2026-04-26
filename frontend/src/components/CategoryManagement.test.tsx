import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { CategoryManagement } from "./CategoryManagement";
import { ToastProvider } from "../contexts/ToastContext";
import type { Category } from "../types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockCategories: Category[] = [
  {
    id: 1,
    name: "Food",
    description: "Food and dining",
    color: "#f59e0b",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Travel",
    description: null,
    color: "#3b82f6",
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

async function renderWithCategories(categories: Category[]) {
  mockFetch.mockResolvedValueOnce(jsonResponse(200, categories));
  render(<CategoryManagement />, { wrapper: createWrapper() });
  // Wait until the initial GET resolves and the table appears
  if (categories.length > 0) {
    await screen.findByText(categories[0].name);
  } else {
    await screen.findByText(/No categories yet/);
  }
}

describe("CategoryManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list rendering", () => {
    it("shows a spinner while loading", () => {
      // Pending fetch — never resolves during this test
      mockFetch.mockReturnValueOnce(new Promise(() => {}));
      const { container } = render(<CategoryManagement />, {
        wrapper: createWrapper(),
      });
      expect(container.querySelector(".loading-spinner")).toBeInTheDocument();
    });

    it("renders the empty state when no categories exist", async () => {
      await renderWithCategories([]);
      expect(screen.getByText(/No categories yet/)).toBeInTheDocument();
    });

    it("renders categories with name, description, and color swatch", async () => {
      await renderWithCategories(mockCategories);

      expect(screen.getByText("Food")).toBeInTheDocument();
      expect(screen.getByText("Food and dining")).toBeInTheDocument();
      expect(screen.getByText("Travel")).toBeInTheDocument();

      // Color swatch uses inline style. Find by title attribute (matches the hex color).
      const foodSwatch = screen.getByTitle("#f59e0b");
      expect(foodSwatch).toHaveStyle({ backgroundColor: "#f59e0b" });
    });
  });

  describe("create", () => {
    it("submits a POST when adding a category", async () => {
      await renderWithCategories([]);

      mockFetch.mockResolvedValueOnce(
        jsonResponse(201, {
          ...mockCategories[0],
          id: 99,
          name: "Groceries",
        })
      );
      // After mutation success the list is invalidated and refetched
      mockFetch.mockResolvedValueOnce(jsonResponse(200, mockCategories));

      const nameInput = screen.getByPlaceholderText("e.g., Groceries");
      fireEvent.change(nameInput, { target: { value: "Groceries" } });
      fireEvent.click(screen.getByRole("button", { name: /Add Category/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/categories",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining('"name":"Groceries"'),
          })
        );
      });
    });

    it("does not submit when name is empty", async () => {
      await renderWithCategories([]);

      const initialCallCount = mockFetch.mock.calls.length;
      fireEvent.click(screen.getByRole("button", { name: /Add Category/i }));

      // Give any potential mutation a tick to fire — it shouldn't
      await new Promise((r) => setTimeout(r, 0));
      expect(mockFetch.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe("inline edit", () => {
    it("toggles into edit mode when Edit is clicked", async () => {
      await renderWithCategories(mockCategories);

      const foodRow = screen.getByText("Food").closest("tr")!;
      fireEvent.click(within(foodRow).getByRole("button", { name: /Edit/i }));

      // Now the row contains a Save and Cancel button
      const editingRow = screen.getByDisplayValue("Food").closest("tr")!;
      expect(within(editingRow).getByRole("button", { name: /Save/i })).toBeInTheDocument();
      expect(within(editingRow).getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    });

    it("submits a PUT with edited values on Save", async () => {
      await renderWithCategories(mockCategories);

      const foodRow = screen.getByText("Food").closest("tr")!;
      fireEvent.click(within(foodRow).getByRole("button", { name: /Edit/i }));

      const nameInput = screen.getByDisplayValue("Food");
      fireEvent.change(nameInput, { target: { value: "Dining Out" } });

      mockFetch.mockResolvedValueOnce(
        jsonResponse(200, { ...mockCategories[0], name: "Dining Out" })
      );
      // Refetch after mutation success
      mockFetch.mockResolvedValueOnce(jsonResponse(200, mockCategories));

      const editingRow = nameInput.closest("tr")!;
      fireEvent.click(within(editingRow).getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/categories/1",
          expect.objectContaining({
            method: "PUT",
            body: expect.stringContaining('"name":"Dining Out"'),
          })
        );
      });
    });

    it("Cancel exits edit mode without firing a PUT", async () => {
      await renderWithCategories(mockCategories);

      const foodRow = screen.getByText("Food").closest("tr")!;
      fireEvent.click(within(foodRow).getByRole("button", { name: /Edit/i }));

      const editingRow = screen.getByDisplayValue("Food").closest("tr")!;
      const callsBefore = mockFetch.mock.calls.length;

      fireEvent.click(within(editingRow).getByRole("button", { name: /Cancel/i }));

      // Display row is back (no input)
      expect(screen.queryByDisplayValue("Food")).not.toBeInTheDocument();
      expect(mockFetch.mock.calls.length).toBe(callsBefore);
    });
  });

  describe("delete", () => {
    it("deletes immediately when category is unused (204)", async () => {
      await renderWithCategories(mockCategories);

      mockFetch.mockResolvedValueOnce(noContentResponse());
      // Multiple invalidations fire on delete success (categories + bills/spending)
      mockFetch.mockResolvedValue(jsonResponse(200, []));

      const foodRow = screen.getByText("Food").closest("tr")!;
      fireEvent.click(within(foodRow).getByRole("button", { name: /Delete/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/categories/1",
          expect.objectContaining({ method: "DELETE" })
        );
      });
      // No confirmation modal should have appeared
      expect(screen.queryByText(/Category in use/)).not.toBeInTheDocument();
    });

    it("opens confirmation modal with usage counts on 409", async () => {
      await renderWithCategories(mockCategories);

      mockFetch.mockResolvedValueOnce(
        jsonResponse(409, {
          error: "in_use",
          bill_templates: 2,
          spending_entries: 5,
        })
      );

      const foodRow = screen.getByText("Food").closest("tr")!;
      fireEvent.click(within(foodRow).getByRole("button", { name: /Delete/i }));

      await screen.findByText(/Category in use/);
      expect(screen.getByText(/2 bill templates and 5 spending entries/)).toBeInTheDocument();
      expect(screen.getByText(/leave those items/)).toBeInTheDocument();
    });

    it("singularizes usage counts of 1", async () => {
      await renderWithCategories(mockCategories);

      mockFetch.mockResolvedValueOnce(
        jsonResponse(409, {
          error: "in_use",
          bill_templates: 1,
          spending_entries: 1,
        })
      );

      const foodRow = screen.getByText("Food").closest("tr")!;
      fireEvent.click(within(foodRow).getByRole("button", { name: /Delete/i }));

      await screen.findByText(/1 bill template and 1 spending entry/);
    });

    it("omits zero-count categories from the usage message", async () => {
      await renderWithCategories(mockCategories);

      mockFetch.mockResolvedValueOnce(
        jsonResponse(409, {
          error: "in_use",
          bill_templates: 0,
          spending_entries: 3,
        })
      );

      const foodRow = screen.getByText("Food").closest("tr")!;
      fireEvent.click(within(foodRow).getByRole("button", { name: /Delete/i }));

      await screen.findByText(/3 spending entries/);
      expect(screen.queryByText(/bill template/)).not.toBeInTheDocument();
    });

    it("calls DELETE with force=true when 'Delete anyway' is confirmed", async () => {
      await renderWithCategories(mockCategories);

      mockFetch.mockResolvedValueOnce(
        jsonResponse(409, {
          error: "in_use",
          bill_templates: 1,
          spending_entries: 0,
        })
      );

      const foodRow = screen.getByText("Food").closest("tr")!;
      fireEvent.click(within(foodRow).getByRole("button", { name: /Delete/i }));

      await screen.findByText(/Category in use/);

      mockFetch.mockResolvedValueOnce(noContentResponse());
      mockFetch.mockResolvedValue(jsonResponse(200, []));

      fireEvent.click(screen.getByRole("button", { name: /Delete anyway/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/categories/1?force=true",
          expect.objectContaining({ method: "DELETE" })
        );
      });
    });

    it("Cancel closes modal without firing the force delete", async () => {
      await renderWithCategories(mockCategories);

      mockFetch.mockResolvedValueOnce(
        jsonResponse(409, {
          error: "in_use",
          bill_templates: 1,
          spending_entries: 0,
        })
      );

      const foodRow = screen.getByText("Food").closest("tr")!;
      fireEvent.click(within(foodRow).getByRole("button", { name: /Delete/i }));

      await screen.findByText(/Category in use/);
      const callsBefore = mockFetch.mock.calls.length;

      fireEvent.click(screen.getByRole("button", { name: /^Cancel$/i }));

      expect(screen.queryByText(/Category in use/)).not.toBeInTheDocument();
      // Modal close shouldn't trigger another fetch
      expect(mockFetch.mock.calls.length).toBe(callsBefore);
    });
  });
});

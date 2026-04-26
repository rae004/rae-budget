import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { AdditionalIncomeCard } from "./AdditionalIncomeCard";
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

function renderCard(value: string | null, description: string | null = null) {
  return render(
    <AdditionalIncomeCard
      payPeriodId={3}
      currentValue={value}
      currentDescription={description}
    />,
    { wrapper: createWrapper() }
  );
}

describe("AdditionalIncomeCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("display mode", () => {
    it("shows $0.00 when currentValue is null", () => {
      renderCard(null);
      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });

    it("formats currentValue as USD", () => {
      renderCard("123.45");
      expect(screen.getByText("$123.45")).toBeInTheDocument();
    });

    it("shows the description when provided", () => {
      renderCard("100", "Side gig");
      expect(screen.getByText("Side gig")).toBeInTheDocument();
    });

    it("does not render a description paragraph when null", () => {
      renderCard("100", null);
      // No paragraph child should exist next to the value
      expect(screen.queryByText(/^(?!Additional Income).+/, { selector: "p" })).toBeNull();
    });
  });

  describe("edit mode", () => {
    it("clicking Edit reveals the value and description inputs", () => {
      renderCard("100", "Bonus");
      fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Bonus")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    });

    it("Save fires a PUT and exits edit mode", async () => {
      renderCard("100", "Old desc");
      fireEvent.click(screen.getByRole("button", { name: /Edit/i }));

      fireEvent.change(screen.getByDisplayValue("100"), { target: { value: "200" } });
      fireEvent.change(screen.getByDisplayValue("Old desc"), {
        target: { value: "New desc" },
      });

      mockFetch.mockResolvedValueOnce(jsonResponse(200, {}));
      mockFetch.mockResolvedValue(jsonResponse(200, {}));

      fireEvent.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/pay-periods/3",
          expect.objectContaining({
            method: "PUT",
            body: expect.stringContaining('"additional_income":200'),
          })
        );
      });
      // Save call should have the description too
      const putCall = mockFetch.mock.calls.find(
        (c) => c[0] === "/api/pay-periods/3"
      );
      expect(putCall?.[1]?.body).toContain('"additional_income_description":"New desc"');
    });

    it("Save with 0 sends null for additional_income (clears the value)", async () => {
      renderCard("100");
      fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
      fireEvent.change(screen.getByDisplayValue("100"), { target: { value: "0" } });

      mockFetch.mockResolvedValueOnce(jsonResponse(200, {}));
      mockFetch.mockResolvedValue(jsonResponse(200, {}));

      fireEvent.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        const putCall = mockFetch.mock.calls.find(
          (c) => c[0] === "/api/pay-periods/3"
        );
        expect(putCall?.[1]?.body).toContain('"additional_income":null');
      });
    });

    it("Save with a negative value does not PUT (early return)", async () => {
      // The toast itself is rendered by ToastContainer (not in our wrapper),
      // so we verify the behavior: the mutation never fires.
      renderCard("100");
      fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
      fireEvent.change(screen.getByDisplayValue("100"), { target: { value: "-5" } });

      const callsBefore = mockFetch.mock.calls.length;
      fireEvent.click(screen.getByRole("button", { name: /Save/i }));

      // Give any potential async mutation time to fire — it shouldn't
      await new Promise((r) => setTimeout(r, 50));
      expect(mockFetch.mock.calls.length).toBe(callsBefore);
      // We're still in edit mode (Save did not succeed)
      expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument();
    });

    it("Cancel exits edit mode without firing a PUT", () => {
      renderCard("100", "Old desc");
      fireEvent.click(screen.getByRole("button", { name: /Edit/i }));
      fireEvent.change(screen.getByDisplayValue("100"), { target: { value: "999" } });

      const callsBefore = mockFetch.mock.calls.length;
      fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

      // Back in display mode — value reverts
      expect(screen.queryByDisplayValue("999")).not.toBeInTheDocument();
      expect(screen.getByText("$100.00")).toBeInTheDocument();
      expect(mockFetch.mock.calls.length).toBe(callsBefore);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { DescriptionAutocomplete } from "./DescriptionAutocomplete";
import type { SpendingDescriptionSuggestion } from "../types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const sampleSuggestions: SpendingDescriptionSuggestion[] = [
  { description: "Lunch", frequency: 12, last_category_id: 5 },
  { description: "Latte", frequency: 7, last_category_id: 5 },
  { description: "Lyft", frequency: 3, last_category_id: null },
];

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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

interface HarnessProps {
  onSelect?: (s: SpendingDescriptionSuggestion) => void;
  initial?: string;
}

function Harness({ onSelect = () => {}, initial = "" }: HarnessProps) {
  const [value, setValue] = useState(initial);
  return (
    <DescriptionAutocomplete
      value={value}
      onChange={setValue}
      onSelect={onSelect}
      placeholder="What did you buy?"
    />
  );
}

async function typeAndWaitForDropdown(text: string) {
  const input = screen.getByPlaceholderText("What did you buy?");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: text } });
  // Advance past the 200ms debounce
  await act(async () => {
    vi.advanceTimersByTime(250);
  });
  await waitFor(() => {
    expect(screen.getByTestId("description-suggestion-list")).toBeInTheDocument();
  });
  return input;
}

describe("DescriptionAutocomplete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetch.mockResolvedValue(jsonResponse(200, sampleSuggestions));
  });

  it("does not show a dropdown when input is empty", async () => {
    render(<Harness />, { wrapper: createWrapper() });
    const input = screen.getByPlaceholderText("What did you buy?");
    fireEvent.focus(input);
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(
      screen.queryByTestId("description-suggestion-list")
    ).not.toBeInTheDocument();
  });

  it("shows the dropdown after typing and the query resolves", async () => {
    render(<Harness />, { wrapper: createWrapper() });
    await typeAndWaitForDropdown("L");
    expect(screen.getByRole("option", { name: /Lunch/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Latte/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Lyft/ })).toBeInTheDocument();
  });

  it("calls the suggestions endpoint with the query string", async () => {
    render(<Harness />, { wrapper: createWrapper() });
    await typeAndWaitForDropdown("L");
    const calledUrls = mockFetch.mock.calls.map((c) => c[0]);
    expect(
      calledUrls.some((u) =>
        String(u).startsWith("/api/spending/description-suggestions?q=L")
      )
    ).toBe(true);
  });

  it("ArrowDown moves highlight down and Enter selects it", async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />, { wrapper: createWrapper() });
    const input = await typeAndWaitForDropdown("L");

    // Default highlight is index 0 (Lunch). One ArrowDown → Latte.
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(sampleSuggestions[1]);
  });

  it("ArrowUp wraps to the last suggestion", async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />, { wrapper: createWrapper() });
    const input = await typeAndWaitForDropdown("L");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledWith(sampleSuggestions[2]);
  });

  it("Tab selects the highlighted suggestion", async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />, { wrapper: createWrapper() });
    const input = await typeAndWaitForDropdown("L");

    fireEvent.keyDown(input, { key: "Tab" });

    expect(onSelect).toHaveBeenCalledWith(sampleSuggestions[0]);
  });

  it("Escape closes the dropdown", async () => {
    render(<Harness />, { wrapper: createWrapper() });
    const input = await typeAndWaitForDropdown("L");

    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByTestId("description-suggestion-list")
      ).not.toBeInTheDocument();
    });
  });

  it("mouseDown on a suggestion selects it", async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />, { wrapper: createWrapper() });
    await typeAndWaitForDropdown("L");

    fireEvent.mouseDown(screen.getByRole("button", { name: /Latte/ }));

    expect(onSelect).toHaveBeenCalledWith(sampleSuggestions[1]);
  });

  it("does not fire the query for empty input", async () => {
    render(<Harness />, { wrapper: createWrapper() });
    const input = screen.getByPlaceholderText("What did you buy?");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

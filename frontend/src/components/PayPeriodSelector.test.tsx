import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PayPeriodSelector } from "./PayPeriodSelector";
import type { PayPeriod } from "../types";

const mockPeriods: PayPeriod[] = [
  {
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
  },
  {
    id: 2,
    start_date: "2026-04-20",
    end_date: "2026-05-05",
    expected_income: "2500.00",
    actual_income: null,
    additional_income: null,
    additional_income_description: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
];

describe("PayPeriodSelector", () => {
  it("shows the empty-state message when there are no pay periods", () => {
    render(<PayPeriodSelector payPeriods={[]} selectedId={undefined} onSelect={() => {}} />);
    expect(screen.getByText(/No pay periods yet/)).toBeInTheDocument();
  });

  it("renders one option per pay period", () => {
    render(
      <PayPeriodSelector payPeriods={mockPeriods} selectedId={1} onSelect={() => {}} />
    );
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
  });

  it("calls onSelect with the parsed numeric id when changed", () => {
    const onSelect = vi.fn();
    render(
      <PayPeriodSelector payPeriods={mockPeriods} selectedId={1} onSelect={onSelect} />
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("reflects selectedId on the underlying select element", () => {
    render(
      <PayPeriodSelector payPeriods={mockPeriods} selectedId={2} onSelect={() => {}} />
    );
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("2");
  });
});

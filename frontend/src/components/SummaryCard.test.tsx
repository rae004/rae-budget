import { describe, it, expect } from "vitest";
import { render, screen } from "../test/utils";
import { SummaryCard } from "./SummaryCard";
import type { PayPeriodDetail } from "../types";

const mockPayPeriod: PayPeriodDetail = {
  id: 1,
  start_date: "2026-04-06",
  end_date: "2026-04-19",
  expected_income: "2500.00",
  actual_income: null,
  additional_income: null,
  notes: null,
  created_at: "2026-04-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
  summary: {
    bill_total: "1500.00",
    spending_total: "150.00",
    running_total: "1650.00",
    remaining: "850.00",
  },
};

describe("SummaryCard", () => {
  it("renders pay period dates", () => {
    render(<SummaryCard payPeriod={mockPayPeriod} />);

    // Check that Pay Period header exists with dates
    expect(screen.getByRole("heading")).toHaveTextContent(/Pay Period:/);
    expect(screen.getByRole("heading")).toHaveTextContent(/Apr/);
    expect(screen.getByRole("heading")).toHaveTextContent(/2026/);
  });

  it("displays expected income", () => {
    render(<SummaryCard payPeriod={mockPayPeriod} />);

    expect(screen.getByText("Expected Income")).toBeInTheDocument();
    expect(screen.getByText("$2,500.00")).toBeInTheDocument();
  });

  it("displays bill total", () => {
    render(<SummaryCard payPeriod={mockPayPeriod} />);

    expect(screen.getByText("Bills Total")).toBeInTheDocument();
    expect(screen.getByText("$1,500.00")).toBeInTheDocument();
  });

  it("displays spending total", () => {
    render(<SummaryCard payPeriod={mockPayPeriod} />);

    expect(screen.getByText("Spending Total")).toBeInTheDocument();
    expect(screen.getByText("$150.00")).toBeInTheDocument();
  });

  it("displays running total", () => {
    render(<SummaryCard payPeriod={mockPayPeriod} />);

    expect(screen.getByText("Running Total")).toBeInTheDocument();
    expect(screen.getByText("$1,650.00")).toBeInTheDocument();
  });

  it("displays positive remaining in success color", () => {
    render(<SummaryCard payPeriod={mockPayPeriod} />);

    expect(screen.getByText("Remaining")).toBeInTheDocument();
    const remainingValue = screen.getByText("$850.00");
    expect(remainingValue).toBeInTheDocument();
    expect(remainingValue).toHaveClass("text-success");
  });

  it("displays negative remaining in error color", () => {
    const negativePayPeriod: PayPeriodDetail = {
      ...mockPayPeriod,
      summary: {
        ...mockPayPeriod.summary,
        remaining: "-200.00",
      },
    };

    render(<SummaryCard payPeriod={negativePayPeriod} />);

    const remainingValue = screen.getByText("-$200.00");
    expect(remainingValue).toBeInTheDocument();
    expect(remainingValue).toHaveClass("text-error");
  });

  it("shows actual income when provided", () => {
    const payPeriodWithActual: PayPeriodDetail = {
      ...mockPayPeriod,
      actual_income: "2600.00",
    };

    render(<SummaryCard payPeriod={payPeriodWithActual} />);

    expect(screen.getByText(/Actual: \$2,600.00/)).toBeInTheDocument();
  });

  it("shows notes when provided", () => {
    const payPeriodWithNotes: PayPeriodDetail = {
      ...mockPayPeriod,
      notes: "Bonus month",
    };

    render(<SummaryCard payPeriod={payPeriodWithNotes} />);

    expect(screen.getByText("Bonus month")).toBeInTheDocument();
  });

  it("does not show notes section when notes are null", () => {
    render(<SummaryCard payPeriod={mockPayPeriod} />);

    expect(screen.queryByText("Notes:")).not.toBeInTheDocument();
  });
});

// Category
export interface Category {
  id: number;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

// Pay Period
export interface PayPeriodSummary {
  bill_total: string;
  spending_total: string;
  running_total: string;
  remaining: string;
}

export interface PayPeriod {
  id: number;
  start_date: string;
  end_date: string;
  expected_income: string;
  actual_income: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayPeriodDetail extends PayPeriod {
  summary: PayPeriodSummary;
}

export interface PayPeriodCreate {
  start_date: string;
  end_date: string;
  expected_income: number;
  actual_income?: number | null;
  notes?: string | null;
}

export interface PayPeriodUpdate {
  start_date?: string;
  end_date?: string;
  expected_income?: number;
  actual_income?: number | null;
  notes?: string | null;
}

// Bill Template
export interface BillTemplate {
  id: number;
  name: string;
  default_amount: string;
  due_day_of_month: number | null;
  is_recurring: boolean;
  category_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillTemplateCreate {
  name: string;
  default_amount: number;
  due_day_of_month?: number | null;
  is_recurring?: boolean;
  category_id?: number | null;
  notes?: string | null;
}

export interface BillTemplateUpdate {
  name?: string;
  default_amount?: number;
  due_day_of_month?: number | null;
  is_recurring?: boolean;
  category_id?: number | null;
  notes?: string | null;
}

// Pay Period Bill
export interface PayPeriodBill {
  id: number;
  pay_period_id: number;
  bill_template_id: number | null;
  name: string;
  amount: string;
  due_date: string | null;
  is_paid: boolean;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayPeriodBillCreate {
  name: string;
  amount: number;
  bill_template_id?: number | null;
  due_date?: string | null;
  is_paid?: boolean;
  paid_date?: string | null;
  notes?: string | null;
}

export interface PayPeriodBillUpdate {
  name?: string;
  amount?: number;
  due_date?: string | null;
  is_paid?: boolean;
  paid_date?: string | null;
  notes?: string | null;
}

// Spending Entry
export interface SpendingEntry {
  id: number;
  pay_period_id: number;
  category_id: number | null;
  description: string;
  amount: string;
  spent_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpendingEntryCreate {
  description: string;
  amount: number;
  spent_date: string;
  category_id?: number | null;
  notes?: string | null;
}

export interface SpendingEntryUpdate {
  description?: string;
  amount?: number;
  spent_date?: string;
  category_id?: number | null;
  notes?: string | null;
}

// API Error
export interface ApiError {
  error: string | object[];
}

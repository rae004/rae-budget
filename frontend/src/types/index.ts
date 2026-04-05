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
  additional_income: string | null;
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
  additional_income?: number | null;
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

// Data Export/Import/Reset Types
export interface CategoryExport {
  name: string;
  description: string | null;
  color: string;
}

export interface BillTemplateExport {
  name: string;
  default_amount: string;
  due_day_of_month: number | null;
  is_recurring: boolean;
  category_name: string | null;
  notes: string | null;
}

export interface PayPeriodBillExport {
  name: string;
  amount: string;
  due_date: string | null;
  is_paid: boolean;
  paid_date: string | null;
  notes: string | null;
  bill_template_name: string | null;
}

export interface SpendingEntryExport {
  description: string;
  amount: string;
  spent_date: string;
  category_name: string | null;
  notes: string | null;
}

export interface PayPeriodExport {
  start_date: string;
  end_date: string;
  expected_income: string;
  actual_income: string | null;
  additional_income: string | null;
  notes: string | null;
  bills: PayPeriodBillExport[];
  spending_entries: SpendingEntryExport[];
}

export interface DataExportData {
  categories: CategoryExport[];
  bill_templates: BillTemplateExport[];
  pay_periods: PayPeriodExport[];
}

export interface DataExport {
  export_version: string;
  export_date: string;
  data: DataExportData;
}

export interface ImportResult {
  categories_created: number;
  categories_skipped: number;
  bill_templates_created: number;
  bill_templates_skipped: number;
  pay_periods_created: number;
  bills_created: number;
  spending_entries_created: number;
}

export interface ResetResult {
  categories_deleted: number;
  bill_templates_deleted: number;
  pay_periods_deleted: number;
  bills_deleted: number;
  spending_entries_deleted: number;
}

export interface RepopulateBillsResult {
  pay_periods_updated: number;
  total_bills_deleted: number;
  total_bills_created: number;
}

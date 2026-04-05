-- rae-budget database schema
-- Initial setup for pay periods, bills, spending, and categories

-- Categories table for organizing spending entries
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6b7280',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pay periods table
CREATE TABLE IF NOT EXISTS pay_periods (
    id SERIAL PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    expected_income DECIMAL(10, 2) NOT NULL,
    actual_income DECIMAL(10, 2),
    additional_income DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Bill templates (recurring bills)
CREATE TABLE IF NOT EXISTS bill_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    default_amount DECIMAL(10, 2) NOT NULL,
    due_day_of_month INTEGER CHECK (due_day_of_month >= 1 AND due_day_of_month <= 31),
    is_recurring BOOLEAN DEFAULT TRUE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pay period bills (instance of a bill for a specific pay period)
CREATE TABLE IF NOT EXISTS pay_period_bills (
    id SERIAL PRIMARY KEY,
    pay_period_id INTEGER NOT NULL REFERENCES pay_periods(id) ON DELETE CASCADE,
    bill_template_id INTEGER REFERENCES bill_templates(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spending entries
CREATE TABLE IF NOT EXISTS spending_entries (
    id SERIAL PRIMARY KEY,
    pay_period_id INTEGER NOT NULL REFERENCES pay_periods(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    spent_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pay_periods_dates ON pay_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pay_period_bills_pay_period ON pay_period_bills(pay_period_id);
CREATE INDEX IF NOT EXISTS idx_pay_period_bills_due_date ON pay_period_bills(due_date);
CREATE INDEX IF NOT EXISTS idx_spending_entries_pay_period ON spending_entries(pay_period_id);
CREATE INDEX IF NOT EXISTS idx_spending_entries_category ON spending_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_spending_entries_date ON spending_entries(spent_date);

-- Insert default categories
INSERT INTO categories (name, description, color) VALUES
    ('Housing', 'Rent, mortgage, property taxes', '#3b82f6'),
    ('Utilities', 'Electric, gas, water, internet', '#10b981'),
    ('Food', 'Groceries and dining out', '#f59e0b'),
    ('Transportation', 'Gas, car payment, insurance, transit', '#8b5cf6'),
    ('Healthcare', 'Medical, dental, prescriptions', '#ef4444'),
    ('Entertainment', 'Streaming, games, events', '#ec4899'),
    ('Shopping', 'Clothing, household items', '#06b6d4'),
    ('Personal', 'Personal care, subscriptions', '#84cc16'),
    ('Savings', 'Emergency fund, investments', '#14b8a6'),
    ('Other', 'Miscellaneous expenses', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_pay_periods_updated_at
    BEFORE UPDATE ON pay_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_bill_templates_updated_at
    BEFORE UPDATE ON bill_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_pay_period_bills_updated_at
    BEFORE UPDATE ON pay_period_bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_spending_entries_updated_at
    BEFORE UPDATE ON spending_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

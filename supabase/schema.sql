-- Pre-Approval Letter Generator Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  nmls VARCHAR(50) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(50),
  address_zip VARCHAR(20),
  logo_url TEXT,
  primary_color VARCHAR(20) DEFAULT '#1e40af',
  secondary_color VARCHAR(20) DEFAULT '#64748b',
  arive_api_key TEXT,
  arive_company_id VARCHAR(100),
  resend_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'loan_officer' CHECK (role IN ('admin', 'loan_officer', 'processor', 'viewer')),
  nmls VARCHAR(50),
  phone VARCHAR(50),
  avatar_url TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Borrowers table
CREATE TABLE borrowers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  arive_borrower_id VARCHAR(100),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  ssn_last_four VARCHAR(4),
  date_of_birth DATE,
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(50),
  address_zip VARCHAR(20),
  employer_name VARCHAR(255),
  job_title VARCHAR(100),
  employment_type VARCHAR(50),
  years_employed DECIMAL(4,2),
  monthly_income DECIMAL(12,2),
  annual_income DECIMAL(12,2),
  credit_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Letter templates table
CREATE TABLE letter_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  loan_type VARCHAR(50) DEFAULT 'all',
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Letters table
CREATE TABLE letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  template_id UUID REFERENCES letter_templates(id),
  borrower_id UUID NOT NULL REFERENCES borrowers(id),
  co_borrower_id UUID REFERENCES borrowers(id),
  arive_loan_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'sent', 'viewed', 'expired', 'revoked')),
  loan_type VARCHAR(50) NOT NULL,
  loan_purpose VARCHAR(50) NOT NULL,
  loan_amount DECIMAL(12,2) NOT NULL,
  down_payment_amount DECIMAL(12,2),
  down_payment_percent DECIMAL(5,2),
  interest_rate DECIMAL(5,3),
  loan_term INTEGER NOT NULL,
  pre_approval_amount DECIMAL(12,2) NOT NULL,
  property_type VARCHAR(50),
  property_occupancy VARCHAR(50),
  property_address VARCHAR(255),
  property_city VARCHAR(100),
  property_state VARCHAR(50),
  property_zip VARCHAR(20),
  expiration_date DATE NOT NULL,
  letter_content TEXT NOT NULL,
  notes TEXT,
  conditions TEXT[],
  sent_to_emails TEXT[],
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Letter versions table (for version history)
CREATE TABLE letter_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  letter_content TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email logs table
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  sent_by UUID NOT NULL REFERENCES users(id),
  sent_to VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'failed')),
  resend_id VARCHAR(100),
  error_message TEXT,
  opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Borrower portal access table
CREATE TABLE borrower_portal_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
  access_token UUID NOT NULL DEFAULT uuid_generate_v4(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_letters_company_id ON letters(company_id);
CREATE INDEX idx_letters_borrower_id ON letters(borrower_id);
CREATE INDEX idx_letters_status ON letters(status);
CREATE INDEX idx_letters_expiration ON letters(expiration_date);
CREATE INDEX idx_letters_created_at ON letters(created_at);
CREATE INDEX idx_borrowers_company_id ON borrowers(company_id);
CREATE INDEX idx_borrowers_email ON borrowers(email);
CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrower_portal_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only see their own company's data
CREATE POLICY "Users can view their company"
  ON companies FOR SELECT
  USING (id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Users can view other users in their company
CREATE POLICY "Users can view company users"
  ON users FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Users can view their company's borrowers
CREATE POLICY "Users can view company borrowers"
  ON borrowers FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create borrowers"
  ON borrowers FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update company borrowers"
  ON borrowers FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Letters policies
CREATE POLICY "Users can view company letters"
  ON letters FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create letters"
  ON letters FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update company letters"
  ON letters FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Templates policies
CREATE POLICY "Users can view company templates"
  ON letter_templates FOR SELECT
  USING (
    company_id IS NULL OR
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Functions

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_borrowers_updated_at
  BEFORE UPDATE ON borrowers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_letters_updated_at
  BEFORE UPDATE ON letters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_letter_templates_updated_at
  BEFORE UPDATE ON letter_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-expire letters
CREATE OR REPLACE FUNCTION expire_old_letters()
RETURNS void AS $$
BEGIN
  UPDATE letters
  SET status = 'expired', updated_at = NOW()
  WHERE expiration_date < CURRENT_DATE
    AND status IN ('issued', 'sent');
END;
$$ language 'plpgsql';

-- Insert default templates (global, not company-specific)
INSERT INTO letter_templates (id, company_id, name, description, loan_type, content, is_default, is_active)
VALUES
  (
    uuid_generate_v4(),
    NULL,
    'Standard Conventional',
    'Standard pre-approval letter for conventional loans',
    'conventional',
    '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">Standard conventional template content here...</div>',
    true,
    true
  ),
  (
    uuid_generate_v4(),
    NULL,
    'FHA Pre-Approval',
    'Pre-approval letter for FHA loans',
    'fha',
    '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">FHA template content here...</div>',
    true,
    true
  ),
  (
    uuid_generate_v4(),
    NULL,
    'VA Pre-Approval',
    'Pre-approval letter for VA loans',
    'va',
    '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">VA template content here...</div>',
    true,
    true
  );

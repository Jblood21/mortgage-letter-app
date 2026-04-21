// Database types for Supabase

export type UserRole = 'admin' | 'loan_officer' | 'processor' | 'viewer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  nmls?: string;
  phone?: string;
  avatar_url?: string;
  company_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  nmls: string;
  phone?: string;
  email?: string;
  website?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  arive_api_key?: string;
  arive_company_id?: string;
  resend_api_key?: string;
  created_at: string;
  updated_at: string;
}

export interface Borrower {
  id: string;
  company_id: string;
  arive_borrower_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ssn_last_four?: string;
  date_of_birth?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  employer_name?: string;
  job_title?: string;
  employment_type?: string;
  years_employed?: number;
  monthly_income?: number;
  annual_income?: number;
  credit_score?: number;
  created_at: string;
  updated_at: string;
}

export interface Letter {
  id: string;
  company_id: string;
  created_by: string;
  template_id: string;
  borrower_id: string;
  co_borrower_id?: string;
  arive_loan_id?: string;
  status: 'draft' | 'issued' | 'sent' | 'viewed' | 'expired' | 'revoked';
  loan_type: string;
  loan_purpose: string;
  loan_amount: number;
  down_payment_amount: number;
  down_payment_percent: number;
  interest_rate?: number;
  loan_term: number;
  pre_approval_amount: number;
  property_type: string;
  property_occupancy: string;
  property_address?: string;
  property_city?: string;
  property_state?: string;
  property_zip?: string;
  expiration_date: string;
  letter_content: string;
  notes?: string;
  conditions?: string[];
  sent_to_emails?: string[];
  sent_at?: string;
  viewed_at?: string;
  signed_at?: string;
  signature_url?: string;
  created_at: string;
  updated_at: string;
}

export interface LetterVersion {
  id: string;
  letter_id: string;
  version_number: number;
  letter_content: string;
  changed_by: string;
  change_summary?: string;
  created_at: string;
}

export interface LetterTemplate {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  loan_type: string;
  content: string;
  is_default: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  company_id: string;
  user_id: string;
  action: string;
  entity_type: 'letter' | 'borrower' | 'template' | 'user' | 'company';
  entity_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface EmailLog {
  id: string;
  company_id: string;
  letter_id: string;
  sent_by: string;
  sent_to: string;
  subject: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'failed';
  resend_id?: string;
  error_message?: string;
  opened_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'letter_expiring' | 'letter_viewed' | 'letter_signed' | 'new_arive_loan' | 'system';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface BorrowerPortalAccess {
  id: string;
  letter_id: string;
  borrower_id: string;
  access_token: string;
  expires_at: string;
  last_accessed_at?: string;
  created_at: string;
}

// Arive API Types
export interface AriveLoan {
  loanId: string;
  loanNumber: string;
  borrower: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    ssn?: string;
    dateOfBirth?: string;
    currentAddress?: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  coBorrower?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  loanInfo: {
    loanType: string;
    loanPurpose: string;
    loanAmount: number;
    purchasePrice?: number;
    interestRate?: number;
    loanTerm: number;
  };
  propertyInfo?: {
    address: string;
    city: string;
    state: string;
    zip: string;
    propertyType: string;
    occupancy: string;
  };
  employment?: {
    employerName: string;
    jobTitle: string;
    yearsEmployed: number;
    monthlyIncome: number;
  };
  creditInfo?: {
    creditScore: number;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface AnalyticsSummary {
  totalLetters: number;
  activeLetters: number;
  expiredLetters: number;
  sentLetters: number;
  viewedLetters: number;
  signedLetters: number;
  totalPreApprovalAmount: number;
  averagePreApprovalAmount: number;
  conversionRate: number;
  lettersByLoanType: Record<string, number>;
  lettersByMonth: { month: string; count: number }[];
  topLoanOfficers: { name: string; count: number; amount: number }[];
}

// Core types for the Mortgage Pre-Approval Letter App

export interface Borrower {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ssn?: string;
  dateOfBirth?: string;
  currentAddress: Address;
  employmentInfo: EmploymentInfo;
  incomeInfo: IncomeInfo;
  creditScore?: number;
}

export interface CoBorrower extends Borrower {
  relationship: 'spouse' | 'domestic_partner' | 'other';
}

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zipCode: string;
  yearsAtAddress?: number;
}

export interface EmploymentInfo {
  employerName: string;
  employerAddress?: Address;
  jobTitle: string;
  yearsEmployed: number;
  monthsEmployed?: number;
  employmentType: 'W2' | 'self_employed' | '1099' | 'retired' | 'other';
  employerPhone?: string;
}

export interface IncomeInfo {
  monthlyGrossIncome: number;
  annualIncome: number;
  additionalIncome?: number;
  incomeSource?: string;
  otherIncomeDescription?: string;
}

export interface PropertyInfo {
  address?: Address;
  propertyType: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'manufactured' | 'tbd';
  occupancy: 'primary' | 'secondary' | 'investment';
  estimatedValue?: number;
  purchasePrice?: number;
}

export interface LoanInfo {
  loanType: 'conventional' | 'fha' | 'va' | 'usda' | 'jumbo' | 'other';
  loanPurpose: 'purchase' | 'refinance' | 'cash_out_refinance';
  loanAmount: number;
  downPaymentAmount: number;
  downPaymentPercent: number;
  interestRate?: number;
  loanTerm: 15 | 20 | 30;
  estimatedMonthlyPayment?: number;
  ltv?: number;
  dti?: number;
  preApprovalAmount: number;
  expirationDate: string;
}

export interface LoanOfficerInfo {
  name: string;
  title: string;
  nmls: string;
  phone: string;
  email: string;
  companyName: string;
  companyNmls: string;
  companyAddress?: Address;
  companyPhone?: string;
  companyLogo?: string;
  personalPhoto?: string;
}

export interface RealEstateAgentInfo {
  name: string;
  title?: string;
  licenseNumber?: string;
  phone: string;
  email: string;
  brokerageName: string;
  brokeragePhone?: string;
  brokerageLogo?: string;
  personalPhoto?: string;
}

export interface PreApprovalLetter {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'issued' | 'expired' | 'revoked';
  templateId: string;
  borrower: Borrower;
  coBorrower?: CoBorrower;
  property: PropertyInfo;
  loan: LoanInfo;
  loanOfficer: LoanOfficerInfo;
  realEstateAgent?: RealEstateAgentInfo;
  letterContent: string;
  notes?: string;
  conditions?: string[];
}

export interface LetterTemplate {
  id: string;
  name: string;
  description?: string;
  loanType: LoanInfo['loanType'] | 'all';
  content: string;
  variables: TemplateVariable[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  key: string;
  label: string;
  category: 'borrower' | 'property' | 'loan' | 'loanOfficer' | 'dates' | 'custom';
  description?: string;
  format?: 'currency' | 'date' | 'percent' | 'phone' | 'text' | 'address';
}

// Available template variables
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // Borrower variables
  { key: '{{borrower.fullName}}', label: 'Borrower Full Name', category: 'borrower' },
  { key: '{{borrower.firstName}}', label: 'Borrower First Name', category: 'borrower' },
  { key: '{{borrower.lastName}}', label: 'Borrower Last Name', category: 'borrower' },
  { key: '{{borrower.email}}', label: 'Borrower Email', category: 'borrower' },
  { key: '{{borrower.phone}}', label: 'Borrower Phone', category: 'borrower', format: 'phone' },
  { key: '{{borrower.address}}', label: 'Borrower Address', category: 'borrower', format: 'address' },

  // Co-Borrower variables
  { key: '{{coBorrower.fullName}}', label: 'Co-Borrower Full Name', category: 'borrower' },
  { key: '{{coBorrower.firstName}}', label: 'Co-Borrower First Name', category: 'borrower' },
  { key: '{{borrowersNames}}', label: 'All Borrower Names', category: 'borrower' },

  // Property variables
  { key: '{{property.address}}', label: 'Property Address', category: 'property', format: 'address' },
  { key: '{{property.type}}', label: 'Property Type', category: 'property' },
  { key: '{{property.occupancy}}', label: 'Occupancy Type', category: 'property' },
  { key: '{{property.purchasePrice}}', label: 'Purchase Price', category: 'property', format: 'currency' },

  // Loan variables
  { key: '{{loan.preApprovalAmount}}', label: 'Pre-Approval Amount', category: 'loan', format: 'currency' },
  { key: '{{loan.loanAmount}}', label: 'Loan Amount', category: 'loan', format: 'currency' },
  { key: '{{loan.downPayment}}', label: 'Down Payment', category: 'loan', format: 'currency' },
  { key: '{{loan.downPaymentPercent}}', label: 'Down Payment %', category: 'loan', format: 'percent' },
  { key: '{{loan.type}}', label: 'Loan Type', category: 'loan' },
  { key: '{{loan.term}}', label: 'Loan Term (years)', category: 'loan' },
  { key: '{{loan.interestRate}}', label: 'Interest Rate', category: 'loan', format: 'percent' },
  { key: '{{loan.monthlyPayment}}', label: 'Est. Monthly Payment', category: 'loan', format: 'currency' },
  { key: '{{loan.ltv}}', label: 'LTV', category: 'loan', format: 'percent' },

  // Loan Officer variables
  { key: '{{loanOfficer.name}}', label: 'Loan Officer Name', category: 'loanOfficer' },
  { key: '{{loanOfficer.title}}', label: 'Loan Officer Title', category: 'loanOfficer' },
  { key: '{{loanOfficer.nmls}}', label: 'Loan Officer NMLS#', category: 'loanOfficer' },
  { key: '{{loanOfficer.phone}}', label: 'Loan Officer Phone', category: 'loanOfficer', format: 'phone' },
  { key: '{{loanOfficer.email}}', label: 'Loan Officer Email', category: 'loanOfficer' },
  { key: '{{company.name}}', label: 'Company Name', category: 'loanOfficer' },
  { key: '{{company.nmls}}', label: 'Company NMLS#', category: 'loanOfficer' },
  { key: '{{company.address}}', label: 'Company Address', category: 'loanOfficer', format: 'address' },
  { key: '{{company.phone}}', label: 'Company Phone', category: 'loanOfficer', format: 'phone' },

  // Date variables
  { key: '{{date.today}}', label: 'Today\'s Date', category: 'dates', format: 'date' },
  { key: '{{date.expiration}}', label: 'Expiration Date', category: 'dates', format: 'date' },
  { key: '{{date.expirationDays}}', label: 'Days Until Expiration', category: 'dates' },
];

export interface AppState {
  letters: PreApprovalLetter[];
  templates: LetterTemplate[];
  loanOfficerDefaults: LoanOfficerInfo;
}

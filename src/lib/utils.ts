import { format, addDays, differenceInDays } from 'date-fns';
import {
  PreApprovalLetter,
  PropertyInfo,
  LoanInfo,
  Address,
} from '@/types';

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format phone number
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// Format date
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMMM d, yyyy');
}

// Format short date
export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MM/dd/yyyy');
}

// Format percent
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

// Format address
export function formatAddress(address: Address, multiLine = false): string {
  const parts = [
    address.street,
    address.unit ? `Unit ${address.unit}` : null,
  ].filter(Boolean);

  const line2 = `${address.city}, ${address.state} ${address.zipCode}`;

  if (multiLine) {
    return `${parts.join(' ')}\n${line2}`;
  }
  return `${parts.join(' ')}, ${line2}`;
}

// Get property type display name
export function getPropertyTypeDisplay(type: PropertyInfo['propertyType']): string {
  const types: Record<PropertyInfo['propertyType'], string> = {
    single_family: 'Single Family Residence',
    condo: 'Condominium',
    townhouse: 'Townhouse',
    multi_family: 'Multi-Family (2-4 Units)',
    manufactured: 'Manufactured Home',
    tbd: 'To Be Determined',
  };
  return types[type] || type;
}

// Get occupancy type display name
export function getOccupancyDisplay(occupancy: PropertyInfo['occupancy']): string {
  const types: Record<PropertyInfo['occupancy'], string> = {
    primary: 'Primary Residence',
    secondary: 'Second Home',
    investment: 'Investment Property',
  };
  return types[occupancy] || occupancy;
}

// Get loan type display name
export function getLoanTypeDisplay(type: LoanInfo['loanType']): string {
  const types: Record<LoanInfo['loanType'], string> = {
    conventional: 'Conventional',
    fha: 'FHA',
    va: 'VA',
    usda: 'USDA',
    jumbo: 'Jumbo',
    other: 'Other',
  };
  return types[type] || type;
}

// Get expiration date (default 90 days)
export function getExpirationDate(fromDate?: Date, days = 90): string {
  const startDate = fromDate || new Date();
  return format(addDays(startDate, days), 'yyyy-MM-dd');
}

// Calculate days until expiration
export function getDaysUntilExpiration(expirationDate: string): number {
  return differenceInDays(new Date(expirationDate), new Date());
}

// Replace template variables with actual values
export function processTemplate(
  template: string,
  letter: Partial<PreApprovalLetter>
): string {
  const { borrower, coBorrower, property, loan, loanOfficer } = letter;

  let content = template;

  // Borrower replacements
  if (borrower) {
    const borrowerFullName = `${borrower.firstName} ${borrower.lastName}`;
    content = content.replace(/\{\{borrower\.fullName\}\}/g, borrowerFullName);
    content = content.replace(/\{\{borrower\.firstName\}\}/g, borrower.firstName);
    content = content.replace(/\{\{borrower\.lastName\}\}/g, borrower.lastName);
    content = content.replace(/\{\{borrower\.email\}\}/g, borrower.email);
    content = content.replace(/\{\{borrower\.phone\}\}/g, formatPhone(borrower.phone));
    if (borrower.currentAddress) {
      content = content.replace(/\{\{borrower\.address\}\}/g, formatAddress(borrower.currentAddress));
    }
  }

  // Co-Borrower replacements
  if (coBorrower) {
    const coBorrowerFullName = `${coBorrower.firstName} ${coBorrower.lastName}`;
    content = content.replace(/\{\{coBorrower\.fullName\}\}/g, coBorrowerFullName);
    content = content.replace(/\{\{coBorrower\.firstName\}\}/g, coBorrower.firstName);

    // Combined borrower names
    if (borrower) {
      const borrowerFullName = `${borrower.firstName} ${borrower.lastName}`;
      content = content.replace(
        /\{\{borrowersNames\}\}/g,
        `${borrowerFullName} and ${coBorrowerFullName}`
      );
    }
  } else if (borrower) {
    // Single borrower
    const borrowerFullName = `${borrower.firstName} ${borrower.lastName}`;
    content = content.replace(/\{\{borrowersNames\}\}/g, borrowerFullName);
    content = content.replace(/\{\{coBorrower\.fullName\}\}/g, '');
    content = content.replace(/\{\{coBorrower\.firstName\}\}/g, '');
  }

  // Property replacements
  if (property) {
    if (property.address && property.propertyType !== 'tbd') {
      content = content.replace(/\{\{property\.address\}\}/g, formatAddress(property.address));
    } else {
      content = content.replace(/\{\{property\.address\}\}/g, 'Property address to be determined');
    }
    content = content.replace(/\{\{property\.type\}\}/g, getPropertyTypeDisplay(property.propertyType));
    content = content.replace(/\{\{property\.occupancy\}\}/g, getOccupancyDisplay(property.occupancy));
    if (property.purchasePrice) {
      content = content.replace(/\{\{property\.purchasePrice\}\}/g, formatCurrency(property.purchasePrice));
    }
  }

  // Loan replacements
  if (loan) {
    content = content.replace(/\{\{loan\.preApprovalAmount\}\}/g, formatCurrency(loan.preApprovalAmount));
    content = content.replace(/\{\{loan\.loanAmount\}\}/g, formatCurrency(loan.loanAmount));
    content = content.replace(/\{\{loan\.downPayment\}\}/g, formatCurrency(loan.downPaymentAmount));
    content = content.replace(/\{\{loan\.downPaymentPercent\}\}/g, formatPercent(loan.downPaymentPercent));
    content = content.replace(/\{\{loan\.type\}\}/g, getLoanTypeDisplay(loan.loanType));
    content = content.replace(/\{\{loan\.term\}\}/g, String(loan.loanTerm));
    if (loan.interestRate) {
      content = content.replace(/\{\{loan\.interestRate\}\}/g, formatPercent(loan.interestRate));
    }
    if (loan.estimatedMonthlyPayment) {
      content = content.replace(/\{\{loan\.monthlyPayment\}\}/g, formatCurrency(loan.estimatedMonthlyPayment));
    }
    if (loan.ltv) {
      content = content.replace(/\{\{loan\.ltv\}\}/g, formatPercent(loan.ltv));
    }

    // Date replacements
    content = content.replace(/\{\{date\.today\}\}/g, formatDate(new Date()));
    content = content.replace(/\{\{date\.expiration\}\}/g, formatDate(loan.expirationDate));
    content = content.replace(/\{\{date\.expirationDays\}\}/g, String(getDaysUntilExpiration(loan.expirationDate)));
  }

  // Loan Officer replacements
  if (loanOfficer) {
    content = content.replace(/\{\{loanOfficer\.name\}\}/g, loanOfficer.name);
    content = content.replace(/\{\{loanOfficer\.title\}\}/g, loanOfficer.title);
    content = content.replace(/\{\{loanOfficer\.nmls\}\}/g, loanOfficer.nmls);
    content = content.replace(/\{\{loanOfficer\.phone\}\}/g, formatPhone(loanOfficer.phone));
    content = content.replace(/\{\{loanOfficer\.email\}\}/g, loanOfficer.email);
    content = content.replace(/\{\{company\.name\}\}/g, loanOfficer.companyName);
    content = content.replace(/\{\{company\.nmls\}\}/g, loanOfficer.companyNmls);
    if (loanOfficer.companyAddress) {
      content = content.replace(/\{\{company\.address\}\}/g, formatAddress(loanOfficer.companyAddress));
    }
    if (loanOfficer.companyPhone) {
      content = content.replace(/\{\{company\.phone\}\}/g, formatPhone(loanOfficer.companyPhone));
    }
  }

  return content;
}

// Calculate loan metrics
export function calculateLoanMetrics(
  purchasePrice: number,
  downPaymentPercent: number,
  interestRate: number,
  loanTerm: number
): {
  loanAmount: number;
  downPaymentAmount: number;
  ltv: number;
  monthlyPayment: number;
} {
  const downPaymentAmount = (purchasePrice * downPaymentPercent) / 100;
  const loanAmount = purchasePrice - downPaymentAmount;
  const ltv = (loanAmount / purchasePrice) * 100;

  // Calculate monthly payment (P&I only)
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTerm * 12;

  let monthlyPayment = 0;
  if (monthlyRate > 0) {
    monthlyPayment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
  } else {
    monthlyPayment = loanAmount / numPayments;
  }

  return {
    loanAmount,
    downPaymentAmount,
    ltv,
    monthlyPayment: Math.round(monthlyPayment),
  };
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10;
}

// Storage keys
export const STORAGE_KEYS = {
  LETTERS: 'mortgage_letters',
  TEMPLATES: 'mortgage_templates',
  LOAN_OFFICER: 'loan_officer_defaults',
};

// Local storage helpers
export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored) as T;
      } catch {
        return defaultValue;
      }
    }
  }
  return defaultValue;
}

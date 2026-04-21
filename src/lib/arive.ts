// Arive LOS API Integration
// Documentation: https://developer.arive.com (example)

import { AriveLoan } from '@/types/database';

interface AriveConfig {
  apiKey: string;
  companyId: string;
  baseUrl?: string;
}

export class AriveClient {
  private apiKey: string;
  private companyId: string;
  private baseUrl: string;

  constructor(config: AriveConfig) {
    this.apiKey = config.apiKey;
    this.companyId = config.companyId;
    this.baseUrl = config.baseUrl || 'https://api.arive.com/v1';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Company-ID': this.companyId,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `Arive API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  // Get all loans
  async getLoans(params?: {
    status?: string;
    loanOfficerId?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ loans: AriveLoan[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }

    const query = searchParams.toString();
    return this.request(`/loans${query ? `?${query}` : ''}`);
  }

  // Get single loan by ID
  async getLoan(loanId: string): Promise<AriveLoan> {
    return this.request(`/loans/${loanId}`);
  }

  // Search loans by borrower name or email
  async searchLoans(query: string): Promise<AriveLoan[]> {
    return this.request(`/loans/search?q=${encodeURIComponent(query)}`);
  }

  // Get loans ready for pre-approval
  async getPreApprovalReady(): Promise<AriveLoan[]> {
    return this.request('/loans?status=pre_approval_ready');
  }

  // Get borrower details
  async getBorrower(borrowerId: string): Promise<AriveLoan['borrower']> {
    return this.request(`/borrowers/${borrowerId}`);
  }

  // Sync loan status back to Arive
  async updateLoanStatus(
    loanId: string,
    status: string,
    preApprovalLetterUrl?: string
  ): Promise<void> {
    await this.request(`/loans/${loanId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        preApprovalLetterUrl,
        preApprovalDate: new Date().toISOString(),
      }),
    });
  }

  // Upload pre-approval letter to loan documents
  async uploadDocument(
    loanId: string,
    documentType: string,
    documentData: {
      name: string;
      content: string; // Base64 encoded
      mimeType: string;
    }
  ): Promise<{ documentId: string; url: string }> {
    return this.request(`/loans/${loanId}/documents`, {
      method: 'POST',
      body: JSON.stringify({
        type: documentType,
        ...documentData,
      }),
    });
  }

  // Webhook registration for loan updates
  async registerWebhook(
    webhookUrl: string,
    events: string[]
  ): Promise<{ webhookId: string }> {
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        url: webhookUrl,
        events,
      }),
    });
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/ping');
      return true;
    } catch {
      return false;
    }
  }
}

// Helper to create client from company settings
export function createAriveClient(apiKey: string, companyId: string): AriveClient {
  return new AriveClient({ apiKey, companyId });
}

// Map Arive loan data to our borrower format
export function mapAriveLoanToBorrower(ariveLoan: AriveLoan) {
  return {
    arive_borrower_id: ariveLoan.loanId,
    first_name: ariveLoan.borrower.firstName,
    last_name: ariveLoan.borrower.lastName,
    email: ariveLoan.borrower.email,
    phone: ariveLoan.borrower.phone,
    ssn_last_four: ariveLoan.borrower.ssn?.slice(-4),
    date_of_birth: ariveLoan.borrower.dateOfBirth,
    address_street: ariveLoan.borrower.currentAddress?.street,
    address_city: ariveLoan.borrower.currentAddress?.city,
    address_state: ariveLoan.borrower.currentAddress?.state,
    address_zip: ariveLoan.borrower.currentAddress?.zip,
    employer_name: ariveLoan.employment?.employerName,
    job_title: ariveLoan.employment?.jobTitle,
    years_employed: ariveLoan.employment?.yearsEmployed,
    monthly_income: ariveLoan.employment?.monthlyIncome,
    annual_income: ariveLoan.employment?.monthlyIncome
      ? ariveLoan.employment.monthlyIncome * 12
      : undefined,
    credit_score: ariveLoan.creditInfo?.creditScore,
  };
}

// Map Arive loan to letter data
export function mapAriveLoanToLetter(ariveLoan: AriveLoan) {
  const purchasePrice = ariveLoan.loanInfo.purchasePrice || ariveLoan.loanInfo.loanAmount;
  const downPaymentAmount = purchasePrice - ariveLoan.loanInfo.loanAmount;
  const downPaymentPercent = (downPaymentAmount / purchasePrice) * 100;

  return {
    arive_loan_id: ariveLoan.loanId,
    loan_type: ariveLoan.loanInfo.loanType.toLowerCase(),
    loan_purpose: ariveLoan.loanInfo.loanPurpose.toLowerCase(),
    loan_amount: ariveLoan.loanInfo.loanAmount,
    down_payment_amount: downPaymentAmount,
    down_payment_percent: downPaymentPercent,
    interest_rate: ariveLoan.loanInfo.interestRate,
    loan_term: ariveLoan.loanInfo.loanTerm,
    pre_approval_amount: purchasePrice,
    property_type: ariveLoan.propertyInfo?.propertyType || 'single_family',
    property_occupancy: ariveLoan.propertyInfo?.occupancy || 'primary',
    property_address: ariveLoan.propertyInfo?.address,
    property_city: ariveLoan.propertyInfo?.city,
    property_state: ariveLoan.propertyInfo?.state,
    property_zip: ariveLoan.propertyInfo?.zip,
  };
}

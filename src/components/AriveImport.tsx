'use client';

import { useState, useEffect } from 'react';
import { Search, Download, RefreshCw, User, DollarSign, Home, CheckCircle } from 'lucide-react';

interface AriveLoan {
  loanId: string;
  loanNumber: string;
  borrower: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  coBorrower?: {
    firstName: string;
    lastName: string;
  };
  loanInfo: {
    loanType: string;
    loanAmount: number;
    purchasePrice?: number;
  };
  status: string;
  createdAt: string;
}

interface AriveImportProps {
  companyId: string;
  userId: string;
  onImport: (borrowerData: Record<string, unknown>, loanData: Record<string, unknown>) => void;
}

export default function AriveImport({ companyId, userId, onImport }: AriveImportProps) {
  const [loans, setLoans] = useState<AriveLoan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<AriveLoan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const fetchLoans = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/arive/loans?company_id=${companyId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch loans');
      }

      setLoans(data.loans || []);
      setFilteredLoans(data.loans || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch loans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [companyId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLoans(loans);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredLoans(
        loans.filter(
          (loan) =>
            loan.borrower.firstName.toLowerCase().includes(query) ||
            loan.borrower.lastName.toLowerCase().includes(query) ||
            loan.borrower.email.toLowerCase().includes(query) ||
            loan.loanNumber.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, loans]);

  const handleImport = async (loan: AriveLoan) => {
    setIsImporting(true);
    setSelectedLoan(loan.loanId);

    try {
      const response = await fetch('/api/arive/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          loan_id: loan.loanId,
          user_id: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import loan');
      }

      onImport(data.borrower_data, data.loan_data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import loan');
    } finally {
      setIsImporting(false);
      setSelectedLoan(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Download className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold">Import from Arive</h3>
            <p className="text-sm text-slate-500">Select a loan to import borrower data</p>
          </div>
        </div>
        <button
          onClick={fetchLoans}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or loan number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-slate-300 mx-auto animate-spin" />
            <p className="text-slate-500 mt-2">Loading loans...</p>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-slate-500 mt-2">No loans found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredLoans.map((loan) => (
              <div
                key={loan.loanId}
                className="p-4 hover:bg-slate-50 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {loan.borrower.firstName} {loan.borrower.lastName}
                      {loan.coBorrower && (
                        <span className="text-slate-500">
                          {' '}& {loan.coBorrower.firstName} {loan.coBorrower.lastName}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(loan.loanInfo.loanAmount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        {loan.loanInfo.loanType}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                        #{loan.loanNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleImport(loan)}
                  disabled={isImporting && selectedLoan === loan.loanId}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                    isImporting && selectedLoan === loan.loanId
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isImporting && selectedLoan === loan.loanId ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Import
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

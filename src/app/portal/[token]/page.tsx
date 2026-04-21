'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Download, AlertCircle, CheckCircle, Clock, User } from 'lucide-react';

interface LetterData {
  id: string;
  borrower: {
    firstName: string;
    lastName: string;
  };
  loanOfficer: {
    fullName: string;
    phone: string;
    email: string;
  };
  company: {
    name: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  loanAmount: number;
  preApprovalAmount: number;
  loanType: string;
  expirationDate: string;
  letterContent: string;
  status: string;
  issuedAt: string;
}

export default function BorrowerPortalPage() {
  const params = useParams();
  const token = params.token as string;
  const [letter, setLetter] = useState<LetterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLetter = useCallback(async () => {
    try {
      const response = await fetch(`/api/portal/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch letter');
      }

      setLetter(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchLetter();
    }
  }, [token, fetchLetter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isExpired = letter ? new Date(letter.expirationDate) < new Date() : false;
  const daysUntilExpiration = letter
    ? Math.ceil((new Date(letter.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleDownloadPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your pre-approval letter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">
            {error === 'Letter not found or access expired'
              ? 'This link has expired or is no longer valid. Please contact your loan officer for a new link.'
              : error}
          </p>
        </div>
      </div>
    );
  }

  if (!letter) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header
        className="py-6 px-8"
        style={{ backgroundColor: letter.company.primaryColor || '#1e40af' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {letter.company.logoUrl ? (
              <img
                src={letter.company.logoUrl}
                alt={letter.company.name}
                className="h-10 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            ) : (
              <div className="flex items-center gap-3 text-white">
                <FileText className="w-8 h-8" />
                <span className="text-xl font-semibold">{letter.company.name}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors print:hidden"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </header>

      {/* Status Banner */}
      {isExpired ? (
        <div className="bg-red-50 border-b border-red-100 py-3 px-8 print:hidden">
          <div className="max-w-4xl mx-auto flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>This pre-approval letter has expired. Please contact your loan officer for renewal.</span>
          </div>
        </div>
      ) : daysUntilExpiration <= 7 ? (
        <div className="bg-amber-50 border-b border-amber-100 py-3 px-8 print:hidden">
          <div className="max-w-4xl mx-auto flex items-center gap-3 text-amber-700">
            <Clock className="w-5 h-5" />
            <span>This pre-approval expires in {daysUntilExpiration} days.</span>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border-b border-green-100 py-3 px-8 print:hidden">
          <div className="max-w-4xl mx-auto flex items-center gap-3 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>Active pre-approval - Valid until {formatDate(letter.expirationDate)}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-8">
        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 print:hidden">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-slate-500">Pre-Approved Amount</p>
            <p
              className="text-2xl font-bold"
              style={{ color: letter.company.primaryColor || '#1e40af' }}
            >
              {formatCurrency(letter.preApprovalAmount)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-slate-500">Loan Type</p>
            <p className="text-xl font-semibold text-slate-900 capitalize">{letter.loanType}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-slate-500">Valid Through</p>
            <p className="text-xl font-semibold text-slate-900">{formatDate(letter.expirationDate)}</p>
          </div>
        </div>

        {/* Letter Content */}
        <div className="bg-white rounded-xl shadow-sm print:shadow-none print:rounded-none">
          <div
            className="letter-content p-8"
            dangerouslySetInnerHTML={{ __html: letter.letterContent }}
          />
        </div>

        {/* Loan Officer Contact */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 print:hidden">
          <h3 className="font-semibold text-slate-900 mb-4">Questions? Contact Your Loan Officer</h3>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{letter.loanOfficer.fullName}</p>
              <p className="text-slate-600">{letter.loanOfficer.email}</p>
              <p className="text-slate-600">{letter.loanOfficer.phone}</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-slate-100 rounded-lg text-xs text-slate-500 print:hidden">
          <p>
            <strong>Important:</strong> This pre-approval letter is subject to verification of the
            information provided, property appraisal, title clearance, and other conditions. It is
            not a commitment to lend. Terms and conditions are subject to change without notice.
          </p>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          header {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

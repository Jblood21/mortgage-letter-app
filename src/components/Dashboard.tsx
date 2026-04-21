'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { formatCurrency, getDaysUntilExpiration, formatShortDate } from '@/lib/utils';
import { PreApprovalLetter } from '@/types';

export default function Dashboard() {
  const { state } = useApp();
  const { letters, loanOfficer, isLoading } = state;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate stats
  const totalLetters = letters.length;
  const issuedLetters = letters.filter((l) => l.status === 'issued').length;
  const expiringLetters = letters.filter((l) => {
    const days = getDaysUntilExpiration(l.loan.expirationDate);
    return days >= 0 && days <= 7 && l.status === 'issued';
  }).length;
  const totalPreApprovalAmount = letters
    .filter((l) => l.status === 'issued')
    .reduce((sum, l) => sum + l.loan.preApprovalAmount, 0);

  const getStatusBadge = (letter: PreApprovalLetter) => {
    const daysLeft = getDaysUntilExpiration(letter.loan.expirationDate);

    if (letter.status === 'revoked') {
      return <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-600">Revoked</span>;
    }
    if (letter.status === 'draft') {
      return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Draft</span>;
    }
    if (daysLeft < 0 || letter.status === 'expired') {
      return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-600">Expired</span>;
    }
    if (daysLeft <= 7) {
      return <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-600">Expiring Soon</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-600">Active</span>;
  };

  return (
    <div>
      {/* Welcome Message / Setup Prompt */}
      {!loanOfficer.name && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-medium text-amber-800">Complete Your Setup</h3>
              <p className="text-amber-700 text-sm mt-1">
                Please configure your loan officer information in Settings before generating pre-approval letters.
              </p>
              <Link
                href="/settings"
                className="inline-block mt-2 text-sm font-medium text-amber-800 hover:text-amber-900 underline"
              >
                Go to Settings →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Letters</p>
              <p className="text-2xl font-semibold mt-1">{totalLetters}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active Letters</p>
              <p className="text-2xl font-semibold mt-1">{issuedLetters}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Expiring Soon</p>
              <p className="text-2xl font-semibold mt-1">{expiringLetters}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Pre-Approved</p>
              <p className="text-xl font-semibold mt-1">{formatCurrency(totalPreApprovalAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Recent Letters</h2>
        <Link
          href="/new-letter"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Letter
        </Link>
      </div>

      {/* Letters Table */}
      {letters.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-slate-700 mb-2">No Letters Yet</h3>
          <p className="text-slate-500 mb-4">Create your first pre-approval letter to get started.</p>
          <Link
            href="/new-letter"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create First Letter
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Borrower</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Loan Type</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Created</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Expires</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {letters.slice(0, 10).map((letter) => (
                <tr key={letter.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">
                        {letter.borrower.firstName} {letter.borrower.lastName}
                      </p>
                      {letter.coBorrower && (
                        <p className="text-sm text-slate-500">
                          & {letter.coBorrower.firstName} {letter.coBorrower.lastName}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-sm">
                      {letter.loan.loanType.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {formatCurrency(letter.loan.preApprovalAmount)}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {formatShortDate(letter.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {formatShortDate(letter.loan.expirationDate)}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(letter)}</td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/letter/${letter.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

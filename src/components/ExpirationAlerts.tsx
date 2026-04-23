'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { getDaysUntilExpiration, formatCurrency, formatShortDate } from '@/lib/utils';
import { AlertTriangle, Clock, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

export default function ExpirationAlerts() {
  const { state } = useApp();
  const { letters } = state;
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Get letters expiring within 14 days
  const expiringLetters = letters.filter((letter) => {
    const days = getDaysUntilExpiration(letter.loan.expirationDate);
    return days >= 0 && days <= 14 && letter.status === 'issued' && !dismissed.includes(letter.id);
  }).sort((a, b) => {
    // Sort by days until expiration (soonest first)
    return getDaysUntilExpiration(a.loan.expirationDate) - getDaysUntilExpiration(b.loan.expirationDate);
  });

  // Get expired letters
  const expiredLetters = letters.filter((letter) => {
    const days = getDaysUntilExpiration(letter.loan.expirationDate);
    return days < 0 && letter.status === 'issued' && !dismissed.includes(letter.id);
  });

  const handleDismiss = (letterId: string) => {
    setDismissed([...dismissed, letterId]);
  };

  if (expiringLetters.length === 0 && expiredLetters.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Expired Letters Alert */}
      {expiredLetters.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">
                {expiredLetters.length} Letter{expiredLetters.length > 1 ? 's' : ''} Expired
              </h3>
              <p className="text-red-700 text-sm mt-1">
                These pre-approval letters have expired and need to be renewed for the borrowers.
              </p>

              <div className="mt-3 space-y-2">
                {expiredLetters.slice(0, 3).map((letter) => (
                  <div key={letter.id} className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-red-900">
                          {letter.borrower.firstName} {letter.borrower.lastName}
                        </p>
                        <p className="text-xs text-red-700">
                          {formatCurrency(letter.loan.preApprovalAmount)} • Expired {formatShortDate(letter.loan.expirationDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/new-letter?duplicate=${letter.id}`}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Renew
                      </Link>
                      <button
                        onClick={() => handleDismiss(letter.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {expiredLetters.length > 3 && (
                  <p className="text-sm text-red-600 text-center pt-1">
                    +{expiredLetters.length - 3} more expired letters
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expiring Soon Alert */}
      {expiringLetters.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">
                {expiringLetters.length} Letter{expiringLetters.length > 1 ? 's' : ''} Expiring Soon
              </h3>
              <p className="text-amber-700 text-sm mt-1">
                These pre-approval letters will expire within the next 14 days.
              </p>

              <div className="mt-3 space-y-2">
                {expiringLetters.slice(0, 5).map((letter) => {
                  const daysLeft = getDaysUntilExpiration(letter.loan.expirationDate);
                  const urgency = daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low';

                  return (
                    <div key={letter.id} className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          urgency === 'high'
                            ? 'bg-red-100 text-red-700'
                            : urgency === 'medium'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}>
                          {daysLeft}d
                        </div>
                        <div>
                          <p className="font-medium text-amber-900">
                            {letter.borrower.firstName} {letter.borrower.lastName}
                          </p>
                          <p className="text-xs text-amber-700">
                            {formatCurrency(letter.loan.preApprovalAmount)} • Expires {formatShortDate(letter.loan.expirationDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/letter/${letter.id}`}
                          className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700"
                        >
                          View
                        </Link>
                        <Link
                          href={`/new-letter?duplicate=${letter.id}`}
                          className="px-3 py-1.5 bg-white text-amber-700 border border-amber-300 text-sm rounded-lg hover:bg-amber-50 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Extend
                        </Link>
                        <button
                          onClick={() => handleDismiss(letter.id)}
                          className="p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {expiringLetters.length > 5 && (
                  <p className="text-sm text-amber-600 text-center pt-1">
                    +{expiringLetters.length - 5} more expiring soon
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Info, Shield } from 'lucide-react';

interface ComplianceCheck {
  id: string;
  category: 'respa' | 'tila' | 'ecoa' | 'general';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  suggestion?: string;
}

interface ComplianceCheckerProps {
  letterContent: string;
  loanType: string;
  preApprovalAmount: number;
  interestRate?: number;
}

const PROHIBITED_PHRASES = [
  { phrase: 'guaranteed', reason: 'Pre-approvals cannot guarantee loan approval' },
  { phrase: 'promise', reason: 'Avoid making promises about loan terms' },
  { phrase: 'no closing costs', reason: 'Closing costs details should not be in pre-approval' },
  { phrase: 'best rate', reason: 'Comparative rate claims require substantiation' },
  { phrase: 'lowest rate', reason: 'Comparative rate claims require substantiation' },
  { phrase: 'act now', reason: 'Urgency language can be misleading' },
  { phrase: 'limited time', reason: 'Artificial urgency may violate regulations' },
];

const REQUIRED_DISCLOSURES: Record<string, { text: string; category: string }[]> = {
  fha: [
    { text: 'FHA', category: 'Loan type identification' },
    { text: 'mortgage insurance', category: 'MIP disclosure' },
  ],
  va: [
    { text: 'VA', category: 'Loan type identification' },
    { text: 'funding fee', category: 'VA funding fee disclosure' },
  ],
  conventional: [
    { text: 'commitment to lend', category: 'Non-commitment disclosure' },
  ],
};

export default function ComplianceChecker({
  letterContent,
  loanType,
  preApprovalAmount,
  interestRate,
}: ComplianceCheckerProps) {
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    runComplianceChecks();
  }, [letterContent, loanType, preApprovalAmount, interestRate]);

  const runComplianceChecks = () => {
    setIsChecking(true);
    const newChecks: ComplianceCheck[] = [];
    const contentLower = letterContent.toLowerCase();

    // Check for prohibited phrases
    PROHIBITED_PHRASES.forEach((item, index) => {
      if (contentLower.includes(item.phrase.toLowerCase())) {
        newChecks.push({
          id: `prohibited-${index}`,
          category: 'general',
          severity: 'error',
          title: `Prohibited phrase: "${item.phrase}"`,
          description: item.reason,
          suggestion: `Remove or rephrase any use of "${item.phrase}"`,
        });
      }
    });

    // Check for required disclosures by loan type
    const requiredForLoanType = REQUIRED_DISCLOSURES[loanType] || [];
    requiredForLoanType.forEach((req, index) => {
      if (!contentLower.includes(req.text.toLowerCase())) {
        newChecks.push({
          id: `required-${loanType}-${index}`,
          category: 'tila',
          severity: 'warning',
          title: `Missing ${req.category}`,
          description: `${loanType.toUpperCase()} loans should include ${req.category}`,
          suggestion: `Add clear ${req.text} language to the letter`,
        });
      }
    });

    // Check for non-commitment disclaimer
    if (!contentLower.includes('not a commitment') && !contentLower.includes('pre-approval only')) {
      newChecks.push({
        id: 'non-commitment',
        category: 'respa',
        severity: 'error',
        title: 'Missing non-commitment disclaimer',
        description: 'Pre-approval letters must clearly state they are not a commitment to lend',
        suggestion: 'Add: "This pre-approval is not a commitment to lend"',
      });
    }

    // Check for expiration date
    if (!contentLower.includes('expire') && !contentLower.includes('valid until') && !contentLower.includes('valid through')) {
      newChecks.push({
        id: 'expiration',
        category: 'general',
        severity: 'warning',
        title: 'No expiration date mentioned',
        description: 'Pre-approval letters should clearly state when they expire',
        suggestion: 'Include expiration date using {{date.expiration}} variable',
      });
    }

    // Check for Equal Housing Lender
    if (!contentLower.includes('equal housing') && !contentLower.includes('equal opportunity')) {
      newChecks.push({
        id: 'equal-housing',
        category: 'ecoa',
        severity: 'warning',
        title: 'Missing Equal Housing Lender statement',
        description: 'Letters should include Equal Housing Lender disclosure',
        suggestion: 'Add "Equal Housing Lender" to the footer',
      });
    }

    // Check for NMLS disclosure
    if (!contentLower.includes('nmls')) {
      newChecks.push({
        id: 'nmls',
        category: 'general',
        severity: 'warning',
        title: 'Missing NMLS number',
        description: 'Loan officer and company NMLS numbers should be included',
        suggestion: 'Add NMLS# for both loan officer and company',
      });
    }

    // Check if interest rate mentioned without proper disclosure
    if (interestRate && contentLower.includes('rate') && !contentLower.includes('subject to change')) {
      newChecks.push({
        id: 'rate-disclosure',
        category: 'tila',
        severity: 'warning',
        title: 'Rate mentioned without change disclaimer',
        description: 'Interest rates mentioned should note they are subject to change',
        suggestion: 'Add: "Interest rates are subject to change without notice"',
      });
    }

    // Check for conditions disclosure
    if (!contentLower.includes('subject to') && !contentLower.includes('conditions')) {
      newChecks.push({
        id: 'conditions',
        category: 'general',
        severity: 'info',
        title: 'No conditions mentioned',
        description: 'Consider listing standard pre-approval conditions',
        suggestion: 'Add conditions like property appraisal, title, and employment verification',
      });
    }

    // Large loan amount warning
    if (preApprovalAmount > 1000000) {
      newChecks.push({
        id: 'jumbo-check',
        category: 'general',
        severity: 'info',
        title: 'High-balance loan amount',
        description: 'Verify this meets jumbo loan requirements and guidelines',
      });
    }

    setChecks(newChecks);
    setIsChecking(false);
  };

  const errorCount = checks.filter(c => c.severity === 'error').length;
  const warningCount = checks.filter(c => c.severity === 'warning').length;

  const getSeverityIcon = (severity: ComplianceCheck['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityBg = (severity: ComplianceCheck['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold">Compliance Check</h3>
            <p className="text-slate-500 text-sm">Automated regulatory review</p>
          </div>
        </div>

        {isChecking ? (
          <span className="text-slate-500 text-sm">Checking...</span>
        ) : (
          <div className="flex items-center gap-3">
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errorCount} errors
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {warningCount} warnings
              </span>
            )}
            {errorCount === 0 && warningCount === 0 && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                All checks passed
              </span>
            )}
          </div>
        )}
      </div>

      {checks.length > 0 && (
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {checks.map((check) => (
            <div
              key={check.id}
              className={`p-4 rounded-lg border ${getSeverityBg(check.severity)}`}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(check.severity)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{check.title}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-200 rounded uppercase">
                      {check.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{check.description}</p>
                  {check.suggestion && (
                    <p className="text-sm text-slate-500 mt-2 italic">
                      Suggestion: {check.suggestion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {checks.length === 0 && !isChecking && (
        <div className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="font-medium text-green-700">All compliance checks passed</p>
          <p className="text-slate-500 text-sm mt-1">
            Your letter meets basic compliance requirements
          </p>
        </div>
      )}

      <div className="p-4 border-t bg-slate-50 text-xs text-slate-500">
        <p>
          <strong>Disclaimer:</strong> This automated check is not a substitute for legal review.
          Always consult with your compliance team for final approval.
        </p>
      </div>
    </div>
  );
}

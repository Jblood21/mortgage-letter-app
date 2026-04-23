'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '@/context/AppContext';
import { PreApprovalLetter, LoanInfo } from '@/types';
import { getExpirationDate, processTemplate } from '@/lib/utils';
import { getTemplateByLoanType } from '@/lib/defaultTemplates';
import { Upload, FileSpreadsheet, Users, CheckCircle, AlertCircle, Loader2, X, Download } from 'lucide-react';

interface BorrowerEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loanAmount: number;
  loanType: LoanInfo['loanType'];
  purchasePrice: number;
  downPaymentPercent: number;
  selected: boolean;
  status: 'pending' | 'generating' | 'success' | 'error';
  error?: string;
}

interface AriveConfig {
  apiKey: string;
  companyId: string;
  baseUrl: string;
}

export default function BatchLetterForm() {
  const router = useRouter();
  const { state, addLetter } = useApp();
  const [ariveConfig, setAriveConfig] = useState<AriveConfig | null>(null);
  const [borrowers, setBorrowers] = useState<BorrowerEntry[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Check if Arive is configured
  useEffect(() => {
    const savedConfig = localStorage.getItem('ariveConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.apiKey && parsed.companyId) {
          setAriveConfig(parsed);
        }
      } catch (e) {
        console.error('Failed to parse Arive config:', e);
      }
    }
  }, []);

  // Import borrowers from Arive
  const handleImportFromArive = async () => {
    if (!ariveConfig) return;

    setIsImporting(true);
    try {
      const response = await fetch('/api/arive/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ariveConfig,
          search: searchQuery,
          limit: 50,
        }),
      });

      const data = await response.json();

      if (response.ok && data.loans) {
        const newBorrowers: BorrowerEntry[] = data.loans.map((loan: Record<string, unknown>) => ({
          id: uuidv4(),
          firstName: String(loan.borrowerFirstName || ''),
          lastName: String(loan.borrowerLastName || ''),
          email: String(loan.borrowerEmail || ''),
          phone: String(loan.borrowerPhone || ''),
          loanAmount: Number(loan.loanAmount || 0),
          loanType: (String(loan.loanType || 'conventional').toLowerCase()) as LoanInfo['loanType'],
          purchasePrice: Number(loan.purchasePrice || loan.loanAmount || 0),
          downPaymentPercent: Number(loan.downPaymentPercent || 20),
          selected: true,
          status: 'pending' as const,
        }));
        setBorrowers(newBorrowers);
      }
    } catch (_error) {
      console.error('Failed to import from Arive:', _error);
    } finally {
      setIsImporting(false);
    }
  };

  // Add manual entry
  const addManualEntry = () => {
    setBorrowers([
      ...borrowers,
      {
        id: uuidv4(),
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        loanAmount: 0,
        loanType: 'conventional',
        purchasePrice: 0,
        downPaymentPercent: 20,
        selected: true,
        status: 'pending',
      },
    ]);
  };

  // Remove entry
  const removeEntry = (id: string) => {
    setBorrowers(borrowers.filter((b) => b.id !== id));
  };

  // Update entry
  const updateEntry = (id: string, field: keyof BorrowerEntry, value: unknown) => {
    setBorrowers(
      borrowers.map((b) =>
        b.id === id ? { ...b, [field]: value } : b
      )
    );
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setBorrowers(
      borrowers.map((b) =>
        b.id === id ? { ...b, selected: !b.selected } : b
      )
    );
  };

  // Select all/none
  const toggleSelectAll = () => {
    const allSelected = borrowers.every((b) => b.selected);
    setBorrowers(borrowers.map((b) => ({ ...b, selected: !allSelected })));
  };

  // Generate letters for selected borrowers
  const handleGenerateLetters = async () => {
    const selectedBorrowers = borrowers.filter((b) => b.selected && b.firstName && b.lastName);
    if (selectedBorrowers.length === 0) return;

    setIsGenerating(true);
    setGeneratedCount(0);
    setShowResults(true);

    for (const borrower of selectedBorrowers) {
      // Update status to generating
      setBorrowers((prev) =>
        prev.map((b) => (b.id === borrower.id ? { ...b, status: 'generating' } : b))
      );

      try {
        // Get template for loan type
        const template = getTemplateByLoanType(borrower.loanType);

        // Calculate loan metrics
        const downPayment = borrower.purchasePrice * (borrower.downPaymentPercent / 100);
        const loanAmount = borrower.purchasePrice - downPayment;

        // Create letter data
        const letterData: PreApprovalLetter = {
          id: uuidv4(),
          templateId: template.id,
          status: 'issued',
          borrower: {
            id: uuidv4(),
            firstName: borrower.firstName,
            lastName: borrower.lastName,
            email: borrower.email,
            phone: borrower.phone,
            currentAddress: { street: '', city: '', state: '', zipCode: '' },
            employmentInfo: { employerName: '', jobTitle: '', yearsEmployed: 0, employmentType: 'W2' },
            incomeInfo: { monthlyGrossIncome: 0, annualIncome: 0 },
          },
          property: {
            address: { street: '', city: '', state: '', zipCode: '' },
            propertyType: 'single_family',
            occupancy: 'primary',
            estimatedValue: borrower.purchasePrice,
            purchasePrice: borrower.purchasePrice,
          },
          loan: {
            loanType: borrower.loanType,
            loanPurpose: 'purchase',
            loanAmount: loanAmount,
            downPaymentAmount: downPayment,
            downPaymentPercent: borrower.downPaymentPercent,
            loanTerm: 30,
            interestRate: 6.5,
            preApprovalAmount: borrower.loanAmount || loanAmount,
            expirationDate: getExpirationDate(),
            estimatedMonthlyPayment: 0,
            ltv: 100 - borrower.downPaymentPercent,
            dti: 0,
          },
          loanOfficer: state.loanOfficer,
          letterContent: processTemplate(template.content, {
            borrower: {
              id: '',
              firstName: borrower.firstName,
              lastName: borrower.lastName,
              email: borrower.email,
              phone: borrower.phone,
              currentAddress: { street: '', city: '', state: '', zipCode: '' },
              employmentInfo: { employerName: '', jobTitle: '', yearsEmployed: 0, employmentType: 'W2' },
              incomeInfo: { monthlyGrossIncome: 0, annualIncome: 0 },
            },
            property: {
              address: { street: '', city: '', state: '', zipCode: '' },
              propertyType: 'single_family',
              occupancy: 'primary',
              estimatedValue: borrower.purchasePrice,
              purchasePrice: borrower.purchasePrice,
            },
            loan: {
              loanType: borrower.loanType,
              loanPurpose: 'purchase',
              loanAmount: loanAmount,
              downPaymentAmount: downPayment,
              downPaymentPercent: borrower.downPaymentPercent,
              loanTerm: 30,
              interestRate: 6.5,
              preApprovalAmount: borrower.loanAmount || loanAmount,
              expirationDate: getExpirationDate(),
              estimatedMonthlyPayment: 0,
              ltv: 100 - borrower.downPaymentPercent,
              dti: 0,
            },
            loanOfficer: state.loanOfficer,
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Add letter
        addLetter(letterData);

        // Update status to success
        setBorrowers((prev) =>
          prev.map((b) => (b.id === borrower.id ? { ...b, status: 'success' } : b))
        );
        setGeneratedCount((prev) => prev + 1);

        // Small delay between generations
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        // Update status to error
        setBorrowers((prev) =>
          prev.map((b) =>
            b.id === borrower.id
              ? { ...b, status: 'error', error: error instanceof Error ? error.message : 'Failed to generate' }
              : b
          )
        );
      }
    }

    setIsGenerating(false);
  };

  const selectedCount = borrowers.filter((b) => b.selected).length;
  const successCount = borrowers.filter((b) => b.status === 'success').length;
  const errorCount = borrowers.filter((b) => b.status === 'error').length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Batch Letter Generation</h1>
        <p className="text-slate-600 mt-1">Generate multiple pre-approval letters at once</p>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Import Borrowers</h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Import from Arive */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Import from Arive</h3>
                <p className="text-sm text-slate-500">Pull borrower data from your LOS</p>
              </div>
            </div>

            {ariveConfig ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or loan number..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleImportFromArive}
                  disabled={isImporting}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Import Borrowers
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-sm">
                Configure Arive integration in Settings first.
              </div>
            )}
          </div>

          {/* Manual Entry */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium">Manual Entry</h3>
                <p className="text-sm text-slate-500">Add borrowers manually</p>
              </div>
            </div>
            <button
              onClick={addManualEntry}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Add Borrower
            </button>
          </div>
        </div>
      </div>

      {/* Borrowers List */}
      {borrowers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={borrowers.every((b) => b.selected)}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm font-medium">Select All</span>
              </label>
              <span className="text-slate-500 text-sm">
                {selectedCount} of {borrowers.length} selected
              </span>
            </div>
            {showResults && (
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  {successCount} generated
                </span>
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errorCount} failed
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="w-10 py-2 px-3"></th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Borrower</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Email</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Loan Type</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Amount</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-slate-600">Status</th>
                  <th className="w-10 py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {borrowers.map((borrower) => (
                  <tr key={borrower.id} className="border-b hover:bg-slate-50">
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={borrower.selected}
                        onChange={() => toggleSelect(borrower.id)}
                        disabled={isGenerating}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={borrower.firstName}
                          onChange={(e) => updateEntry(borrower.id, 'firstName', e.target.value)}
                          placeholder="First"
                          disabled={isGenerating}
                          className="w-24 px-2 py-1 border border-slate-200 rounded text-sm"
                        />
                        <input
                          type="text"
                          value={borrower.lastName}
                          onChange={(e) => updateEntry(borrower.id, 'lastName', e.target.value)}
                          placeholder="Last"
                          disabled={isGenerating}
                          className="w-24 px-2 py-1 border border-slate-200 rounded text-sm"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="email"
                        value={borrower.email}
                        onChange={(e) => updateEntry(borrower.id, 'email', e.target.value)}
                        placeholder="email@example.com"
                        disabled={isGenerating}
                        className="w-40 px-2 py-1 border border-slate-200 rounded text-sm"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={borrower.loanType}
                        onChange={(e) => updateEntry(borrower.id, 'loanType', e.target.value)}
                        disabled={isGenerating}
                        className="px-2 py-1 border border-slate-200 rounded text-sm"
                      >
                        <option value="conventional">Conventional</option>
                        <option value="fha">FHA</option>
                        <option value="va">VA</option>
                        <option value="usda">USDA</option>
                        <option value="jumbo">Jumbo</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={borrower.purchasePrice || ''}
                        onChange={(e) => updateEntry(borrower.id, 'purchasePrice', Number(e.target.value))}
                        placeholder="Amount"
                        disabled={isGenerating}
                        className="w-28 px-2 py-1 border border-slate-200 rounded text-sm"
                      />
                    </td>
                    <td className="py-2 px-3">
                      {borrower.status === 'pending' && (
                        <span className="text-slate-400 text-sm">Pending</span>
                      )}
                      {borrower.status === 'generating' && (
                        <span className="flex items-center gap-1 text-blue-600 text-sm">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Generating
                        </span>
                      )}
                      {borrower.status === 'success' && (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Done
                        </span>
                      )}
                      {borrower.status === 'error' && (
                        <span className="flex items-center gap-1 text-red-600 text-sm" title={borrower.error}>
                          <AlertCircle className="w-3.5 h-3.5" />
                          Error
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => removeEntry(borrower.id)}
                        disabled={isGenerating}
                        className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          {showResults && successCount > 0 && (
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
            >
              View Letters
            </button>
          )}
          <button
            onClick={handleGenerateLetters}
            disabled={selectedCount === 0 || isGenerating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating ({generatedCount}/{selectedCount})
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                Generate {selectedCount} Letters
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

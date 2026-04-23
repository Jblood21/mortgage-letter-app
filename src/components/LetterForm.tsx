'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '@/context/AppContext';
import {
  Borrower,
  CoBorrower,
  PropertyInfo,
  LoanInfo,
  PreApprovalLetter,
  Address,
  RealEstateAgentInfo,
} from '@/types';
import {
  generateId,
  getExpirationDate,
  calculateLoanMetrics,
  processTemplate,
  isValidEmail,
  isValidPhone,
} from '@/lib/utils';
import { getTemplateByLoanType } from '@/lib/defaultTemplates';
import { Download, X, AlertCircle, Home, Upload, User, ChevronDown, ChevronUp } from 'lucide-react';
import AriveImport from './AriveImport';

interface AriveConfig {
  apiKey: string;
  companyId: string;
  baseUrl: string;
}

interface LetterFormProps {
  existingLetter?: PreApprovalLetter;
}

const emptyAddress: Address = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
};

const emptyBorrower: Borrower = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  currentAddress: { ...emptyAddress },
  employmentInfo: {
    employerName: '',
    jobTitle: '',
    yearsEmployed: 0,
    employmentType: 'W2',
  },
  incomeInfo: {
    monthlyGrossIncome: 0,
    annualIncome: 0,
  },
};

export default function LetterForm({ existingLetter }: LetterFormProps) {
  const router = useRouter();
  const { state, addLetter, updateLetter } = useApp();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasCoBorrower, setHasCoBorrower] = useState(false);
  const [showAriveModal, setShowAriveModal] = useState(false);
  const [ariveConfig, setAriveConfig] = useState<AriveConfig | null>(null);

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

  // Handle Arive import
  const handleAriveImport = (borrowerData: Record<string, unknown>, loanData: Record<string, unknown>) => {
    // Populate borrower fields
    if (borrowerData.firstName) {
      setBorrower(prev => ({
        ...prev,
        firstName: String(borrowerData.firstName || ''),
        lastName: String(borrowerData.lastName || ''),
        email: String(borrowerData.email || ''),
        phone: String(borrowerData.phone || ''),
      }));
    }

    // Populate co-borrower if present
    if (borrowerData.coBorrower && typeof borrowerData.coBorrower === 'object') {
      const co = borrowerData.coBorrower as Record<string, unknown>;
      if (co.firstName) {
        setHasCoBorrower(true);
        setCoBorrower({
          ...emptyBorrower,
          id: uuidv4(),
          firstName: String(co.firstName || ''),
          lastName: String(co.lastName || ''),
          relationship: 'spouse',
        });
      }
    }

    // Populate loan fields
    if (loanData.loanAmount) {
      const amount = Number(loanData.purchasePrice || loanData.loanAmount);
      setPurchasePrice(amount);
    }
    if (loanData.loanType) {
      const loanType = String(loanData.loanType).toLowerCase();
      setLoan(prev => ({
        ...prev,
        loanType: loanType as LoanInfo['loanType'],
      }));
    }
    if (loanData.interestRate) {
      setInterestRate(Number(loanData.interestRate));
    }
    if (loanData.downPaymentPercent) {
      setLoan(prev => ({
        ...prev,
        downPaymentPercent: Number(loanData.downPaymentPercent),
      }));
    }

    setShowAriveModal(false);
  };

  // Borrower state
  const [borrower, setBorrower] = useState<Borrower>(
    existingLetter?.borrower || { ...emptyBorrower, id: uuidv4() }
  );

  // Co-Borrower state
  const [coBorrower, setCoBorrower] = useState<CoBorrower | undefined>(
    existingLetter?.coBorrower
  );

  // Real Estate Agent state (for dual branding)
  const [hasAgent, setHasAgent] = useState(!!existingLetter?.realEstateAgent);
  const [showAgentSection, setShowAgentSection] = useState(false);
  const [realEstateAgent, setRealEstateAgent] = useState<RealEstateAgentInfo | undefined>(
    existingLetter?.realEstateAgent
  );
  const [isUploadingAgentPhoto, setIsUploadingAgentPhoto] = useState(false);
  const [isUploadingAgentLogo, setIsUploadingAgentLogo] = useState(false);
  const agentPhotoRef = useRef<HTMLInputElement>(null);
  const agentLogoRef = useRef<HTMLInputElement>(null);

  const handleAgentPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !realEstateAgent) return;
    setIsUploadingAgentPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setRealEstateAgent({ ...realEstateAgent, personalPhoto: reader.result as string });
      setIsUploadingAgentPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAgentLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !realEstateAgent) return;
    setIsUploadingAgentLogo(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setRealEstateAgent({ ...realEstateAgent, brokerageLogo: reader.result as string });
      setIsUploadingAgentLogo(false);
    };
    reader.readAsDataURL(file);
  };

  // Property state
  const [property, setProperty] = useState<PropertyInfo>(
    existingLetter?.property || {
      propertyType: 'single_family',
      occupancy: 'primary',
    }
  );

  // Loan state
  const [loan, setLoan] = useState<LoanInfo>(
    existingLetter?.loan || {
      loanType: 'conventional',
      loanPurpose: 'purchase',
      loanAmount: 0,
      downPaymentAmount: 0,
      downPaymentPercent: 20,
      loanTerm: 30,
      preApprovalAmount: 0,
      expirationDate: getExpirationDate(),
    }
  );

  // Template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    existingLetter?.templateId || ''
  );

  // Purchase price for calculations
  const [purchasePrice, setPurchasePrice] = useState(
    existingLetter?.property.purchasePrice || 0
  );

  // Interest rate
  const [interestRate, setInterestRate] = useState(
    existingLetter?.loan.interestRate || 6.5
  );

  // Update loan calculations when inputs change
  useEffect(() => {
    if (purchasePrice > 0) {
      const metrics = calculateLoanMetrics(
        purchasePrice,
        loan.downPaymentPercent,
        interestRate,
        loan.loanTerm
      );

      setLoan((prev) => ({
        ...prev,
        loanAmount: metrics.loanAmount,
        downPaymentAmount: metrics.downPaymentAmount,
        ltv: metrics.ltv,
        estimatedMonthlyPayment: metrics.monthlyPayment,
        preApprovalAmount: purchasePrice,
        interestRate,
      }));

      setProperty((prev) => ({
        ...prev,
        purchasePrice,
        estimatedValue: purchasePrice,
      }));
    }
  }, [purchasePrice, loan.downPaymentPercent, interestRate, loan.loanTerm]);

  // Set default template based on loan type
  useEffect(() => {
    if (!selectedTemplateId) {
      const template = getTemplateByLoanType(loan.loanType);
      if (template) {
        setSelectedTemplateId(template.id);
      }
    }
  }, [loan.loanType, selectedTemplateId]);

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!borrower.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!borrower.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!borrower.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!isValidEmail(borrower.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!borrower.phone.trim()) {
        newErrors.phone = 'Phone is required';
      } else if (!isValidPhone(borrower.phone)) {
        newErrors.phone = 'Invalid phone number';
      }

      if (hasCoBorrower && coBorrower) {
        if (!coBorrower.firstName.trim()) newErrors.coFirstName = 'Co-borrower first name is required';
        if (!coBorrower.lastName.trim()) newErrors.coLastName = 'Co-borrower last name is required';
      }
    }

    if (currentStep === 2) {
      if (purchasePrice <= 0) newErrors.purchasePrice = 'Purchase price is required';
      if (loan.downPaymentPercent < 0 || loan.downPaymentPercent > 100) {
        newErrors.downPayment = 'Down payment must be between 0 and 100%';
      }
    }

    if (currentStep === 3) {
      if (!selectedTemplateId) newErrors.template = 'Please select a template';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (!validateStep(step)) return;

    const template = state.templates.find((t) => t.id === selectedTemplateId);
    if (!template) return;

    const letterData: PreApprovalLetter = {
      id: existingLetter?.id || generateId(),
      createdAt: existingLetter?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'issued',
      templateId: selectedTemplateId,
      borrower,
      coBorrower: hasCoBorrower ? coBorrower : undefined,
      property,
      loan,
      loanOfficer: state.loanOfficer,
      realEstateAgent: hasAgent ? realEstateAgent : undefined,
      letterContent: processTemplate(template.content, {
        borrower,
        coBorrower: hasCoBorrower ? coBorrower : undefined,
        property,
        loan,
        loanOfficer: state.loanOfficer,
      }),
    };

    if (existingLetter) {
      updateLetter(letterData);
    } else {
      addLetter(letterData);
    }

    router.push(`/letter/${letterData.id}`);
  };

  const formatCurrencyInput = (value: string): number => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Import from Arive Button */}
      {ariveConfig && (
        <div className="mb-6">
          <button
            onClick={() => setShowAriveModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
          >
            <Download className="w-5 h-5" />
            Import from Arive
          </button>
        </div>
      )}

      {!ariveConfig && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">Arive Integration Not Configured</p>
            <p className="text-sm text-amber-700 mt-1">
              Configure your Arive API settings to import borrower data automatically.{' '}
              <a href="/settings" className="underline hover:no-underline">Go to Settings</a>
            </p>
          </div>
        </div>
      )}

      {/* Arive Import Modal */}
      {showAriveModal && ariveConfig && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Import from Arive</h2>
              <button
                onClick={() => setShowAriveModal(false)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
              <AriveImport
                companyId={ariveConfig.companyId}
                userId="current-user"
                onImport={handleAriveImport}
              />
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Borrower Info' },
            { num: 2, label: 'Loan Details' },
            { num: 3, label: 'Template' },
            { num: 4, label: 'Review' },
          ].map((s, index) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s.num
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {s.num}
              </div>
              <span
                className={`ml-2 text-sm ${
                  step >= s.num ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
              {index < 3 && (
                <div
                  className={`w-16 h-1 mx-4 ${
                    step > s.num ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Borrower Information */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Borrower Information</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={borrower.firstName}
                onChange={(e) =>
                  setBorrower({ ...borrower, firstName: e.target.value })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.firstName ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={borrower.lastName}
                onChange={(e) =>
                  setBorrower({ ...borrower, lastName: e.target.value })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.lastName ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={borrower.email}
                onChange={(e) =>
                  setBorrower({ ...borrower, email: e.target.value })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                value={borrower.phone}
                onChange={(e) =>
                  setBorrower({ ...borrower, phone: e.target.value })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="(555) 555-5555"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Current Address
            </label>
            <input
              type="text"
              value={borrower.currentAddress.street}
              onChange={(e) =>
                setBorrower({
                  ...borrower,
                  currentAddress: {
                    ...borrower.currentAddress,
                    street: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
              placeholder="Street Address"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={borrower.currentAddress.city}
                onChange={(e) =>
                  setBorrower({
                    ...borrower,
                    currentAddress: {
                      ...borrower.currentAddress,
                      city: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="City"
              />
              <input
                type="text"
                value={borrower.currentAddress.state}
                onChange={(e) =>
                  setBorrower({
                    ...borrower,
                    currentAddress: {
                      ...borrower.currentAddress,
                      state: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="State"
              />
              <input
                type="text"
                value={borrower.currentAddress.zipCode}
                onChange={(e) =>
                  setBorrower({
                    ...borrower,
                    currentAddress: {
                      ...borrower.currentAddress,
                      zipCode: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ZIP"
              />
            </div>
          </div>

          {/* Co-Borrower Toggle */}
          <div className="border-t pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasCoBorrower}
                onChange={(e) => {
                  setHasCoBorrower(e.target.checked);
                  if (e.target.checked && !coBorrower) {
                    setCoBorrower({
                      ...emptyBorrower,
                      id: uuidv4(),
                      relationship: 'spouse',
                    });
                  }
                }}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium">Add Co-Borrower</span>
            </label>

            {hasCoBorrower && coBorrower && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Co-Borrower First Name *
                    </label>
                    <input
                      type="text"
                      value={coBorrower.firstName}
                      onChange={(e) =>
                        setCoBorrower({ ...coBorrower, firstName: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.coFirstName ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {errors.coFirstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.coFirstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Co-Borrower Last Name *
                    </label>
                    <input
                      type="text"
                      value={coBorrower.lastName}
                      onChange={(e) =>
                        setCoBorrower({ ...coBorrower, lastName: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.coLastName ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {errors.coLastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.coLastName}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Relationship
                  </label>
                  <select
                    value={coBorrower.relationship}
                    onChange={(e) =>
                      setCoBorrower({
                        ...coBorrower,
                        relationship: e.target.value as CoBorrower['relationship'],
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="spouse">Spouse</option>
                    <option value="domestic_partner">Domestic Partner</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Loan Details */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Loan Details</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Loan Type *
              </label>
              <select
                value={loan.loanType}
                onChange={(e) =>
                  setLoan({
                    ...loan,
                    loanType: e.target.value as LoanInfo['loanType'],
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="conventional">Conventional</option>
                <option value="fha">FHA</option>
                <option value="va">VA</option>
                <option value="usda">USDA</option>
                <option value="jumbo">Jumbo</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Loan Term *
              </label>
              <select
                value={loan.loanTerm}
                onChange={(e) =>
                  setLoan({
                    ...loan,
                    loanTerm: parseInt(e.target.value) as LoanInfo['loanTerm'],
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={30}>30 Years</option>
                <option value={20}>20 Years</option>
                <option value={15}>15 Years</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Maximum Purchase Price *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2 text-slate-500">$</span>
                <input
                  type="text"
                  value={purchasePrice > 0 ? purchasePrice.toLocaleString() : ''}
                  onChange={(e) => setPurchasePrice(formatCurrencyInput(e.target.value))}
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.purchasePrice ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="500,000"
                />
              </div>
              {errors.purchasePrice && (
                <p className="text-red-500 text-sm mt-1">{errors.purchasePrice}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Down Payment %
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={loan.downPaymentPercent}
                  onChange={(e) =>
                    setLoan({
                      ...loan,
                      downPaymentPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.downPayment ? 'border-red-500' : 'border-slate-300'
                  }`}
                  min="0"
                  max="100"
                  step="0.5"
                />
                <span className="absolute right-4 top-2 text-slate-500">%</span>
              </div>
              {errors.downPayment && (
                <p className="text-red-500 text-sm mt-1">{errors.downPayment}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Interest Rate (optional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="20"
                  step="0.125"
                />
                <span className="absolute right-4 top-2 text-slate-500">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                value={loan.expirationDate}
                onChange={(e) =>
                  setLoan({ ...loan, expirationDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Property Type
              </label>
              <select
                value={property.propertyType}
                onChange={(e) =>
                  setProperty({
                    ...property,
                    propertyType: e.target.value as PropertyInfo['propertyType'],
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="single_family">Single Family Residence</option>
                <option value="condo">Condominium</option>
                <option value="townhouse">Townhouse</option>
                <option value="multi_family">Multi-Family (2-4 Units)</option>
                <option value="manufactured">Manufactured Home</option>
                <option value="tbd">To Be Determined</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Occupancy Type
              </label>
              <select
                value={property.occupancy}
                onChange={(e) =>
                  setProperty({
                    ...property,
                    occupancy: e.target.value as PropertyInfo['occupancy'],
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="primary">Primary Residence</option>
                <option value="secondary">Second Home</option>
                <option value="investment">Investment Property</option>
              </select>
            </div>
          </div>

          {/* Calculated Values */}
          {purchasePrice > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mt-6">
              <h3 className="font-medium text-blue-900 mb-3">Calculated Loan Details</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-blue-600">Loan Amount</p>
                  <p className="font-semibold text-blue-900">
                    ${loan.loanAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600">Down Payment</p>
                  <p className="font-semibold text-blue-900">
                    ${loan.downPaymentAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600">LTV</p>
                  <p className="font-semibold text-blue-900">
                    {loan.ltv?.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-blue-600">Est. Monthly (P&I)</p>
                  <p className="font-semibold text-blue-900">
                    ${loan.estimatedMonthlyPayment?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Template Selection */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Select Template</h2>

          {errors.template && (
            <p className="text-red-500 text-sm mb-4">{errors.template}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            {state.templates
              .filter(
                (t) =>
                  t.loanType === 'all' || t.loanType === loan.loanType
              )
              .sort((a, b) => {
                // Sort matching loan type templates first (recommended)
                if (a.loanType === loan.loanType && b.loanType !== loan.loanType) return -1;
                if (b.loanType === loan.loanType && a.loanType !== loan.loanType) return 1;
                return 0;
              })
              .map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTemplateId === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : template.loanType === loan.loanType
                        ? 'border-green-300 bg-green-50/50 hover:border-green-400'
                        : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium mb-1">{template.name}</h3>
                    {template.loanType === loan.loanType && (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{template.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {template.loanType === 'all' ? 'All Types' : template.loanType.toUpperCase()}
                    </span>
                    {template.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Real Estate Agent Section (Dual Branding) */}
          <div className="mt-8 border-t pt-6">
            <button
              type="button"
              onClick={() => setShowAgentSection(!showAgentSection)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-medium">Real Estate Agent Co-Branding</h3>
                  <p className="text-sm text-slate-500">Add agent info for dual branding on the letter</p>
                </div>
              </div>
              {showAgentSection ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {showAgentSection && (
              <div className="mt-6 space-y-6 bg-slate-50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hasAgent"
                    checked={hasAgent}
                    onChange={(e) => {
                      setHasAgent(e.target.checked);
                      if (e.target.checked && !realEstateAgent) {
                        setRealEstateAgent({
                          name: '',
                          phone: '',
                          email: '',
                          brokerageName: '',
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <label htmlFor="hasAgent" className="text-sm font-medium">
                    Include real estate agent on this letter
                  </label>
                </div>

                {hasAgent && realEstateAgent && (
                  <div className="space-y-4">
                    {/* Agent Info Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Agent Name *
                        </label>
                        <input
                          type="text"
                          value={realEstateAgent.name}
                          onChange={(e) => setRealEstateAgent({ ...realEstateAgent, name: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={realEstateAgent.title || ''}
                          onChange={(e) => setRealEstateAgent({ ...realEstateAgent, title: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="REALTOR®"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          value={realEstateAgent.phone}
                          onChange={(e) => setRealEstateAgent({ ...realEstateAgent, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="(555) 555-5555"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={realEstateAgent.email}
                          onChange={(e) => setRealEstateAgent({ ...realEstateAgent, email: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="jane@realty.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Brokerage Name *
                        </label>
                        <input
                          type="text"
                          value={realEstateAgent.brokerageName}
                          onChange={(e) => setRealEstateAgent({ ...realEstateAgent, brokerageName: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="ABC Realty"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          License Number
                        </label>
                        <input
                          type="text"
                          value={realEstateAgent.licenseNumber || ''}
                          onChange={(e) => setRealEstateAgent({ ...realEstateAgent, licenseNumber: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="DRE# 12345678"
                        />
                      </div>
                    </div>

                    {/* Agent Photos */}
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                      {/* Agent Photo */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Agent Photo
                        </label>
                        <div className="flex items-start gap-3">
                          <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center bg-white overflow-hidden">
                            {realEstateAgent.personalPhoto ? (
                              <img
                                src={realEstateAgent.personalPhoto}
                                alt="Agent photo"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-8 h-8 text-slate-300" />
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <input
                              type="file"
                              ref={agentPhotoRef}
                              onChange={handleAgentPhotoUpload}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => agentPhotoRef.current?.click()}
                              disabled={isUploadingAgentPhoto}
                              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              {isUploadingAgentPhoto ? 'Uploading...' : 'Upload'}
                            </button>
                            {realEstateAgent.personalPhoto && (
                              <button
                                type="button"
                                onClick={() => setRealEstateAgent({ ...realEstateAgent, personalPhoto: '' })}
                                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Brokerage Logo */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Brokerage Logo
                        </label>
                        <div className="flex items-start gap-3">
                          <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                            {realEstateAgent.brokerageLogo ? (
                              <img
                                src={realEstateAgent.brokerageLogo}
                                alt="Brokerage logo"
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <Home className="w-8 h-8 text-slate-300" />
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <input
                              type="file"
                              ref={agentLogoRef}
                              onChange={handleAgentLogoUpload}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => agentLogoRef.current?.click()}
                              disabled={isUploadingAgentLogo}
                              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              {isUploadingAgentLogo ? 'Uploading...' : 'Upload'}
                            </button>
                            {realEstateAgent.brokerageLogo && (
                              <button
                                type="button"
                                onClick={() => setRealEstateAgent({ ...realEstateAgent, brokerageLogo: '' })}
                                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Review & Generate</h2>

          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="font-medium text-slate-700 mb-2">Borrower</h3>
              <p className="text-lg">
                {borrower.firstName} {borrower.lastName}
                {hasCoBorrower && coBorrower && (
                  <span> & {coBorrower.firstName} {coBorrower.lastName}</span>
                )}
              </p>
              <p className="text-slate-500">{borrower.email}</p>
            </div>

            <div className="border-b pb-4">
              <h3 className="font-medium text-slate-700 mb-2">Loan Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-500 text-sm">Pre-Approval Amount</p>
                  <p className="text-xl font-semibold text-blue-600">
                    ${loan.preApprovalAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Loan Type</p>
                  <p className="font-medium">{loan.loanType.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Term</p>
                  <p className="font-medium">{loan.loanTerm} Years</p>
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h3 className="font-medium text-slate-700 mb-2">Property</h3>
              <p>
                {property.propertyType === 'tbd'
                  ? 'To Be Determined'
                  : property.propertyType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                {' - '}
                {property.occupancy.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-slate-700 mb-2">Loan Officer</h3>
              {state.loanOfficer.name ? (
                <>
                  <p className="font-medium">{state.loanOfficer.name}</p>
                  <p className="text-slate-500">{state.loanOfficer.companyName}</p>
                  <p className="text-slate-500">NMLS# {state.loanOfficer.nmls}</p>
                </>
              ) : (
                <p className="text-amber-600">
                  Please set up your loan officer information in Settings before generating letters.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className={`px-6 py-2 rounded-lg font-medium ${
            step === 1
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          Back
        </button>

        {step < 4 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!state.loanOfficer.name}
            className={`px-6 py-2 rounded-lg font-medium ${
              state.loanOfficer.name
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            Generate Letter
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { LoanOfficerInfo, Address } from '@/types';
import { isValidEmail, isValidPhone } from '@/lib/utils';

const emptyAddress: Address = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
};

export default function Settings() {
  const { state, updateLoanOfficer } = useApp();
  const [info, setInfo] = useState<LoanOfficerInfo>(state.loanOfficer);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setInfo(state.loanOfficer);
  }, [state.loanOfficer]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!info.name.trim()) newErrors.name = 'Name is required';
    if (!info.nmls.trim()) newErrors.nmls = 'NMLS# is required';
    if (!info.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(info.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!info.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!isValidPhone(info.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    if (!info.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!info.companyNmls.trim()) newErrors.companyNmls = 'Company NMLS# is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    updateLoanOfficer(info);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setInfo({
      ...info,
      companyAddress: {
        ...(info.companyAddress || emptyAddress),
        [field]: value,
      },
    });
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">Loan Officer Information</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={info.name}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="John Smith"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={info.title}
                onChange={(e) => setInfo({ ...info, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Senior Loan Officer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              NMLS# *
            </label>
            <input
              type="text"
              value={info.nmls}
              onChange={(e) => setInfo({ ...info, nmls: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.nmls ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="123456"
            />
            {errors.nmls && <p className="text-red-500 text-sm mt-1">{errors.nmls}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={info.email}
                onChange={(e) => setInfo({ ...info, email: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="john@company.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                value={info.phone}
                onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="(555) 555-5555"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">Company Information</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={info.companyName}
                onChange={(e) => setInfo({ ...info, companyName: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.companyName ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="ABC Mortgage Company"
              />
              {errors.companyName && (
                <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Company NMLS# *
              </label>
              <input
                type="text"
                value={info.companyNmls}
                onChange={(e) => setInfo({ ...info, companyNmls: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.companyNmls ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="789012"
              />
              {errors.companyNmls && (
                <p className="text-red-500 text-sm mt-1">{errors.companyNmls}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Company Phone
            </label>
            <input
              type="tel"
              value={info.companyPhone || ''}
              onChange={(e) => setInfo({ ...info, companyPhone: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="(555) 555-5555"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Company Address
            </label>
            <input
              type="text"
              value={info.companyAddress?.street || ''}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
              placeholder="Street Address"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={info.companyAddress?.city || ''}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="City"
              />
              <input
                type="text"
                value={info.companyAddress?.state || ''}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="State"
              />
              <input
                type="text"
                value={info.companyAddress?.zipCode || ''}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ZIP"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Save Settings
        </button>
        {saved && (
          <span className="text-green-600 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Settings saved successfully!
          </span>
        )}
      </div>
    </div>
  );
}

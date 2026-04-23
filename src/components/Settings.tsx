'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { LoanOfficerInfo, Address } from '@/types';
import { isValidEmail, isValidPhone } from '@/lib/utils';
import { Upload, User, Building2, X, Camera } from 'lucide-react';

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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInfo(state.loanOfficer);
  }, [state.loanOfficer]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInfo({ ...info, companyLogo: reader.result as string });
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Logo upload error:', error);
      setIsUploadingLogo(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInfo({ ...info, personalPhoto: reader.result as string });
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Photo upload error:', error);
      setIsUploadingPhoto(false);
    }
  };

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

      {/* Branding & Photos Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">Branding & Photos</h2>
        <p className="text-slate-500 text-sm mb-6">
          Add your company logo and personal photo to appear on pre-approval letters
        </p>

        <div className="grid grid-cols-2 gap-8">
          {/* Company Logo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Company Logo
            </label>
            <div className="flex items-start gap-4">
              <div className="w-28 h-28 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden">
                {info.companyLogo ? (
                  <img
                    src={info.companyLogo}
                    alt="Company logo"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-300" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                </button>
                {info.companyLogo && (
                  <button
                    onClick={() => setInfo({ ...info, companyLogo: '' })}
                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Remove
                  </button>
                )}
                <p className="text-xs text-slate-500">
                  PNG or JPG, recommended 200x200px
                </p>
              </div>
            </div>
          </div>

          {/* Personal Photo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Personal Photo (Headshot)
            </label>
            <div className="flex items-start gap-4">
              <div className="w-28 h-28 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center bg-slate-50 overflow-hidden">
                {info.personalPhoto ? (
                  <img
                    src={info.personalPhoto}
                    alt="Personal photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-slate-300" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2 text-sm"
                >
                  <Camera className="w-4 h-4" />
                  {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
                {info.personalPhoto && (
                  <button
                    onClick={() => setInfo({ ...info, personalPhoto: '' })}
                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Remove
                  </button>
                )}
                <p className="text-xs text-slate-500">
                  Professional headshot, square ratio
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        {(info.companyLogo || info.personalPhoto) && (
          <div className="mt-8 pt-6 border-t">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Letter Header Preview
            </label>
            <div className="border rounded-lg p-6 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {info.companyLogo && (
                    <img
                      src={info.companyLogo}
                      alt="Company logo"
                      className="h-16 w-auto object-contain"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-lg">{info.companyName || 'Your Company'}</p>
                    <p className="text-sm text-slate-500">NMLS# {info.companyNmls || '000000'}</p>
                  </div>
                </div>
                {info.personalPhoto && (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium">{info.name || 'Loan Officer'}</p>
                      <p className="text-sm text-slate-500">{info.title || 'Loan Officer'}</p>
                      <p className="text-sm text-slate-500">NMLS# {info.nmls || '000000'}</p>
                    </div>
                    <img
                      src={info.personalPhoto}
                      alt="Personal photo"
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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

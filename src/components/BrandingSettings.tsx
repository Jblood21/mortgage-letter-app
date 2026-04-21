'use client';

import { useState, useRef } from 'react';
import { Upload, Palette, Building, Check, X } from 'lucide-react';

interface BrandingSettingsProps {
  company: {
    name: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  onSave: (updates: Partial<{
    logo_url: string;
    primary_color: string;
    secondary_color: string;
  }>) => Promise<void>;
}

export default function BrandingSettings({ company, onSave }: BrandingSettingsProps) {
  const [logoUrl, setLogoUrl] = useState(company.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(company.primary_color || '#1e40af');
  const [secondaryColor, setSecondaryColor] = useState(company.secondary_color || '#64748b');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // For now, convert to base64 data URL
      // In production, you'd upload to Supabase Storage or S3
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await onSave({
        logo_url: logoUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const presetColors = [
    { name: 'Blue', primary: '#1e40af', secondary: '#64748b' },
    { name: 'Green', primary: '#166534', secondary: '#4b5563' },
    { name: 'Purple', primary: '#7c3aed', secondary: '#6b7280' },
    { name: 'Red', primary: '#b91c1c', secondary: '#78716c' },
    { name: 'Navy', primary: '#1e3a5f', secondary: '#475569' },
    { name: 'Teal', primary: '#0d9488', secondary: '#64748b' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Branding Settings</h2>
            <p className="text-slate-500 text-sm">Customize your company&apos;s appearance on letters</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Company Logo
          </label>
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Company logo"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Building className="w-12 h-12 text-slate-300" />
              )}
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload Logo'}
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Recommended: PNG or SVG, at least 200x200px
              </p>
              {logoUrl && (
                <button
                  onClick={() => setLogoUrl('')}
                  className="text-xs text-red-600 hover:text-red-700 mt-2 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Remove logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Color Presets */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Color Presets
          </label>
          <div className="flex flex-wrap gap-3">
            {presetColors.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setPrimaryColor(preset.primary);
                  setSecondaryColor(preset.secondary);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                  primaryColor === preset.primary
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: preset.primary }}
                />
                <span className="text-sm">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border border-slate-300"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg uppercase font-mono"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Used for headers and primary buttons
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border border-slate-300"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg uppercase font-mono"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Used for text and secondary elements
            </p>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Letter Preview
          </label>
          <div className="border rounded-xl overflow-hidden">
            <div
              className="p-6 text-center"
              style={{ backgroundColor: primaryColor }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-12 mx-auto mb-2 object-contain"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              ) : (
                <h2 className="text-xl font-bold text-white">{company.name}</h2>
              )}
              <p className="text-white/70 text-sm">Pre-Approval Letter</p>
            </div>
            <div className="p-6 bg-slate-50">
              <p style={{ color: secondaryColor }} className="text-sm mb-3">
                April 17, 2026
              </p>
              <p className="mb-3">Dear John Smith,</p>
              <p className="text-sm" style={{ color: secondaryColor }}>
                This letter confirms that you have been pre-approved for a mortgage loan...
              </p>
              <div
                className="mt-4 p-4 rounded-lg"
                style={{ backgroundColor: `${primaryColor}15`, borderLeft: `4px solid ${primaryColor}` }}
              >
                <p style={{ color: primaryColor }} className="text-sm font-medium">
                  Pre-Approved Amount
                </p>
                <p style={{ color: primaryColor }} className="text-2xl font-bold">
                  $500,000
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t flex items-center justify-end gap-3">
        {saved && (
          <span className="text-green-600 flex items-center gap-2">
            <Check className="w-5 h-5" />
            Settings saved!
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-6 py-2 rounded-lg font-medium ${
            isSaving
              ? 'bg-slate-200 text-slate-400'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Branding'}
        </button>
      </div>
    </div>
  );
}

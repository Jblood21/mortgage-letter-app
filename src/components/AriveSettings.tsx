'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, AlertCircle, Loader2, Link2, Database, Shield } from 'lucide-react';

interface AriveConfig {
  apiKey: string;
  companyId: string;
  baseUrl: string;
}

export default function AriveSettings() {
  const [config, setConfig] = useState<AriveConfig>({
    apiKey: '',
    companyId: '',
    baseUrl: 'https://api.arive.com/v1',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('ariveConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } catch (e) {
        console.error('Failed to parse saved Arive config:', e);
      }
    }
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestMessage('');

    try {
      const response = await fetch('/api/arive/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult('success');
        setTestMessage('Successfully connected to Arive API');
      } else {
        setTestResult('error');
        setTestMessage(data.error || 'Failed to connect to Arive API');
      }
    } catch (_error) {
      setTestResult('error');
      setTestMessage('Network error - please check your connection');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Save to localStorage
    localStorage.setItem('ariveConfig', JSON.stringify(config));

    // Simulate API save delay
    await new Promise(resolve => setTimeout(resolve, 500));

    setSaved(true);
    setIsSaving(false);

    setTimeout(() => setSaved(false), 3000);
  };

  const dataFields = [
    { name: 'Borrower Name', key: 'borrower.firstName, borrower.lastName' },
    { name: 'Co-Borrower', key: 'coBorrower.firstName, coBorrower.lastName' },
    { name: 'Email', key: 'borrower.email' },
    { name: 'Phone', key: 'borrower.phone' },
    { name: 'Loan Amount', key: 'loanAmount' },
    { name: 'Purchase Price', key: 'purchasePrice' },
    { name: 'Down Payment', key: 'downPayment' },
    { name: 'Loan Type', key: 'loanType' },
    { name: 'Interest Rate', key: 'interestRate' },
    { name: 'Property Address', key: 'property.address' },
    { name: 'Credit Score', key: 'creditScore' },
    { name: 'Employment Info', key: 'employment.employer, employment.income' },
  ];

  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Link2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Arive API Configuration</h2>
            <p className="text-sm text-slate-500">Connect your Arive LOS account to import loan data</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Enter your Arive API key"
                className="w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Company ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Company ID
            </label>
            <input
              type="text"
              value={config.companyId}
              onChange={(e) => setConfig({ ...config, companyId: e.target.value })}
              placeholder="Enter your Arive Company ID"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              API Base URL
            </label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              placeholder="https://api.arive.com/v1"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-slate-500">Default: https://api.arive.com/v1</p>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              testResult === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {testResult === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm">{testMessage}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !config.apiKey || !config.companyId}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Test Connection
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !config.apiKey || !config.companyId}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {saved ? 'Saved!' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Data Fields Info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Available Data Fields</h2>
            <p className="text-sm text-slate-500">These fields will be imported from Arive</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {dataFields.map((field) => (
            <div
              key={field.key}
              className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
            >
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{field.name}</p>
                <p className="text-xs text-slate-400 truncate">{field.key}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">How It Works</h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="font-semibold">1.</span>
            Enter your Arive API credentials above and save
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">2.</span>
            When creating a new letter, click &quot;Import from Arive&quot;
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">3.</span>
            Search for a borrower by name or loan number
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">4.</span>
            All loan data will be automatically populated into the letter
          </li>
        </ol>
      </div>
    </div>
  );
}

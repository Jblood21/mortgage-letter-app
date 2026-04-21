'use client';

import { useState } from 'react';
import Settings from "@/components/Settings";
import AriveSettings from "@/components/AriveSettings";
import { User, Link2 } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'arive'>('profile');

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'profile' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <span className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </span>
        </button>
        <button
          onClick={() => setActiveTab('arive')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'arive' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <span className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Arive Integration
          </span>
        </button>
      </div>

      {activeTab === 'profile' && <Settings />}
      {activeTab === 'arive' && <AriveSettings />}
    </div>
  );
}

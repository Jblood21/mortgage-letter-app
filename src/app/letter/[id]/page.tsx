'use client';

import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import LetterView from '@/components/LetterView';

export default function LetterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { state } = useApp();

  const letter = state.letters.find((l) => l.id === params.id);

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Letter Not Found</h2>
        <p className="text-slate-500 mb-4">The letter you&apos;re looking for doesn&apos;t exist.</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return <LetterView letter={letter} />;
}

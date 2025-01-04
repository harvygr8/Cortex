'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NewNoteForm from '../components/NewNoteForm';

export default function NewNotePage() {
  const router = useRouter();

  const handleNoteCreated = () => {
    router.push('/');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm min-h-[calc(100vh-10rem)]">
        <div className="p-6 shadow-md">
          {/* <h1 className="text-2xl font-bold text-gray-800 mb-6">New Note</h1> */}
          <NewNoteForm onNoteCreated={handleNoteCreated} />
        </div>
      </div>
    </div>
  );
} 
import React from 'react';

export default function LoadingSpinner({ message = "Loading TrekMate data..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-trek-gold rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-slate-500 animate-pulse">{message}</p>
    </div>
  );
}

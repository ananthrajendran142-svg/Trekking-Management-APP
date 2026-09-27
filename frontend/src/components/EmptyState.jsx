import React from 'react';
import { Compass } from 'lucide-react';

export default function EmptyState({ title = "No data available", message = "There are no records found at this time.", icon: Icon = Compass, actionText, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm my-6">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-8 h-8 text-navy-700" />
      </div>
      <h3 className="text-lg font-bold text-navy-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-trek-blue hover:bg-navy-800 text-white font-semibold rounded-lg text-sm transition shadow"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

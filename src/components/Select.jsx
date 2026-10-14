import React from 'react';

export default function Select({ label, error, options = [], className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>}
      <select
        className={`w-full rounded-lg border bg-white py-1.5 px-3 text-sm text-slate-900 transition-colors ${
          error
            ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
            : 'border-slate-200 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900'
        } ${className}`}
        {...props}
      >
        {options.map((opt, i) => (
          <option key={i} value={typeof opt === 'object' ? opt.value : opt}>
            {typeof opt === 'object' ? opt.label : opt}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}

window.Select = Select;

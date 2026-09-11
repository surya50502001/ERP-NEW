import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

export default function Combobox({ label, options = [], value, onChange, placeholder = "Search...", onCreateNew, createLabel = "+ Create item", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  const selectedOption = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o =>
    (o.label && String(o.label).toLowerCase().includes(search.toLowerCase())) ||
    (o.sublabel && String(o.sublabel).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={`w-full relative ${className}`} ref={wrapperRef}>
      {label && <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>}
      <div
        className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-sm text-slate-900 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 flex items-center justify-between cursor-pointer transition-colors shadow-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-slate-900 font-medium' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon name="ChevronDown" className="w-4 h-4 text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden py-1 text-sm">
          <div className="p-1.5 border-b border-slate-100">
            <input
              type="text"
              autoFocus
              className="w-full px-2.5 py-1 text-xs rounded border border-slate-200 focus:outline-none focus:border-slate-900"
              placeholder="Type to filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-48 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 italic">No matches found</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`px-3 py-2 cursor-pointer text-xs flex items-center justify-between hover:bg-slate-100 ${value === opt.value ? 'bg-slate-50 font-semibold text-slate-900' : 'text-slate-700'}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {opt.sublabel && <span className="text-[11px] text-slate-400 font-normal ml-2">{opt.sublabel}</span>}
                </div>
              ))
            )}
          </div>

          {onCreateNew && (
            <div
              className="border-t border-slate-100 p-1.5 bg-slate-50/70 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-indigo-600 flex items-center gap-1.5 transition-colors"
              onClick={() => {
                setIsOpen(false);
                onCreateNew();
              }}
            >
              <Icon name="PlusCircle" className="w-3.5 h-3.5" />
              {createLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

window.Combobox = Combobox;

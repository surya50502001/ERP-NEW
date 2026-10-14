import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

export default function Combobox({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Search...",
  onCreateNew, // callback: (searchTerm: string) => void
  createLabel = "+ Create item",
  entityName = "item",
  className = ""
}) {
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

  const trimmedSearch = search.trim();
  const filteredOptions = options.filter(o =>
    (o.label && String(o.label).toLowerCase().includes(search.toLowerCase())) ||
    (o.sublabel && String(o.sublabel).toLowerCase().includes(search.toLowerCase()))
  );

  const handleTriggerCreate = (termToUse) => {
    setIsOpen(false);
    if (onCreateNew) {
      onCreateNew(termToUse || trimmedSearch);
    }
  };

  return (
    <div className={`w-full relative ${className}`} ref={wrapperRef}>
      {label && <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>}
      <div
        className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-sm text-slate-900 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 flex items-center justify-between cursor-pointer transition-colors shadow-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-slate-900 font-medium truncate' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon name="ChevronDown" className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden py-1 text-sm animate-in fade-in duration-100">
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <input
                type="text"
                autoFocus
                className="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                placeholder={placeholder || "Type to search..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Icon name="Search" className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              trimmedSearch ? (
                /* Prominent prompt when no results match the user's search */
                <div className="p-3 text-center space-y-2 bg-slate-50/70 border-t border-slate-100">
                  <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Icon name="Search" className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-slate-600">
                      No results for <span className="font-bold text-slate-900 font-mono">"{trimmedSearch}"</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Would you like to create this as a new {entityName}?
                    </p>
                  </div>

                  {onCreateNew && (
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                      onClick={() => handleTriggerCreate(trimmedSearch)}
                    >
                      <Icon name="PlusCircle" className="w-3.5 h-3.5" />
                      <span>Create "{trimmedSearch}"</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="px-3 py-3 text-center text-xs text-slate-400 italic">No options available</div>
              )
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`px-3 py-2 cursor-pointer text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    String(value) === String(opt.value) ? 'bg-indigo-50/70 font-semibold text-indigo-900' : 'text-slate-700'
                  }`}
                  onClick={() => {
                    onChange(opt.value, opt);
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="text-[11px] text-slate-400 font-normal ml-2 shrink-0">
                      {opt.sublabel}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick Create Footer (always available when onCreateNew is passed) */}
          {onCreateNew && filteredOptions.length > 0 && (
            <div
              className="border-t border-slate-100 p-2 bg-slate-50/80 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-indigo-600 flex items-center justify-between transition-colors"
              onClick={() => handleTriggerCreate(trimmedSearch)}
            >
              <span className="flex items-center gap-1.5">
                <Icon name="PlusCircle" className="w-3.5 h-3.5" />
                {createLabel || `+ Create new ${entityName}`}
              </span>
              {trimmedSearch && (
                <span className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]">
                  as "{trimmedSearch}"
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

window.Combobox = Combobox;

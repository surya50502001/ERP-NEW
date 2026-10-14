import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { useERP } from '../context/ERPContext';

export default function CommandPalette() {
  const { isCmdPaletteOpen, setIsCmdPaletteOpen, state } = useERP();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isCmdPaletteOpen) {
      setQuery('');
      return;
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCmdPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCmdPaletteOpen, setIsCmdPaletteOpen]);

  if (!isCmdPaletteOpen || !state) return null;

  const allItems = [
    ...(state.purchaseOrders || []).map(p => ({ id: p.id, title: `${p.id} - ${p.supplierName}`, category: 'Purchase Orders', meta: `₹${(p.totalAmount || 0).toLocaleString('en-IN')}`, route: '#/purchases' })),
    ...(state.salesInvoices || []).map(i => ({ id: i.id, title: `${i.id} - ${i.customerName}`, category: 'Invoices', meta: `₹${(i.totalAmount || 0).toLocaleString('en-IN')}`, route: '#/sales' })),
    ...(state.products || []).map(p => ({ id: p.id, title: p.name, category: 'Products', meta: `${p.availableStock} ${p.uom}`, route: '#/inventory' })),
    ...(state.parties || []).map(p => ({ id: p.id, title: `${p.name} (${p.type})`, category: 'Parties', meta: p.location, route: '#/masters' })),
    { id: 'NAV-1', title: 'Go to Dashboard', category: 'Navigation', route: '#/dashboard' },
    { id: 'NAV-2', title: 'Go to Purchases', category: 'Navigation', route: '#/purchases' },
    { id: 'NAV-3', title: 'Go to Inventory & FIFO Stock', category: 'Navigation', route: '#/inventory' },
    { id: 'NAV-4', title: 'Go to Sales & Invoices', category: 'Navigation', route: '#/sales' },
    { id: 'NAV-5', title: 'Go to Master Data', category: 'Navigation', route: '#/masters' }
  ];

  const filtered = query.trim() === '' ? allItems.slice(0, 8) : allItems.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCmdPaletteOpen(false)}
      />
      <div className="relative mx-auto max-w-xl rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/10 overflow-hidden divide-y divide-slate-100 mt-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 bg-slate-50/50">
          <Icon name="Search" className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            autoFocus
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
            placeholder="Search POs, Invoices, Customers, Products... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-xs">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">No search results found</div>
          ) : (
            filtered.map(item => (
              <a
                key={item.id}
                href={item.route}
                onClick={() => setIsCmdPaletteOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-200/60 rounded">{item.category}</span>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">{item.title}</span>
                </div>
                {item.meta && <span className="text-xs font-mono font-medium text-slate-500">{item.meta}</span>}
              </a>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between font-medium">
          <span>Tip: Type keywords to search across all ERP modules</span>
          <div className="flex items-center gap-2">
            <span>Use Ctrl + K to toggle anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.CommandPalette = CommandPalette;

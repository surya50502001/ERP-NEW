import React, { useState } from 'react';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Combobox from '../../components/Combobox';
import Drawer from '../../components/Drawer';
import StatusBadge from '../../components/StatusBadge';
import { useERP } from '../../context/ERPContext';
import QuickCreatePartyModal from '../../components/QuickCreatePartyModal';
import QuickCreateProductModal from '../../components/QuickCreateProductModal';

export default function PurchaseBillsTab() {
  const { state, createPurchaseBill } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Quick Create Modals
  const [quickPartyModal, setQuickPartyModal] = useState({ isOpen: false, name: '', type: 'Supplier' });
  const [quickProductModal, setQuickProductModal] = useState({ isOpen: false, name: '', itemIndex: null });

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState([{ productId: '', qty: 50, rate: 0 }]);
  const [notes, setNotes] = useState('');

  const suppliers = (state.parties || []).filter(p => p.partyType === 'Supplier' || p.partyType === 'Both');
  const bills = state.purchaseBills || [];

  const filteredBills = bills.filter(b => {
    const q = search.toLowerCase();
    return !q || (b.billNo && b.billNo.toLowerCase().includes(q)) || (b.supplierName && b.supplierName.toLowerCase().includes(q));
  });

  const totalBilled = bills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const unpaidCount = bills.filter(b => b.status === 'Unpaid').length;

  const handleSave = () => {
    const supplier = suppliers.find(s => String(s.id) === String(supplierId) || String(s.partyId) === String(supplierId));
    if (!supplier || items.length === 0) return;

    const formattedItems = items.map(it => {
      const prod = (state.products || []).find(p => String(p.id) === String(it.productId) || String(p.productId) === String(it.productId));
      const qty = parseFloat(it.qty || 1);
      const rate = parseFloat(it.rate || (prod?.avgRate || 100));
      return {
        productId: it.productId,
        productName: prod ? prod.name : 'Item',
        qty,
        rate,
        amount: qty * rate
      };
    });

    const totalAmount = formattedItems.reduce((acc, i) => acc + i.amount, 0);

    createPurchaseBill({
      billNo: billNo || `PB-${Math.floor(1000 + Math.random() * 9000)}`,
      billDate,
      dueDate,
      supplierId: supplier.partyId || supplier.id,
      supplierName: supplier.name,
      items: formattedItems,
      totalAmount,
      status: 'Unpaid',
      notes
    });

    setIsOpen(false);
    setSupplierId('');
    setBillNo('');
    setItems([{ productId: '', qty: 50, rate: 0 }]);
    setNotes('');
  };

  return (
    <div className="space-y-5">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Purchase Bills</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900">{bills.length}</span>
            <span className="text-xs text-slate-500 font-medium">Recorded</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Billed Amount</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900 font-mono">₹{totalBilled.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unpaid Bills</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-amber-600 font-mono">{unpaidCount}</span>
            <span className="text-xs text-amber-600 font-medium">Pending Payment</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Icon name="Search" className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search bills, suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsOpen(true)}>
          <Icon name="Plus" className="w-3.5 h-3.5" />
          Record Purchase Bill
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3">Bill Number</th>
                <th className="px-4 py-3">Bill Date</th>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 font-medium">
                    No purchase bills recorded yet. Click &quot;Record Purchase Bill&quot; to add vendor invoices.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{b.billNo || b.id}</td>
                    <td className="px-4 py-3 text-slate-600">{b.billDate}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{b.supplierName}</td>
                    <td className="px-4 py-3 text-slate-500">{b.dueDate || 'Immediate'}</td>
                    <td className="px-4 py-3 text-right font-mono">{b.items?.length || 1}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ₹{(b.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={b.status === 'Paid' ? 'Received' : 'Pending'} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Bill Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Record Vendor Purchase Bill"
        subtitle="Log inward vendor invoice and record payable liability"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleSave}>Save Purchase Bill</Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Supplier Bill / Invoice #" placeholder="e.g. INV-9842" value={billNo} onChange={(e) => setBillNo(e.target.value)} />
            <Combobox
              label="Supplier"
              placeholder="Select supplier..."
              entityName="Supplier"
              options={suppliers.map(s => ({ label: s.name, value: s.id ?? s.partyId, sublabel: s.city || 'Vendor' }))}
              value={supplierId}
              onChange={setSupplierId}
              onCreateNew={(term) => setQuickPartyModal({ isOpen: true, name: term, type: 'Supplier' })}
              createLabel="+ Create new supplier"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Bill Date" type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
            <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          {/* Line Items */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 text-xs">Bill Items</span>
                <p className="text-[10px] text-slate-400">Products, quantities and vendor rates</p>
              </div>
              <button
                type="button"
                onClick={() => setItems([...items, { productId: '', qty: 10, rate: 0 }])}
                className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
              >
                + Add Row
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl bg-white shadow-2xs divide-y divide-slate-100 overflow-visible">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-50/80 rounded-t-xl text-[10px] font-bold text-slate-500 uppercase tracking-wider items-center">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">Product</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1 text-center"></div>
              </div>

              {/* Rows */}
              {items.map((it, idx) => {
                const qty = parseFloat(it.qty) || 0;
                const rate = parseFloat(it.rate) || 0;
                const lineTotal = Math.round(qty * rate);
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-slate-50/60 transition-colors">
                    <div className="col-span-1 text-center font-bold text-xs text-slate-400">{idx + 1}</div>
                    <div className="col-span-5">
                      <Combobox
                        placeholder="Select product..."
                        entityName="Product"
                        options={(state.products || []).map(p => ({ label: p.name, value: p.id ?? p.productId }))}
                        value={it.productId}
                        onChange={(val) => {
                          const prod = (state.products || []).find(p => String(p.id) === String(val) || String(p.productId) === String(val));
                          const up = [...items];
                          up[idx] = { ...up[idx], productId: val, rate: prod?.avgRate || prod?.purchaseRate || 100 };
                          setItems(up);
                        }}
                        onCreateNew={(term) => setQuickProductModal({ isOpen: true, name: term, itemIndex: idx })}
                        createLabel="+ Create product"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Qty"
                        className="w-full text-right py-1.5 px-2 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                        value={it.qty}
                        onChange={(e) => {
                          const up = [...items];
                          up[idx].qty = e.target.value;
                          setItems(up);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Rate"
                        className="w-full text-right py-1.5 px-2 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                        value={it.rate}
                        onChange={(e) => {
                          const up = [...items];
                          up[idx].rate = e.target.value;
                          setItems(up);
                        }}
                      />
                    </div>
                    <div className="col-span-1 text-right font-mono font-bold text-xs text-slate-800 truncate" title={`₹${lineTotal}`}>
                      ₹{lineTotal}
                    </div>
                    <div className="col-span-1 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setItems(items.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Icon name="Trash2" className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Input label="Notes / Remarks" placeholder="e.g. Terms 30 days credit" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </Drawer>

      {/* Quick Create Modals */}
      <QuickCreatePartyModal
        isOpen={quickPartyModal.isOpen}
        onClose={() => setQuickPartyModal({ isOpen: false, name: '', type: 'Supplier' })}
        defaultType="Supplier"
        initialName={quickPartyModal.name}
        onCreated={(newParty) => {
          setSupplierId(newParty.id || newParty.partyId);
        }}
      />

      <QuickCreateProductModal
        isOpen={quickProductModal.isOpen}
        onClose={() => setQuickProductModal({ isOpen: false, name: '', itemIndex: null })}
        initialName={quickProductModal.name}
        onCreated={(newProd) => {
          if (quickProductModal.itemIndex !== null && quickProductModal.itemIndex !== undefined) {
            const idx = quickProductModal.itemIndex;
            const pid = newProd.id || newProd.productId;
            const up = [...items];
            if (up[idx]) {
              up[idx] = {
                ...up[idx],
                productId: pid,
                rate: newProd.purchaseRate || newProd.avgRate || 100
              };
              setItems(up);
            }
          }
        }}
      />
    </div>
  );
}

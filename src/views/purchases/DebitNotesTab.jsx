import React, { useState } from 'react';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Combobox from '../../components/Combobox';
import Drawer from '../../components/Drawer';
import { useERP } from '../../context/ERPContext';
import QuickCreatePartyModal from '../../components/QuickCreatePartyModal';
import QuickCreateProductModal from '../../components/QuickCreateProductModal';

export default function DebitNotesTab() {
  const { state, createPurchaseReturn } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Quick Create Modals
  const [quickPartyModal, setQuickPartyModal] = useState({ isOpen: false, name: '', type: 'Supplier' });
  const [quickProductModal, setQuickProductModal] = useState({ isOpen: false, name: '' });

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [returnQty, setReturnQty] = useState('10');
  const [returnRate, setReturnRate] = useState('150');
  const [reason, setReason] = useState('Defective / Damaged in Transit');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const suppliers = (state.parties || []).filter(p => p.partyType === 'Supplier' || p.partyType === 'Both');
  const returns = state.purchaseReturns || [];

  const filteredReturns = returns.filter(r => {
    const q = search.toLowerCase();
    return !q || (r.supplierName && r.supplierName.toLowerCase().includes(q)) || (r.id && r.id.toLowerCase().includes(q));
  });

  const totalReturnedValue = returns.reduce((acc, r) => acc + (r.returnAmount || 0), 0);

  const handleSave = () => {
    const supplier = suppliers.find(s => String(s.id) === String(supplierId) || String(s.partyId) === String(supplierId));
    const prod = (state.products || []).find(p => String(p.id) === String(productId) || String(p.productId) === String(productId));
    if (!supplier || !prod) return;

    const qty = parseFloat(returnQty || 1);
    const rate = parseFloat(returnRate || 100);
    const returnAmount = qty * rate;

    createPurchaseReturn({
      supplierId: supplier.partyId || supplier.id,
      supplierName: supplier.name,
      items: [
        {
          productId: prod.id ?? prod.productId,
          productName: prod.name,
          qty,
          rate,
          amount: returnAmount
        }
      ],
      returnAmount,
      reason,
      date
    });

    setIsOpen(false);
    setSupplierId('');
    setProductId('');
    setReturnQty('10');
  };

  return (
    <div className="space-y-5">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Debit Notes</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900">{returns.length}</span>
            <span className="text-xs text-slate-500 font-medium">Recorded</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Debit Value</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900 font-mono">₹{totalReturnedValue.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Stock Adjustment</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xs font-bold text-emerald-600">Auto-Deducted from Inventory</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Icon name="Search" className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search debit notes, suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsOpen(true)}>
          <Icon name="Plus" className="w-3.5 h-3.5" />
          Create Debit Note (Purchase Return)
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3">Debit Note #</th>
                <th className="px-4 py-3">Return Date</th>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3">Item Returned</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 text-right">Debit Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 font-medium">
                    No debit notes recorded yet. Click &quot;Create Debit Note&quot; to log goods returned to suppliers.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{r.id}</td>
                    <td className="px-4 py-3 text-slate-600">{r.date}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.supplierName}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900">{r.items?.[0]?.productName || 'Goods Return'}</span>
                      {r.items?.[0]?.qty && <span className="text-[11px] text-slate-500 ml-1.5 font-mono">({r.items[0].qty} qty)</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.reason}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ₹{(r.returnAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {r.status || 'Adjusted'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Debit Note Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create Debit Note (Purchase Return)"
        subtitle="Return goods to supplier and reduce vendor payable balance"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleSave}>Issue Debit Note</Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <Combobox
            label="Supplier / Vendor"
            placeholder="Select vendor..."
            entityName="Supplier"
            options={suppliers.map(s => ({ label: s.name, value: s.id ?? s.partyId, sublabel: s.city || 'Vendor' }))}
            value={supplierId}
            onChange={setSupplierId}
            onCreateNew={(term) => setQuickPartyModal({ isOpen: true, name: term, type: 'Supplier' })}
            createLabel="+ Create new supplier"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Return Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Select
              label="Return Reason"
              options={['Defective / Damaged in Transit', 'Poor Quality / Out of Spec', 'Excess Quantity Delivered', 'Billing Discrepancy']}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <span className="font-bold text-slate-800">Return Item Details</span>
            <Combobox
              label="Select Product to Return"
              placeholder="Select product..."
              entityName="Product"
              options={(state.products || []).map(p => ({ label: p.name, value: p.id ?? p.productId, sublabel: `Stock: ${p.availableStock} ${p.uom || 'KG'}` }))}
              value={productId}
              onChange={(val) => {
                setProductId(val);
                const prod = (state.products || []).find(p => String(p.id) === String(val) || String(p.productId) === String(val));
                if (prod) setReturnRate(String(prod.avgRate || prod.purchaseRate || 100));
              }}
              onCreateNew={(term) => setQuickProductModal({ isOpen: true, name: term })}
              createLabel="+ Create product"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input label="Return Quantity" type="number" value={returnQty} onChange={(e) => setReturnQty(e.target.value)} />
              <Input label="Unit Rate (₹)" type="number" value={returnRate} onChange={(e) => setReturnRate(e.target.value)} />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 text-[11px]">
              <span className="font-bold block">Debit Note Total: ₹{(parseFloat(returnQty || 0) * parseFloat(returnRate || 0)).toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-amber-700">Stock will be automatically deducted from available inventory.</span>
            </div>
          </div>
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
        onClose={() => setQuickProductModal({ isOpen: false, name: '' })}
        initialName={quickProductModal.name}
        onCreated={(newProd) => {
          const pid = newProd.id || newProd.productId;
          setProductId(pid);
          setReturnRate(String(newProd.purchaseRate || newProd.avgRate || 100));
        }}
      />
    </div>
  );
}

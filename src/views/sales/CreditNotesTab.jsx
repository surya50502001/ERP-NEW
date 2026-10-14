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

export default function CreditNotesTab() {
  const { state, createSalesReturn } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Quick Create Modals
  const [quickPartyModal, setQuickPartyModal] = useState({ isOpen: false, name: '' });
  const [quickProductModal, setQuickProductModal] = useState({ isOpen: false, name: '' });

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [returnQty, setReturnQty] = useState('5');
  const [returnRate, setReturnRate] = useState('250');
  const [reason, setReason] = useState('Defective / Quality Issue');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const customers = (state.parties || []).filter(p => p.partyType === 'Customer' || p.partyType === 'Both');
  const returns = state.salesReturns || [];

  const filteredReturns = returns.filter(r => {
    const q = search.toLowerCase();
    return !q || 
      (r.customerName && r.customerName.toLowerCase().includes(q)) || 
      (r.id && r.id.toLowerCase().includes(q)) ||
      (r.reason && r.reason.toLowerCase().includes(q));
  });

  const totalCreditedValue = returns.reduce((acc, r) => acc + (r.refundAmount || 0), 0);

  const handleSave = () => {
    const customer = customers.find(c => String(c.id) === String(customerId) || String(c.partyId) === String(customerId));
    const prod = (state.products || []).find(p => String(p.id) === String(productId) || String(p.productId) === String(productId));
    if (!customer || !prod) return;

    const qty = parseFloat(returnQty || 1);
    const rate = parseFloat(returnRate || 100);
    const refundAmount = qty * rate;

    createSalesReturn({
      customerId: customer.partyId || customer.id,
      customerName: customer.name,
      items: [
        {
          productId: prod.id ?? prod.productId,
          productName: prod.name,
          qty,
          rate,
          amount: refundAmount
        }
      ],
      refundAmount,
      reason,
      date
    });

    setIsOpen(false);
    setCustomerId('');
    setProductId('');
    setReturnQty('5');
    setReturnRate('250');
  };

  return (
    <div className="space-y-5">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Credit Issued</span>
          <p className="text-2xl font-bold font-mono text-rose-600 mt-1">₹{totalCreditedValue.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-500">Value credited back to clients</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Returns Logged</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{returns.length}</p>
          <span className="text-[11px] text-slate-500">Customer return records</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Inventory Status</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">Restocked</p>
          <span className="text-[11px] text-slate-500">Items automatically returned to stock</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="w-full sm:w-80">
          <Input
            icon="Search"
            placeholder="Search customer, credit note ID, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="primary" size="md" onClick={() => setIsOpen(true)}>
          <Icon name="Plus" className="w-4 h-4" />
          Issue Credit Note (Sale Return)
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Credit Note ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Returned Item(s)</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4 text-right">Credit Amount (₹)</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {filteredReturns.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-10 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Icon name="RotateCcw" className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-600">No sale returns recorded</p>
                    <p className="text-xs text-slate-400">Click &quot;Issue Credit Note&quot; to register returned goods from a customer.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredReturns.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold font-mono text-slate-900">{r.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{r.customerName}</td>
                  <td className="py-3 px-4 text-slate-500">{r.date}</td>
                  <td className="py-3 px-4">
                    {r.items && r.items.length > 0 ? (
                      <div>
                        <span className="font-semibold text-slate-900">{r.items[0].productName}</span>
                        <span className="text-slate-500 ml-1">({r.items[0].qty} units)</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{r.reason}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                    ₹{(r.refundAmount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {r.status || 'Credited'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Issue Sale Return (Credit Note)"
        subtitle="Return goods from customer back to inventory and credit ledger"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleSave}>Issue Credit Note</Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <Combobox
            label="Select Customer"
            placeholder="Search customer..."
            entityName="Customer"
            options={customers.map(c => ({
              label: c.name,
              value: c.id ?? c.partyId,
              sublabel: c.phone || c.city || ''
            }))}
            value={customerId}
            onChange={(val) => setCustomerId(val)}
            onCreateNew={(term) => setQuickPartyModal({ isOpen: true, name: term })}
            createLabel="+ Create new customer"
          />

          <Combobox
            label="Returned Product"
            placeholder="Select product..."
            entityName="Product"
            options={(state.products || []).map(p => ({
              label: p.name,
              value: p.id ?? p.productId,
              sublabel: `Current Stock: ${p.availableStock} ${p.uom}`
            }))}
            value={productId}
            onChange={(val) => {
              setProductId(val);
              const p = (state.products || []).find(x => String(x.id) === String(val) || String(x.productId) === String(val));
              if (p) setReturnRate(String(Math.round(p.avgRate * 1.15 || 250)));
            }}
            onCreateNew={(term) => setQuickProductModal({ isOpen: true, name: term })}
            createLabel="+ Create product"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Return Quantity"
              type="number"
              value={returnQty}
              onChange={(e) => setReturnQty(e.target.value)}
            />
            <Input
              label="Credit Rate per unit (₹)"
              type="number"
              value={returnRate}
              onChange={(e) => setReturnRate(e.target.value)}
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center font-mono">
            <span className="text-slate-600">Calculated Credit Note Amount:</span>
            <span className="text-base font-bold text-rose-600">
              ₹{(parseFloat(returnQty || 0) * parseFloat(returnRate || 0)).toLocaleString('en-IN')}
            </span>
          </div>

          <Select
            label="Return Reason"
            options={[
              'Defective / Quality Issue',
              'Damage in Shipping',
              'Wrong Item Shipped',
              'Client Specification Mismatch',
              'Order Cancellation Post-Delivery'
            ]}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <Input
            label="Return Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900 text-[11px] leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5">
              <Icon name="CheckCircle2" className="w-4 h-4 text-emerald-600" />
              Automated Stock Restock
            </p>
            Submitting this Credit Note will automatically add {returnQty || 0} units back into warehouse available inventory stock and adjust receivables.
          </div>
        </div>
      </Drawer>

      {/* Quick Create Modals */}
      <QuickCreatePartyModal
        isOpen={quickPartyModal.isOpen}
        onClose={() => setQuickPartyModal({ isOpen: false, name: '' })}
        defaultType="Customer"
        initialName={quickPartyModal.name}
        onCreated={(newParty) => {
          setCustomerId(newParty.id || newParty.partyId);
        }}
      />

      <QuickCreateProductModal
        isOpen={quickProductModal.isOpen}
        onClose={() => setQuickProductModal({ isOpen: false, name: '' })}
        initialName={quickProductModal.name}
        onCreated={(newProd) => {
          const pid = newProd.id || newProd.productId;
          setProductId(pid);
          setReturnRate(String(Math.round((newProd.avgRate || 250) * 1.15)));
        }}
      />
    </div>
  );
}

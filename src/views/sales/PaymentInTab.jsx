import React, { useState } from 'react';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Combobox from '../../components/Combobox';
import Drawer from '../../components/Drawer';
import { useERP } from '../../context/ERPContext';
import QuickCreatePartyModal from '../../components/QuickCreatePartyModal';

export default function PaymentInTab() {
  const { state, recordPaymentIn } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('All');

  // Quick Create Modal
  const [quickPartyModal, setQuickPartyModal] = useState({ isOpen: false, name: '' });

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [notes, setNotes] = useState('');

  const customers = (state.parties || []).filter(p => p.partyType === 'Customer' || p.partyType === 'Both');
  const payments = state.paymentsIn || [];
  const invoices = state.salesInvoices || [];

  const customerInvoices = invoices.filter(inv => {
    if (!customerId) return true;
    return String(inv.customerId) === String(customerId) || inv.customerName === customers.find(c => String(c.id) === String(customerId))?.name;
  });

  const filteredPayments = payments.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = !q || 
      (p.customerName && p.customerName.toLowerCase().includes(q)) || 
      (p.referenceNo && p.referenceNo.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q));
    const matchesMode = modeFilter === 'All' || p.paymentMode === modeFilter;
    return matchesSearch && matchesMode;
  });

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCollected = payments.filter(p => p.date === todayStr).reduce((acc, p) => acc + (p.amount || 0), 0);

  const handleSave = () => {
    const customer = customers.find(c => String(c.id) === String(customerId) || String(c.partyId) === String(customerId));
    if (!customer || !amount || parseFloat(amount) <= 0) return;

    recordPaymentIn({
      customerId: customer.partyId || customer.id,
      customerName: customer.name,
      amount: parseFloat(amount),
      date,
      paymentMode,
      referenceNo: referenceNo || `UPI-${Date.now().toString().slice(-6)}`,
      invoiceRef,
      notes
    });

    setIsOpen(false);
    setCustomerId('');
    setAmount('');
    setReferenceNo('');
    setInvoiceRef('');
    setNotes('');
  };

  return (
    <div className="space-y-5">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Collections</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">₹{totalCollected.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-500">Cumulative inward revenue</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Today's Inflow</span>
          <p className="text-2xl font-bold font-mono text-indigo-600 mt-1">₹{todayCollected.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-500">Receipts logged today</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Receipts Logged</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{payments.length}</p>
          <span className="text-[11px] text-slate-500">Payment-in vouchers</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="w-full sm:w-80">
          <Input
            icon="Search"
            placeholder="Search customer, reference, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['All', 'Bank Transfer', 'UPI', 'Cash', 'Cheque'].map(mode => (
              <button
                key={mode}
                onClick={() => setModeFilter(mode)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  modeFilter === mode
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <Button variant="primary" size="md" onClick={() => setIsOpen(true)}>
            <Icon name="Plus" className="w-4 h-4" />
            Record Payment - In
          </Button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Receipt ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Mode</th>
              <th className="py-3 px-4">Ref / UTR</th>
              <th className="py-3 px-4">Invoice Linked</th>
              <th className="py-3 px-4 text-right">Amount (₹)</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-10 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Icon name="CreditCard" className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-600">No payment receipts found</p>
                    <p className="text-xs text-slate-400">Click &quot;Record Payment - In&quot; to log incoming customer funds.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold font-mono text-slate-900">{p.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{p.customerName}</td>
                  <td className="py-3 px-4 text-slate-500">{p.date}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {p.paymentMode}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{p.referenceNo || '—'}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{p.invoiceRef || 'Unallocated'}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                    +₹{(p.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {p.status || 'Received'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment-In Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Record Payment - In"
        subtitle="Log inward funds received from a client / customer"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleSave}>Confirm Receipt</Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <Combobox
            label="Customer"
            placeholder="Select customer..."
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

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Receipt Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Select
              label="Payment Mode"
              options={['Bank Transfer', 'UPI', 'Cash', 'Cheque']}
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount Received (₹)"
              type="number"
              placeholder="e.g. 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              label="Ref / UTR / Cheque No"
              placeholder="e.g. UPI-987654"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
            />
          </div>

          <Select
            label="Against Sales Invoice (Optional)"
            options={[
              'None (On Account)',
              ...customerInvoices.map(inv => `${inv.id || inv.invoiceId} - ₹${(inv.totalAmount || 0).toLocaleString('en-IN')}`)
            ]}
            value={invoiceRef ? invoiceRef : 'None (On Account)'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'None (On Account)') {
                setInvoiceRef('');
              } else {
                setInvoiceRef(val.split(' - ')[0]);
              }
            }}
          />

          <Input
            label="Notes / Remarks"
            placeholder="e.g. Payment for order batch or advance deposit"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </Drawer>

      {/* Quick Create Modal */}
      <QuickCreatePartyModal
        isOpen={quickPartyModal.isOpen}
        onClose={() => setQuickPartyModal({ isOpen: false, name: '' })}
        defaultType="Customer"
        initialName={quickPartyModal.name}
        onCreated={(newParty) => {
          setCustomerId(newParty.id || newParty.partyId);
        }}
      />
    </div>
  );
}

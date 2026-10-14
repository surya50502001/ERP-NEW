import React, { useState } from 'react';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Combobox from '../../components/Combobox';
import Drawer from '../../components/Drawer';
import { useERP } from '../../context/ERPContext';
import QuickCreatePartyModal from '../../components/QuickCreatePartyModal';

export default function PaymentOutTab() {
  const { state, recordPaymentOut } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Quick Create Modal
  const [quickPartyModal, setQuickPartyModal] = useState({ isOpen: false, name: '' });

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [billRef, setBillRef] = useState('');
  const [notes, setNotes] = useState('');

  const suppliers = (state.parties || []).filter(p => p.partyType === 'Supplier' || p.partyType === 'Both');
  const payments = state.paymentsOut || [];
  const bills = state.purchaseBills || [];

  const filteredPayments = payments.filter(p => {
    const q = search.toLowerCase();
    return !q || (p.supplierName && p.supplierName.toLowerCase().includes(q)) || (p.referenceNo && p.referenceNo.toLowerCase().includes(q));
  });

  const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const handleSave = () => {
    const supplier = suppliers.find(s => String(s.id) === String(supplierId) || String(s.partyId) === String(supplierId));
    if (!supplier || !amount || parseFloat(amount) <= 0) return;

    recordPaymentOut({
      supplierId: supplier.partyId || supplier.id,
      supplierName: supplier.name,
      amount: parseFloat(amount),
      date,
      paymentMode,
      referenceNo: referenceNo || `UTR-${Math.floor(100000 + Math.random() * 900000)}`,
      billRef,
      notes
    });

    setIsOpen(false);
    setSupplierId('');
    setAmount('');
    setReferenceNo('');
    setBillRef('');
    setNotes('');
  };

  return (
    <div className="space-y-5">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Payments Out</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900 font-mono">₹{totalPaid.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Vouchers Count</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900">{payments.length}</span>
            <span className="text-xs text-slate-500 font-medium">Disbursements</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Primary Channel</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-sm font-bold text-slate-800">NEFT / RTGS & UPI</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Icon name="Search" className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search payments, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsOpen(true)}>
          <Icon name="Plus" className="w-3.5 h-3.5" />
          Record Payment - Out
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3">Voucher #</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3">Payment Mode</th>
                <th className="px-4 py-3">Ref / UTR #</th>
                <th className="px-4 py-3 text-right">Amount Paid</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 font-medium">
                    No payments out recorded yet. Click &quot;Record Payment - Out&quot; to log vendor settlements.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.id}</td>
                    <td className="px-4 py-3 text-slate-600">{p.date}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.supplierName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        <Icon name="CreditCard" className="w-3 h-3 text-slate-500" />
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{p.referenceNo || 'N/A'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                      -₹{(p.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Out Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Record Supplier Payment - Out"
        subtitle="Log vendor disbursement and adjust outstanding balance"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleSave}>Confirm Payment Out</Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <Combobox
            label="Supplier / Vendor"
            placeholder="Select vendor..."
            entityName="Supplier"
            options={suppliers.map(s => ({ label: s.name, value: s.id ?? s.partyId, sublabel: s.contactNumber || 'Vendor' }))}
            value={supplierId}
            onChange={setSupplierId}
            onCreateNew={(term) => setQuickPartyModal({ isOpen: true, name: term })}
            createLabel="+ Create new supplier"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount Paid (₹)" type="number" placeholder="50000" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input label="Payment Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Payment Mode"
              options={['Bank Transfer', 'UPI', 'Cheque', 'Cash']}
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            />
            <Input label="Ref # / UTR / Cheque #" placeholder="e.g. UTR-982187" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
          </div>

          <Select
            label="Link to Purchase Bill (Optional)"
            options={['None / Advance Payment', ...bills.map(b => `${b.billNo || b.id} - ₹${b.totalAmount} (${b.supplierName})`)]}
            value={billRef}
            onChange={(e) => setBillRef(e.target.value)}
          />

          <Input label="Payment Notes" placeholder="e.g. Part payment for August delivery" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </Drawer>

      {/* Quick Create Modal */}
      <QuickCreatePartyModal
        isOpen={quickPartyModal.isOpen}
        onClose={() => setQuickPartyModal({ isOpen: false, name: '' })}
        defaultType="Supplier"
        initialName={quickPartyModal.name}
        onCreated={(newParty) => {
          setSupplierId(newParty.id || newParty.partyId);
        }}
      />
    </div>
  );
}

import React, { useState } from 'react';
import Icon from '../components/Icon';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Combobox from '../components/Combobox';
import StatusBadge from '../components/StatusBadge';
import { useERP } from '../context/ERPContext';
import PartyLedgerModal from '../components/PartyLedgerModal';

export default function PaymentsView({ onNavigate }) {
  const { state, recordPaymentIn, recordPaymentOut, showToast } = useERP();
  const [subTab, setSubTab] = useState('payment-in'); // 'payment-in' | 'payment-out' | 'receivables' | 'payables' | 'ledgers'
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('All');

  // Party Statement Modal
  const [selectedPartyForLedger, setSelectedPartyForLedger] = useState(null);

  // Record Payment In Modal State
  const [isPayInOpen, setIsPayInOpen] = useState(false);
  const [payInCustId, setPayInCustId] = useState('');
  const [payInAmount, setPayInAmount] = useState('');
  const [payInDate, setPayInDate] = useState(new Date().toISOString().split('T')[0]);
  const [payInMode, setPayInMode] = useState('UPI');
  const [payInRef, setPayInRef] = useState('');
  const [payInInvoiceRef, setPayInInvoiceRef] = useState('');
  const [payInNotes, setPayInNotes] = useState('');
  const [payInErrors, setPayInErrors] = useState({});

  // Record Payment Out Modal State
  const [isPayOutOpen, setIsPayOutOpen] = useState(false);
  const [payOutSuppId, setPayOutSuppId] = useState('');
  const [payOutAmount, setPayOutAmount] = useState('');
  const [payOutDate, setPayOutDate] = useState(new Date().toISOString().split('T')[0]);
  const [payOutMode, setPayOutMode] = useState('NEFT/RTGS');
  const [payOutRef, setPayOutRef] = useState('');
  const [payOutBillRef, setPayOutBillRef] = useState('');
  const [payOutNotes, setPayOutNotes] = useState('');
  const [payOutErrors, setPayOutErrors] = useState({});

  if (!state) return null;

  const customers = (state.parties || []).filter(p => (p.partyType || p.type) === 'Customer' || (p.partyType || p.type) === 'Both');
  const suppliers = (state.parties || []).filter(p => (p.partyType || p.type) === 'Supplier' || (p.partyType || p.type) === 'Both');

  const paymentsIn = state.paymentsIn || [];
  const paymentsOut = state.paymentsOut || [];
  const salesInvoices = state.salesInvoices || [];
  const purchaseBills = state.purchaseBills || [];

  // Metrics
  const totalCollections = paymentsIn.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  const totalDisbursements = paymentsOut.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  
  // Pending Receivables (Unpaid or Partial Invoices)
  const pendingInvoices = salesInvoices.filter(inv => inv.status !== 'Paid');
  const totalReceivables = pendingInvoices.reduce((acc, inv) => acc + (parseFloat(inv.totalAmount || inv.invVal) || 0), 0);

  // Pending Payables (Unpaid Bills)
  const pendingBills = purchaseBills.filter(b => b.status !== 'Paid');
  const totalPayables = pendingBills.reduce((acc, b) => acc + (parseFloat(b.totalAmount) || 0), 0);

  // Handlers
  const handleSavePaymentIn = () => {
    const errs = {};
    const customer = customers.find(c => String(c.id) === String(payInCustId) || String(c.partyId) === String(payInCustId));
    if (!customer) errs.customer = 'Please select a customer.';
    const amt = parseFloat(payInAmount);
    if (!amt || isNaN(amt) || amt <= 0) errs.amount = 'Amount must be greater than zero.';
    if (!payInMode) errs.mode = 'Please select payment mode.';

    if (Object.keys(errs).length > 0) {
      setPayInErrors(errs);
      return;
    }
    setPayInErrors({});

    recordPaymentIn({
      customerId: customer.partyId || customer.id,
      customerName: customer.name,
      amount: amt,
      date: payInDate,
      paymentMode: payInMode,
      referenceNo: payInRef || `UPI-${Date.now().toString().slice(-6)}`,
      invoiceRef: payInInvoiceRef || '',
      notes: payInNotes
    });

    setIsPayInOpen(false);
    setPayInCustId('');
    setPayInAmount('');
    setPayInRef('');
    setPayInInvoiceRef('');
    setPayInNotes('');
  };

  const handleSavePaymentOut = () => {
    const errs = {};
    const supplier = suppliers.find(s => String(s.id) === String(payOutSuppId) || String(s.partyId) === String(payOutSuppId));
    if (!supplier) errs.supplier = 'Please select a supplier.';
    const amt = parseFloat(payOutAmount);
    if (!amt || isNaN(amt) || amt <= 0) errs.amount = 'Amount must be greater than zero.';
    if (!payOutMode) errs.mode = 'Please select payment mode.';

    if (Object.keys(errs).length > 0) {
      setPayOutErrors(errs);
      return;
    }
    setPayOutErrors({});

    recordPaymentOut({
      supplierId: supplier.partyId || supplier.id,
      supplierName: supplier.name,
      amount: amt,
      date: payOutDate,
      paymentMode: payOutMode,
      referenceNo: payOutRef || `UTR-${Date.now().toString().slice(-6)}`,
      billRef: payOutBillRef || '',
      notes: payOutNotes
    });

    setIsPayOutOpen(false);
    setPayOutSuppId('');
    setPayOutAmount('');
    setPayOutRef('');
    setPayOutBillRef('');
    setPayOutNotes('');
  };

  const handleQuickCollect = (inv) => {
    setPayInCustId(inv.customerId || '');
    setPayInAmount(inv.totalAmount || inv.invVal || '');
    setPayInInvoiceRef(inv.id || inv.invoiceId || '');
    setIsPayInOpen(true);
  };

  const handleQuickPayBill = (bill) => {
    setPayOutSuppId(bill.supplierId || '');
    setPayOutAmount(bill.totalAmount || '');
    setPayOutBillRef(bill.billNo || bill.id || '');
    setIsPayOutOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payments & Ledger Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">Accounts Receivable, Accounts Payable, Voucher Receipts, and Detailed Party Statements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={() => setIsPayOutOpen(true)}>
            <Icon name="ArrowUpRight" className="w-4 h-4 text-rose-500" />
            + Record Payment Out
          </Button>
          <Button variant="primary" size="md" onClick={() => setIsPayInOpen(true)}>
            <Icon name="ArrowDownLeft" className="w-4 h-4 text-emerald-400" />
            + Record Payment In
          </Button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Collections</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">₹{totalCollections.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-500">{paymentsIn.length} Customer Receipts</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Disbursements</span>
          <p className="text-2xl font-bold font-mono text-indigo-600 mt-1">₹{totalDisbursements.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-500">{paymentsOut.length} Vendor Payments</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Outstanding Receivables</span>
          <p className="text-2xl font-bold font-mono text-rose-600 mt-1">₹{totalReceivables.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-500">{pendingInvoices.length} Unsettled Invoices</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Outstanding Payables</span>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-1">₹{totalPayables.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-500">{pendingBills.length} Unsettled Vendor Bills</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'payment-in', label: 'Customer Receipts (Payment In)', icon: 'ArrowDownLeft' },
          { id: 'payment-out', label: 'Supplier Payments (Payment Out)', icon: 'ArrowUpRight' },
          { id: 'receivables', label: 'Outstanding Receivables', icon: 'Receipt' },
          { id: 'payables', label: 'Outstanding Payables', icon: 'ShoppingBag' },
          { id: 'ledgers', label: 'Party Ledgers & Statements', icon: 'BookOpen' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Icon name={tab.icon} className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="w-full sm:w-80">
          <Input
            icon="Search"
            placeholder="Search party, reference, voucher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-medium text-slate-600">
          <span className="text-[11px] font-bold text-slate-400">Payment Mode:</span>
          {['All', 'Cash', 'UPI', 'NEFT/RTGS', 'Cheque'].map(m => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                modeFilter === m ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Payment In (Customer Receipts) */}
      {subTab === 'payment-in' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Receipt Voucher</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Receipt Date</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Reference / UTR</th>
                <th className="py-3 px-4">Linked Invoice</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paymentsIn.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400 italic">No customer payment receipts logged yet.</td>
                </tr>
              ) : (
                paymentsIn
                  .filter(p => !search || (p.customerName || '').toLowerCase().includes(search.toLowerCase()) || (p.id || '').toLowerCase().includes(search.toLowerCase()))
                  .filter(p => modeFilter === 'All' || p.paymentMode === modeFilter)
                  .map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.customerName}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{p.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.referenceNo || '—'}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.invoiceRef || 'Unallocated'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">+₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={p.status || 'Received'} />
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Payment Out (Supplier Payments) */}
      {subTab === 'payment-out' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Disbursement Voucher</th>
                <th className="py-3 px-4">Vendor / Supplier</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Cheque / UTR Ref</th>
                <th className="py-3 px-4">Linked Bill</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paymentsOut.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400 italic">No vendor disbursements logged yet.</td>
                </tr>
              ) : (
                paymentsOut
                  .filter(p => !search || (p.supplierName || '').toLowerCase().includes(search.toLowerCase()) || (p.id || '').toLowerCase().includes(search.toLowerCase()))
                  .filter(p => modeFilter === 'All' || p.paymentMode === modeFilter)
                  .map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.supplierName}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{p.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.referenceNo || '—'}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.billRef || 'Direct Inward'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">-₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={p.status || 'Completed'} />
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Outstanding Receivables */}
      {subTab === 'receivables' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Invoice Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Invoice Value (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {pendingInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">All customer invoices are fully settled!</td>
                </tr>
              ) : (
                pendingInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.id || inv.invoiceId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{inv.customerName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{inv.date || '2026-09-01'}</td>
                    <td className="py-3 px-4 font-mono text-rose-600 font-bold">{inv.dueDate || 'Immediate'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{(inv.totalAmount || inv.invVal || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={inv.status || 'Pending Approval'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="primary" size="sm" onClick={() => handleQuickCollect(inv)}>
                        <Icon name="CreditCard" className="w-3.5 h-3.5" />
                        Collect Payment
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: Outstanding Payables */}
      {subTab === 'payables' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Supplier Party</th>
                <th className="py-3 px-4">Bill Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Bill Value (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {pendingBills.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">All vendor bills are fully paid!</td>
                </tr>
              ) : (
                pendingBills.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.billNo || b.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{b.supplierName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{b.billDate || '2026-09-01'}</td>
                    <td className="py-3 px-4 font-mono text-amber-600 font-bold">{b.dueDate || '30 Days'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{(b.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={b.status || 'Unpaid'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="secondary" size="sm" onClick={() => handleQuickPayBill(b)}>
                        <Icon name="ArrowUpRight" className="w-3.5 h-3.5" />
                        Pay Vendor
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: Party Ledgers Directory */}
      {subTab === 'ledgers' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Party Name & ID</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4 text-right">Statement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {(state.parties || []).map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setSelectedPartyForLedger(p)}
                      className="font-bold text-slate-900 hover:text-indigo-600 hover:underline text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{p.name}</span>
                      <Icon name="ExternalLink" className="w-3 h-3 text-slate-400" />
                    </button>
                    <span className="text-[10px] font-mono text-slate-400 block">{p.partyId || p.id}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {p.partyType || p.type || 'Party'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{p.phone || p.contactNumber || '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{p.city || p.location || p.state || 'India'}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{p.gstin || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedPartyForLedger(p)}
                      className="cursor-pointer"
                    >
                      <Icon name="FileText" className="w-3.5 h-3.5" />
                      View Statement
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment In Modal */}
      {isPayInOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Icon name="ArrowDownLeft" className="w-4 h-4 text-emerald-600" />
                Record Customer Receipt (Payment - In)
              </h3>
              <button onClick={() => setIsPayInOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3">
              <Combobox
                label="Customer *"
                placeholder="Select customer..."
                entityName="Customer"
                options={customers.map(c => ({ label: c.name, value: c.id ?? c.partyId, sublabel: c.location }))}
                value={payInCustId}
                onChange={(val) => setPayInCustId(val)}
                error={payInErrors.customer}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Amount Received (₹) *"
                  type="number"
                  placeholder="0.00"
                  value={payInAmount}
                  onChange={(e) => setPayInAmount(e.target.value)}
                  error={payInErrors.amount}
                />
                <Input
                  label="Receipt Date *"
                  type="date"
                  value={payInDate}
                  onChange={(e) => setPayInDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Payment Mode *"
                  options={['UPI', 'Cash', 'Bank Transfer', 'NEFT/RTGS', 'Cheque']}
                  value={payInMode}
                  onChange={(e) => setPayInMode(e.target.value)}
                  error={payInErrors.mode}
                />
                <Input
                  label="Reference / UTR No"
                  placeholder="e.g. UPI-984214"
                  value={payInRef}
                  onChange={(e) => setPayInRef(e.target.value)}
                />
              </div>

              <Input
                label="Linked Sales Invoice Ref (Optional)"
                placeholder="e.g. INV-2081"
                value={payInInvoiceRef}
                onChange={(e) => setPayInInvoiceRef(e.target.value)}
              />

              <Input
                label="Remarks / Notes"
                placeholder="Payment notes..."
                value={payInNotes}
                onChange={(e) => setPayInNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setIsPayInOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSavePaymentIn}>Save Receipt</Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Out Modal */}
      {isPayOutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Icon name="ArrowUpRight" className="w-4 h-4 text-rose-600" />
                Record Supplier Disbursement (Payment - Out)
              </h3>
              <button onClick={() => setIsPayOutOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3">
              <Combobox
                label="Supplier / Vendor *"
                placeholder="Select supplier..."
                entityName="Supplier"
                options={suppliers.map(s => ({ label: s.name, value: s.id ?? s.partyId, sublabel: s.location }))}
                value={payOutSuppId}
                onChange={(val) => setPayOutSuppId(val)}
                error={payOutErrors.supplier}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Amount Paid (₹) *"
                  type="number"
                  placeholder="0.00"
                  value={payOutAmount}
                  onChange={(e) => setPayOutAmount(e.target.value)}
                  error={payOutErrors.amount}
                />
                <Input
                  label="Payment Date *"
                  type="date"
                  value={payOutDate}
                  onChange={(e) => setPayOutDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Payment Mode *"
                  options={['NEFT/RTGS', 'Bank Transfer', 'UPI', 'Cheque', 'Cash']}
                  value={payOutMode}
                  onChange={(e) => setPayOutMode(e.target.value)}
                  error={payOutErrors.mode}
                />
                <Input
                  label="UTR / Cheque No"
                  placeholder="e.g. UTR-004812"
                  value={payOutRef}
                  onChange={(e) => setPayOutRef(e.target.value)}
                />
              </div>

              <Input
                label="Linked Purchase Bill Ref (Optional)"
                placeholder="e.g. PB-1001"
                value={payOutBillRef}
                onChange={(e) => setPayOutBillRef(e.target.value)}
              />

              <Input
                label="Remarks / Notes"
                placeholder="Disbursement notes..."
                value={payOutNotes}
                onChange={(e) => setPayOutNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setIsPayOutOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSavePaymentOut}>Confirm Disbursement</Button>
            </div>
          </div>
        </div>
      )}

      {/* Party Statement Modal */}
      <PartyLedgerModal
        isOpen={!!selectedPartyForLedger}
        onClose={() => setSelectedPartyForLedger(null)}
        party={selectedPartyForLedger}
      />
    </div>
  );
}

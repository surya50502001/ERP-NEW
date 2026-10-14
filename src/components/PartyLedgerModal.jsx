import React, { useState, useMemo } from 'react';
import Icon from './Icon';
import Button from './Button';
import { useERP } from '../context/ERPContext';

export default function PartyLedgerModal({ isOpen, onClose, party }) {
  const { state } = useERP();
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'thisMonth' | 'last30'

  if (!isOpen || !party) return null;

  const partyName = party.name || party.slName || 'Party';
  const partyId = party.partyId || party.id || party.slCode;
  const isCustomer = (party.partyType || party.type) === 'Customer';
  const isSupplier = (party.partyType || party.type) === 'Supplier';

  // Gather all transactions for this party
  const transactions = useMemo(() => {
    if (!state) return [];
    const list = [];

    const isMatch = (targetId, targetName) => {
      if (targetId && (String(targetId) === String(partyId) || String(targetId) === String(party.id))) return true;
      if (targetName && targetName.toLowerCase() === partyName.toLowerCase()) return true;
      return false;
    };

    // 1. Sales Invoices (Customer Debit)
    (state.salesInvoices || []).forEach(inv => {
      if (isMatch(inv.customerId, inv.customerName)) {
        list.push({
          date: inv.date || inv.invDt || '2026-09-01',
          type: 'Sales Invoice',
          refNo: inv.id || inv.invoiceId || 'INV-001',
          description: `Sales Invoice (${inv.itemsCount || inv.items?.length || 1} items) - ${inv.status || 'Active'}`,
          debit: parseFloat(inv.totalAmount || inv.invVal || 0),
          credit: 0
        });
      }
    });

    // 2. Payments In (Customer Credit)
    (state.paymentsIn || []).forEach(pay => {
      if (isMatch(pay.customerId, pay.customerName)) {
        list.push({
          date: pay.date || '2026-09-02',
          type: 'Payment In (Receipt)',
          refNo: pay.referenceNo || pay.id,
          description: `Customer Receipt via ${pay.paymentMode || 'Bank'} ${pay.invoiceRef ? `(Inv: ${pay.invoiceRef})` : ''}`,
          debit: 0,
          credit: parseFloat(pay.amount || 0)
        });
      }
    });

    // 3. Sales Returns / Credit Notes (Customer Credit)
    (state.salesReturns || []).forEach(ret => {
      if (isMatch(ret.customerId, ret.customerName)) {
        list.push({
          date: ret.date || '2026-09-03',
          type: 'Credit Note (Return)',
          refNo: ret.id,
          description: `Sales Return Credit - ${ret.reason || 'Restocked'}`,
          debit: 0,
          credit: parseFloat(ret.refundAmount || 0)
        });
      }
    });

    // 4. Purchase Bills / POs (Supplier Credit)
    (state.purchaseBills || []).forEach(pb => {
      if (isMatch(pb.supplierId, pb.supplierName)) {
        list.push({
          date: pb.billDate || pb.date || '2026-09-01',
          type: 'Purchase Bill',
          refNo: pb.billNo || pb.id,
          description: `Vendor Inward Bill - ${pb.status || 'Unpaid'}`,
          debit: 0,
          credit: parseFloat(pb.totalAmount || 0)
        });
      }
    });

    // If no purchase bills, include POs as supplier orders
    (state.purchaseOrders || []).forEach(po => {
      if (isMatch(po.supplierId, po.supplierName)) {
        list.push({
          date: po.date || '2026-09-01',
          type: 'Purchase Order',
          refNo: po.poId || po.id,
          description: `Purchase Order Issued - ${po.status || 'Pending'}`,
          debit: 0,
          credit: parseFloat(po.totalAmount || 0)
        });
      }
    });

    // 5. Payments Out (Supplier Debit)
    (state.paymentsOut || []).forEach(pay => {
      if (isMatch(pay.supplierId, pay.supplierName)) {
        list.push({
          date: pay.date || '2026-09-02',
          type: 'Payment Out (Disbursement)',
          refNo: pay.referenceNo || pay.id,
          description: `Disbursement via ${pay.paymentMode || 'Bank'} ${pay.billRef ? `(Ref: ${pay.billRef})` : ''}`,
          debit: parseFloat(pay.amount || 0),
          credit: 0
        });
      }
    });

    // 6. Purchase Returns / Debit Notes (Supplier Debit)
    (state.purchaseReturns || []).forEach(ret => {
      if (isMatch(ret.supplierId, ret.supplierName)) {
        list.push({
          date: ret.date || '2026-09-03',
          type: 'Debit Note (Return)',
          refNo: ret.id,
          description: `Purchase Return Debit - ${ret.reason || 'Damaged stock'}`,
          debit: parseFloat(ret.returnAmount || 0),
          credit: 0
        });
      }
    });

    // Sort chronologically
    list.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let running = 0;
    return list.map(item => {
      if (isCustomer) {
        running += (item.debit - item.credit);
      } else {
        running += (item.credit - item.debit);
      }
      return { ...item, runningBalance: running };
    });
  }, [state, party, partyId, partyName, isCustomer]);

  const totalDebit = transactions.reduce((acc, t) => acc + t.debit, 0);
  const totalCredit = transactions.reduce((acc, t) => acc + t.credit, 0);
  const closingBalance = transactions.length > 0 ? transactions[transactions.length - 1].runningBalance : 0;

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Reference No', 'Description', 'Debit (INR)', 'Credit (INR)', 'Running Balance (INR)'];
    const rows = transactions.map(t => [
      `"${t.date}"`,
      `"${t.type}"`,
      `"${t.refNo}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.debit.toFixed(2),
      t.credit.toFixed(2),
      t.runningBalance.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ledger_Statement_${partyName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-4 text-xs flex flex-col max-h-[90vh] print:max-h-none print:border-none print:shadow-none print:w-full print:rounded-none">
        
        {/* Header Toolbar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              <Icon name="FileText" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{partyName} - Party Ledger Statement</h3>
              <p className="text-[11px] text-slate-500 font-mono">Party ID: {partyId} • Role: {party.partyType || party.type || 'Enterprise Partner'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Icon name="Download" className="w-4 h-4" /> Export CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Icon name="Printer" className="w-4 h-4" /> Print Statement
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              <Icon name="X" className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
          
          {/* Party Profile Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contact Info</span>
              <p className="font-bold text-slate-900 mt-0.5">{party.phone || party.contactNumber || '—'}</p>
              <p className="text-slate-500 text-[11px] truncate">{party.email || '—'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">GSTIN / PAN</span>
              <p className="font-mono font-bold text-indigo-950 mt-0.5">{party.gstin || 'Unregistered'}</p>
              {party.pan && <p className="text-slate-500 font-mono text-[11px]">PAN: {party.pan}</p>}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Location / State</span>
              <p className="text-slate-900 font-semibold mt-0.5">{party.state || 'Tamil Nadu'}, {party.country || 'India'}</p>
              <p className="text-slate-500 text-[11px]">{party.city || ''}</p>
            </div>
            <div className="sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Net Outstanding</span>
              <p className={`text-lg font-bold font-mono mt-0.5 ${closingBalance > 0 ? (isCustomer ? 'text-rose-600' : 'text-amber-600') : 'text-emerald-600'}`}>
                ₹{Math.abs(closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                <span className="text-[10px] ml-1 font-sans">{isCustomer ? (closingBalance > 0 ? 'Dr (Receivable)' : 'Cr (Advance)') : (closingBalance > 0 ? 'Cr (Payable)' : 'Dr (Settled)')}</span>
              </p>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Debits (+)</span>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Credits (-)</span>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Closing Balance</span>
              <p className="text-xl font-bold font-mono text-indigo-700 mt-1">₹{closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">Detailed Transaction History</h4>
              <span className="text-[11px] text-slate-500 font-mono">{transactions.length} records found</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Ref No</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                    <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                    <th className="py-2.5 px-3 text-right">Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400 italic">
                        No transactions recorded for this party yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tr, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono text-slate-600">{tr.date}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {tr.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-900">{tr.refNo}</td>
                        <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">{tr.description}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {tr.debit > 0 ? `₹${tr.debit.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                          {tr.credit > 0 ? `₹${tr.credit.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{tr.runningBalance.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

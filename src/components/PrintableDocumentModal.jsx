import React, { useRef } from 'react';
import Icon from './Icon';
import Button from './Button';
import { useERP } from '../context/ERPContext';

// Helper function: Convert number to Indian currency words
function numberToWords(num) {
  if (num === 0) return 'Zero Rupees Only';
  if (!num || isNaN(num)) return '';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit !== 0 ? ' ' + a[digit] : ' ');
  }

  let whole = Math.floor(Math.abs(num));
  let paise = Math.round((Math.abs(num) - whole) * 100);

  let str = '';
  const crore = Math.floor(whole / 10000000);
  whole %= 10000000;
  const lakh = Math.floor(whole / 100000);
  whole %= 100000;
  const thousand = Math.floor(whole / 1000);
  whole %= 1000;
  const hundred = Math.floor(whole / 100);
  const remaining = whole % 100;

  if (crore > 0) str += inWords(crore) + 'Crore ';
  if (lakh > 0) str += inWords(lakh) + 'Lakh ';
  if (thousand > 0) str += inWords(thousand) + 'Thousand ';
  if (hundred > 0) str += inWords(hundred) + 'Hundred ';
  if (remaining > 0) str += (str !== '' ? 'and ' : '') + inWords(remaining);

  str = 'Rupees ' + str.trim();
  if (paise > 0) {
    str += ' and ' + inWords(paise).trim() + 'Paise';
  }
  return str + ' Only';
}

export default function PrintableDocumentModal({ isOpen, onClose, document, type = 'invoice' }) {
  const { state, currentUser } = useERP();
  const printAreaRef = useRef(null);

  if (!isOpen || !document) return null;

  const isInvoice = type === 'invoice';
  const isPO = type === 'po';

  // Company Profile defaults (from settings / current user)
  const company = {
    name: currentUser?.companyName || 'Prime ERP Enterprise Pvt Ltd',
    gstin: '33AAACS1234F1Z9',
    pan: 'AAACS1234F',
    address: '104 Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu - 641012',
    phone: '+91 98422 10101',
    email: currentUser?.email || 'contact@primeerp.com',
    state: 'Tamil Nadu',
    stateCode: '33',
    bankName: 'HDFC Bank Ltd',
    accountName: currentUser?.companyName || 'Prime ERP Enterprise Pvt Ltd',
    accountNo: '50200012345678',
    ifsc: 'HDFC0001234',
    branch: 'Gandhipuram, Coimbatore',
    upiId: 'primeerp@hdfcbank'
  };

  // Party info
  const partyId = isInvoice ? (document.customerId || document.slCode) : (document.supplierId || document.slCode);
  const partyName = isInvoice ? (document.customerName || document.slName) : (document.supplierName || document.slName);
  const matchedParty = (state?.parties || []).find(p =>
    String(p.id) === String(partyId) ||
    String(p.partyId) === String(partyId) ||
    p.name === partyName
  );

  const partyAddress = matchedParty?.address || matchedParty?.location || [matchedParty?.addr1, matchedParty?.addr2, matchedParty?.city, matchedParty?.state].filter(Boolean).join(', ') || 'Registered Commercial Premises';
  const partyGstin = matchedParty?.gstin || '33BBBPY5678Q1Z2';
  const partyState = matchedParty?.state || 'Tamil Nadu';
  const partyStateCode = matchedParty?.stateCode || (partyState.toLowerCase().includes('tamil') ? '33' : '29');
  const partyPhone = matchedParty?.phone || matchedParty?.contactNumber || '+91 98000 00000';

  // Items
  const items = Array.isArray(document.items) ? document.items : [];
  const docNumber = document.id || document.invoiceId || document.poId || (isInvoice ? 'INV-001' : 'PO-001');
  const docDate = document.date || document.invDt || document.createdDate || new Date().toISOString().split('T')[0];
  const dueDate = document.dueDate || document.expectedDate || 'On Demand';

  // Calculate totals
  const subtotal = items.reduce((acc, it) => acc + (parseFloat(it.amount || (it.qty * it.rate)) || 0), 0);
  const isInterState = partyStateCode !== company.stateCode;
  const gstRate = document.taxRate ?? (isInvoice ? 5 : 0);
  const taxAmount = document.tax ?? Math.round(subtotal * (gstRate / 100));
  const cgst = isInterState ? 0 : taxAmount / 2;
  const sgst = isInterState ? 0 : taxAmount / 2;
  const igst = isInterState ? taxAmount : 0;
  const totalAmount = document.totalAmount || (subtotal + taxAmount);
  const amountInWords = numberToWords(Math.round(totalAmount));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-4 text-xs flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:w-full print:rounded-none">
        
        {/* Modal Toolbar (hidden during print) */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs">
              <Icon name="Printer" className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isInvoice ? 'GST Tax Invoice Print Preview' : 'Official Purchase Order Print Preview'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">Reference: {docNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              <Icon name="X" className="w-4 h-4" /> Close
            </Button>
            <Button variant="primary" size="sm" onClick={handlePrint}>
              <Icon name="Printer" className="w-4 h-4" /> Print / Save as PDF
            </Button>
          </div>
        </div>

        {/* Printable Document A4 Canvas */}
        <div className="overflow-y-auto p-6 sm:p-10 flex-1 print:p-0 print:overflow-visible" ref={printAreaRef}>
          <div className="max-w-3xl mx-auto border border-slate-300 p-6 sm:p-8 rounded-lg bg-white shadow-xs print:border-none print:shadow-none print:p-0 text-slate-800 leading-normal">
            
            {/* Header: Company & Tax Details */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 block mb-1">
                  {isInvoice ? 'TAX INVOICE' : 'PURCHASE ORDER'}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{company.name}</h1>
                <p className="text-slate-600 text-xs mt-1 max-w-sm">{company.address}</p>
                <div className="mt-2 space-y-0.5 text-[11px] text-slate-600">
                  <p><strong className="text-slate-900 font-bold">GSTIN:</strong> <span className="font-mono">{company.gstin}</span> | <strong className="text-slate-900 font-bold">State Code:</strong> {company.stateCode}</p>
                  <p><strong className="text-slate-900 font-bold">Contact:</strong> {company.phone} | {company.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-wider mb-2">
                  {isInvoice ? 'ORIGINAL FOR RECIPIENT' : 'OFFICIAL PURCHASE ORDER'}
                </div>
                <div className="text-xs space-y-1">
                  <p><strong className="text-slate-900">{isInvoice ? 'Invoice No:' : 'PO Number:'}</strong> <span className="font-mono font-bold text-indigo-900">{docNumber}</span></p>
                  <p><strong className="text-slate-900">Date:</strong> <span className="font-mono">{docDate}</span></p>
                  <p><strong className="text-slate-900">{isInvoice ? 'Due Date:' : 'Expected By:'}</strong> <span className="font-mono">{dueDate}</span></p>
                  <p><strong className="text-slate-900">Place of Supply:</strong> {partyState} ({partyStateCode})</p>
                </div>
              </div>
            </div>

            {/* Bill To & Ship To Parties */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
              <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {isInvoice ? 'Billed To (Customer):' : 'Vendor / Supplier:'}
                </span>
                <h4 className="font-bold text-slate-900 text-sm">{partyName}</h4>
                <p className="text-slate-600 mt-1">{partyAddress}</p>
                <div className="mt-2 text-[11px] text-slate-700 space-y-0.5">
                  <p><strong className="text-slate-900">GSTIN / UIN:</strong> <span className="font-mono">{partyGstin}</span></p>
                  <p><strong className="text-slate-900">State:</strong> {partyState} (Code: {partyStateCode})</p>
                  <p><strong className="text-slate-900">Phone:</strong> {partyPhone}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {isInvoice ? 'Shipped / Dispatched To:' : 'Deliver Goods To:'}
                </span>
                <h4 className="font-bold text-slate-900 text-sm">{isInvoice ? partyName : company.name}</h4>
                <p className="text-slate-600 mt-1">{isInvoice ? partyAddress : company.address}</p>
                <div className="mt-2 text-[11px] text-slate-700 space-y-0.5">
                  <p><strong className="text-slate-900">Despatch Mode:</strong> Road Transport</p>
                  <p><strong className="text-slate-900">Vehicle No:</strong> TN38-BZ-4412</p>
                  <p><strong className="text-slate-900">Reverse Charge:</strong> No</p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-[10px] uppercase font-bold text-slate-700">
                    <th className="py-2 px-1 text-center w-8">#</th>
                    <th className="py-2 px-2">Description of Goods</th>
                    <th className="py-2 px-2 text-center w-20">HSN/SAC</th>
                    <th className="py-2 px-2 text-right w-16">Qty</th>
                    <th className="py-2 px-2 text-center w-14">UOM</th>
                    <th className="py-2 px-2 text-right w-20">Rate (₹)</th>
                    <th className="py-2 px-2 text-right w-24">Taxable (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-4 text-center text-slate-400 italic">No line items recorded.</td>
                    </tr>
                  ) : (
                    items.map((it, idx) => {
                      const qty = parseFloat(it.qty || it.receivedQty || 1);
                      const rate = parseFloat(it.rate || 0);
                      const taxable = it.amount || (qty * rate);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-1 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-2">
                            <span className="font-bold text-slate-900 block">{it.productName || it.name || `Item #${it.productId}`}</span>
                            {it.batchNo && (
                              <span className="text-[10px] text-slate-400 font-mono">Batch: {it.batchNo}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600">{it.hsnCode || '5205'}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">{qty}</td>
                          <td className="py-2.5 px-2 text-center text-slate-500 font-medium">{it.uom || 'KG'}</td>
                          <td className="py-2.5 px-2 text-right font-mono">₹{rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">₹{taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals */}
            <div className="grid grid-cols-12 gap-4 border-t-2 border-slate-900 pt-3 text-xs">
              <div className="col-span-7 space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Amount in Words:</span>
                  <p className="font-bold text-slate-900 italic text-xs leading-relaxed">{amountInWords}</p>
                </div>

                {/* Bank / UPI Details */}
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 text-[11px] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Bank Payment & Settlement Details:</span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-700">
                    <p><strong>Bank:</strong> {company.bankName}</p>
                    <p><strong>Account Name:</strong> {company.accountName}</p>
                    <p><strong>A/C No:</strong> <span className="font-mono font-bold">{company.accountNo}</span></p>
                    <p><strong>IFSC Code:</strong> <span className="font-mono font-bold">{company.ifsc}</span></p>
                    <p><strong>Branch:</strong> {company.branch}</p>
                    <p><strong>UPI ID:</strong> <span className="font-mono text-indigo-700 font-bold">{company.upiId}</span></p>
                  </div>
                </div>
              </div>

              <div className="col-span-5 space-y-2 border-l border-slate-200 pl-4 text-xs">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Taxable Amount</span>
                  <span className="font-mono font-semibold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                {!isInterState ? (
                  <>
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>CGST ({(gstRate / 2)}%)</span>
                      <span className="font-mono font-semibold">₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>SGST ({(gstRate / 2)}%)</span>
                      <span className="font-mono font-semibold">₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>IGST ({gstRate}%)</span>
                    <span className="font-mono font-semibold">₹{igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-t-2 border-slate-900 font-black text-sm text-slate-900">
                  <span>Grand Total (INR)</span>
                  <span className="font-mono text-base text-slate-900">₹{Math.round(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Terms & Authorization */}
            <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 gap-6 items-end text-[11px] text-slate-500">
              <div>
                <strong className="text-slate-800 block text-xs mb-1">Declaration & Terms:</strong>
                <p>1. We declare that this invoice shows the actual price of goods described and that all particulars are true and correct.</p>
                <p>2. Subject to Coimbatore jurisdiction only.</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900 text-xs mb-10">For {company.name}</p>
                <p className="border-t border-slate-400 inline-block pt-1 font-semibold text-slate-700">Authorized Signatory</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

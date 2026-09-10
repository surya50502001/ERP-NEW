import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Combobox from '../components/Combobox';
import Drawer from '../components/Drawer';
import StatusBadge from '../components/StatusBadge';
import { useERP } from '../context/ERPContext';

export default function SalesView({ onNavigate }) {
  const { state, createSalesInvoice, approveInvoice, rejectInvoice, addParty, addProduct, navResetCounter } = useERP();
  
  // Navigation & Sub-Tabs
  const [subTab, setSubTab] = useState('invoices'); // 'invoices' | 'approvals'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals / Drawers
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [rejectionModalInv, setRejectionModalInv] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form states for New Invoice
  const [invCustomerId, setInvCustomerId] = useState('');
  const [invDueDate, setInvDueDate] = useState('');
  const [gstRate, setGstRate] = useState(5);
  const [invItems, setInvItems] = useState([
    { productId: '', qty: 10, rate: 0 }
  ]);

  // Inline forms
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);

  // Inline Customer state
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custState, setCustState] = useState('Gujarat');

  // Inline Product state
  const [prodName, setProdName] = useState('');
  const [prodUom, setProdUom] = useState('KG');
  const [prodRate, setProdRate] = useState(250);

  // Reset view on sidebar click
  useEffect(() => {
    setSubTab('invoices');
    setIsNewInvoiceOpen(false);
    setSelectedInvoice(null);
    setRejectionModalInv(null);
  }, [navResetCounter]);

  if (!state) return null;

  const allInvoices = state.salesInvoices || [];
  const pendingApprovalInvoices = allInvoices.filter(inv => inv.status === 'Pending Approval');
  const approvedInvoices = allInvoices.filter(inv => inv.status === 'Approved' || inv.status === 'Paid');

  const filteredInvoices = allInvoices.filter(inv => {
    const matchesSearch = String(inv.id || inv.invoiceId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(inv.customerName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formattedLineItems = invItems.map(item => {
    const prod = (state.products || []).find(p => p.id === item.productId) || (state.products && state.products[0]);
    const qty = parseFloat(item.qty || 10);
    const rate = parseFloat(item.rate || (prod ? prod.avgRate * 1.15 : 230));
    return {
      productId: item.productId || (prod ? prod.id : 'PRD-001'),
      productName: prod ? prod.name : 'Cotton Yarn 40s Combed',
      uom: prod ? prod.uom : 'KG',
      qty,
      rate: Math.round(rate),
      amount: Math.round(qty * rate)
    };
  });

  const subtotal = formattedLineItems.reduce((acc, i) => acc + i.amount, 0) || 5000;
  const taxAmount = Math.round(subtotal * (gstRate / 100));
  const grandTotal = subtotal + taxAmount;

  // KPI Calculations
  const totalInvoicedAmount = allInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const pendingApprovalAmount = pendingApprovalInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

  const handleCreateInvoice = async () => {
    const customer = (state.parties || []).find(p => p.id === invCustomerId) ||
      (state.parties && state.parties.find(p => (p.partyType || p.type) === 'Customer')) ||
      { id: 'PTY-104', name: 'XYZ Textiles' };

    await createSalesInvoice({
      customerId: customer.id,
      customerName: customer.name,
      dueDate: invDueDate || '2026-09-05',
      itemsCount: formattedLineItems.length,
      subtotal,
      tax: taxAmount,
      totalAmount: grandTotal,
      items: formattedLineItems,
      status: 'Pending Approval'
    });

    setIsNewInvoiceOpen(false);
    setInvCustomerId('');
    setInvDueDate('');
    setInvItems([{ productId: '', qty: 10, rate: 0 }]);
  };

  const handleSaveInlineCustomer = () => {
    if (!custName) return;
    addParty({
      name: custName,
      type: 'Customer',
      phone: custPhone || '+91 98250 00000',
      location: `Surat, ${custState}`,
      country: 'India',
      state: custState
    });
    setCustName('');
    setIsCreateCustomerOpen(false);
  };

  const handleSaveInlineProduct = () => {
    if (!prodName) return;
    addProduct({
      name: prodName,
      uom: prodUom,
      majorGroup: 'Yarn',
      subGroup: 'Cotton Yarn',
      subSubGroup: 'Combed Cotton',
      purchaseRate: parseFloat(prodRate * 0.85),
      openingStock: 100
    });
    setProdName('');
    setIsCreateProductOpen(false);
  };

  const handleConfirmReject = () => {
    if (!rejectionModalInv) return;
    rejectInvoice(rejectionModalInv.id || rejectionModalInv.invoiceId, rejectionReason || 'Manager rejection');
    setRejectionModalInv(null);
    setRejectionReason('');
  };

  // FULL MAIN AREA CREATION VIEW
  if (isNewInvoiceOpen) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewInvoiceOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Icon name="ArrowLeft" className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create New Sales Invoice</h1>
              <p className="text-xs text-slate-500 mt-0.5">Add line items, calculate GST & stock deduction, and submit for Manager Approval</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={() => setIsNewInvoiceOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleCreateInvoice}>
              <Icon name="Plus" className="w-4 h-4" /> Submit for Approval
            </Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <Combobox
              label="Select Customer"
              placeholder="Search customer name..."
              options={(state.parties || []).filter(p => (p.partyType || p.type) === 'Customer' || (p.partyType || p.type) === 'Both').map(p => ({ label: p.name, value: p.id, sublabel: p.location }))}
              value={invCustomerId}
              onChange={(val) => setInvCustomerId(val)}
              onCreateNew={() => setIsCreateCustomerOpen(true)}
              createLabel="+ Create new customer inline"
            />
            <Input
              label="Payment Due Date"
              type="date"
              value={invDueDate}
              onChange={(e) => setInvDueDate(e.target.value)}
            />
          </div>

          {isCreateCustomerOpen && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>Quick Add New Customer</span>
                <button onClick={() => setIsCreateCustomerOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input label="Customer Name" value={custName} onChange={(e) => setCustName(e.target.value)} />
                <Input label="Phone" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} />
                <Select label="State" options={['Tamil Nadu', 'Gujarat', 'Maharashtra', 'Karnataka', 'Punjab']} value={custState} onChange={(e) => setCustState(e.target.value)} />
              </div>
              <Button size="sm" variant="primary" onClick={handleSaveInlineCustomer}>Save Customer</Button>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Invoice Line Items</h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setInvItems([...invItems, { productId: '', qty: 10, rate: 0 }])}
              >
                + Add Item
              </Button>
            </div>

            {invItems.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <Combobox
                      label={`Product #${idx + 1}`}
                      placeholder="Search product..."
                      options={(state.products || []).map(p => ({ label: p.name, value: p.id, sublabel: `Stock: ${p.availableStock} ${p.uom}` }))}
                      value={item.productId}
                      onChange={(val) => {
                        const prod = (state.products || []).find(p => p.id === val);
                        const updated = [...invItems];
                        updated[idx] = { ...updated[idx], productId: val, rate: prod ? Math.round(prod.avgRate * 1.15) : 250 };
                        setInvItems(updated);
                      }}
                      onCreateNew={() => setIsCreateProductOpen(true)}
                      createLabel="+ Create product inline"
                    />
                  </div>
                  <Input
                    label="Qty"
                    type="number"
                    value={item.qty}
                    onChange={(e) => {
                      const updated = [...invItems];
                      updated[idx].qty = e.target.value;
                      setInvItems(updated);
                    }}
                  />
                  <Input
                    label="Selling Rate (₹)"
                    type="number"
                    value={item.rate}
                    onChange={(e) => {
                      const updated = [...invItems];
                      updated[idx].rate = e.target.value;
                      setInvItems(updated);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {isCreateProductOpen && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>Quick Add Product</span>
                <button onClick={() => setIsCreateProductOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input label="Product Name" value={prodName} onChange={(e) => setProdName(e.target.value)} />
                <Select label="UOM" options={['KG', 'MTR', 'PCS']} value={prodUom} onChange={(e) => setProdUom(e.target.value)} />
                <Input label="Selling Rate (₹)" type="number" value={prodRate} onChange={(e) => setProdRate(e.target.value)} />
              </div>
              <Button size="sm" variant="primary" onClick={handleSaveInlineProduct}>Save Product</Button>
            </div>
          )}

          <div className="p-5 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex justify-between text-slate-300 text-xs">
              <span>Subtotal</span>
              <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300 text-xs">
              <span>GST Tax Rate</span>
              <select className="bg-slate-800 text-white rounded px-2.5 py-1 text-xs font-mono border border-slate-700 focus:outline-none" value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value))}>
                <option value={0}>0% Exempt</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST</option>
              </select>
            </div>
            <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-slate-800">
              <span>Grand Total</span>
              <span className="font-mono text-lg text-emerald-400">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales & Revenue Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage Sales Invoices, Multi-tier Approvals, and Customer Billing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="md" onClick={() => setIsNewInvoiceOpen(true)}>
            <Icon name="Plus" className="w-4 h-4" />
            New Sales Invoice
          </Button>
        </div>
      </div>

      {/* Sub-Tab Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            subTab === 'invoices'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Icon name="Receipt" className="w-4 h-4" />
          <span>Sales Invoices</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            subTab === 'invoices' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
          }`}>
            {allInvoices.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            subTab === 'approvals'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Icon name="CheckCircle2" className="w-4 h-4" />
          <span>Approval Workflow</span>
          {pendingApprovalInvoices.length > 0 ? (
            <span className="bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full text-[10px] animate-pulse">
              {pendingApprovalInvoices.length} Pending
            </span>
          ) : (
            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
              0
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SALES INVOICES MANAGEMENT */}
      {/* ========================================================= */}
      {subTab === 'invoices' && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Invoices</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-slate-900">{allInvoices.length}</span>
                <span className="text-xs text-slate-500 font-medium">Billed to date</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Billed Value</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-slate-900">₹{totalInvoicedAmount.toLocaleString('en-IN')}</span>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                  <Icon name="TrendingUp" className="w-3.5 h-3.5" /> Gross Total
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Approved / Paid</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-emerald-700">{approvedInvoices.length}</span>
                <span className="text-xs text-emerald-600 font-medium">Verified</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 shadow-2xs">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Pending Approval</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-amber-900">{pendingApprovalInvoices.length}</span>
                <span className="text-xs text-amber-700 font-medium font-mono">₹{pendingApprovalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="w-full sm:w-72">
              <Input
                icon="Search"
                placeholder="Search invoice no, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto text-xs font-medium text-slate-600 w-full sm:w-auto">
              {['All', 'Pending Approval', 'Approved', 'Paid', 'Rejected'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    statusFilter === st ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Sales Invoices Data Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Date / Due</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Tax (₹)</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400 italic">
                      No sales invoices found for current filters. Click "New Sales Invoice" to issue one.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => {
                    const invId = inv.id || inv.invoiceId;
                    return (
                      <tr key={invId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold font-mono text-slate-900">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="text-indigo-600 hover:underline hover:text-indigo-800 font-bold cursor-pointer"
                          >
                            {invId}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{inv.customerName}</div>
                          {inv.customerId && <div className="text-[10px] text-slate-400 font-mono">{inv.customerId}</div>}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          <div>{inv.date || 'Today'}</div>
                          {inv.dueDate && <div className="text-[10px] text-slate-400">Due: {inv.dueDate}</div>}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700 font-semibold">
                            {inv.itemsCount || (inv.items ? inv.items.length : 1)} items
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          ₹{(inv.tax || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                          ₹{(inv.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button size="sm" variant="secondary" onClick={() => setSelectedInvoice(inv)}>
                            <Icon name="Eye" className="w-3.5 h-3.5 mr-1" />
                            Details
                          </Button>
                          {inv.status === 'Pending Approval' && (
                            <Button size="sm" variant="accent" onClick={() => setSubTab('approvals')}>
                              Review
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: APPROVAL WORKFLOW QUEUE */}
      {/* ========================================================= */}
      {subTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500 text-white shadow-xs">
                <Icon name="ShieldCheck" className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Sales Invoice Approval Workspace</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Review credit limits, product pricing, tax applicability, and authorize sales invoice dispatch.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 font-mono">
                {pendingApprovalInvoices.length} Invoices Pending Action
              </span>
            </div>
          </div>

          {pendingApprovalInvoices.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Icon name="CheckCircle2" className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">All Invoices Approved</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are no sales invoices awaiting managerial review right now. New invoices created will automatically appear here.
              </p>
              <div className="pt-2">
                <Button variant="secondary" size="sm" onClick={() => setSubTab('invoices')}>
                  Return to Invoice Registry
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Invoices Requiring Authorization ({pendingApprovalInvoices.length})
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {pendingApprovalInvoices.map(inv => {
                  const invId = inv.id || inv.invoiceId;
                  return (
                    <div
                      key={invId}
                      className="bg-white border-2 border-amber-200/80 rounded-xl p-5 shadow-xs space-y-4 hover:border-amber-400 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-900 font-bold font-mono text-xs flex items-center justify-center">
                            INV
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-slate-900 font-mono">{invId}</span>
                              <StatusBadge status={inv.status} />
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Customer: <strong className="text-slate-800">{inv.customerName}</strong> • Date: {inv.date || 'Today'} • Due Date: {inv.dueDate || 'Upon Receipt'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Grand Total</span>
                          <span className="text-lg font-bold font-mono text-slate-900">
                            ₹{(inv.totalAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {inv.items && inv.items.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 pb-1">
                                <th className="py-1 px-2">Item</th>
                                <th className="py-1 px-2 text-center">Qty</th>
                                <th className="py-1 px-2 text-right">Selling Rate</th>
                                <th className="py-1 px-2 text-right">Line Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/60 font-medium text-slate-700">
                              {inv.items.map((it, i) => (
                                <tr key={i}>
                                  <td className="py-1.5 px-2 font-bold text-slate-900">{it.productName || it.productId}</td>
                                  <td className="py-1.5 px-2 text-center font-mono">{it.qty} {it.uom || 'KG'}</td>
                                  <td className="py-1.5 px-2 text-right font-mono">₹{it.rate}</td>
                                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">₹{(it.amount || it.qty * it.rate).toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div className="text-xs text-slate-500 font-mono">
                          Subtotal: ₹{(inv.subtotal || 0).toLocaleString('en-IN')} + GST Tax: ₹{(inv.tax || 0).toLocaleString('en-IN')}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="md"
                            variant="accent"
                            onClick={() => approveInvoice(invId, 'Store Manager')}
                          >
                            <Icon name="CheckCircle2" className="w-4 h-4 mr-1" />
                            Approve Invoice
                          </Button>
                          <Button
                            size="md"
                            variant="danger"
                            onClick={() => {
                              setRejectionModalInv(inv);
                              setRejectionReason('');
                            }}
                          >
                            <Icon name="X" className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Recently Processed Invoices
            </h3>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 font-semibold text-slate-600 text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Invoice No</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Action Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {allInvoices.filter(i => i.status !== 'Pending Approval').slice(0, 5).map(inv => (
                    <tr key={inv.id || inv.invoiceId} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-bold font-mono text-slate-900">{inv.id || inv.invoiceId}</td>
                      <td className="py-2.5 px-4">{inv.customerName}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-4 text-center"><StatusBadge status={inv.status} /></td>
                      <td className="py-2.5 px-4 text-right text-slate-500 text-[11px]">
                        {inv.status === 'Approved' ? 'Authorized by Store Manager' : (inv.rejectionReason || 'Rejected')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE DETAILS DRAWER */}
      <Drawer
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Invoice ${selectedInvoice.id || selectedInvoice.invoiceId}` : 'Invoice Details'}
        subtitle={selectedInvoice ? `Customer: ${selectedInvoice.customerName} • Status: ${selectedInvoice.status}` : ''}
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" onClick={() => setSelectedInvoice(null)}>Close</Button>
            {selectedInvoice && selectedInvoice.status === 'Pending Approval' && (
              <Button
                variant="accent"
                size="md"
                onClick={() => {
                  approveInvoice(selectedInvoice.id || selectedInvoice.invoiceId, 'Store Manager');
                  setSelectedInvoice(null);
                }}
              >
                <Icon name="CheckCircle2" className="w-4 h-4 mr-1" /> Approve
              </Button>
            )}
          </div>
        }
      >
        {selectedInvoice && (
          <div className="space-y-6 text-xs">
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Invoice Status</span>
                <StatusBadge status={selectedInvoice.status} />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                ₹{(selectedInvoice.totalAmount || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-slate-400 text-[11px] pt-2 border-t border-slate-800 flex justify-between">
                <span>Customer: {selectedInvoice.customerName}</span>
                <span>Due: {selectedInvoice.dueDate || 'Immediate'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Line Items</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(selectedInvoice.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold text-slate-900">{it.productName || it.productId}</td>
                        <td className="py-2 px-3 text-center font-mono">{it.qty} {it.uom}</td>
                        <td className="py-2 px-3 text-right font-mono">₹{it.rate}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">₹{(it.amount || it.qty * it.rate).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{(selectedInvoice.subtotal || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST Tax</span>
                <span>₹{(selectedInvoice.tax || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                <span>Grand Total</span>
                <span>₹{(selectedInvoice.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* REJECTION REASON MODAL */}
      {rejectionModalInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Icon name="AlertCircle" className="w-5 h-5 text-rose-600" />
                Reject Sales Invoice
              </h3>
              <button
                onClick={() => setRejectionModalInv(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide a reason for rejecting invoice <strong className="font-mono text-slate-900">{rejectionModalInv.id || rejectionModalInv.invoiceId}</strong>. The creator will be notified.
            </p>

            <Input
              label="Rejection Reason / Remarks"
              placeholder="e.g., Credit limit exceeded, Price disagreement, Item out of stock"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="md" onClick={() => setRejectionModalInv(null)}>Cancel</Button>
              <Button variant="danger" size="md" onClick={handleConfirmReject}>Confirm Rejection</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.SalesView = SalesView;

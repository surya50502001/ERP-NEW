import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Combobox from '../components/Combobox';
import Drawer from '../components/Drawer';
import StatusBadge from '../components/StatusBadge';
import { useERP } from '../context/ERPContext';

export default function InventoryView({ onNavigate }) {
  const { state, receiveGoods, createDirectGRN, addParty, addProduct, navResetCounter } = useERP();

  // Sub-Tab Navigation: 'stock' | 'po_grn' | 'direct_grn'
  const [subTab, setSubTab] = useState('stock');

  // Stock Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // PO GRN Modal / Drawer State
  const [selectedPOForGRN, setSelectedPOForGRN] = useState(null);
  const [poGrnQtyMap, setPoGrnQtyMap] = useState({});
  const [poGrnBatchMap, setPoGrnBatchMap] = useState({});
  const [poGrnNotes, setPoGrnNotes] = useState('');
  const [poGrnDcNo, setPoGrnDcNo] = useState('');
  const [poSearchQuery, setPoSearchQuery] = useState('');

  // Direct GRN State
  const [isDirectGRNModalOpen, setIsDirectGRNModalOpen] = useState(false);
  const [directInwardType, setDirectInwardType] = useState('Direct Purchase');
  const [directSupplierId, setDirectSupplierId] = useState('');
  const [directDate, setDirectDate] = useState(new Date().toISOString().split('T')[0]);
  const [directDcNo, setDirectDcNo] = useState('');
  const [directStoreLoc, setDirectStoreLoc] = useState('Main Warehouse');
  const [directNotes, setDirectNotes] = useState('');
  const [directItems, setDirectItems] = useState([
    { productId: '', qty: 100, rate: 0, batchNo: `DB${Math.floor(Math.random() * 900) + 100}` }
  ]);
  const [selectedDirectGRN, setSelectedDirectGRN] = useState(null);

  // Inline Quick Add Party / Product
  const [isQuickPartyOpen, setIsQuickPartyOpen] = useState(false);
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyType, setNewPartyType] = useState('Supplier');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyState, setNewPartyState] = useState('Tamil Nadu');
  const [newProdName, setNewProdName] = useState('');
  const [newProdUom, setNewProdUom] = useState('KG');
  const [newProdRate, setNewProdRate] = useState(200);

  // Reset navigation when sidebar icon is re-clicked
  useEffect(() => {
    setSubTab('stock');
    setSelectedProduct(null);
    setSelectedPOForGRN(null);
    setIsDirectGRNModalOpen(false);
    setSelectedDirectGRN(null);
  }, [navResetCounter]);

  if (!state) return null;

  // 1. Stock Data Filtering & KPIs
  const allProducts = state.products || [];
  const filteredProducts = allProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || p.majorGroup === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalStockUnits = allProducts.reduce((acc, p) => acc + (parseFloat(p.availableStock) || 0), 0);
  const totalStockValuation = allProducts.reduce((acc, p) => acc + (parseFloat(p.stockValue) || 0), 0);
  const lowStockCount = allProducts.filter(p => p.status === 'Low Stock' || p.availableStock <= p.minReorderLevel).length;

  const activeProd = selectedProduct ? allProducts.find(p => p.id === selectedProduct.id) || selectedProduct : null;
  const prodBatches = activeProd ? ((state.batches && state.batches[activeProd.id]) || []) : [];

  // 2. PO GRN Data
  const allPOs = state.purchaseOrders || [];
  const openPOs = allPOs.filter(po => po.status === 'Pending' || po.status === 'Partial');
  const completedPOsWithGRN = allPOs.filter(po => po.grnId || po.status === 'Received' || po.status === 'Partial');

  const filteredOpenPOs = openPOs.filter(po => {
    return po.id.toLowerCase().includes(poSearchQuery.toLowerCase()) ||
      (po.supplierName || '').toLowerCase().includes(poSearchQuery.toLowerCase());
  });

  // 3. Direct GRN Data
  const directGrnList = state.directGrns || [];

  // Handlers for PO GRN
  const handleOpenPOGrnModal = (po) => {
    setSelectedPOForGRN(po);
    const initialQtyMap = {};
    const initialBatchMap = {};
    (po.items || []).forEach(item => {
      const remaining = Math.max(0, item.qty - (item.receivedQty || 0));
      initialQtyMap[item.productId] = remaining;
      initialBatchMap[item.productId] = `B${Math.floor(Math.random() * 900) + 100}`;
    });
    setPoGrnQtyMap(initialQtyMap);
    setPoGrnBatchMap(initialBatchMap);
    setPoGrnNotes('');
    setPoGrnDcNo(`DC-${Math.floor(Math.random() * 9000) + 1000}`);
  };

  const handleConfirmPOGRN = () => {
    if (!selectedPOForGRN) return;
    const receivedItemsList = (selectedPOForGRN.items || []).map(item => ({
      productId: item.productId,
      productName: item.productName,
      receivedQty: parseFloat(poGrnQtyMap[item.productId] || 0),
      rate: item.rate,
      batchNo: poGrnBatchMap[item.productId] || `B001`
    }));

    receiveGoods(
      selectedPOForGRN.id,
      receivedItemsList,
      poGrnNotes ? `${poGrnNotes} (DC: ${poGrnDcNo})` : `Received against ${selectedPOForGRN.id} (DC: ${poGrnDcNo})`,
      selectedPOForGRN.supplierName
    );

    setSelectedPOForGRN(null);
    setPoGrnNotes('');
  };

  // Handlers for Direct GRN
  const handleAddDirectItemRow = () => {
    setDirectItems([
      ...directItems,
      { productId: '', qty: 50, rate: 0, batchNo: `DB${Math.floor(Math.random() * 900) + 100}` }
    ]);
  };

  const handleRemoveDirectItemRow = (idx) => {
    if (directItems.length <= 1) return;
    setDirectItems(directItems.filter((_, i) => i !== idx));
  };

  const handleSaveDirectGRN = async () => {
    const supplier = (state.parties || []).find(p => p.id === directSupplierId);
    const formattedItems = directItems.map(item => {
      const prod = allProducts.find(p => p.id === item.productId) || allProducts[0];
      return {
        productId: item.productId || (prod ? prod.id : 'PRD-001'),
        productName: prod ? prod.name : 'Raw Material Item',
        qty: parseFloat(item.qty || 1),
        rate: parseFloat(item.rate || (prod ? prod.avgRate : 100)),
        batchNo: item.batchNo || `DB${Math.floor(Math.random() * 900) + 100}`,
        warehouse: directStoreLoc
      };
    });

    await createDirectGRN({
      inwardType: directInwardType,
      supplierId: supplier ? supplier.id : null,
      supplierName: supplier ? supplier.name : 'Internal / Direct Source',
      dcNo: directDcNo || `DDC-${Date.now().toString().slice(-4)}`,
      date: directDate,
      notes: directNotes,
      warehouse: directStoreLoc,
      items: formattedItems
    });

    setIsDirectGRNModalOpen(false);
    setDirectSupplierId('');
    setDirectDcNo('');
    setDirectNotes('');
    setDirectItems([{ productId: '', qty: 100, rate: 0, batchNo: `DB${Math.floor(Math.random() * 900) + 100}` }]);
  };

  // Quick inline creators
  const handleSaveQuickParty = () => {
    if (!newPartyName) return;
    addParty({
      name: newPartyName,
      partyType: newPartyType,
      contactNumber: newPartyPhone || '+91 98400 00000',
      country: 'India',
      state: newPartyState
    });
    setNewPartyName('');
    setIsQuickPartyOpen(false);
  };

  const handleSaveQuickProduct = () => {
    if (!newProdName) return;
    addProduct({
      name: newProdName,
      uom: newProdUom,
      majorGroup: 'Yarn',
      subGroup: 'Cotton Yarn',
      subSubGroup: 'Combed Cotton',
      purchaseRate: parseFloat(newProdRate),
      openingStock: 0
    });
    setNewProdName('');
    setIsQuickProductOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventory & Goods Receipt (GRN)</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time stock ledger, PO-linked Goods Receipts, and Direct Stock Inwards</p>
        </div>
        <div className="flex items-center gap-2">
          {subTab === 'direct_grn' ? (
            <Button variant="primary" size="md" onClick={() => setIsDirectGRNModalOpen(true)}>
              <Icon name="Plus" className="w-4 h-4" />
              New Direct GRN
            </Button>
          ) : (
            <Button variant="secondary" size="md" onClick={() => onNavigate('reports')}>
              <Icon name="FileSpreadsheet" className="w-4 h-4" />
              Stock Valuation Report
            </Button>
          )}
        </div>
      </div>

      {/* Sub-Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('stock')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'stock'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Icon name="Package" className="w-4 h-4" />
          <span>Stock & FIFO Ledger</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            subTab === 'stock' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
          }`}>
            {allProducts.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('po_grn')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'po_grn'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Icon name="Truck" className="w-4 h-4" />
          <span>PO Goods Receipt (GRN)</span>
          {openPOs.length > 0 ? (
            <span className="bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full text-[10px] animate-pulse">
              {openPOs.length} Open POs
            </span>
          ) : (
            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
              0
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('direct_grn')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'direct_grn'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Icon name="Layers" className="w-4 h-4" />
          <span>Direct Stock Inward (GRN)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            subTab === 'direct_grn' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
          }`}>
            {directGrnList.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: STOCK & FIFO BATCHES LEDGER */}
      {/* ========================================================= */}
      {subTab === 'stock' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total SKUs Tracked</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-slate-900">{allProducts.length} Items</span>
                <span className="text-xs text-slate-500 font-medium">Catalog items</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Available Stock</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-slate-900">{totalStockUnits.toLocaleString('en-IN')} Units</span>
                <span className="text-xs text-indigo-600 font-medium font-mono">In Warehouses</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Inventory Valuation</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-emerald-700">₹{totalStockValuation.toLocaleString('en-IN')}</span>
                <span className="text-xs text-emerald-600 font-medium">FIFO Basis</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 shadow-2xs">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Reorder / Low Stock</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-amber-900">{lowStockCount} Items</span>
                <span className="text-xs text-amber-700 font-medium">Below Min Level</span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="w-full sm:w-80">
              <Input
                icon="Search"
                placeholder="Search product name, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto text-xs">
              <Select
                options={['All', 'Yarn', 'Fabric', 'Trims', 'Raw Material']}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-36"
              />
              <Select
                options={['All', 'Active', 'Low Stock']}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-32"
              />
            </div>
          </div>

          {/* Stock Data Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Product Name & Group</th>
                  <th className="py-3 px-4 text-right">Available Stock</th>
                  <th className="py-3 px-4 text-center">UOM</th>
                  <th className="py-3 px-4 text-right">Average Rate (₹)</th>
                  <th className="py-3 px-4 text-right">Stock Value (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">FIFO Batches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400 italic">
                      No stock items found for current filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(prod => (
                    <tr
                      key={prod.id}
                      onClick={() => setSelectedProduct(prod)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{prod.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {prod.id} • {prod.majorGroup} {prod.subGroup ? `/ ${prod.subGroup}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {prod.availableStock}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">{prod.uom}</td>
                      <td className="py-3 px-4 text-right font-mono">₹{prod.avgRate}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{(prod.stockValue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={prod.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button size="sm" variant="ghost">
                          <Icon name="Layers" className="w-3.5 h-3.5 mr-1" />
                          View Batches
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: PO-LINKED GOODS RECEIPT (PO GRN) */}
      {/* ========================================================= */}
      {subTab === 'po_grn' && (
        <div className="space-y-6">
          {/* PO GRN Info Banner */}
          <div className="bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                <Icon name="Truck" className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Purchase Order Goods Receipt (GRN)</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Receive materials against approved Purchase Orders, assign batch numbers, verify quantities, and update stock queues.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-900 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-300 font-mono">
                {openPOs.length} Purchase Orders Awaiting Receipt
              </span>
            </div>
          </div>

          {/* Section: Open POs Ready for Receipt */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Icon name="ShoppingBag" className="w-4 h-4 text-indigo-600" />
                Open Purchase Orders for Inward Receipt ({filteredOpenPOs.length})
              </h3>
              <div className="w-full sm:w-72">
                <Input
                  icon="Search"
                  placeholder="Search PO # or supplier..."
                  value={poSearchQuery}
                  onChange={(e) => setPoSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 font-semibold text-slate-600 text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Order Date</th>
                    <th className="py-3 px-4 text-center">Items & Fulfillment</th>
                    <th className="py-3 px-4 text-right">PO Total (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Inward Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredOpenPOs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-slate-400 italic">
                        No open Purchase Orders pending receipt. All POs are fully received or create a new PO in Purchases.
                      </td>
                    </tr>
                  ) : (
                    filteredOpenPOs.map(po => {
                      const totalOrdered = (po.items || []).reduce((acc, i) => acc + (parseFloat(i.qty) || 0), 0);
                      const totalRec = (po.items || []).reduce((acc, i) => acc + (parseFloat(i.receivedQty) || 0), 0);
                      return (
                        <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold font-mono text-slate-900">{po.id}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{po.supplierName}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{po.date}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {totalRec} / {totalOrdered} Units
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            ₹{(po.totalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge status={po.status} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button size="sm" variant="accent" onClick={() => handleOpenPOGrnModal(po)}>
                              <Icon name="PackagePlus" className="w-3.5 h-3.5 mr-1" />
                              Generate PO GRN
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: PO GRN History Table */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Icon name="CheckCircle2" className="w-4 h-4 text-emerald-600" />
              PO Goods Receipt Notes History ({completedPOsWithGRN.length})
            </h3>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 font-semibold text-slate-600 text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">GRN No</th>
                    <th className="py-2.5 px-4">Linked PO</th>
                    <th className="py-2.5 px-4">Supplier</th>
                    <th className="py-2.5 px-4">Received Date</th>
                    <th className="py-2.5 px-4 text-center">Receipt Status</th>
                    <th className="py-2.5 px-4 text-right">Order Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {completedPOsWithGRN.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400 italic">No PO Goods Receipts recorded yet.</td>
                    </tr>
                  ) : (
                    completedPOsWithGRN.map(po => (
                      <tr key={po.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-bold font-mono text-indigo-700">
                          {po.grnId || `GRN-PO-${po.id.replace('PO-', '')}`}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{po.id}</td>
                        <td className="py-2.5 px-4">{po.supplierName}</td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{po.grnDate || po.date}</td>
                        <td className="py-2.5 px-4 text-center"><StatusBadge status={po.status} /></td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{(po.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: DIRECT STOCK INWARD (NON-PO DIRECT GRN) */}
      {/* ========================================================= */}
      {subTab === 'direct_grn' && (
        <div className="space-y-6">
          {/* Direct GRN Info Banner */}
          <div className="bg-gradient-to-r from-emerald-600/10 via-emerald-600/5 to-transparent border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-700 text-white shadow-xs">
                <Icon name="Layers" className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Direct Stock Inward (Direct GRN)</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Direct stock intake without a Purchase Order (Opening balances, job work returns, vendor return receipts, sample intake).
                </p>
              </div>
            </div>
            <Button variant="primary" size="md" onClick={() => setIsDirectGRNModalOpen(true)}>
              <Icon name="Plus" className="w-4 h-4" />
              Create Direct GRN
            </Button>
          </div>

          {/* Direct GRN History Registry */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Icon name="FileText" className="w-4 h-4 text-emerald-600" />
                Direct Goods Receipt Notes ({directGrnList.length})
              </h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 font-semibold text-slate-600 text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Direct GRN No</th>
                    <th className="py-3 px-4">Inward Type</th>
                    <th className="py-3 px-4">Source / Party</th>
                    <th className="py-3 px-4">Receipt Date</th>
                    <th className="py-3 px-4 text-center">Items Count</th>
                    <th className="py-3 px-4 text-right">Inward Value (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Slip Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {directGrnList.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400 italic">
                        No direct stock inwards recorded yet. Click "Create Direct GRN" to inward opening stock, vendor returns, or spot purchases.
                      </td>
                    </tr>
                  ) : (
                    directGrnList.map(grn => (
                      <tr key={grn.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold font-mono text-emerald-800">{grn.id}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{grn.inwardType}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{grn.dcNo}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-semibold">{grn.supplierName}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{grn.date}</td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700 font-semibold">
                            {grn.totalItems || (grn.items ? grn.items.length : 1)} items ({grn.totalQty || 0} units)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{(grn.totalValuation || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={grn.status || 'Completed'} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button size="sm" variant="secondary" onClick={() => setSelectedDirectGRN(grn)}>
                            <Icon name="Eye" className="w-3.5 h-3.5 mr-1" />
                            View Slip
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL / DRAWER: PO GOODS RECEIPT (PO GRN) FORM */}
      {/* ========================================================= */}
      <Drawer
        isOpen={!!selectedPOForGRN}
        onClose={() => setSelectedPOForGRN(null)}
        title={selectedPOForGRN ? `Goods Receipt for ${selectedPOForGRN.id}` : 'PO Goods Receipt'}
        subtitle={selectedPOForGRN ? `Supplier: ${selectedPOForGRN.supplierName}` : ''}
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" onClick={() => setSelectedPOForGRN(null)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleConfirmPOGRN}>
              <Icon name="CheckCircle2" className="w-4 h-4 mr-1" />
              Confirm & Post PO GRN
            </Button>
          </div>
        }
      >
        {selectedPOForGRN && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Purchase Order</span>
                <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">{selectedPOForGRN.id}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Supplier Party</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{selectedPOForGRN.supplierName}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Supplier DC / Invoice No"
                value={poGrnDcNo}
                onChange={(e) => setPoGrnDcNo(e.target.value)}
                placeholder="e.g. DC-9842"
              />
              <Input
                label="Inspection / Inward Notes"
                value={poGrnNotes}
                onChange={(e) => setPoGrnNotes(e.target.value)}
                placeholder="e.g. Passed physical QA inspection"
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">PO Line Items to Inward</h4>
              {(selectedPOForGRN.items || []).map((it, idx) => {
                const remaining = Math.max(0, it.qty - (it.receivedQty || 0));
                return (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{it.productName || it.productId}</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        Ordered: {it.qty} | Bal: <strong className="text-indigo-700">{remaining} {it.uom || 'KG'}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <Input
                        label="Received Qty Inward"
                        type="number"
                        value={poGrnQtyMap[it.productId] !== undefined ? poGrnQtyMap[it.productId] : remaining}
                        onChange={(e) => setPoGrnQtyMap({ ...poGrnQtyMap, [it.productId]: e.target.value })}
                      />
                      <Input
                        label="Assigned Batch No"
                        value={poGrnBatchMap[it.productId] || ''}
                        onChange={(e) => setPoGrnBatchMap({ ...poGrnBatchMap, [it.productId]: e.target.value })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Drawer>

      {/* ========================================================= */}
      {/* MODAL / DRAWER: CREATE DIRECT GRN FORM */}
      {/* ========================================================= */}
      <Drawer
        isOpen={isDirectGRNModalOpen}
        onClose={() => setIsDirectGRNModalOpen(false)}
        title="Direct Stock Inward (Direct GRN)"
        subtitle="Record inward stock intake without a Purchase Order"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="md" onClick={() => setIsDirectGRNModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleSaveDirectGRN}>
              <Icon name="CheckCircle2" className="w-4 h-4 mr-1" />
              Post Direct GRN
            </Button>
          </div>
        }
      >
        <div className="space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Inward Reason / Type"
              options={['Direct Purchase', 'Opening Stock Inward', 'Job Work Return', 'Customer Return', 'Sample Inward', 'Physical Adjustment / Excess']}
              value={directInwardType}
              onChange={(e) => setDirectInwardType(e.target.value)}
            />
            <Combobox
              label="Supplier / Source Party"
              placeholder="Select or search party..."
              options={(state.parties || []).map(p => ({ label: p.name, value: p.id, sublabel: p.partyType || p.type }))}
              value={directSupplierId}
              onChange={(val) => setDirectSupplierId(val)}
              onCreateNew={() => setIsQuickPartyOpen(true)}
              createLabel="+ Add new supplier inline"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Receipt Date"
              type="date"
              value={directDate}
              onChange={(e) => setDirectDate(e.target.value)}
            />
            <Input
              label="Challan / Ref No"
              placeholder="e.g. DC-5510"
              value={directDcNo}
              onChange={(e) => setDirectDcNo(e.target.value)}
            />
            <Select
              label="Warehouse Location"
              options={['Main Warehouse', 'Raw Material Godown', 'Yarn Store', 'Finished Goods Yard']}
              value={directStoreLoc}
              onChange={(e) => setDirectStoreLoc(e.target.value)}
            />
          </div>

          {/* Quick Party Form */}
          {isQuickPartyOpen && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span>Quick Add Party</span>
                <button onClick={() => setIsQuickPartyOpen(false)} className="text-amber-700">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input label="Name" value={newPartyName} onChange={(e) => setNewPartyName(e.target.value)} />
                <Select label="Type" options={['Supplier', 'Customer', 'Both']} value={newPartyType} onChange={(e) => setNewPartyType(e.target.value)} />
                <Input label="Phone" value={newPartyPhone} onChange={(e) => setNewPartyPhone(e.target.value)} />
              </div>
              <Button size="sm" variant="primary" onClick={handleSaveQuickParty}>Save Party</Button>
            </div>
          )}

          {/* Line Items for Direct GRN */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">Inward Item Lines</h4>
              <Button type="button" variant="secondary" size="sm" onClick={handleAddDirectItemRow}>
                + Add Line
              </Button>
            </div>

            {directItems.map((item, idx) => {
              const selectedP = allProducts.find(p => p.id === item.productId);
              return (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Line #{idx + 1}</span>
                    {directItems.length > 1 && (
                      <button
                        onClick={() => handleRemoveDirectItemRow(idx)}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer text-xs font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <Combobox
                    label="Select Product"
                    placeholder="Search product..."
                    options={allProducts.map(p => ({ label: p.name, value: p.id, sublabel: `Stock: ${p.availableStock} ${p.uom}` }))}
                    value={item.productId}
                    onChange={(val) => {
                      const prod = allProducts.find(p => p.id === val);
                      const updated = [...directItems];
                      updated[idx] = { ...updated[idx], productId: val, rate: prod ? prod.avgRate : 150 };
                      setDirectItems(updated);
                    }}
                    onCreateNew={() => setIsQuickProductOpen(true)}
                    createLabel="+ Create product inline"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      label="Inward Qty"
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const updated = [...directItems];
                        updated[idx].qty = e.target.value;
                        setDirectItems(updated);
                      }}
                    />
                    <Input
                      label="Unit Rate (₹)"
                      type="number"
                      value={item.rate}
                      onChange={(e) => {
                        const updated = [...directItems];
                        updated[idx].rate = e.target.value;
                        setDirectItems(updated);
                      }}
                    />
                    <Input
                      label="Batch No"
                      value={item.batchNo}
                      onChange={(e) => {
                        const updated = [...directItems];
                        updated[idx].batchNo = e.target.value;
                        setDirectItems(updated);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Product Form */}
          {isQuickProductOpen && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-bold text-indigo-900">
                <span>Quick Add Item Master</span>
                <button onClick={() => setIsQuickProductOpen(false)} className="text-indigo-700">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input label="Item Name" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} />
                <Select label="UOM" options={['KG', 'MTR', 'PCS', 'BAG']} value={newProdUom} onChange={(e) => setNewProdUom(e.target.value)} />
                <Input label="Rate (₹)" type="number" value={newProdRate} onChange={(e) => setNewProdRate(e.target.value)} />
              </div>
              <Button size="sm" variant="primary" onClick={handleSaveQuickProduct}>Save Product</Button>
            </div>
          )}

          <Input
            label="Inward Remarks / General Note"
            placeholder="e.g. Received directly for trial batch"
            value={directNotes}
            onChange={(e) => setDirectNotes(e.target.value)}
          />
        </div>
      </Drawer>

      {/* ========================================================= */}
      {/* DRAWER: PRODUCT FIFO BATCH DETAILS */}
      {/* ========================================================= */}
      <Drawer
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={activeProd ? activeProd.name : 'Product Batches'}
        subtitle={activeProd ? `Available Stock: ${activeProd.availableStock} ${activeProd.uom} • Avg Rate: ₹${activeProd.avgRate}` : ''}
        footer={<Button variant="secondary" size="md" onClick={() => setSelectedProduct(null)}>Close Panel</Button>}
      >
        {activeProd && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Total Value</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                  ₹{(activeProd.stockValue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Reorder Level</span>
                <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">
                  {activeProd.minReorderLevel} {activeProd.uom}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900 text-[11px] leading-relaxed flex items-start gap-2">
              <Icon name="ShieldCheck" className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong className="block font-bold">Automated FIFO Queue</strong>
                Stock is deducted chronologically starting from the oldest available batch during Sales Invoice dispatch.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900">FIFO Batch Ledger</h4>
              {prodBatches.length === 0 ? (
                <div className="py-6 text-center text-slate-400 italic">No active batches found in queue.</div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[10px] uppercase">
                      <tr>
                        <th className="py-2 px-3">Batch & Ref</th>
                        <th className="py-2 px-3 text-right">Available</th>
                        <th className="py-2 px-3 text-right">Purchase Rate</th>
                        <th className="py-2 px-3 text-right">Batch Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {prodBatches.map((b, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold font-mono text-slate-900 block">{b.batchNo}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {b.grnId || 'Direct'} • {b.receivedDate}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {b.availableQty} {activeProd.uom}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">₹{b.rate}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ₹{((b.availableQty || 0) * (b.rate || 0)).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ========================================================= */}
      {/* DRAWER: DIRECT GRN SLIP DETAILS */}
      {/* ========================================================= */}
      <Drawer
        isOpen={!!selectedDirectGRN}
        onClose={() => setSelectedDirectGRN(null)}
        title={selectedDirectGRN ? `Direct GRN ${selectedDirectGRN.id}` : 'Direct GRN Slip'}
        subtitle={selectedDirectGRN ? `Source: ${selectedDirectGRN.supplierName} • Type: ${selectedDirectGRN.inwardType}` : ''}
        footer={<Button variant="secondary" size="md" onClick={() => setSelectedDirectGRN(null)}>Close Slip</Button>}
      >
        {selectedDirectGRN && (
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-emerald-950 text-white rounded-xl space-y-2">
              <div className="flex justify-between items-center text-emerald-300 text-[11px]">
                <span>Inward Receipt Status</span>
                <StatusBadge status={selectedDirectGRN.status || 'Completed'} />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                ₹{(selectedDirectGRN.totalValuation || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-emerald-300 text-[11px] pt-2 border-t border-emerald-900 flex justify-between">
                <span>Party: {selectedDirectGRN.supplierName}</span>
                <span>Date: {selectedDirectGRN.date}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Received Items</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">Batch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(selectedDirectGRN.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-bold text-slate-900">{it.productName || it.productId}</td>
                        <td className="py-2 px-3 text-center font-mono">{it.qty}</td>
                        <td className="py-2 px-3 text-right font-mono">₹{it.rate}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">{it.batchNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedDirectGRN.notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                <strong>Remarks:</strong> {selectedDirectGRN.notes}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

window.InventoryView = InventoryView;


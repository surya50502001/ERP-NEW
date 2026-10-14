import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Combobox from '../components/Combobox';
import Drawer from '../components/Drawer';
import StatusBadge from '../components/StatusBadge';
import { useERP } from '../context/ERPContext';
import PurchaseBillsTab from './purchases/PurchaseBillsTab';
import PaymentOutTab from './purchases/PaymentOutTab';
import DebitNotesTab from './purchases/DebitNotesTab';
import QuickCreatePartyModal from '../components/QuickCreatePartyModal';
import QuickCreateProductModal from '../components/QuickCreateProductModal';
import PrintableDocumentModal from '../components/PrintableDocumentModal';

export default function PurchasesView({ onNavigate }) {
  const { state, createPurchaseOrder, receiveGoods, addProduct, addParty, navResetCounter, showToast } = useERP();
  const [subTab, setSubTab] = useState('orders'); // 'orders' | 'bills' | 'payment-out' | 'debit-notes'
  const [selectedPO, setSelectedPO] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [isNewPOFormOpen, setIsNewPOFormOpen] = useState(false);
  const [isGRNDrawerOpen, setIsGRNDrawerOpen] = useState(false);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreatePartyOpen, setIsCreatePartyOpen] = useState(false);
  const [printablePO, setPrintablePO] = useState(null);
  const [poErrors, setPoErrors] = useState({});

  // Quick Create Modals
  const [quickPartyModal, setQuickPartyModal] = useState({ isOpen: false, name: '', type: 'Supplier' });
  const [quickProductModal, setQuickProductModal] = useState({ isOpen: false, name: '', itemIndex: null });

  const [poSupplierId, setPoSupplierId] = useState('');
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poItems, setPoItems] = useState([{ productId: '', qty: 100, rate: 0 }]);

  const [newProdName, setNewProdName] = useState('');
  const [newProdUom, setNewProdUom] = useState('KG');
  const [newProdRate, setNewProdRate] = useState(200);

  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyType, setNewPartyType] = useState('Supplier');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyState, setNewPartyState] = useState('Tamil Nadu');

  const [grnReceivedQtyMap, setGrnReceivedQtyMap] = useState({});
  const [grnBatchNoMap, setGrnBatchNoMap] = useState({});
  const [grnNotes, setGrnNotes] = useState('');

  // Reset view to main list when user re-clicks sidebar
  useEffect(() => {
    setSubTab('orders');
    setIsNewPOFormOpen(false);
    setSelectedPO(null);
    setIsGRNDrawerOpen(false);
  }, [navResetCounter]);

  if (!state) return null;

  const getPOTotal = (po) => {
    if (!po) return 0;
    if (typeof po.totalAmount === 'number' && !isNaN(po.totalAmount) && po.totalAmount > 0) {
      return po.totalAmount;
    }
    if (Array.isArray(po.items) && po.items.length > 0) {
      return po.items.reduce((acc, item) => {
        const itemAmount = Number(item.amount);
        if (!isNaN(itemAmount) && itemAmount > 0) return acc + itemAmount;
        const qty = Number(item.qty || 0);
        const rate = Number(item.rate || 0);
        return acc + (qty * rate);
      }, 0);
    }
    return 0;
  };

  const allPOs = state.purchaseOrders || [];

  const filteredPOs = allPOs.filter(po => {
    if (!po) return false;
    const poNum = String(po.poId || po.id || '').toLowerCase();
    const supplier = String(po.supplierName || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    const matchesSearch = !query || poNum.includes(query) || supplier.includes(query);
    const matchesStatus = statusFilter === 'All' || (po.status || 'Pending') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPOsCount = allPOs.length;
  const totalPurchaseValue = allPOs.reduce((acc, po) => acc + getPOTotal(po), 0);
  const pendingPOsCount = allPOs.filter(po => (po.status || 'Pending') === 'Pending').length;
  const receivedPOsCount = allPOs.filter(po => po.status === 'Received').length;

  const currentPO = selectedPO
    ? allPOs.find(p => (p.poId && p.poId === selectedPO.poId) || String(p.id) === String(selectedPO.id)) || selectedPO
    : null;

  const currentPOTotal = currentPO ? getPOTotal(currentPO) : 0;

  const handleSavePO = async () => {
    const errors = {};
    if (!poSupplierId) {
      errors.supplier = 'Please select a supplier.';
    }
    const itemErrors = [];
    let hasItemError = false;

    if (!poItems || poItems.length === 0) {
      errors.items = 'At least one line item is required.';
    } else {
      poItems.forEach((item, idx) => {
        const itemErr = {};
        if (!item.productId) {
          itemErr.productId = 'Product is required';
          hasItemError = true;
        }
        if (!item.qty || parseFloat(item.qty) <= 0) {
          itemErr.qty = 'Qty must be > 0';
          hasItemError = true;
        }
        if (item.rate === '' || item.rate === undefined || parseFloat(item.rate) <= 0) {
          itemErr.rate = 'Rate must be > 0';
          hasItemError = true;
        }
        itemErrors[idx] = itemErr;
      });
    }

    if (hasItemError) errors.itemErrors = itemErrors;

    if (Object.keys(errors).length > 0) {
      setPoErrors(errors);
      showToast?.('Validation Error', 'Please complete all required fields with positive values.', 'error');
      return;
    }
    setPoErrors({});

    const supplier = (state.parties || []).find(p => String(p.id) === String(poSupplierId) || String(p.partyId) === String(poSupplierId));
    if (!supplier) {
      setPoErrors({ supplier: 'Selected supplier not found in records.' });
      return;
    }

    const formattedItems = poItems.map(item => {
      const prod = (state.products || []).find(p => String(p.id) === String(item.productId) || String(p.productId) === String(item.productId));
      const qty = parseFloat(item.qty || 1);
      const rate = parseFloat(item.rate || (prod ? (prod.avgRate || prod.purchaseRate || 100) : 100));
      const resolvedProdId = prod && !isNaN(Number(prod.id)) && Number(prod.id) > 0 ? Number(prod.id) : item.productId;

      return {
        productId: resolvedProdId,
        productName: prod ? prod.name : 'Custom Product',
        qty,
        uom: prod ? prod.uom : 'KG',
        rate,
        amount: qty * rate
      };
    });

    const totalAmount = formattedItems.reduce((acc, i) => acc + i.amount, 0);

    const res = await createPurchaseOrder({
      supplierId: supplier.partyId || supplier.id,
      supplierName: supplier.name,
      expectedDate: poExpectedDate || new Date().toISOString().split('T')[0],
      itemsCount: formattedItems.length,
      totalAmount,
      items: formattedItems
    });

    if (res && res.success) {
      setIsNewPOFormOpen(false);
      setPoSupplierId('');
      setPoItems([{ productId: '', qty: 100, rate: 0 }]);
      setPoErrors({});
    }
  };

  const handleOpenGRNDrawer = () => {
    if (!currentPO) return;
    const initialQtyMap = {};
    const initialBatchMap = {};
    (currentPO.items || []).forEach((item, idx) => {
      const itemKey = item.productId || item.id || idx;
      const remaining = Math.max(0, (item.qty || 0) - (item.receivedQty || 0));
      initialQtyMap[itemKey] = remaining;
      initialBatchMap[itemKey] = `B${Math.floor(Math.random() * 900) + 100}`;
    });
    setGrnReceivedQtyMap(initialQtyMap);
    setGrnBatchNoMap(initialBatchMap);
    setIsGRNDrawerOpen(true);
  };

  const handleConfirmGRN = () => {
    if (!currentPO) return;
    const receivedItemsList = (currentPO.items || []).map((item, idx) => {
      const itemKey = item.productId || item.id || idx;
      return {
        productId: item.productId || item.id,
        receivedQty: parseFloat(grnReceivedQtyMap[itemKey] || 0),
        rate: item.rate || 0,
        batchNo: grnBatchNoMap[itemKey] || 'B001'
      };
    });

    const hasValidQty = receivedItemsList.some(i => i.receivedQty > 0);
    if (!hasValidQty) {
      showToast?.('Validation Error', 'At least one received quantity must be greater than zero.', 'error');
      return;
    }

    receiveGoods(currentPO.id, receivedItemsList, grnNotes, currentPO.supplierName);
    setIsGRNDrawerOpen(false);
    setGrnNotes('');
  };

  const handleInlineSaveProduct = () => {
    if (!newProdName) return;
    addProduct({
      name: newProdName,
      uom: newProdUom,
      majorGroup: 'Yarn',
      subGroup: 'Cotton Yarn',
      subSubGroup: 'Combed Cotton',
      purchaseRate: parseFloat(newProdRate || 0),
      openingStock: 0
    });
    setNewProdName('');
    setIsCreateProductOpen(false);
  };

  const handleInlineSaveParty = () => {
    if (!newPartyName) return;
    addParty({
      name: newPartyName,
      partyType: newPartyType,
      contactNumber: newPartyPhone || '+91 98420 00000',
      country: 'India',
      state: newPartyState
    });
    setNewPartyName('');
    setIsCreatePartyOpen(false);
  };

  // FULL MAIN AREA CREATION FORM FOR PO
  if (isNewPOFormOpen) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewPOFormOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Icon name="ArrowLeft" className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Purchase Order</h1>
              <p className="text-xs text-slate-500 mt-0.5">Issue a new PO to a registered supplier</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={() => setIsNewPOFormOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleSavePO}>
              <Icon name="Plus" className="w-4 h-4" /> Generate PO
            </Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <Combobox
              label="Select Supplier"
              placeholder="Search supplier..."
              entityName="Supplier"
              error={poErrors.supplier}
              options={(state.parties || []).filter(p => (p.partyType || p.type) === 'Supplier' || (p.partyType || p.type) === 'Both').map(p => ({
                label: p.name || 'Unnamed Supplier',
                value: p.id ?? p.partyId,
                sublabel: p.city || p.location || p.state || ''
              }))}
              value={poSupplierId}
              onChange={(val) => {
                setPoSupplierId(val);
                if (poErrors.supplier) setPoErrors({ ...poErrors, supplier: undefined });
              }}
              onCreateNew={(term) => setQuickPartyModal({ isOpen: true, name: term, type: 'Supplier' })}
              createLabel="+ Create new supplier"
            />

            <Input
              label="Expected Delivery Date"
              type="date"
              value={poExpectedDate}
              onChange={(e) => setPoExpectedDate(e.target.value)}
            />
          </div>

          {/* Line Items */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Order Line Items</h3>
                <p className="text-[11px] text-slate-500">Products, quantities, and rates for this purchase order</p>
                {poErrors.items && <p className="text-xs text-rose-500 font-medium mt-1">{poErrors.items}</p>}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPoItems([...poItems, { productId: '', qty: 100, rate: 0 }])}
              >
                + Add Item
              </Button>
            </div>

            <div className="border border-slate-200 rounded-xl bg-white shadow-2xs divide-y divide-slate-100 overflow-visible">
              {/* Header Row */}
              <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 bg-slate-50/80 rounded-t-xl text-[11px] font-bold text-slate-500 uppercase tracking-wider items-center">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">Product / Item</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Rate (₹)</div>
                <div className="col-span-1 text-right">Amount</div>
                <div className="col-span-1 text-center"></div>
              </div>

              {/* Item Rows */}
              {poItems.map((item, idx) => {
                const qty = parseFloat(item.qty) || 0;
                const rate = parseFloat(item.rate) || 0;
                const amount = Math.round(qty * rate);
                const itemErr = poErrors.itemErrors?.[idx];

                return (
                  <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 p-2.5 sm:px-3 sm:py-2 items-center hover:bg-slate-50/60 transition-colors">
                    <div className="hidden sm:block col-span-1 text-center font-bold text-xs text-slate-400">
                      {idx + 1}
                    </div>
                    <div className="w-full sm:col-span-5">
                      <Combobox
                        placeholder="Select product..."
                        entityName="Product"
                        error={itemErr?.productId}
                        options={(state.products || []).map(p => ({
                          label: p.name || 'Unnamed Product',
                          value: p.id ?? p.productId,
                          sublabel: `Stock: ${p.availableStock ?? 0} ${p.uom || 'KG'}`
                        }))}
                        value={item.productId}
                        onChange={(val) => {
                          const prod = (state.products || []).find(p => String(p.id) === String(val) || String(p.productId) === String(val));
                          const updated = [...poItems];
                          updated[idx] = {
                            ...updated[idx],
                            productId: val,
                            rate: prod ? (prod.avgRate || prod.purchaseRate || 200) : 200
                          };
                          setPoItems(updated);
                        }}
                        onCreateNew={(term) => setQuickProductModal({ isOpen: true, name: term, itemIndex: idx })}
                        createLabel="+ Create product"
                      />
                    </div>
                    <div className="flex sm:contents items-center gap-2 w-full">
                      <div className="flex-1 sm:col-span-2">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          placeholder="Qty"
                          className={`w-full text-right py-1.5 px-2.5 text-xs rounded-lg border font-mono focus:outline-none ${
                            itemErr?.qty
                              ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20'
                              : 'border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                          }`}
                          value={item.qty}
                          onChange={(e) => {
                            const updated = [...poItems];
                            updated[idx].qty = e.target.value;
                            setPoItems(updated);
                          }}
                        />
                        {itemErr?.qty && <p className="text-[10px] text-rose-500 mt-0.5 text-right">{itemErr.qty}</p>}
                      </div>
                      <div className="flex-1 sm:col-span-2">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          placeholder="Rate"
                          className={`w-full text-right py-1.5 px-2.5 text-xs rounded-lg border font-mono focus:outline-none ${
                            itemErr?.rate
                              ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20'
                              : 'border-slate-200 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                          }`}
                          value={item.rate}
                          onChange={(e) => {
                            const updated = [...poItems];
                            updated[idx].rate = e.target.value;
                            setPoItems(updated);
                          }}
                        />
                        {itemErr?.rate && <p className="text-[10px] text-rose-500 mt-0.5 text-right">{itemErr.rate}</p>}
                      </div>
                      <div className="flex-1 sm:col-span-1 text-right">
                        <span className="font-mono font-bold text-xs text-slate-800">₹{amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="sm:col-span-1 text-center">
                        {poItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Icon name="Trash2" className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" size="md" onClick={() => setIsNewPOFormOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleSavePO}>Generate PO</Button>
          </div>
        </div>

        {/* Quick Create Modals */}
        <QuickCreatePartyModal
          isOpen={quickPartyModal.isOpen}
          onClose={() => setQuickPartyModal({ isOpen: false, name: '', type: 'Supplier' })}
          defaultType="Supplier"
          initialName={quickPartyModal.name}
          onCreated={(newParty) => {
            const pid = newParty.id || newParty.partyId;
            setPoSupplierId(pid);
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
              const updated = [...poItems];
              if (updated[idx]) {
                updated[idx] = {
                  ...updated[idx],
                  productId: pid,
                  rate: newProd.purchaseRate || newProd.avgRate || 200
                };
                setPoItems(updated);
              }
            }
          }}
        />
      </div>
    );
  }

  // DETAILED SINGLE PO VIEW
  if (currentPO) {
    const poNumber = currentPO.poId || (typeof currentPO.id === 'string' && currentPO.id.startsWith('PO') ? currentPO.id : `PO-${currentPO.id}`);
    const poDate = currentPO.date ? String(currentPO.date).split('T')[0] : 'N/A';

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedPO(null)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Icon name="ArrowLeft" className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 font-mono tracking-tight">{poNumber}</h1>
                <StatusBadge status={currentPO.status || 'Pending'} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Supplier: {currentPO.supplierName || 'N/A'} • Order Date: {poDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentPO.status !== 'Received' && currentPO.status !== 'Cancelled' && (
              <Button variant="accent" size="md" onClick={handleOpenGRNDrawer}>
                <Icon name="Truck" className="w-4 h-4" />
                Receive Goods (GRN)
              </Button>
            )}
            <Button variant="secondary" size="md" onClick={() => setPrintablePO(currentPO)}>
              <Icon name="Printer" className="w-4 h-4" />
              Print PO
            </Button>
          </div>
        </div>

        <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-semibold text-slate-500">
          {['Overview', 'Items', 'Receiving', 'Activity'].map(tab => {
            const key = tab.toLowerCase();
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
                  isActive ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Supplier & Order Details</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Supplier Name</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{currentPO.supplierName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">PO Date</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{poDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Expected Delivery</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{currentPO.expectedDate || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">GRN Status</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block font-mono">{currentPO.grnId || 'Pending GRN'}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Delivery Notes</span>
                <p className="text-slate-600 mt-1 leading-relaxed">{currentPO.notes || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Financial Summary</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{((currentPOTotal * 0.95) || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Estimated GST (5%)</span>
                  <span className="font-mono">₹{((currentPOTotal * 0.05) || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total PO Value</span>
                  <span className="font-mono">₹{(currentPOTotal || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Line Items in PO</h3>
              <Button size="sm" variant="secondary" onClick={() => setIsCreateProductOpen(true)}>
                <Icon name="Plus" className="w-3.5 h-3.5" /> Create Missing Product
              </Button>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-y border-slate-200/80 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 text-right">Ordered Qty</th>
                  <th className="py-2.5 px-3 text-center">UOM</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {(currentPO.items || []).map((item, idx) => {
                  const prod = (state.products || []).find(p => String(p.id) === String(item.productId) || String(p.productId) === String(item.productId));
                  const prodName = item.productName || (prod ? prod.name : `Product #${item.productId}`);
                  const uom = item.uom || (prod ? prod.uom : 'KG');
                  const rate = Number(item.rate || (prod ? (prod.avgRate || prod.purchaseRate || 0) : 0));
                  const amount = Number(item.amount || (Number(item.qty || 0) * rate));
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-slate-900">{prodName}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">{item.qty || 0}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">{uom}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{rate.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{amount.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'receiving' && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Goods Receipt Notes (GRN)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Receiving automatically updates FIFO inventory queues.</p>
              </div>
              {currentPO.status !== 'Received' && (
                <Button size="sm" variant="accent" onClick={handleOpenGRNDrawer}>
                  <Icon name="Truck" className="w-3.5 h-3.5" /> Receive Goods
                </Button>
              )}
            </div>
            {currentPO.grnId ? (
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-slate-900 text-sm">{currentPO.grnId}</span>
                  <span className="text-slate-500">{currentPO.grnDate || '2026-08-20'}</span>
                </div>
                <p className="text-slate-600">All line items received into Warehouse. Stock quantities updated successfully.</p>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">No GRN recorded yet. Click &quot;Receive Goods&quot; to log arrival.</div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">PO Activity Log</h3>
            <div className="space-y-3 text-xs">
              {(currentPO.activity || []).map((act, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-900 mt-1.5" />
                  <div>
                    <p className="font-bold text-slate-900">{act.title} • {act.user}</p>
                    <p className="text-slate-500 mt-0.5">{act.detail}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block font-mono">{act.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Drawer
          isOpen={isGRNDrawerOpen}
          onClose={() => setIsGRNDrawerOpen(false)}
          title={`Receive Goods - ${poNumber}`}
          subtitle={`Supplier: ${currentPO.supplierName || 'N/A'}`}
          footer={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="md" onClick={() => setIsGRNDrawerOpen(false)}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleConfirmGRN}>Confirm & Update Stock</Button>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-900 text-[11px] leading-relaxed">
              <p className="font-semibold flex items-center gap-1.5">
                <Icon name="Info" className="w-4 h-4 text-indigo-600" />
                Inventory & FIFO Mechanics
              </p>
              Entering received quantities will automatically generate a new GRN log, create FIFO batch entries, and update product available stock in real time.
            </div>

            <div className="border border-slate-200 rounded-xl bg-white shadow-2xs divide-y divide-slate-100 overflow-visible">
              <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 bg-slate-50/80 rounded-t-xl text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <div className="col-span-5">Product / Item</div>
                <div className="col-span-2 text-right">Ordered</div>
                <div className="col-span-2 text-right">Receive Qty</div>
                <div className="col-span-3">Batch Number</div>
              </div>

              {(currentPO.items || []).map((item, idx) => {
                const itemKey = item.productId || item.id || idx;
                const prod = (state.products || []).find(p => String(p.id) === String(item.productId) || String(p.productId) === String(item.productId));
                const prodName = item.productName || (prod ? prod.name : `Product #${item.productId}`);
                const uom = item.uom || (prod ? prod.uom : 'KG');
                const remaining = Math.max(0, (item.qty || 0) - (item.receivedQty || 0));

                return (
                  <div key={itemKey} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 p-2.5 sm:px-3 sm:py-2 items-center hover:bg-slate-50/60 transition-colors">
                    <div className="w-full sm:col-span-5">
                      <span className="font-bold text-slate-800 text-xs block truncate">{prodName}</span>
                      <span className="sm:hidden text-[10px] text-slate-400 font-mono">Ordered: {item.qty || 0} {uom}</span>
                    </div>
                    <div className="hidden sm:block sm:col-span-2 text-right text-xs text-slate-500 font-mono">
                      {item.qty || 0} {uom}
                    </div>
                    <div className="w-full sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Qty"
                        className="w-full text-right py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                        value={grnReceivedQtyMap[itemKey] ?? remaining}
                        onChange={(e) => setGrnReceivedQtyMap({ ...grnReceivedQtyMap, [itemKey]: e.target.value })}
                      />
                    </div>
                    <div className="w-full sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Batch Number"
                        className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                        value={grnBatchNoMap[itemKey] || 'B001'}
                        onChange={(e) => setGrnBatchNoMap({ ...grnBatchNoMap, [itemKey]: e.target.value })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <Input
              label="GRN Remarks / Delivery Note"
              placeholder="E.g. Received via VRL Logistics truck #TN38-1234"
              value={grnNotes}
              onChange={(e) => setGrnNotes(e.target.value)}
            />
          </div>
        </Drawer>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Module Sub-tabs Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'orders', label: 'Purchase Orders', icon: 'ShoppingBag' },
          { id: 'bills', label: 'Purchase Bills', icon: 'FileText' },
          { id: 'payment-out', label: 'Payment - Out', icon: 'CreditCard' },
          { id: 'debit-notes', label: 'Purchase Return (Debit Note)', icon: 'ArrowLeft' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSubTab(tab.id);
              setSelectedPO(null);
            }}
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

      {subTab === 'bills' && <PurchaseBillsTab onNavigate={onNavigate} />}
      {subTab === 'payment-out' && <PaymentOutTab onNavigate={onNavigate} />}
      {subTab === 'debit-notes' && <DebitNotesTab onNavigate={onNavigate} />}

      {subTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Orders</h1>
              <p className="text-xs text-slate-500 mt-0.5">Manage Purchase Orders, GRNs, and Supplier Transactions</p>
            </div>
            <Button variant="primary" size="md" onClick={() => setIsNewPOFormOpen(true)}>
              <Icon name="Plus" className="w-4 h-4" />
              New Purchase Order
            </Button>
          </div>

      {/* KPI Metrics Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Orders</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalPOsCount}</p>
          <span className="text-[11px] text-slate-500">All registered POs</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Purchase Value</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">₹{totalPurchaseValue.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-500">Cumulative order value</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pending Receipt</span>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-1">{pendingPOsCount}</p>
          <span className="text-[11px] text-slate-500">Awaiting GRN inward</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Completed (Received)</span>
          <p className="text-2xl font-bold font-mono text-indigo-600 mt-1">{receivedPOsCount}</p>
          <span className="text-[11px] text-slate-500">Goods received into stock</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="w-full sm:w-72">
          <Input
            icon="Search"
            placeholder="Search PO number, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-xs font-medium text-slate-600">
          {['All', 'Pending', 'Partial', 'Received', 'Cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === st ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">PO Number</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-center">Items</th>
              <th className="py-3 px-4 text-right">Total Amount (₹)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {filteredPOs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Icon name="ShoppingBag" className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-600">No purchase orders found</p>
                    <p className="text-xs text-slate-400">Click &quot;New Purchase Order&quot; to issue an order to a supplier.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPOs.map(po => {
                const poNumber = po.poId || (typeof po.id === 'string' && po.id.startsWith('PO') ? po.id : `PO-${po.id}`);
                const poDate = po.date ? String(po.date).split('T')[0] : 'N/A';
                const itemsCount = po.itemsCount ?? (po.items?.length || 0);
                const poTotal = getPOTotal(po);

                return (
                  <tr
                    key={po.id || po.poId || Math.random()}
                    onClick={() => setSelectedPO(po)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold font-mono text-slate-900">{poNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{po.supplierName || 'Unknown Supplier'}</td>
                    <td className="py-3 px-4 text-slate-500">{poDate}</td>
                    <td className="py-3 px-4 text-center font-mono">{itemsCount} items</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{poTotal.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={po.status || 'Pending'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setPrintablePO(po)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Purchase Order"
                        >
                          <Icon name="Printer" className="w-4 h-4" />
                        </button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedPO(po)}>View</Button>
                      </div>
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

    {printablePO && (
      <PrintableDocumentModal
        isOpen={Boolean(printablePO)}
        onClose={() => setPrintablePO(null)}
        docType="PURCHASE_ORDER"
        data={printablePO}
      />
    )}
  </div>
  );
}

window.PurchasesView = PurchasesView;

import React, { useState } from 'react';
import Icon from '../components/Icon';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Combobox from '../components/Combobox';
import Drawer from '../components/Drawer';
import StatusBadge from '../components/StatusBadge';
import { useERP } from '../context/ERPContext';

export default function PurchasesView({ onNavigate }) {
  const { state, createPurchaseOrder, receiveGoods, addProduct, addParty } = useERP();
  const [selectedPO, setSelectedPO] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [isNewPOFormOpen, setIsNewPOFormOpen] = useState(false);
  const [isGRNDrawerOpen, setIsGRNDrawerOpen] = useState(false);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreatePartyOpen, setIsCreatePartyOpen] = useState(false);

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

  if (!state) return null;

  const filteredPOs = (state.purchaseOrders || []).filter(po => {
    const matchesSearch = po.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const currentPO = selectedPO ? (state.purchaseOrders || []).find(p => p.id === selectedPO.id) || selectedPO : null;

  const handleSavePO = () => {
    const supplier = (state.parties || []).find(p => p.id === poSupplierId);
    if (!supplier || poItems.length === 0) return;

    const formattedItems = poItems.map(item => {
      const prod = (state.products || []).find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod ? prod.name : 'Custom Product',
        qty: parseFloat(item.qty || 1),
        uom: prod ? prod.uom : 'KG',
        rate: parseFloat(item.rate || (prod ? prod.avgRate : 100)),
        amount: parseFloat(item.qty || 1) * parseFloat(item.rate || (prod ? prod.avgRate : 100))
      };
    });

    const totalAmount = formattedItems.reduce((acc, i) => acc + i.amount, 0);

    createPurchaseOrder({
      supplierId: supplier.id,
      supplierName: supplier.name,
      expectedDate: poExpectedDate || '2026-08-25',
      itemsCount: formattedItems.length,
      totalAmount,
      items: formattedItems
    });

    setIsNewPOFormOpen(false);
    setPoSupplierId('');
    setPoItems([{ productId: '', qty: 100, rate: 0 }]);
  };

  const handleOpenGRNDrawer = () => {
    if (!currentPO) return;
    const initialQtyMap = {};
    const initialBatchMap = {};
    currentPO.items.forEach((item) => {
      const remaining = Math.max(0, item.qty - (item.receivedQty || 0));
      initialQtyMap[item.productId] = remaining;
      initialBatchMap[item.productId] = `B${Math.floor(Math.random() * 900) + 100}`;
    });
    setGrnReceivedQtyMap(initialQtyMap);
    setGrnBatchNoMap(initialBatchMap);
    setIsGRNDrawerOpen(true);
  };

  const handleConfirmGRN = () => {
    if (!currentPO) return;
    const receivedItemsList = currentPO.items.map(item => ({
      productId: item.productId,
      receivedQty: parseFloat(grnReceivedQtyMap[item.productId] || 0),
      rate: item.rate,
      batchNo: grnBatchNoMap[item.productId] || 'B001'
    }));

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
      purchaseRate: parseFloat(newProdRate),
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

  // FULL MAIN AREA CREATION FORM FOR PO (Replaces Side Drawer)
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
              options={(state.parties || []).filter(p => (p.partyType || p.type) === 'Supplier' || (p.partyType || p.type) === 'Both').map(p => ({ label: p.name, value: p.id, sublabel: p.location }))}
              value={poSupplierId}
              onChange={(val) => setPoSupplierId(val)}
              onCreateNew={() => setIsCreatePartyOpen(true)}
              createLabel="+ Create new supplier inline"
            />

            <Input
              label="Expected Delivery Date"
              type="date"
              value={poExpectedDate}
              onChange={(e) => setPoExpectedDate(e.target.value)}
            />
          </div>

          {/* Inline Supplier Form */}
          {isCreatePartyOpen && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>Quick Add Supplier</span>
                <button onClick={() => setIsCreatePartyOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input label="Supplier Name" value={newPartyName} onChange={(e) => setNewPartyName(e.target.value)} />
                <Select label="Party Type" options={['Supplier', 'Both']} value={newPartyType} onChange={(e) => setNewPartyType(e.target.value)} />
                <Input label="Phone" value={newPartyPhone} onChange={(e) => setNewPartyPhone(e.target.value)} />
              </div>
              <Button size="sm" variant="primary" onClick={handleInlineSaveParty}>Save Supplier</Button>
            </div>
          )}

          {/* Line Items */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Order Line Items</h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPoItems([...poItems, { productId: '', qty: 100, rate: 0 }])}
              >
                + Add Item
              </Button>
            </div>

            {poItems.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Combobox
                    label={`Item #${idx + 1}`}
                    placeholder="Select product..."
                    options={(state.products || []).map(p => ({ label: p.name, value: p.id, sublabel: `Stock: ${p.availableStock} ${p.uom}` }))}
                    value={item.productId}
                    onChange={(val) => {
                      const prod = (state.products || []).find(p => p.id === val);
                      const updated = [...poItems];
                      updated[idx] = { ...updated[idx], productId: val, rate: prod ? prod.avgRate : 200 };
                      setPoItems(updated);
                    }}
                    onCreateNew={() => setIsCreateProductOpen(true)}
                    createLabel="+ Create product inline"
                  />

                  <Input
                    label="Qty"
                    type="number"
                    value={item.qty}
                    onChange={(e) => {
                      const updated = [...poItems];
                      updated[idx].qty = e.target.value;
                      setPoItems(updated);
                    }}
                  />
                  <Input
                    label="Rate (₹)"
                    type="number"
                    value={item.rate}
                    onChange={(e) => {
                      const updated = [...poItems];
                      updated[idx].rate = e.target.value;
                      setPoItems(updated);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Inline Product Form */}
          {isCreateProductOpen && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>Quick Add Product</span>
                <button onClick={() => setIsCreateProductOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input label="Product Name" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} />
                <Select label="UOM" options={['KG', 'MTR', 'PCS']} value={newProdUom} onChange={(e) => setNewProdUom(e.target.value)} />
                <Input label="Standard Rate (₹)" type="number" value={newProdRate} onChange={(e) => setNewProdRate(e.target.value)} />
              </div>
              <Button size="sm" variant="primary" onClick={handleInlineSaveProduct}>Save Product</Button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" size="md" onClick={() => setIsNewPOFormOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleSavePO}>Generate PO</Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPO) {
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
                <h1 className="text-xl font-bold text-slate-900 font-mono tracking-tight">{currentPO.id}</h1>
                <StatusBadge status={currentPO.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Supplier: {currentPO.supplierName} • Order Date: {currentPO.date}
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
            <Button variant="secondary" size="md">
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
                  <span className="font-bold text-slate-900 mt-0.5 block">{currentPO.supplierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">PO Date</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{currentPO.date}</span>
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
                  <span className="font-mono">₹{(currentPO.totalAmount * 0.95).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Estimated GST (5%)</span>
                  <span className="font-mono">₹{(currentPO.totalAmount * 0.05).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total PO Value</span>
                  <span className="font-mono">₹{currentPO.totalAmount.toLocaleString('en-IN')}</span>
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
                {currentPO.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-semibold text-slate-900">{item.productName}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">{item.qty}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">{item.uom}</td>
                    <td className="py-3 px-3 text-right font-mono">₹{item.rate}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
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
                <p className="text-slate-600">All line items received into Warehouse A. Stock quantities updated successfully.</p>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">No GRN recorded yet. Click "Receive Goods" to log arrival.</div>
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
          title={`Receive Goods - ${currentPO.id}`}
          subtitle={`Supplier: ${currentPO.supplierName}`}
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

            {currentPO.items.map((item) => {
              const remaining = Math.max(0, item.qty - (item.receivedQty || 0));
              return (
                <div key={item.productId} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{item.productName}</span>
                    <span className="text-slate-500 font-mono text-[11px]">Ordered: {item.qty} {item.uom}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Received Qty"
                      type="number"
                      value={grnReceivedQtyMap[item.productId] ?? remaining}
                      onChange={(e) => setGrnReceivedQtyMap({ ...grnReceivedQtyMap, [item.productId]: e.target.value })}
                    />
                    <Input
                      label="Batch Number"
                      value={grnBatchNoMap[item.productId] || 'B001'}
                      onChange={(e) => setGrnBatchNoMap({ ...grnBatchNoMap, [item.productId]: e.target.value })}
                    />
                  </div>
                </div>
              );
            })}

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchases</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage Purchase Orders, GRNs, and Supplier Transactions</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsNewPOFormOpen(true)}>
          <Icon name="Plus" className="w-4 h-4" />
          New Purchase Order
        </Button>
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
                <td colSpan="7" className="py-8 text-center text-slate-400 italic">No purchase orders found. Click "New Purchase Order" to create one.</td>
              </tr>
            ) : (
              filteredPOs.map(po => (
                <tr
                  key={po.id}
                  onClick={() => setSelectedPO(po)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-bold font-mono text-slate-900">{po.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{po.supplierName}</td>
                  <td className="py-3 px-4 text-slate-500">{po.date}</td>
                  <td className="py-3 px-4 text-center font-mono">{po.itemsCount} items</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{po.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={po.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button size="sm" variant="ghost">View</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.PurchasesView = PurchasesView;

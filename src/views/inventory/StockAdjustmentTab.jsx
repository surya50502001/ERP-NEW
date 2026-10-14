import React, { useState } from 'react';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Combobox from '../../components/Combobox';
import StatusBadge from '../../components/StatusBadge';
import { useERP } from '../../context/ERPContext';

export default function StockAdjustmentTab() {
  const { state, recordStockAdjustment } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Form State
  const [productId, setProductId] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [adjType, setAdjType] = useState('Damaged'); // 'Damaged' | 'Expired' | 'Lost/Theft' | 'Audit Reconciliation'
  const [qty, setQty] = useState('5');
  const [unitCost, setUnitCost] = useState('100');
  const [reasonCode, setReasonCode] = useState('DMG-01');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState({});

  if (!state) return null;

  const allProducts = state.products || [];
  const selectedProd = allProducts.find(p => String(p.id) === String(productId) || String(p.productId) === String(productId));
  const availableBatches = selectedProd && state.batches && state.batches[selectedProd.id] ? state.batches[selectedProd.id] : [];

  const adjustments = state.stockAdjustments || [];

  const totalWriteOffVal = adjustments.reduce((acc, a) => acc + (parseFloat(a.totalValuation) || 0), 0);
  const totalWriteOffUnits = adjustments.reduce((acc, a) => acc + (parseFloat(a.qty) || 0), 0);

  const filteredAdjustments = adjustments.filter(a => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (a.productName && a.productName.toLowerCase().includes(q)) ||
      (a.id && a.id.toLowerCase().includes(q)) ||
      (a.remarks && a.remarks.toLowerCase().includes(q));
    const matchesType = typeFilter === 'All' || a.adjType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSave = () => {
    const errs = {};
    if (!selectedProd) {
      errs.product = 'Please select a product.';
    }
    const numQty = parseFloat(qty);
    if (!numQty || isNaN(numQty) || numQty <= 0) {
      errs.qty = 'Quantity must be greater than zero.';
    } else if (adjType !== 'Audit Reconciliation (+)' && selectedProd && numQty > (selectedProd.availableStock || 0)) {
      errs.qty = `Cannot deduct more than available stock (${selectedProd.availableStock} ${selectedProd.uom}).`;
    }

    const numRate = parseFloat(unitCost);
    if (isNaN(numRate) || numRate < 0) {
      errs.rate = 'Unit cost must be valid.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    if (recordStockAdjustment) {
      recordStockAdjustment({
        productId: selectedProd.id,
        productName: selectedProd.name,
        uom: selectedProd.uom || 'KG',
        batchNo: batchNo || (availableBatches.length > 0 ? availableBatches[0].batchNo : 'ADJ-BATCH'),
        adjType,
        qty: numQty,
        unitCost: numRate,
        totalValuation: Math.round(numQty * numRate),
        reasonCode,
        remarks: remarks || `${adjType} stock write-off`
      });
    }

    setIsOpen(false);
    setProductId('');
    setBatchNo('');
    setQty('5');
    setRemarks('');
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Write-Off Value</span>
          <p className="text-2xl font-bold font-mono text-rose-600 mt-1">₹{totalWriteOffVal.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-500">Cumulative loss & audit deductions</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Adjusted Units</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalWriteOffUnits}</p>
          <span className="text-[11px] text-slate-500">Physical units accounted for</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Audit Discrepancies</span>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {adjustments.filter(a => a.adjType === 'Audit Reconciliation').length}
          </p>
          <span className="text-[11px] text-slate-500">Count reconciliation adjustments</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">FIFO Accuracy</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">Synchronized</p>
          <span className="text-[11px] text-slate-500">Batches deducted at specific cost</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="w-full sm:w-80">
          <Input
            icon="Search"
            placeholder="Search adjustments by item, ref, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['All', 'Damaged', 'Expired', 'Lost/Theft', 'Audit Reconciliation'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  typeFilter === t ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Button variant="primary" size="md" onClick={() => setIsOpen(true)}>
            <Icon name="Plus" className="w-4 h-4" />
            + Record Adjustment
          </Button>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Adjustment ID</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Product / Item</th>
              <th className="py-3 px-4">Batch Number</th>
              <th className="py-3 px-4 text-center">Adjustment Type</th>
              <th className="py-3 px-4 text-right">Adjusted Qty</th>
              <th className="py-3 px-4 text-right">Cost (₹)</th>
              <th className="py-3 px-4 text-right">Total Loss / Variance</th>
              <th className="py-3 px-4">Reason & Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {filteredAdjustments.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-10 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Icon name="PackageCheck" className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-600">No stock write-offs recorded</p>
                    <p className="text-xs text-slate-400">Record damaged, expired, or audit discrepancy adjustments here.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAdjustments.map(adj => (
                <tr key={adj.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{adj.id}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{adj.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{adj.productName}</td>
                  <td className="py-3 px-4 font-mono text-indigo-700 font-semibold">{adj.batchNo}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      adj.adjType === 'Damaged' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      adj.adjType === 'Expired' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      adj.adjType === 'Lost/Theft' ? 'bg-red-100 text-red-800' :
                      'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {adj.adjType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                    -{adj.qty} {adj.uom}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">₹{adj.unitCost}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{(adj.totalValuation || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    <span className="font-mono text-[10px] font-bold text-slate-400 mr-1.5">{adj.reasonCode}</span>
                    {adj.remarks}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Stock Adjustment Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Icon name="Sliders" className="w-4 h-4 text-indigo-600" />
                Record Stock Adjustment / Wastage
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3">
              <Combobox
                label="Product / Item *"
                placeholder="Select product to adjust..."
                entityName="Product"
                options={allProducts.map(p => ({
                  label: p.name,
                  value: p.id,
                  sublabel: `Available Stock: ${p.availableStock} ${p.uom} (Avg ₹${p.avgRate})`
                }))}
                value={productId}
                onChange={(val) => {
                  setProductId(val);
                  const prod = allProducts.find(p => p.id === val);
                  if (prod) {
                    setUnitCost(prod.avgRate || 100);
                    const b = state.batches && state.batches[prod.id];
                    if (b && b.length > 0) setBatchNo(b[0].batchNo);
                  }
                }}
                error={errors.product}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Adjustment Type *"
                  options={['Damaged', 'Expired', 'Lost/Theft', 'Audit Reconciliation']}
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value)}
                />
                <Input
                  label="Batch Number"
                  placeholder="e.g. B010"
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={`Quantity to Deduct (${selectedProd ? selectedProd.uom : 'Units'}) *`}
                  type="number"
                  placeholder="0.00"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  error={errors.qty}
                />
                <Input
                  label="Unit Cost (₹)"
                  type="number"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  error={errors.rate}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Reason Code"
                  options={[
                    { value: 'DMG-01', label: 'DMG-01: Damaged in Warehouse / Handling' },
                    { value: 'EXP-01', label: 'EXP-01: Quality Degradation / Expired' },
                    { value: 'LST-01', label: 'LST-01: Shortage / Unaccounted Loss' },
                    { value: 'AUD-01', label: 'AUD-01: Physical Audit Stock Variance' }
                  ]}
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                />
                <Input
                  label="Detailed Remarks"
                  placeholder="Audit count remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              {selectedProd && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                  <p><strong>Current Stock:</strong> {selectedProd.availableStock} {selectedProd.uom}</p>
                  <p><strong>Estimated Loss:</strong> ₹{(parseFloat(qty || 0) * parseFloat(unitCost || 0)).toLocaleString('en-IN')}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSave}>Confirm Stock Adjustment</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

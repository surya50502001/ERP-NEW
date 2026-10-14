import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import { useERP } from '../context/ERPContext';

export default function QuickCreateProductModal({
  isOpen,
  onClose,
  initialName = '',
  onCreated // callback: (newProduct) => void
}) {
  const { addProduct } = useERP();
  const [name, setName] = useState(initialName);
  const [uom, setUom] = useState('KG');
  const [rate, setRate] = useState('250');
  const [openingStock, setOpeningStock] = useState('50');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setUom('KG');
      setRate('250');
      setOpeningStock('50');
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      const numRate = parseFloat(rate) || 200;
      const numStock = parseFloat(openingStock) || 0;

      const res = await addProduct({
        name: trimmed,
        uom,
        majorGroup: 'General',
        subGroup: 'Standard Goods',
        subSubGroup: 'Finished',
        purchaseRate: Math.round(numRate * 0.85),
        avgRate: numRate,
        openingStock: numStock,
        availableStock: numStock
      });

      if (res && res.success && res.product) {
        if (onCreated) {
          onCreated(res.product);
        }
        onClose();
      }
    } catch (err) {
      console.error('Failed to quick-create product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Icon name="PackagePlus" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Quick Create Product</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pre-populated from your search query</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <Input
              label="Product / Item Name"
              placeholder="e.g. Cotton Yarn 40s Combed"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="UOM (Unit)"
              options={['KG', 'MTR', 'PCS', 'LTR', 'BOX', 'BAG', 'ROLL']}
              value={uom}
              onChange={(e) => setUom(e.target.value)}
            />
            <Input
              label="Default Rate (₹)"
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
            />
            <Input
              label="Opening Stock"
              type="number"
              value={openingStock}
              onChange={(e) => setOpeningStock(e.target.value)}
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 text-[11px] flex items-start gap-2">
            <Icon name="Info" className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Saving will add this product to your Master catalog and automatically select it for your current line item.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting || !name.trim()}>
              <Icon name="Check" className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save & Select Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

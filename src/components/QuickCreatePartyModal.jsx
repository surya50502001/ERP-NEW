import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import { useERP } from '../context/ERPContext';

export default function QuickCreatePartyModal({
  isOpen,
  onClose,
  defaultType = 'Customer', // 'Customer' | 'Supplier' | 'Both'
  initialName = '',
  onCreated // callback: (newParty) => void
}) {
  const { addParty } = useERP();
  const [name, setName] = useState(initialName);
  const [partyType, setPartyType] = useState(defaultType);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setPartyType(defaultType || 'Customer');
      setPhone('');
      setCity('');
      setState('Tamil Nadu');
    }
  }, [isOpen, initialName, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      const res = await addParty({
        name: trimmed,
        partyType,
        type: partyType,
        phone: phone || '+91 98400 00000',
        contactNumber: phone || '+91 98400 00000',
        city: city || 'Chennai',
        location: `${city || 'Chennai'}, ${state}`,
        state,
        country: 'India'
      });

      if (res && res.success && res.party) {
        if (onCreated) {
          onCreated(res.party);
        }
        onClose();
      }
    } catch (err) {
      console.error('Failed to quick-create party:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleText = partyType === 'Supplier' 
    ? 'Quick Create Supplier' 
    : partyType === 'Both' 
      ? 'Quick Create Business Partner' 
      : 'Quick Create Customer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Icon name="UserPlus" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">{titleText}</h3>
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
              label={`${partyType === 'Supplier' ? 'Supplier' : 'Customer'} Name`}
              placeholder="e.g. Acme Industries Ltd"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Party Type"
              options={['Customer', 'Supplier', 'Both']}
              value={partyType}
              onChange={(e) => setPartyType(e.target.value)}
            />
            <Input
              label="Phone / Mobile"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City / Town"
              placeholder="e.g. Coimbatore"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Select
              label="State"
              options={['Tamil Nadu', 'Gujarat', 'Maharashtra', 'Karnataka', 'Telangana', 'Andhra Pradesh', 'Kerala', 'Delhi']}
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 text-[11px] flex items-start gap-2">
            <Icon name="Info" className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              Saving will immediately create this {partyType.toLowerCase()} in your ledger and auto-select it in your current form without losing your entered data.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting || !name.trim()}>
              <Icon name="Check" className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : `Save & Select ${partyType}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

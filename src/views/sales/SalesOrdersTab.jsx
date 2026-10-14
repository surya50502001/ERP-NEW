import React, { useState } from 'react';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Combobox from '../../components/Combobox';
import Drawer from '../../components/Drawer';
import { useERP } from '../../context/ERPContext';
import QuickCreatePartyModal from '../../components/QuickCreatePartyModal';
import QuickCreateProductModal from '../../components/QuickCreateProductModal';

export default function SalesOrdersTab({ onNavigate }) {
  const { state, createSalesOrder, createSalesInvoice } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Quick Create Modals
  const [quickPartyModal, setQuickPartyModal] = useState({ isOpen: false, name: '' });
  const [quickProductModal, setQuickProductModal] = useState({ isOpen: false, name: '', itemIndex: null });

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState([{ productId: '', qty: 50, rate: 0 }]);
  const [notes, setNotes] = useState('');

  const customers = (state.parties || []).filter(p => p.partyType === 'Customer' || p.partyType === 'Both');
  const orders = state.salesOrders || [];

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase();
    const matchesSearch = !q || 
      (o.customerName && o.customerName.toLowerCase().includes(q)) || 
      (o.id && o.id.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'All' || (o.status || 'Confirmed') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOrdersValue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const activeOrdersCount = orders.filter(o => o.status !== 'Cancelled').length;

  const handleSave = () => {
    const customer = customers.find(c => String(c.id) === String(customerId) || String(c.partyId) === String(customerId));
    if (!customer || items.length === 0) return;

    const formattedItems = items.map(it => {
      const prod = (state.products || []).find(p => String(p.id) === String(it.productId) || String(p.productId) === String(it.productId));
      const qty = parseFloat(it.qty || 1);
      const rate = parseFloat(it.rate || (prod?.avgRate * 1.15 || 250));
      return {
        productId: it.productId,
        productName: prod ? prod.name : 'Finished Good',
        qty,
        rate,
        amount: qty * rate
      };
    });

    const totalAmount = formattedItems.reduce((acc, i) => acc + i.amount, 0);

    createSalesOrder({
      customerId: customer.partyId || customer.id,
      customerName: customer.name,
      date,
      deliveryDate: deliveryDate || date,
      items: formattedItems,
      totalAmount,
      notes
    });

    setIsOpen(false);
    setCustomerId('');
    setItems([{ productId: '', qty: 50, rate: 0 }]);
    setNotes('');
  };

  const handleConvertToInvoice = async (order) => {
    if (!order) return;
    const subtotal = order.totalAmount || 0;
    const tax = Math.round(subtotal * 0.05);
    await createSalesInvoice({
      customerId: order.customerId,
      customerName: order.customerName,
      dueDate: order.deliveryDate || new Date().toISOString().split('T')[0],
      itemsCount: order.items?.length || 1,
      subtotal,
      tax,
      totalAmount: subtotal + tax,
      items: order.items || [],
      sourceOrderId: order.id
    });
  };

  return (
    <div className="space-y-5">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Order Pipeline</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">₹{totalOrdersValue.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-500">Cumulative confirmed bookings</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Sale Orders</span>
          <p className="text-2xl font-bold font-mono text-indigo-600 mt-1">{activeOrdersCount}</p>
          <span className="text-[11px] text-slate-500">Orders ready for fulfillment</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Orders Placed</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">{orders.length}</p>
          <span className="text-[11px] text-slate-500">Customer purchase intents</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="w-full sm:w-80">
          <Input
            icon="Search"
            placeholder="Search order ID, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['All', 'Confirmed', 'Dispatched', 'Completed'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <Button variant="primary" size="md" onClick={() => setIsOpen(true)}>
            <Icon name="Plus" className="w-4 h-4" />
            Create Sale Order
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Expected Delivery</th>
              <th className="py-3 px-4 text-center">Items</th>
              <th className="py-3 px-4 text-right">Order Value (₹)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-10 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Icon name="ShoppingCart" className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-600">No sales orders found</p>
                    <p className="text-xs text-slate-400">Click &quot;Create Sale Order&quot; to book a customer quotation or order.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold font-mono text-slate-900">{o.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{o.customerName}</td>
                  <td className="py-3 px-4 text-slate-500">{o.date}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{o.deliveryDate || '—'}</td>
                  <td className="py-3 px-4 text-center font-mono">{(o.items?.length || 1)} items</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{(o.totalAmount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {o.status || 'Confirmed'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => handleConvertToInvoice(o)}
                    >
                      Convert to Invoice
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Sale Order Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create Sale Order"
        subtitle="Book customer requirement / quotation before invoicing"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleSave}>Confirm & Book Order</Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <Combobox
            label="Customer"
            placeholder="Select customer..."
            entityName="Customer"
            options={customers.map(c => ({
              label: c.name,
              value: c.id ?? c.partyId,
              sublabel: c.phone || c.city || ''
            }))}
            value={customerId}
            onChange={(val) => setCustomerId(val)}
            onCreateNew={(term) => setQuickPartyModal({ isOpen: true, name: term })}
            createLabel="+ Create new customer"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Order Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label="Target Delivery Date"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>

          {/* Line Items */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 text-xs">Order Items</span>
                <p className="text-[10px] text-slate-400">Products, booked quantities and rates</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setItems([...items, { productId: '', qty: 50, rate: 0 }])}
              >
                + Add Item
              </Button>
            </div>

            <div className="border border-slate-200 rounded-xl bg-white shadow-2xs divide-y divide-slate-100 overflow-visible">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-50/80 rounded-t-xl text-[10px] font-bold text-slate-500 uppercase tracking-wider items-center">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">Product</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1 text-center"></div>
              </div>

              {/* Rows */}
              {items.map((it, idx) => {
                const qty = parseFloat(it.qty) || 0;
                const rate = parseFloat(it.rate) || 0;
                const lineTotal = Math.round(qty * rate);
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-slate-50/60 transition-colors">
                    <div className="col-span-1 text-center font-bold text-xs text-slate-400">{idx + 1}</div>
                    <div className="col-span-5">
                      <Combobox
                        placeholder="Select product..."
                        entityName="Product"
                        options={(state.products || []).map(p => ({
                          label: p.name,
                          value: p.id ?? p.productId,
                          sublabel: `Rate: ₹${Math.round(p.avgRate * 1.15 || 250)}`
                        }))}
                        value={it.productId}
                        onChange={(val) => {
                          const updated = [...items];
                          updated[idx].productId = val;
                          const prod = (state.products || []).find(p => String(p.id) === String(val) || String(p.productId) === String(val));
                          if (prod) updated[idx].rate = Math.round(prod.avgRate * 1.15 || 250);
                          setItems(updated);
                        }}
                        onCreateNew={(term) => setQuickProductModal({ isOpen: true, name: term, itemIndex: idx })}
                        createLabel="+ Create product"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Qty"
                        className="w-full text-right py-1.5 px-2 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                        value={it.qty}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].qty = e.target.value;
                          setItems(updated);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Rate"
                        className="w-full text-right py-1.5 px-2 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                        value={it.rate}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].rate = e.target.value;
                          setItems(updated);
                        }}
                      />
                    </div>
                    <div className="col-span-1 text-right font-mono font-bold text-xs text-slate-800 truncate" title={`₹${lineTotal}`}>
                      ₹{lineTotal}
                    </div>
                    <div className="col-span-1 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setItems(items.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Icon name="Trash2" className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Input
            label="Notes / Terms"
            placeholder="e.g. 50% advance on dispatch, delivery within 7 working days"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </Drawer>

      {/* Quick Create Modals */}
      <QuickCreatePartyModal
        isOpen={quickPartyModal.isOpen}
        onClose={() => setQuickPartyModal({ isOpen: false, name: '' })}
        defaultType="Customer"
        initialName={quickPartyModal.name}
        onCreated={(newParty) => {
          setCustomerId(newParty.id || newParty.partyId);
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
            const updated = [...items];
            if (updated[idx]) {
              updated[idx] = {
                ...updated[idx],
                productId: pid,
                rate: Math.round((newProd.avgRate || 250) * 1.15)
              };
              setItems(updated);
            }
          }
        }}
      />
    </div>
  );
}

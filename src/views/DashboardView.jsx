import React from 'react';
import Icon from '../components/Icon';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useERP } from '../context/ERPContext';

export default function DashboardView({ onNavigate }) {
  const { state, currentUser } = useERP();
  if (!state) return null;

  const totalPurchases = (state.purchaseOrders || []).reduce((acc, po) => acc + (po.totalAmount || 0), 0);
  const totalSales = (state.salesInvoices || []).reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const totalStockValue = (state.products || []).reduce((acc, p) => acc + (p.stockValue || 0), 0);

  const pendingPOs = (state.purchaseOrders || []).filter(p => p.status === 'Pending' || p.status === 'Partial');
  const lowStockProducts = (state.products || []).filter(p => {
    const stock = p.availableStock !== undefined ? p.availableStock : (p.currentStock || 0);
    const minLevel = p.minReorderLevel !== undefined ? p.minReorderLevel : 0;
    return stock <= minLevel;
  });
  const pendingInvoices = (state.salesInvoices || []).filter(i => i.status === 'Pending' || i.status === 'Pending Approval' || i.status === 'Overdue');

  const attentionItems = [];

  if (pendingPOs.length > 0) {
    const firstPO = pendingPOs[0];
    const extraCount = pendingPOs.length - 1;
    attentionItems.push({
      id: 'po',
      cardStyle: 'border-amber-200/60 bg-amber-50/40 hover:bg-amber-50',
      titleStyle: 'text-amber-900',
      subStyle: 'text-amber-700/80',
      iconStyle: 'text-amber-600',
      title: `${pendingPOs.length} Purchase Order${pendingPOs.length > 1 ? 's' : ''} awaiting GRN`,
      subtitle: extraCount > 0 
        ? `${firstPO.id} (${firstPO.supplierName || 'Supplier'}) & ${extraCount} more awaiting receiving`
        : `${firstPO.id} (${firstPO.supplierName || 'Supplier'}) awaiting receiving`,
      onClick: () => onNavigate('purchases')
    });
  }

  if (lowStockProducts.length > 0) {
    const firstProd = lowStockProducts[0];
    const extraCount = lowStockProducts.length - 1;
    attentionItems.push({
      id: 'stock',
      cardStyle: 'border-rose-200/60 bg-rose-50/40 hover:bg-rose-50',
      titleStyle: 'text-rose-900',
      subStyle: 'text-rose-700/80',
      iconStyle: 'text-rose-600',
      title: `${lowStockProducts.length} product${lowStockProducts.length > 1 ? 's' : ''} running low`,
      subtitle: extraCount > 0
        ? `${firstProd.name} at ${firstProd.availableStock} ${firstProd.uom || 'units'} & ${extraCount} more`
        : `${firstProd.name} at ${firstProd.availableStock} ${firstProd.uom || 'units'}`,
      onClick: () => onNavigate('inventory')
    });
  }

  if (pendingInvoices.length > 0) {
    const firstInv = pendingInvoices[0];
    const extraCount = pendingInvoices.length - 1;
    attentionItems.push({
      id: 'invoice',
      cardStyle: 'border-slate-200 bg-slate-50/60 hover:bg-slate-100',
      titleStyle: 'text-slate-900',
      subStyle: 'text-slate-600',
      iconStyle: 'text-slate-500',
      title: `${pendingInvoices.length} pending invoice${pendingInvoices.length > 1 ? 's' : ''}`,
      subtitle: extraCount > 0
        ? `${firstInv.id} (${firstInv.customerName || 'Customer'}) & ${extraCount} more awaiting action`
        : `${firstInv.id} (${firstInv.customerName || 'Customer'}) awaiting action`,
      onClick: () => onNavigate('sales')
    });
  }

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Good morning, {currentUser?.fullName || 'User'}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Operational overview for {currentUser?.companyName || 'your company'} • {todayStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => onNavigate('purchases')}>
            <Icon name="Plus" className="w-3.5 h-3.5" /> Create PO
          </Button>
          <Button size="sm" variant="primary" onClick={() => onNavigate('sales')}>
            <Icon name="Plus" className="w-3.5 h-3.5" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Purchases</span>
            <span className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Icon name="ShoppingBag" className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">₹{(totalPurchases / 1000).toFixed(2)}L</span>
            <span className="text-xs text-slate-400 font-semibold flex items-center">—</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales</span>
            <span className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Icon name="Receipt" className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">₹{(totalSales / 100000).toFixed(2)}L</span>
            <span className="text-xs text-slate-400 font-semibold flex items-center">—</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Value (FIFO)</span>
            <span className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Icon name="Package" className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">₹{(totalStockValue / 100000).toFixed(2)}L</span>
            <span className="text-xs text-slate-500 font-medium">{state.products?.length || 0} products active</span>
          </div>
        </div>
      </div>

      {/* Needs Attention */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Icon name="AlertCircle" className="w-4 h-4 text-amber-500" />
            Needs attention
          </h3>
          <span className="text-xs text-slate-400 font-medium">Action required</span>
        </div>

        {attentionItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {attentionItems.map(item => (
              <div
                key={item.id}
                onClick={item.onClick}
                className={`p-3 rounded-lg border transition-colors cursor-pointer flex items-center justify-between group ${item.cardStyle}`}
              >
                <div>
                  <p className={`font-semibold ${item.titleStyle}`}>{item.title}</p>
                  <p className={`${item.subStyle} mt-0.5`}>{item.subtitle}</p>
                </div>
                <Icon name="ArrowRight" className={`w-4 h-4 ${item.iconStyle} group-hover:translate-x-1 transition-transform`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50/60 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Icon name="CheckCircle" className="w-4 h-4 text-emerald-500" />
              <span>All operational checks normal. No urgent actions required.</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              All clear
            </span>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent activity</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time audit log of purchases, GRNs, and sales</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onNavigate('reports')}>View full log</Button>
        </div>

        <div className="divide-y divide-slate-100">
          {(state.recentActivities || []).map(act => (
            <div key={act.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold font-mono text-[11px] text-slate-800 border border-slate-200">
                  {act.code.split('-')[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono">{act.code}</span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="font-semibold text-slate-800">{act.party}</span>
                  </div>
                  <p className="text-slate-500 mt-0.5 text-[11px]">{act.detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={act.status} />
                <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">{act.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.DashboardView = DashboardView;

import React, { createContext, useContext, useState, useEffect, useReducer } from 'react';

const INITIAL_ERP_DATA = {
  parties: [],
  countries: [],
  states: [],
  itemTypes: [],
  brands: [],
  categories: { major: [], sub: [], subSub: [] },
  uoms: [],
  locations: [],
  products: [],
  batches: {},
  purchaseOrders: [],
  salesInvoices: [],
  directGrns: [],
  purchaseBills: [],
  paymentsOut: [],
  purchaseReturns: [],
  salesOrders: [],
  paymentsIn: [],
  salesReturns: [],
  recentActivities: [],
  notifications: []
};

const EMPTY_ERP_DATA = {
  parties: [],
  countries: [],
  states: [],
  itemTypes: [],
  brands: [],
  categories: { major: [], sub: [], subSub: [] },
  uoms: [],
  locations: [],
  products: [],
  batches: {},
  purchaseOrders: [],
  salesInvoices: [],
  directGrns: [],
  purchaseBills: [],
  paymentsOut: [],
  purchaseReturns: [],
  salesOrders: [],
  paymentsIn: [],
  salesReturns: [],
  recentActivities: [],
  notifications: []
};

window.ERP_MOCK_DATA = INITIAL_ERP_DATA;

export const ERPContext = createContext();
const STORAGE_KEY = 'PRIME_ERP_DATA_V2';

function loadInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        if (!parsed.itemTypes) parsed.itemTypes = INITIAL_ERP_DATA.itemTypes;
        if (!parsed.brands) parsed.brands = INITIAL_ERP_DATA.brands;
        if (!parsed.categories) parsed.categories = INITIAL_ERP_DATA.categories;
        if (!parsed.countries) parsed.countries = INITIAL_ERP_DATA.countries;
        if (!parsed.states) parsed.states = INITIAL_ERP_DATA.states;
        if (!parsed.purchaseBills) parsed.purchaseBills = [];
        if (!parsed.paymentsOut) parsed.paymentsOut = [];
        if (!parsed.purchaseReturns) parsed.purchaseReturns = [];
        if (!parsed.salesOrders) parsed.salesOrders = [];
        if (!parsed.paymentsIn) parsed.paymentsIn = [];
        if (!parsed.salesReturns) parsed.salesReturns = [];
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load localStorage:', e);
  }
  return INITIAL_ERP_DATA;
}

function saveToLocalStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save ERP state to localStorage:', e);
  }
  return data;
}

function erpReducer(state, action) {
  let newState = state;
  switch (action.type) {
    case 'RESET_DATA': {
      newState = JSON.parse(JSON.stringify(INITIAL_ERP_DATA));
      break;
    }
    case 'CLEAR_ALL_DATA': {
      newState = JSON.parse(JSON.stringify(EMPTY_ERP_DATA));
      break;
    }
    case 'ADD_PARTY': {
      const newParty = {
        id: action.payload.id || `PTY-${100 + (state.parties?.length || 0) + 1}`,
        status: 'Active',
        ...action.payload
      };
      newState = { ...state, parties: [newParty, ...(state.parties || [])] };
      break;
    }
    case 'UPDATE_PARTY': {
      const updated = action.payload;
      newState = {
        ...state,
        parties: (state.parties || []).map(p =>
          (p.id === updated.id || (updated.partyId && p.partyId === updated.partyId)) ? { ...p, ...updated } : p
        )
      };
      break;
    }
    case 'DELETE_PARTY': {
      newState = {
        ...state,
        parties: (state.parties || []).filter(p => p.id !== action.payload && p.partyId !== action.payload)
      };
      break;
    }
    case 'ADD_PRODUCT': {
      const newProd = {
        id: action.payload.id || `PRD-00${(state.products?.length || 0) + 1}`,
        availableStock: parseFloat(action.payload.openingStock || 0),
        minReorderLevel: parseFloat(action.payload.minReorderLevel || 50),
        avgRate: parseFloat(action.payload.purchaseRate || 100),
        stockValue: (parseFloat(action.payload.openingStock || 0) * parseFloat(action.payload.purchaseRate || 100)),
        status: 'Active',
        ...action.payload
      };

      const updatedBatches = { ...(state.batches || {}) };
      if (newProd.availableStock > 0) {
        updatedBatches[newProd.id] = [
          {
            batchNo: `B0${(state.products?.length || 0) + 10}`,
            receivedDate: new Date().toISOString().split('T')[0],
            initialQty: newProd.availableStock,
            availableQty: newProd.availableStock,
            rate: newProd.avgRate,
            grnId: 'INITIAL-STOCK'
          }
        ];
      }

      newState = {
        ...state,
        products: [newProd, ...(state.products || [])],
        batches: updatedBatches
      };
      break;
    }
    case 'UPDATE_PRODUCT': {
      const updated = action.payload;
      newState = {
        ...state,
        products: (state.products || []).map(p =>
          (p.id === updated.id || (updated.productId && p.productId === updated.productId)) ? { ...p, ...updated } : p
        )
      };
      break;
    }
    case 'DELETE_PRODUCT': {
      newState = {
        ...state,
        products: (state.products || []).filter(p => p.id !== action.payload && p.productId !== action.payload && p.name !== action.payload)
      };
      break;
    }
    case 'CREATE_PO': {
      const newPO = {
        id: `PO-${1040 + (state.purchaseOrders?.length || 0) + 1}`,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        grnId: null,
        activity: [
          { date: new Date().toLocaleString(), user: 'Admin', title: 'PO Created', detail: 'Purchase order issued.' }
        ],
        ...action.payload
      };
      newState = { ...state, purchaseOrders: [newPO, ...(state.purchaseOrders || [])] };
      break;
    }
    case 'RECEIVE_GOODS': {
      const { poId, receivedItems = [], notes, grnNumber: actionGrn, todayStr: actionDate } = action.payload;
      const grnNumber = actionGrn || `GRN-${1090 + Math.floor(Math.random() * 90) + 10}`;
      const todayStr = actionDate || new Date().toISOString().split('T')[0];

      const updatedPOs = (state.purchaseOrders || []).map(po => {
        if (String(po.id) === String(poId) || (po.poId && po.poId === poId)) {
          const updatedItems = (po.items || []).map(item => {
            const rec = receivedItems.find(r => String(r.productId) === String(item.productId));
            const recQty = rec ? parseFloat(rec.receivedQty || 0) : item.qty;
            return {
              ...item,
              receivedQty: (item.receivedQty || 0) + recQty
            };
          });

          const isAllReceived = updatedItems.every(i => (i.receivedQty || 0) >= (i.qty || 1));
          const isPartial = updatedItems.some(i => (i.receivedQty || 0) > 0) && !isAllReceived;

          return {
            ...po,
            status: isAllReceived ? 'Received' : (isPartial ? 'Partial' : po.status),
            grnId: grnNumber,
            grnDate: todayStr,
            items: updatedItems,
            activity: [
              {
                date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
                user: 'Store Manager',
                title: `Goods Received (${grnNumber})`,
                detail: notes || `Received items into inventory stock under ${grnNumber}.`
              },
              ...(po.activity || [])
            ]
          };
        }
        return po;
      });

      const newBatches = { ...(state.batches || {}) };
      const updatedProducts = (state.products || []).map(prod => {
        const rec = receivedItems.find(r => String(r.productId) === String(prod.id) || String(r.productId) === String(prod.productId));
        if (rec && parseFloat(rec.receivedQty || 0) > 0) {
          const addedQty = parseFloat(rec.receivedQty);
          const rate = parseFloat(rec.rate || prod.avgRate || prod.purchaseRate || 0);
          const batchNo = rec.batchNo || `B0${Math.floor(Math.random() * 900) + 100}`;

          const prodKey = prod.id || prod.productId;
          const prodBatches = newBatches[prodKey] ? [...newBatches[prodKey]] : [];
          prodBatches.push({
            batchNo,
            receivedDate: todayStr,
            initialQty: addedQty,
            availableQty: addedQty,
            rate: rate,
            grnId: grnNumber
          });
          newBatches[prodKey] = prodBatches;

          const currentStock = Number(prod.availableStock || 0);
          const newTotalStock = currentStock + addedQty;
          const currentVal = Number(prod.stockValue || (currentStock * (prod.avgRate || 0)));
          const newStockVal = currentVal + (addedQty * rate);
          const newAvgRate = newTotalStock > 0 ? (newStockVal / newTotalStock) : (prod.avgRate || rate);

          return {
            ...prod,
            availableStock: newTotalStock,
            stockValue: newStockVal,
            avgRate: Math.round(newAvgRate * 100) / 100,
            status: newTotalStock > (prod.minReorderLevel || 10) ? 'Active' : 'Low Stock'
          };
        }
        return prod;
      });

      const newAct = {
        id: `ACT-${Date.now()}`,
        code: grnNumber,
        party: action.payload.supplierName || 'Supplier',
        detail: `Stock Updated via ${grnNumber}`,
        time: 'Just now',
        type: 'grn',
        status: 'Success'
      };

      newState = {
        ...state,
        purchaseOrders: updatedPOs,
        products: updatedProducts,
        batches: newBatches,
        recentActivities: [newAct, ...(state.recentActivities || [])]
      };
      break;
    }
    case 'CREATE_DIRECT_GRN': {
      const { inwardType, supplierId, supplierName, dcNo, date, notes, items } = action.payload;
      const dgrnNumber = `DGRN-${1000 + (state.directGrns?.length || 0) + 1}`;
      const todayStr = date || new Date().toISOString().split('T')[0];

      const newBatches = { ...(state.batches || {}) };
      const updatedProducts = (state.products || []).map(prod => {
        const lineItem = (items || []).find(r => r.productId === prod.id);
        if (lineItem && parseFloat(lineItem.qty || 0) > 0) {
          const addedQty = parseFloat(lineItem.qty);
          const rate = parseFloat(lineItem.rate || prod.avgRate || 0);
          const batchNo = lineItem.batchNo || `DB${Math.floor(Math.random() * 900) + 100}`;

          const prodBatches = newBatches[prod.id] ? [...newBatches[prod.id]] : [];
          prodBatches.push({
            batchNo,
            receivedDate: todayStr,
            initialQty: addedQty,
            availableQty: addedQty,
            rate: rate,
            grnId: dgrnNumber,
            warehouse: lineItem.warehouse || 'Main Warehouse',
            inwardType: inwardType || 'Direct Inward'
          });
          newBatches[prod.id] = prodBatches;

          const newTotalStock = prod.availableStock + addedQty;
          const newStockVal = prod.stockValue + (addedQty * rate);
          const newAvgRate = newTotalStock > 0 ? (newStockVal / newTotalStock) : prod.avgRate;

          return {
            ...prod,
            availableStock: newTotalStock,
            stockValue: newStockVal,
            avgRate: Math.round(newAvgRate * 100) / 100,
            status: newTotalStock > prod.minReorderLevel ? 'Active' : 'Low Stock'
          };
        }
        return prod;
      });

      const totalValuation = (items || []).reduce((acc, it) => acc + (parseFloat(it.qty || 0) * parseFloat(it.rate || 0)), 0);

      const newDirectGrn = {
        id: dgrnNumber,
        inwardType: inwardType || 'Direct Purchase',
        supplierId: supplierId || null,
        supplierName: supplierName || 'Direct / Internal Stock',
        dcNo: dcNo || 'DC-DIRECT',
        date: todayStr,
        notes: notes || 'Direct stock inward without PO',
        items: items || [],
        totalItems: (items || []).length,
        totalQty: (items || []).reduce((acc, it) => acc + parseFloat(it.qty || 0), 0),
        totalValuation,
        status: 'Completed'
      };

      const newAct = {
        id: `ACT-${Date.now()}`,
        code: dgrnNumber,
        party: supplierName || 'Direct Stock Inward',
        detail: `${inwardType || 'Direct Inward'} • ${(items || []).length} items added to inventory stock`,
        time: 'Just now',
        type: 'grn',
        status: 'Success'
      };

      newState = {
        ...state,
        products: updatedProducts,
        batches: newBatches,
        directGrns: [newDirectGrn, ...(state.directGrns || [])],
        recentActivities: [newAct, ...(state.recentActivities || [])]
      };
      break;
    }
    case 'CREATE_PURCHASE_BILL': {
      const billData = action.payload;
      const billNumber = `PB-${1000 + (state.purchaseBills?.length || 0) + 1}`;
      const todayStr = billData.billDate || new Date().toISOString().split('T')[0];

      const newBill = {
        id: billNumber,
        billNo: billData.billNo || billNumber,
        billDate: todayStr,
        dueDate: billData.dueDate || '',
        supplierId: billData.supplierId,
        supplierName: billData.supplierName,
        items: billData.items || [],
        totalAmount: parseFloat(billData.totalAmount || 0),
        status: billData.status || 'Unpaid',
        notes: billData.notes || 'Vendor Purchase Bill'
      };

      const newBatches = { ...(state.batches || {}) };
      const updatedProducts = (state.products || []).map(prod => {
        const item = (billData.items || []).find(i => String(i.productId) === String(prod.id));
        if (item && parseFloat(item.qty || 0) > 0) {
          const qty = parseFloat(item.qty);
          const rate = parseFloat(item.rate || prod.avgRate || 0);
          const batchNo = `PB-${Math.floor(Math.random() * 900) + 100}`;
          const prodBatches = newBatches[prod.id] ? [...newBatches[prod.id]] : [];
          prodBatches.push({
            batchNo,
            receivedDate: todayStr,
            initialQty: qty,
            availableQty: qty,
            rate,
            grnId: billNumber
          });
          newBatches[prod.id] = prodBatches;
          const newStock = prod.availableStock + qty;
          const newStockVal = prod.stockValue + (qty * rate);
          return {
            ...prod,
            availableStock: newStock,
            stockValue: newStockVal,
            avgRate: newStock > 0 ? Math.round((newStockVal / newStock) * 100) / 100 : prod.avgRate
          };
        }
        return prod;
      });

      const newAct = {
        id: `ACT-${Date.now()}`,
        code: billNumber,
        party: billData.supplierName,
        detail: `Purchase Bill recorded • ₹${(billData.totalAmount || 0).toLocaleString('en-IN')}`,
        time: 'Just now',
        type: 'grn',
        status: 'Success'
      };

      newState = {
        ...state,
        products: updatedProducts,
        batches: newBatches,
        purchaseBills: [newBill, ...(state.purchaseBills || [])],
        recentActivities: [newAct, ...(state.recentActivities || [])]
      };
      break;
    }
    case 'RECORD_PAYMENT_OUT': {
      const payData = action.payload;
      const payId = `PAYO-${2000 + (state.paymentsOut?.length || 0) + 1}`;
      const newPayment = {
        id: payId,
        date: payData.date || new Date().toISOString().split('T')[0],
        supplierId: payData.supplierId,
        supplierName: payData.supplierName,
        amount: parseFloat(payData.amount || 0),
        paymentMode: payData.paymentMode || 'Bank Transfer',
        referenceNo: payData.referenceNo || `UTR-${Date.now().toString().slice(-6)}`,
        billRef: payData.billRef || '',
        notes: payData.notes || '',
        status: 'Completed'
      };

      const updatedBills = (state.purchaseBills || []).map(b => {
        if (b.id === payData.billRef || b.billNo === payData.billRef) {
          return { ...b, status: 'Paid' };
        }
        return b;
      });

      const newAct = {
        id: `ACT-${Date.now()}`,
        code: payId,
        party: payData.supplierName,
        detail: `Payment - Out • ₹${(payData.amount || 0).toLocaleString('en-IN')} via ${payData.paymentMode}`,
        time: 'Just now',
        type: 'payment',
        status: 'Success'
      };

      newState = {
        ...state,
        purchaseBills: updatedBills,
        paymentsOut: [newPayment, ...(state.paymentsOut || [])],
        recentActivities: [newAct, ...(state.recentActivities || [])]
      };
      break;
    }
    case 'CREATE_PURCHASE_RETURN': {
      const retData = action.payload;
      const dnNumber = `DN-${3000 + (state.purchaseReturns?.length || 0) + 1}`;
      const newReturn = {
        id: dnNumber,
        date: retData.date || new Date().toISOString().split('T')[0],
        supplierId: retData.supplierId,
        supplierName: retData.supplierName,
        items: retData.items || [],
        returnAmount: parseFloat(retData.returnAmount || 0),
        reason: retData.reason || 'Defective / Quality Return',
        status: 'Adjusted'
      };

      const updatedProducts = (state.products || []).map(prod => {
        const item = (retData.items || []).find(i => String(i.productId) === String(prod.id));
        if (item && parseFloat(item.qty || 0) > 0) {
          const retQty = parseFloat(item.qty);
          const newStock = Math.max(0, prod.availableStock - retQty);
          return { ...prod, availableStock: newStock };
        }
        return prod;
      });

      const newAct = {
        id: `ACT-${Date.now()}`,
        code: dnNumber,
        party: retData.supplierName,
        detail: `Debit Note Created • ₹${(retData.returnAmount || 0).toLocaleString('en-IN')}`,
        time: 'Just now',
        type: 'return',
        status: 'Warning'
      };

      newState = {
        ...state,
        products: updatedProducts,
        purchaseReturns: [newReturn, ...(state.purchaseReturns || [])],
        recentActivities: [newAct, ...(state.recentActivities || [])]
      };
      break;
    }
    case 'RECORD_PAYMENT_IN': {
      const payData = action.payload;
      const payId = `PAYI-${4000 + (state.paymentsIn?.length || 0) + 1}`;
      const newPayment = {
        id: payId,
        date: payData.date || new Date().toISOString().split('T')[0],
        customerId: payData.customerId,
        customerName: payData.customerName,
        amount: parseFloat(payData.amount || 0),
        paymentMode: payData.paymentMode || 'Bank Transfer',
        referenceNo: payData.referenceNo || `UPI-${Date.now().toString().slice(-6)}`,
        invoiceRef: payData.invoiceRef || '',
        notes: payData.notes || '',
        status: 'Received'
      };

      const updatedInvoices = (state.salesInvoices || []).map(inv => {
        if (inv.id === payData.invoiceRef || inv.invoiceNumber === payData.invoiceRef) {
          return { ...inv, status: 'Paid' };
        }
        return inv;
      });

      const newAct = {
        id: `ACT-${Date.now()}`,
        code: payId,
        party: payData.customerName,
        detail: `Payment - In Received • ₹${(payData.amount || 0).toLocaleString('en-IN')}`,
        time: 'Just now',
        type: 'payment',
        status: 'Success'
      };

      newState = {
        ...state,
        salesInvoices: updatedInvoices,
        paymentsIn: [newPayment, ...(state.paymentsIn || [])],
        recentActivities: [newAct, ...(state.recentActivities || [])]
      };
      break;
    }
    case 'CREATE_SALES_RETURN': {
      const retData = action.payload;
      const cnNumber = `CN-${5000 + (state.salesReturns?.length || 0) + 1}`;
      const newReturn = {
        id: cnNumber,
        date: retData.date || new Date().toISOString().split('T')[0],
        customerId: retData.customerId,
        customerName: retData.customerName,
        items: retData.items || [],
        refundAmount: parseFloat(retData.refundAmount || 0),
        reason: retData.reason || 'Customer Return',
        status: 'Credited'
      };

      const updatedProducts = (state.products || []).map(prod => {
        const item = (retData.items || []).find(i => String(i.productId) === String(prod.id));
        if (item && parseFloat(item.qty || 0) > 0) {
          const addStock = parseFloat(item.qty);
          return { ...prod, availableStock: prod.availableStock + addStock };
        }
        return prod;
      });

      const newAct = {
        id: `ACT-${Date.now()}`,
        code: cnNumber,
        party: retData.customerName,
        detail: `Credit Note Created • ₹${(retData.refundAmount || 0).toLocaleString('en-IN')}`,
        time: 'Just now',
        type: 'return',
        status: 'Warning'
      };

      newState = {
        ...state,
        products: updatedProducts,
        salesReturns: [newReturn, ...(state.salesReturns || [])],
        recentActivities: [newAct, ...(state.recentActivities || [])]
      };
      break;
    }
    case 'CREATE_SALES_ORDER': {
      const orderData = action.payload;
      const soNumber = `SO-${6000 + (state.salesOrders?.length || 0) + 1}`;
      const newOrder = {
        id: soNumber,
        date: orderData.date || new Date().toISOString().split('T')[0],
        deliveryDate: orderData.deliveryDate || '',
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        items: orderData.items || [],
        totalAmount: parseFloat(orderData.totalAmount || 0),
        status: 'Confirmed'
      };

      const newAct = {
        id: `ACT-${Date.now()}`,
        code: soNumber,
        party: orderData.customerName,
        detail: `Sales Order Placed • ₹${(orderData.totalAmount || 0).toLocaleString('en-IN')}`,
        time: 'Just now',
        type: 'invoice',
        status: 'Success'
      };

      newState = {
        ...state,
        salesOrders: [newOrder, ...(state.salesOrders || [])],
        recentActivities: [newAct, ...(state.recentActivities || [])]
      };
      break;
    }
    case 'CREATE_INVOICE': {
      const invData = action.payload;
      const invNumber = `INV-${2080 + (state.salesInvoices?.length || 0) + 1}`;
      const todayStr = new Date().toISOString().split('T')[0];

      const newBatches = { ...(state.batches || {}) };
      const updatedProducts = (state.products || []).map(prod => {
        const invItem = (invData.items || []).find(i => i.productId === prod.id);
        if (invItem && parseFloat(invItem.qty || 0) > 0) {
          let qtyToDeduct = parseFloat(invItem.qty);
          const prodBatches = newBatches[prod.id] ? [...newBatches[prod.id]] : [];

          const updatedProdBatches = prodBatches.map(b => {
            if (qtyToDeduct <= 0) return b;
            if (b.availableQty <= 0) return b;

            if (b.availableQty >= qtyToDeduct) {
              const updated = { ...b, availableQty: b.availableQty - qtyToDeduct };
              qtyToDeduct = 0;
              return updated;
            } else {
              qtyToDeduct -= b.availableQty;
              return { ...b, availableQty: 0 };
            }
          });

          newBatches[prod.id] = updatedProdBatches;
          const newStock = Math.max(0, prod.availableStock - parseFloat(invItem.qty));
          const newStockVal = newStock * prod.avgRate;

          return {
            ...prod,
            availableStock: newStock,
            stockValue: newStockVal,
            status: newStock > prod.minReorderLevel ? 'Active' : 'Low Stock'
          };
        }
        return prod;
      });

      const newInvoice = {
        id: invNumber,
        date: todayStr,
        status: 'Pending Approval',
        ...invData
      };

      const newAct = {
        id: `ACT-${Date.now()}`,
        code: invNumber,
        party: invData.customerName || 'Customer',
        detail: `₹${(invData.totalAmount || 0).toLocaleString('en-IN')} • Submitted for Approval`,
        time: 'Just now',
        type: 'sales',
        status: 'Pending Approval'
      };

      newState = {
        ...state,
        salesInvoices: [newInvoice, ...(state.salesInvoices || [])],
        products: updatedProducts,
        batches: newBatches,
        recentActivities: [newAct, ...(state.recentActivities || [])]
      };
      break;
    }
    case 'APPROVE_INVOICE': {
      const { invoiceId, approverName } = action.payload;
      const idStr = String(invoiceId).toLowerCase();

      const updatedInvoices = (state.salesInvoices || []).map(inv => {
        if (String(inv.id).toLowerCase() === idStr) {
          return { ...inv, status: 'Approved' };
        }
        return inv;
      });

      const targetInv = (state.salesInvoices || []).find(inv => String(inv.id).toLowerCase() === idStr);
      const newAct = {
        id: `ACT-${Date.now()}`,
        code: String(invoiceId),
        party: targetInv ? targetInv.customerName : 'Customer',
        detail: `Invoice ${invoiceId} Approved by ${approverName || 'Store Manager'}`,
        time: 'Just now',
        type: 'sales',
        status: 'Approved'
      };

      newState = {
        ...state,
        salesInvoices: updatedInvoices,
        recentActivities: [newAct, ...(state.recentActivities || [])]
      };
      break;
    }
    case 'REJECT_INVOICE': {
      const { invoiceId, reason } = action.payload;
      const idStr = String(invoiceId).toLowerCase();

      const updatedInvoices = (state.salesInvoices || []).map(inv => {
        if (String(inv.id).toLowerCase() === idStr) {
          return { ...inv, status: 'Rejected', rejectionReason: reason };
        }
        return inv;
      });

      const targetInv = (state.salesInvoices || []).find(inv => String(inv.id).toLowerCase() === idStr);
      const newAct = {
        id: `ACT-${Date.now()}`,
        code: String(invoiceId),
        party: targetInv ? targetInv.customerName : 'Customer',
        detail: `Invoice ${invoiceId} Rejected: ${reason || 'Not approved'}`,
        time: 'Just now',
        type: 'sales',
        status: 'Rejected'
      };

      newState = {
        ...state,
        salesInvoices: updatedInvoices,
        recentActivities: [newAct, ...(state.recentActivities || [])]
      };
      break;
    }
    case 'ADD_ITEM_TYPE': {
      const newItemType = {
        id: action.payload.id || `IT-${Date.now()}`,
        itemTypeId: action.payload.itemTypeId || `IT-${Date.now()}`,
        name: action.payload.name,
        code: action.payload.code || action.payload.name.substring(0, 3).toUpperCase()
      };
      newState = { ...state, itemTypes: [...(state.itemTypes || []), newItemType] };
      break;
    }
    case 'UPDATE_ITEM_TYPE': {
      const updated = action.payload;
      newState = {
        ...state,
        itemTypes: (state.itemTypes || []).map(it => (it.id === updated.id || it.itemTypeId === updated.itemTypeId) ? { ...it, ...updated } : it)
      };
      break;
    }
    case 'DELETE_ITEM_TYPE': {
      newState = {
        ...state,
        itemTypes: (state.itemTypes || []).filter(it => it.id !== action.payload && it.name !== action.payload && it.itemTypeId !== action.payload)
      };
      break;
    }
    case 'ADD_BRAND': {
      const newBrand = {
        id: action.payload.id || `BR-${Date.now()}`,
        brandId: action.payload.brandId || `BR-${Date.now()}`,
        name: action.payload.name
      };
      newState = { ...state, brands: [...(state.brands || []), newBrand] };
      break;
    }
    case 'UPDATE_BRAND': {
      const updated = action.payload;
      newState = {
        ...state,
        brands: (state.brands || []).map(b => (b.id === updated.id || b.brandId === updated.brandId) ? { ...b, ...updated } : b)
      };
      break;
    }
    case 'DELETE_BRAND': {
      newState = {
        ...state,
        brands: (state.brands || []).filter(b => b.id !== action.payload && b.name !== action.payload && b.brandId !== action.payload)
      };
      break;
    }
    case 'ADD_MAJOR_CATEGORY': {
      const newMaj = {
        id: action.payload.id || `MJ-${Date.now()}`,
        majorId: action.payload.majorId || String(action.payload.id || Date.now()),
        name: action.payload.name,
        code: action.payload.code || action.payload.name.substring(0, 3).toUpperCase()
      };
      const cat = state.categories || { major: [], sub: [], subSub: [] };
      newState = {
        ...state,
        categories: {
          ...cat,
          major: [...(cat.major || []), newMaj]
        }
      };
      break;
    }
    case 'UPDATE_MAJOR_CATEGORY': {
      const updated = action.payload;
      const cat = state.categories || { major: [], sub: [], subSub: [] };
      newState = {
        ...state,
        categories: {
          ...cat,
          major: (cat.major || []).map(m => (m.id === updated.id || m.majorId === updated.majorId) ? { ...m, ...updated } : m)
        }
      };
      break;
    }
    case 'DELETE_MAJOR_CATEGORY': {
      const cat = state.categories || { major: [], sub: [], subSub: [] };
      newState = {
        ...state,
        categories: {
          ...cat,
          major: (cat.major || []).filter(m => m.id !== action.payload && m.majorId !== action.payload && m.name !== action.payload)
        }
      };
      break;
    }
    case 'ADD_SUB_CATEGORY': {
      const newSub = {
        id: action.payload.id || `SB-${Date.now()}`,
        subId: action.payload.subId || String(action.payload.id || Date.now()),
        majorId: String(action.payload.majorId),
        name: action.payload.name
      };
      const cat = state.categories || { major: [], sub: [], subSub: [] };
      newState = {
        ...state,
        categories: {
          ...cat,
          sub: [...(cat.sub || []), newSub]
        }
      };
      break;
    }
    case 'UPDATE_SUB_CATEGORY': {
      const updated = action.payload;
      const cat = state.categories || { major: [], sub: [], subSub: [] };
      newState = {
        ...state,
        categories: {
          ...cat,
          sub: (cat.sub || []).map(s => (s.id === updated.id || s.subId === updated.subId) ? { ...s, ...updated } : s)
        }
      };
      break;
    }
    case 'DELETE_SUB_CATEGORY': {
      const cat = state.categories || { major: [], sub: [], subSub: [] };
      newState = {
        ...state,
        categories: {
          ...cat,
          sub: (cat.sub || []).filter(s => s.id !== action.payload && s.subId !== action.payload && s.name !== action.payload)
        }
      };
      break;
    }
    case 'ADD_SUB_SUB_CATEGORY': {
      const newSubSub = {
        id: action.payload.id || `SSB-${Date.now()}`,
        subSubId: action.payload.subSubId || String(action.payload.id || Date.now()),
        subId: String(action.payload.subId),
        name: action.payload.name
      };
      const cat = state.categories || { major: [], sub: [], subSub: [] };
      newState = {
        ...state,
        categories: {
          ...cat,
          subSub: [...(cat.subSub || []), newSubSub]
        }
      };
      break;
    }
    case 'UPDATE_SUB_SUB_CATEGORY': {
      const updated = action.payload;
      const cat = state.categories || { major: [], sub: [], subSub: [] };
      newState = {
        ...state,
        categories: {
          ...cat,
          subSub: (cat.subSub || []).map(ss => (ss.id === updated.id || ss.subSubId === updated.subSubId) ? { ...ss, ...updated } : ss)
        }
      };
      break;
    }
    case 'DELETE_SUB_SUB_CATEGORY': {
      const cat = state.categories || { major: [], sub: [], subSub: [] };
      newState = {
        ...state,
        categories: {
          ...cat,
          subSub: (cat.subSub || []).filter(ss => ss.id !== action.payload && ss.subSubId !== action.payload && ss.name !== action.payload)
        }
      };
      break;
    }
    case 'ADD_UOM': {
      const newUom = {
        id: action.payload.id || `UOM-${Date.now()}`,
        uomId: action.payload.uomId || `UOM-${Date.now()}`,
        code: action.payload.code.toUpperCase(),
        name: action.payload.name,
        decimalPlaces: parseInt(action.payload.decimalPlaces || 0, 10)
      };
      newState = { ...state, uoms: [...(state.uoms || []), newUom] };
      break;
    }
    case 'UPDATE_UOM': {
      const updated = action.payload;
      newState = {
        ...state,
        uoms: (state.uoms || []).map(u => (u.id === updated.id || u.uomId === updated.uomId) ? { ...u, ...updated } : u)
      };
      break;
    }
    case 'DELETE_UOM': {
      newState = {
        ...state,
        uoms: (state.uoms || []).filter(u => u.id !== action.payload && u.code !== action.payload && u.uomId !== action.payload)
      };
      break;
    }
    case 'ADD_COUNTRY': {
      const newCountry = {
        id: action.payload.id || Date.now(),
        countryId: action.payload.countryId || `CTRY${((state.countries?.length || 0) + 1).toString().padStart(4, '0')}`,
        code: (action.payload.code || '').toUpperCase(),
        name: action.payload.name,
        currencyCode: (action.payload.currencyCode || 'INR').toUpperCase(),
        phoneCode: action.payload.phoneCode || '+91',
        status: action.payload.status || 'Active'
      };
      newState = { ...state, countries: [...(state.countries || []), newCountry] };
      break;
    }
    case 'UPDATE_COUNTRY': {
      const updated = action.payload;
      newState = {
        ...state,
        countries: (state.countries || []).map(c =>
          (c.id === updated.id || (updated.countryId && c.countryId === updated.countryId) || (updated.code && c.code === updated.code))
            ? { ...c, ...updated }
            : c
        )
      };
      break;
    }
    case 'DELETE_COUNTRY': {
      newState = {
        ...state,
        countries: (state.countries || []).filter(c => c.id !== action.payload && c.countryId !== action.payload && c.code !== action.payload)
      };
      break;
    }
    case 'ADD_STATE': {
      const newStateObj = {
        id: action.payload.id || Date.now(),
        stateId: action.payload.stateId || `ST${((state.states?.length || 0) + 1).toString().padStart(4, '0')}`,
        code: (action.payload.code || '').toUpperCase(),
        name: action.payload.name,
        countryCode: (action.payload.countryCode || 'IND').toUpperCase(),
        gstStateCode: action.payload.gstStateCode || '',
        status: action.payload.status || 'Active'
      };
      newState = { ...state, states: [...(state.states || []), newStateObj] };
      break;
    }
    case 'UPDATE_STATE': {
      const updated = action.payload;
      newState = {
        ...state,
        states: (state.states || []).map(s =>
          (s.id === updated.id || (updated.stateId && s.stateId === updated.stateId) || (updated.code && s.code === updated.code))
            ? { ...s, ...updated }
            : s
        )
      };
      break;
    }
    case 'DELETE_STATE': {
      newState = {
        ...state,
        states: (state.states || []).filter(s => s.id !== action.payload && s.stateId !== action.payload && s.code !== action.payload)
      };
      break;
    }
    case 'SET_ALL_DATA': {
      newState = { ...state, ...action.payload };
      break;
    }
    default:
      return state;
  }

  return saveToLocalStorage(newState);
}

export function ERPProvider({ children }) {
  const [state, dispatch] = useReducer(erpReducer, null, loadInitialState);
  const [toasts, setToasts] = useState([]);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navResetCounter, setNavResetCounter] = useState(0);

  const triggerNavReset = (tabId) => {
    setNavResetCounter(prev => prev + 1);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (title, message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('PRIME_ERP_USER');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const safeParse = async (r) => {
    const text = await r.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch (e) {
      return {};
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchAllData = async () => {
      try {
        const safeJson = async (r) => {
          if (!r.ok) return [];
          const text = await r.text();
          try {
            return text ? JSON.parse(text) : [];
          } catch (e) {
            return [];
          }
        };

        const [parties, products, brands, uoms, itemTypes, pos, invs, countries, states, majorCats, subCats, subSubCats, grns, purchaseBills, paymentsOut, purchaseReturns, paymentsIn, salesReturns, salesOrders] = await Promise.all([
          fetch('/api/parties').then(safeJson),
          fetch('/api/products').then(safeJson),
          fetch('/api/brands').then(safeJson),
          fetch('/api/uoms').then(safeJson),
          fetch('/api/itemtypes').then(safeJson),
          fetch('/api/purchaseorders').then(safeJson),
          fetch('/api/salesinvoices').then(safeJson),
          fetch('/api/countries').then(safeJson),
          fetch('/api/states').then(safeJson),
          fetch('/api/categories/major').then(safeJson),
          fetch('/api/categories/sub').then(safeJson),
          fetch('/api/categories/subsub').then(safeJson),
          fetch('/api/grn').then(safeJson),
          fetch('/api/purchasebills').then(safeJson),
          fetch('/api/paymentsout').then(safeJson),
          fetch('/api/purchasereturns').then(safeJson),
          fetch('/api/paymentsin').then(safeJson),
          fetch('/api/salesreturns').then(safeJson),
          fetch('/api/salesorders').then(safeJson)
        ]);

        // Merge backend POs with any locally received GRN data so receipt status is never lost
        const mergedPOs = (pos || []).map(p => {
          const localPO = (state.purchaseOrders || []).find(lp => String(lp.id) === String(p.id) || (lp.poId && lp.poId === p.poId));
          return {
            ...p,
            status: (p.status && p.status !== 'Pending') ? p.status : (localPO?.status || p.status || 'Pending'),
            grnId: p.grnId || localPO?.grnId || null,
            grnDate: p.grnDate || localPO?.grnDate || null,
            totalAmount: p.totalAmount || localPO?.totalAmount || 0,
            itemsCount: p.itemsCount || localPO?.itemsCount || p.items?.length || 0,
            activity: p.activity && p.activity.length > 0 ? p.activity : (localPO?.activity || [])
          };
        });

        // Format backend GRN responses
        const backendGrns = (grns && Array.isArray(grns) && grns.length > 0)
          ? grns.map(g => ({
              id: `${g.recSr}-${g.recYr}-${String(g.recNo).padStart(6, '0')}`,
              inwardType: g.remarks || 'Direct Stock Inward',
              supplierName: g.supplierName || g.slCode || 'Supplier',
              dcNo: g.suppInvNo || 'DC-001',
              date: g.recDt ? String(g.recDt).split('T')[0] : new Date().toISOString().split('T')[0],
              totalItems: 1,
              totalQty: g.totQty || 0,
              totalValuation: g.totVal || 0,
              status: g.status === 'A' ? 'Completed' : 'Cancelled',
              storeLoc: g.storeLoc || 'MAIN'
            }))
          : [];

        // Combine backend and local directGrns without duplicates
        const existingGrnIds = new Set(backendGrns.map(g => g.id));
        const combinedDirectGrns = [
          ...backendGrns,
          ...(state.directGrns || []).filter(lg => !existingGrnIds.has(lg.id))
        ];

        dispatch({
          type: 'SET_ALL_DATA',
          payload: {
            parties: parties || [],
            products: products || [],
            brands: brands || [],
            uoms: uoms || [],
            itemTypes: itemTypes || [],
            purchaseOrders: mergedPOs,
            directGrns: combinedDirectGrns,
            salesInvoices: invs || [],
            purchaseBills: (purchaseBills && purchaseBills.length > 0) ? purchaseBills : (state.purchaseBills || []),
            paymentsOut: (paymentsOut && paymentsOut.length > 0) ? paymentsOut : (state.paymentsOut || []),
            purchaseReturns: (purchaseReturns && purchaseReturns.length > 0) ? purchaseReturns : (state.purchaseReturns || []),
            paymentsIn: (paymentsIn && paymentsIn.length > 0) ? paymentsIn : (state.paymentsIn || []),
            salesReturns: (salesReturns && salesReturns.length > 0) ? salesReturns : (state.salesReturns || []),
            salesOrders: (salesOrders && salesOrders.length > 0) ? salesOrders : (state.salesOrders || []),
            countries: (countries && countries.length > 0) ? countries : [],
            states: (states && states.length > 0) ? states : [],
            categories: {
              major: (majorCats && majorCats.length > 0) ? majorCats : (state.categories?.major || []),
              sub: (subCats && subCats.length > 0) ? subCats : (state.categories?.sub || []),
              subSub: (subSubCats && subSubCats.length > 0) ? subSubCats : (state.categories?.subSub || [])
            }
          }
        });
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    };
    
    fetchAllData();
  }, [currentUser]);

  const loginUser = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      
      if (!res.ok) {
        throw new Error(data.message || `Login failed (Status ${res.status})`);
      }
      
      const userObj = { id: data.id, fullName: data.fullName, companyName: data.companyName || 'My Enterprise', email: data.email, role: data.role, token: data.token };
      setCurrentUser(userObj);
      localStorage.setItem('PRIME_ERP_USER', JSON.stringify(userObj));
      localStorage.setItem('PRIME_ERP_TOKEN', data.token);
      showToast('Welcome back', `Logged in as ${data.fullName}`);
      return { success: true, user: userObj };
    } catch (err) {
      showToast('Login Failed', err.message || 'Server error during login.', 'error');
      throw err;
    }
  };

  const registerUser = async (fullName, email, password, role, companyName) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role, companyName })
      });
      
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      
      if (!res.ok) {
        throw new Error(data.message || `Registration failed (Status ${res.status})`);
      }

      const userObj = { id: data.id, fullName: data.fullName, companyName: data.companyName || companyName || 'My Enterprise', email: data.email, role: data.role, token: data.token };
      setCurrentUser(userObj);
      localStorage.setItem('PRIME_ERP_USER', JSON.stringify(userObj));
      localStorage.setItem('PRIME_ERP_TOKEN', data.token);
      showToast('Account Created', `Welcome to PRIME ERP, ${data.fullName}!`);
      return { success: true, user: userObj };
    } catch (err) {
      showToast('Registration Failed', err.message || 'Server error during registration.', 'error');
      throw err;
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('PRIME_ERP_USER');
    localStorage.removeItem('PRIME_ERP_TOKEN');
    showToast('Logged Out', 'You have been safely logged out.');
  };

  const addParty = async (partyData) => {
    let saved = null;
    try {
      const res = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partyData)
      });
      if (res.ok) {
        saved = await safeParse(res);
      }
    } catch (err) {
      console.warn('Backend party sync note:', err);
    }

    if (!saved || (!saved.id && !saved.partyId)) {
      const pId = `PTY-${100 + (state.parties?.length || 0) + 1}`;
      saved = {
        id: pId,
        partyId: pId,
        status: 'Active',
        ...partyData
      };
    }

    dispatch({ type: 'ADD_PARTY', payload: saved });
    showToast('Party Created', `${saved.name || partyData.name} created.`, 'success');
    return { success: true, party: saved };
  };

  const updateParty = async (id, partyData) => {
    try {
      const res = await fetch(`/api/parties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partyData)
      });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'UPDATE_PARTY', payload: { id, ...partyData } });
      showToast('Party Updated', `Party details updated successfully.`);
      return { success: true };
    } catch (err) {
      showToast('Update Failed', 'Could not update party on server.', 'error');
      return { success: false };
    }
  };

  const deleteParty = async (id) => {
    try {
      const res = await fetch(`/api/parties/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'DELETE_PARTY', payload: id });
      showToast('Party Removed', 'Party deleted.');
    } catch (err) {
      showToast('Deletion Failed', 'Could not delete party on server.', 'error');
    }
  };

  const addProduct = async (productData) => {
    let saved = null;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        saved = await safeParse(res);
      }
    } catch (err) {
      console.warn('Backend product sync note:', err);
    }

    if (!saved || (!saved.id && !saved.productId)) {
      const pCount = (state.products?.length || 0) + 1;
      const pid = `PRD-${String(pCount).padStart(3, '0')}`;
      saved = {
        id: pid,
        productId: pid,
        status: 'Active',
        availableStock: parseFloat(productData.openingStock || productData.availableStock || 0),
        avgRate: parseFloat(productData.purchaseRate || productData.avgRate || 200),
        stockValue: parseFloat(productData.openingStock || 0) * parseFloat(productData.purchaseRate || 200),
        ...productData
      };
    }

    dispatch({ type: 'ADD_PRODUCT', payload: saved });
    showToast('Product Created', `${saved.name || productData.name} created.`, 'success');
    return { success: true, product: saved };
  };

  const updateProduct = async (id, productData) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'UPDATE_PRODUCT', payload: { id, ...productData } });
      showToast('Product Updated', `Item master updated successfully.`);
      return { success: true };
    } catch (err) {
      showToast('Update Failed', 'Could not update item on server.', 'error');
      return { success: false };
    }
  };

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
      showToast('Product Removed', 'Product deleted.');
      return { success: true };
    } catch (err) {
      showToast('Deletion Failed', 'Could not delete product on server.', 'error');
      return { success: false };
    }
  };

  const createPurchaseOrder = async (poData) => {
    try {
      const res = await fetch('/api/purchaseorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poData)
      });
      if (!res.ok) {
        const errData = await safeParse(res);
        const errMsg = errData.message || (errData.errors ? Object.entries(errData.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ') : null) || errData.title || 'Server rejected purchase order.';
        showToast('PO Creation Failed', errMsg, 'error');
        return { success: false };
      }
      const saved = await safeParse(res);
      dispatch({ type: 'CREATE_PO', payload: { ...poData, ...saved } });
      showToast('PO Generated', `Purchase Order ${saved.poId || poData.poId || ''} generated successfully.`, 'success');
      return { success: true, po: saved };
    } catch (err) {
      showToast('PO Creation Failed', err.message || 'Server error.', 'error');
      return { success: false };
    }
  };

  const receiveGoods = async (poId, receivedItems, notes, supplierName) => {
    const grnNumber = `GRN-${1090 + Math.floor(Math.random() * 90) + 10}`;
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Dispatch locally so UI immediately updates
    dispatch({
      type: 'RECEIVE_GOODS',
      payload: { poId, receivedItems, notes, supplierName, grnNumber, todayStr }
    });
    showToast('Goods Received', `Stock & FIFO batch ledger updated. (${grnNumber})`, 'success');

    // 2. Persist to backend database via PUT /api/purchaseorders/{id}
    try {
      const targetPO = (state.purchaseOrders || []).find(p => String(p.id) === String(poId) || (p.poId && p.poId === poId));
      const isAllReceived = (receivedItems || []).every(i => (parseFloat(i.receivedQty || 0) >= parseFloat(i.qty || 0)));
      const status = isAllReceived ? 'Received' : 'Partial';

      await fetch(`/api/purchaseorders/${poId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          grnId: grnNumber,
          items: (receivedItems || []).map(r => ({
            productId: parseInt(r.productId) || 0,
            receivedQty: parseFloat(r.receivedQty || 0)
          }))
        })
      });

      // 3. Post to /api/grn so backend receipt records are created
      const dcNumber = notes && notes.includes('DC:')
        ? notes.split('DC:')[1].replace(')', '').trim()
        : `DC-${Date.now().toString().slice(-4)}`;

      const grnPayload = {
        compCode: '01',
        slCode: targetPO ? (targetPO.supplierId || targetPO.supplierName || 'SUPPLIER') : (supplierName || 'SUPPLIER'),
        suppInvNo: dcNumber,
        storeLoc: 'MAIN',
        remarks: notes || `Received against PO ${poId}`,
        items: (receivedItems || []).map(r => ({
          itemCode: String(r.productId),
          recQty: parseFloat(r.receivedQty || 0),
          recRate: parseFloat(r.rate || 0),
          batchNo: r.batchNo || null
        }))
      };

      await fetch('/api/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grnPayload)
      });
    } catch (err) {
      console.warn('Backend GRN persist error:', err);
    }
  };

  const createDirectGRN = async (grnData) => {
    try {
      const payload = {
        slCode: grnData.supplierId || 'DIRECT',
        suppInvNo: grnData.dcNo || 'DIRECT-DC',
        storeLoc: 'MAIN',
        remarks: grnData.notes || grnData.inwardType || 'Direct Stock Inward',
        items: (grnData.items || []).map(i => ({
          itemCode: i.productId,
          recQty: parseFloat(i.qty || 0),
          recRate: parseFloat(i.rate || 0),
          batchNo: i.batchNo || null
        }))
      };
      fetch('/api/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch (e) {}

    dispatch({ type: 'CREATE_DIRECT_GRN', payload: grnData });
    showToast('Direct GRN Posted', `Direct stock inward completed & inventory updated.`, 'success');
    return { success: true };
  };

  const createSalesInvoice = async (invData) => {
    try {
      const res = await fetch('/api/salesinvoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invData)
      });
      if (!res.ok) {
        const errData = await safeParse(res);
        showToast('Invoice Creation Failed', errData.message || 'Server error.', 'error');
        return { success: false };
      }
      const saved = await safeParse(res);
      dispatch({ type: 'CREATE_INVOICE', payload: saved });
      showToast('Invoice Submitted', `Invoice ${saved.invoiceId || ''} created and submitted for approval.`, 'success');
      return { success: true, invoice: saved };
    } catch (err) {
      showToast('Invoice Creation Failed', err.message || 'Server error.', 'error');
      return { success: false };
    }
  };

  const approveInvoice = async (invoiceId, approverName = 'Store Manager') => {
    try {
      const res = await fetch(`/api/salesinvoices/${invoiceId}/approve`, { method: 'PUT' });
      if (!res.ok) {
        const errData = await safeParse(res).catch(() => ({}));
        showToast('Approval Failed', errData.message || 'Failed to approve invoice.', 'error');
        return { success: false };
      }
    } catch (e) {}
    dispatch({ type: 'APPROVE_INVOICE', payload: { invoiceId, approverName } });
    showToast('Invoice Approved', `Invoice ${invoiceId} has been approved.`, 'success');
    return { success: true };
  };

  const rejectInvoice = async (invoiceId, reason = 'Spec mismatch') => {
    try {
      await fetch(`/api/salesinvoices/${invoiceId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reason)
      });
    } catch (e) {}
    dispatch({ type: 'REJECT_INVOICE', payload: { invoiceId, reason } });
    showToast('Invoice Rejected', `Invoice ${invoiceId} rejected.`, 'error');
    return { success: true };
  };

  const addItemType = async (name, code) => {
    try {
      const res = await fetch('/api/itemtypes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code })
      });
      if (!res.ok) throw new Error('Server error');
      const saved = await safeParse(res);
      dispatch({ type: 'ADD_ITEM_TYPE', payload: saved });
      showToast('Item Type Created', `Item type "${name}" created.`);
      return { success: true, itemType: saved };
    } catch (err) {
      showToast('Creation Failed', 'Could not create item type on server.', 'error');
      return { success: false };
    }
  };

  const updateItemType = async (id, data) => {
    try {
      const res = await fetch(`/api/itemtypes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Server error');
      const saved = await safeParse(res);
      dispatch({ type: 'UPDATE_ITEM_TYPE', payload: { id, ...data } });
      showToast('Item Type Updated', `Item type updated successfully.`);
      return { success: true };
    } catch (err) {
      showToast('Update Failed', 'Could not update item type on server.', 'error');
      return { success: false };
    }
  };

  const deleteItemType = async (id) => {
    try {
      const res = await fetch(`/api/itemtypes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'DELETE_ITEM_TYPE', payload: id });
      showToast('Item Type Removed', `Item type deleted.`);
    } catch (err) {
      showToast('Deletion Failed', 'Could not delete item type on server.', 'error');
    }
  };

  const addBrand = async (name) => {
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error('Server error');
      const saved = await safeParse(res);
      dispatch({ type: 'ADD_BRAND', payload: saved });
      showToast('Brand Created', `Brand "${name}" created.`);
      return { success: true, brand: saved };
    } catch (err) {
      showToast('Creation Failed', 'Could not create brand on server.', 'error');
      return { success: false };
    }
  };

  const updateBrand = async (id, data) => {
    try {
      const res = await fetch(`/api/brands/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'UPDATE_BRAND', payload: { id, ...data } });
      showToast('Brand Updated', `Brand updated successfully.`);
      return { success: true };
    } catch (err) {
      showToast('Update Failed', 'Could not update brand on server.', 'error');
      return { success: false };
    }
  };

  const deleteBrand = async (id) => {
    try {
      const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'DELETE_BRAND', payload: id });
      showToast('Brand Removed', `Brand deleted.`);
    } catch (err) {
      showToast('Deletion Failed', 'Could not delete brand on server.', 'error');
    }
  };

  const addMajorCategory = async (name, code) => {
    try {
      const res = await fetch('/api/categories/major', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code })
      });
      if (!res.ok) throw new Error('Server error');
      const saved = await safeParse(res);
      dispatch({ type: 'ADD_MAJOR_CATEGORY', payload: saved });
      showToast('Major Group Created', `Major group "${name}" created.`);
      return { success: true, category: saved };
    } catch (err) {
      showToast('Creation Failed', 'Could not create category on server.', 'error');
      return { success: false };
    }
  };

  const updateMajorCategory = async (id, data) => {
    try {
      const res = await fetch(`/api/categories/major/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'UPDATE_MAJOR_CATEGORY', payload: { id, ...data } });
      showToast('Major Group Updated', `Major group updated.`);
      return { success: true };
    } catch (err) {
      showToast('Update Failed', 'Could not update category on server.', 'error');
      return { success: false };
    }
  };

  const deleteMajorCategory = async (id) => {
    try {
      const res = await fetch(`/api/categories/major/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'DELETE_MAJOR_CATEGORY', payload: id });
      showToast('Major Group Removed', `Major group deleted.`);
    } catch (err) {
      showToast('Deletion Failed', 'Could not delete category on server.', 'error');
    }
  };

  const addSubCategory = async (majorId, name) => {
    try {
      const res = await fetch('/api/categories/sub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ majorId: String(majorId), name })
      });
      if (!res.ok) throw new Error('Server error');
      const saved = await safeParse(res);
      dispatch({ type: 'ADD_SUB_CATEGORY', payload: saved });
      showToast('Sub Group Created', `Sub group "${name}" created.`);
      return { success: true, category: saved };
    } catch (err) {
      showToast('Creation Failed', 'Could not create category on server.', 'error');
      return { success: false };
    }
  };

  const updateSubCategory = async (id, data) => {
    try {
      const res = await fetch(`/api/categories/sub/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'UPDATE_SUB_CATEGORY', payload: { id, ...data } });
      showToast('Sub Group Updated', `Sub group updated.`);
      return { success: true };
    } catch (err) {
      showToast('Update Failed', 'Could not update category on server.', 'error');
      return { success: false };
    }
  };

  const deleteSubCategory = async (id) => {
    try {
      const res = await fetch(`/api/categories/sub/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'DELETE_SUB_CATEGORY', payload: id });
      showToast('Sub Group Removed', `Sub group deleted.`);
    } catch (err) {
      showToast('Deletion Failed', 'Could not delete category on server.', 'error');
    }
  };

  const addSubSubCategory = async (subId, name) => {
    try {
      const res = await fetch('/api/categories/subsub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subId: String(subId), name })
      });
      if (!res.ok) throw new Error('Server error');
      const saved = await safeParse(res);
      dispatch({ type: 'ADD_SUB_SUB_CATEGORY', payload: saved });
      showToast('Sub-Sub Group Created', `Sub-Sub group "${name}" created.`);
      return { success: true, category: saved };
    } catch (err) {
      showToast('Creation Failed', 'Could not create category on server.', 'error');
      return { success: false };
    }
  };

  const updateSubSubCategory = async (id, data) => {
    try {
      const res = await fetch(`/api/categories/subsub/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'UPDATE_SUB_SUB_CATEGORY', payload: { id, ...data } });
      showToast('Sub-Sub Group Updated', `Sub-Sub group updated.`);
      return { success: true };
    } catch (err) {
      showToast('Update Failed', 'Could not update category on server.', 'error');
      return { success: false };
    }
  };

  const deleteSubSubCategory = async (id) => {
    try {
      const res = await fetch(`/api/categories/subsub/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'DELETE_SUB_SUB_CATEGORY', payload: id });
      showToast('Sub-Sub Group Removed', `Sub-Sub group deleted.`);
    } catch (err) {
      showToast('Deletion Failed', 'Could not delete category on server.', 'error');
    }
  };

  const addUOM = async (code, name, decimalPlaces = 2) => {
    try {
      const res = await fetch('/api/uoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, decimalPlaces })
      });
      if (!res.ok) throw new Error('Server error');
      const saved = await safeParse(res);
      dispatch({ type: 'ADD_UOM', payload: saved });
      showToast('UOM Created', `Unit "${code}" created.`);
      return { success: true, uom: saved };
    } catch (err) {
      showToast('Creation Failed', 'Could not create UOM on server.', 'error');
      return { success: false };
    }
  };

  const updateUOM = async (id, data) => {
    try {
      const res = await fetch(`/api/uoms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'UPDATE_UOM', payload: { id, ...data } });
      showToast('UOM Updated', `UOM updated successfully.`);
      return { success: true };
    } catch (err) {
      showToast('Update Failed', 'Could not update UOM on server.', 'error');
      return { success: false };
    }
  };

  const deleteUOM = async (id) => {
    try {
      const res = await fetch(`/api/uoms/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'DELETE_UOM', payload: id });
      showToast('UOM Removed', `UOM deleted.`);
    } catch (err) {
      showToast('Deletion Failed', 'Could not delete UOM on server.', 'error');
    }
  };

  const addCountry = async (countryData) => {
    try {
      const res = await fetch('/api/countries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(countryData)
      });
      if (!res.ok) throw new Error('Server error');
      const saved = await safeParse(res);
      dispatch({ type: 'ADD_COUNTRY', payload: saved });
      showToast('Country Created', `Country "${saved.name || countryData.name}" created.`);
      return { success: true, country: saved };
    } catch (err) {
      showToast('Creation Failed', 'Could not create country on server.', 'error');
      return { success: false };
    }
  };

  const updateCountry = async (id, countryData) => {
    try {
      const res = await fetch(`/api/countries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(countryData)
      });
      if (!res.ok) throw new Error('Server error');
      const saved = await safeParse(res);
      dispatch({ type: 'UPDATE_COUNTRY', payload: { id, ...countryData } });
      showToast('Country Updated', `Country "${countryData.name || 'details'}" updated.`);
      return { success: true };
    } catch (err) {
      showToast('Update Failed', 'Could not update country on server.', 'error');
      return { success: false };
    }
  };

  const deleteCountry = async (id) => {
    try {
      const res = await fetch(`/api/countries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'DELETE_COUNTRY', payload: id });
      showToast('Country Removed', 'Country deleted.');
    } catch (err) {
      showToast('Deletion Failed', 'Could not delete country on server.', 'error');
    }
  };

  const addState = async (stateData) => {
    try {
      const res = await fetch('/api/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateData)
      });
      if (!res.ok) throw new Error('Server error');
      const saved = await safeParse(res);
      dispatch({ type: 'ADD_STATE', payload: saved });
      showToast('State Created', `State "${saved.name || stateData.name}" created.`);
      return { success: true, state: saved };
    } catch (err) {
      showToast('Creation Failed', 'Could not create state on server.', 'error');
      return { success: false };
    }
  };

  const updateState = async (id, stateData) => {
    try {
      const res = await fetch(`/api/states/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateData)
      });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'UPDATE_STATE', payload: { id, ...stateData } });
      showToast('State Updated', `State "${stateData.name || 'details'}" updated.`);
      return { success: true };
    } catch (err) {
      showToast('Update Failed', 'Could not update state on server.', 'error');
      return { success: false };
    }
  };

  const deleteState = async (id) => {
    try {
      const res = await fetch(`/api/states/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Server error');
      dispatch({ type: 'DELETE_STATE', payload: id });
      showToast('State Removed', 'State deleted.');
    } catch (err) {
      showToast('Deletion Failed', 'Could not delete state on server.', 'error');
    }
  };

  const createPurchaseBill = async (billData) => {
    dispatch({ type: 'CREATE_PURCHASE_BILL', payload: billData });
    try {
      await fetch('/api/purchasebills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });
    } catch (e) {
      console.warn('Backend sync note for purchase bill:', e);
    }
    showToast('Purchase Bill Created', `Bill "${billData.billNo || 'New'}" recorded successfully.`);
    return { success: true };
  };

  const recordPaymentOut = async (paymentData) => {
    dispatch({ type: 'RECORD_PAYMENT_OUT', payload: paymentData });
    try {
      await fetch('/api/paymentsout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
    } catch (e) {
      console.warn('Backend sync note for payment out:', e);
    }
    showToast('Payment - Out Recorded', `₹${(paymentData.amount || 0).toLocaleString('en-IN')} paid to ${paymentData.supplierName}.`);
    return { success: true };
  };

  const createPurchaseReturn = async (returnData) => {
    dispatch({ type: 'CREATE_PURCHASE_RETURN', payload: returnData });
    try {
      await fetch('/api/purchasereturns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData)
      });
    } catch (e) {
      console.warn('Backend sync note for purchase return:', e);
    }
    showToast('Debit Note Created', `Purchase return for ${returnData.supplierName} recorded.`);
    return { success: true };
  };

  const recordPaymentIn = async (paymentData) => {
    dispatch({ type: 'RECORD_PAYMENT_IN', payload: paymentData });
    try {
      await fetch('/api/paymentsin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
    } catch (e) {
      console.warn('Backend sync note for payment in:', e);
    }
    showToast('Payment - In Received', `₹${(paymentData.amount || 0).toLocaleString('en-IN')} received from ${paymentData.customerName}.`);
    return { success: true };
  };

  const createSalesReturn = async (returnData) => {
    dispatch({ type: 'CREATE_SALES_RETURN', payload: returnData });
    try {
      await fetch('/api/salesreturns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData)
      });
    } catch (e) {
      console.warn('Backend sync note for sales return:', e);
    }
    showToast('Credit Note Created', `Sales return from ${returnData.customerName} credited.`);
    return { success: true };
  };

  const createSalesOrder = async (orderData) => {
    dispatch({ type: 'CREATE_SALES_ORDER', payload: orderData });
    try {
      await fetch('/api/salesorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
    } catch (e) {
      console.warn('Backend sync note for sales order:', e);
    }
    showToast('Sales Order Created', `Order for ${orderData.customerName} confirmed.`);
    return { success: true };
  };

  const clearAllData = () => {
    dispatch({ type: 'CLEAR_ALL_DATA' });
    showToast('Data Cleared', 'All mock records cleared.');
  };

  const value = {
    state,
    currentUser,
    loginUser,
    registerUser,
    logoutUser,
    toasts,
    showToast,
    removeToast,
    navResetCounter,
    triggerNavReset,
    addParty,
    updateParty,
    deleteParty,
    addProduct,
    updateProduct,
    deleteProduct,
    createPurchaseOrder,
    receiveGoods,
    createDirectGRN,
    createPurchaseBill,
    recordPaymentOut,
    createPurchaseReturn,
    createSalesInvoice,
    recordPaymentIn,
    createSalesReturn,
    createSalesOrder,
    approveInvoice,
    rejectInvoice,
    addItemType,
    updateItemType,
    deleteItemType,
    addBrand,
    updateBrand,
    deleteBrand,
    addMajorCategory,
    updateMajorCategory,
    deleteMajorCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    addSubSubCategory,
    updateSubSubCategory,
    deleteSubSubCategory,
    addUOM,
    updateUOM,
    deleteUOM,
    addCountry,
    updateCountry,
    deleteCountry,
    addState,
    updateState,
    deleteState,
    clearAllData,
    isCmdPaletteOpen,
    setIsCmdPaletteOpen,
    sidebarCollapsed,
    setSidebarCollapsed
  };

  return <ERPContext.Provider value={value}>{children}</ERPContext.Provider>;
}

export function useERP() {
  return useContext(ERPContext);
}

window.useERP = useERP;

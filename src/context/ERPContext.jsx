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
      const { poId, receivedItems, notes } = action.payload;
      const grnNumber = `GRN-${1090 + Math.floor(Math.random() * 90) + 10}`;
      const todayStr = new Date().toISOString().split('T')[0];

      const updatedPOs = (state.purchaseOrders || []).map(po => {
        if (po.id === poId) {
          const updatedItems = (po.items || []).map(item => {
            const rec = receivedItems.find(r => r.productId === item.productId);
            const recQty = rec ? parseFloat(rec.receivedQty || 0) : item.qty;
            return {
              ...item,
              receivedQty: (item.receivedQty || 0) + recQty
            };
          });

          const isAllReceived = updatedItems.every(i => (i.receivedQty || 0) >= i.qty);
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
        const rec = receivedItems.find(r => r.productId === prod.id);
        if (rec && parseFloat(rec.receivedQty || 0) > 0) {
          const addedQty = parseFloat(rec.receivedQty);
          const rate = parseFloat(rec.rate || prod.avgRate);
          const batchNo = rec.batchNo || `B0${Math.floor(Math.random() * 900) + 100}`;

          const prodBatches = newBatches[prod.id] ? [...newBatches[prod.id]] : [];
          prodBatches.push({
            batchNo,
            receivedDate: todayStr,
            initialQty: addedQty,
            availableQty: addedQty,
            rate: rate,
            grnId: grnNumber
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

        const [parties, products, brands, uoms, itemTypes, pos, invs, countries, states, majorCats, subCats, subSubCats] = await Promise.all([
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
          fetch('/api/categories/subsub').then(safeJson)
        ]);

        dispatch({
          type: 'SET_ALL_DATA',
          payload: {
            parties: parties || [],
            products: products || [],
            brands: brands || [],
            uoms: uoms || [],
            itemTypes: itemTypes || [],
            purchaseOrders: pos || [],
            salesInvoices: invs || [],
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
    try {
      const res = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partyData)
      });
      if (!res.ok) {
        const errData = await safeParse(res);
        showToast('Creation Failed', errData.message || 'Server error.', 'error');
        return { success: false };
      }
      const saved = await safeParse(res);
      dispatch({ type: 'ADD_PARTY', payload: saved });
      showToast('Party Created', `${saved.name || partyData.name} created.`, 'success');
      return { success: true, party: saved };
    } catch (err) {
      showToast('Creation Failed', err.message || 'Server error.', 'error');
      return { success: false };
    }
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
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (!res.ok) {
        const errData = await safeParse(res);
        showToast('Creation Failed', errData.message || 'Server error.', 'error');
        return { success: false };
      }
      const saved = await safeParse(res);
      dispatch({ type: 'ADD_PRODUCT', payload: saved });
      showToast('Product Created', `${saved.name || productData.name} created.`, 'success');
      return { success: true, product: saved };
    } catch (err) {
      showToast('Creation Failed', err.message || 'Server error.', 'error');
      return { success: false };
    }
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
        showToast('PO Creation Failed', errData.message || 'Server rejected purchase order.', 'error');
        return { success: false };
      }
      const saved = await safeParse(res);
      dispatch({ type: 'CREATE_PO', payload: saved });
      showToast('PO Generated', `Purchase Order ${saved.poId || ''} generated successfully.`, 'success');
      return { success: true, po: saved };
    } catch (err) {
      showToast('PO Creation Failed', err.message || 'Server error.', 'error');
      return { success: false };
    }
  };

  const receiveGoods = (poId, receivedItems, notes, supplierName) => {
    dispatch({ type: 'RECEIVE_GOODS', payload: { poId, receivedItems, notes, supplierName } });
    showToast('Goods Received', `Stock & FIFO batch ledger updated.`, 'success');
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
    createSalesInvoice,
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

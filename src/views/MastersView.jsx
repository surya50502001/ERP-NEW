import React, { useState } from 'react';
import Icon from '../components/Icon';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import StatusBadge from '../components/StatusBadge';
import { useERP } from '../context/ERPContext';

export default function MastersView({ onNavigate }) {
  const {
    state,
    addParty,
    addProduct,
    addItemType,
    deleteItemType,
    addBrand,
    deleteBrand,
    addMajorCategory,
    deleteMajorCategory,
    addSubCategory,
    deleteSubCategory,
    addSubSubCategory,
    deleteSubSubCategory,
    addUOM,
    deleteUOM,
    addCountry,
    deleteCountry,
    addState,
    deleteState,
    clearAllData
  } = useERP();

  const [subTab, setSubTab] = useState('overview');

  // Forms open state
  const [isPartyFormOpen, setIsPartyFormOpen] = useState(false);
  const [isProdFormOpen, setIsProdFormOpen] = useState(false);

  // Quick Add Modal State
  const [quickAddType, setQuickAddType] = useState(null); // 'itemType' | 'major' | 'sub' | 'subSub' | 'brand' | 'uom' | 'country' | 'state'
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddCode, setQuickAddCode] = useState('');
  const [quickAddExtra1, setQuickAddExtra1] = useState('');
  const [quickAddExtra2, setQuickAddExtra2] = useState('');

  // Party Form State (with 4 Address Columns)
  const [partySearch, setPartySearch] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState('All');
  const [partyName, setPartyName] = useState('');
  const [partyType, setPartyType] = useState('Supplier');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyEmail, setPartyEmail] = useState('');
  const [partyGstin, setPartyGstin] = useState('');
  const [partyPan, setPartyPan] = useState('');
  const [partyAddr1, setPartyAddr1] = useState('');
  const [partyAddr2, setPartyAddr2] = useState('');
  const [partyAddr3, setPartyAddr3] = useState('');
  const [partyAddr4, setPartyAddr4] = useState('');
  const [partyCity, setPartyCity] = useState('');
  const [partyCountry, setPartyCountry] = useState('India');
  const [partyState, setPartyState] = useState('Tamil Nadu');
  const [partyPincode, setPartyPincode] = useState('');

  // Country Master creation states
  const [countrySearch, setCountrySearch] = useState('');
  const [newCountryName, setNewCountryName] = useState('');
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryCurrency, setNewCountryCurrency] = useState('INR');
  const [newCountryPhone, setNewCountryPhone] = useState('+91');

  // State Master creation states
  const [stateSearch, setStateSearch] = useState('');
  const [stateCountryFilter, setStateCountryFilter] = useState('All');
  const [newStateName, setNewStateName] = useState('');
  const [newStateCode, setNewStateCode] = useState('');
  const [newStateCountry, setNewStateCountry] = useState('IND');
  const [newStateGstCode, setNewStateGstCode] = useState('');

  // Product Form State (Tabbed)
  const [prodSearch, setProdSearch] = useState('');
  const [prodModalTab, setProdModalTab] = useState('general');

  const [pItemType, setPItemType] = useState('');
  const [pName, setPName] = useState('');
  const [pBrand, setPBrand] = useState('');
  const [pMajor, setPMajor] = useState('');
  const [pSub, setPSub] = useState('');
  const [pSubSub, setPSubSub] = useState('');
  const [pUom, setPUom] = useState('');
  const [pStock, setPStock] = useState(100);
  const [pRate, setPRate] = useState(200);
  const [pSellingRate, setPSellingRate] = useState(240);
  const [pMinLevel, setPMinLevel] = useState(50);
  const [pHsn, setPHsn] = useState('52051210');
  const [pGst, setPGst] = useState(5);
  const [pDesc, setPDesc] = useState('');

  // Standalone Master creation states
  const [newItemTypeName, setNewItemTypeName] = useState('');
  const [newItemTypeCode, setNewItemTypeCode] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newMajName, setNewMajName] = useState('');
  const [newMajCode, setNewMajCode] = useState('');
  const [newSubMajId, setNewSubMajId] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubSubSubId, setNewSubSubSubId] = useState('');
  const [newSubSubName, setNewSubSubName] = useState('');
  const [newUomCode, setNewUomCode] = useState('');
  const [newUomName, setNewUomName] = useState('');
  const [newUomDecimals, setNewUomDecimals] = useState(2);

  if (!state) return null;

  // Defaults for product dropdowns if blank
  const itemTypeOptions = (state.itemTypes || []).map(it => typeof it === 'string' ? it : it.name);
  const brandOptions = (state.brands || []).map(b => typeof b === 'string' ? b : b.name);
  const majorOptions = (state.categories?.major || []).map(m => m.name);

  const selectedMajorObj = (state.categories?.major || []).find(m => m.name === (pMajor || majorOptions[0]));
  const subOptions = (state.categories?.sub || [])
    .filter(s => !selectedMajorObj || s.majorId === selectedMajorObj.id)
    .map(s => s.name);

  const selectedSubObj = (state.categories?.sub || []).find(s => s.name === (pSub || subOptions[0]));
  const subSubOptions = (state.categories?.subSub || [])
    .filter(ss => !selectedSubObj || ss.subId === selectedSubObj.id)
    .map(ss => ss.name);

  const uomOptions = (state.uoms || []).map(u => u.code);

  // Dynamic Country and State lists
  const countryList = (state.countries && state.countries.length > 0)
    ? state.countries
    : [
        { id: 1, countryId: 'CTRY0001', code: 'IND', name: 'India', currencyCode: 'INR', phoneCode: '+91', status: 'Active' },
        { id: 2, countryId: 'CTRY0002', code: 'USA', name: 'United States', currencyCode: 'USD', phoneCode: '+1', status: 'Active' },
        { id: 3, countryId: 'CTRY0003', code: 'UAE', name: 'United Arab Emirates', currencyCode: 'AED', phoneCode: '+971', status: 'Active' },
        { id: 4, countryId: 'CTRY0004', code: 'GBR', name: 'United Kingdom', currencyCode: 'GBP', phoneCode: '+44', status: 'Active' },
        { id: 5, countryId: 'CTRY0005', code: 'SGP', name: 'Singapore', currencyCode: 'SGD', phoneCode: '+65', status: 'Active' }
      ];

  const stateList = (state.states && state.states.length > 0)
    ? state.states
    : [
        { id: 1, stateId: 'ST0001', code: 'TN', name: 'Tamil Nadu', countryCode: 'IND', gstStateCode: '33', status: 'Active' },
        { id: 2, stateId: 'ST0002', code: 'KA', name: 'Karnataka', countryCode: 'IND', gstStateCode: '29', status: 'Active' },
        { id: 3, stateId: 'ST0003', code: 'MH', name: 'Maharashtra', countryCode: 'IND', gstStateCode: '27', status: 'Active' },
        { id: 4, stateId: 'ST0004', code: 'DL', name: 'Delhi', countryCode: 'IND', gstStateCode: '07', status: 'Active' },
        { id: 5, stateId: 'ST0005', code: 'KL', name: 'Kerala', countryCode: 'IND', gstStateCode: '32', status: 'Active' },
        { id: 6, stateId: 'ST0006', code: 'AP', name: 'Andhra Pradesh', countryCode: 'IND', gstStateCode: '37', status: 'Active' },
        { id: 7, stateId: 'ST0007', code: 'TG', name: 'Telangana', countryCode: 'IND', gstStateCode: '36', status: 'Active' },
        { id: 8, stateId: 'ST0008', code: 'GJ', name: 'Gujarat', countryCode: 'IND', gstStateCode: '24', status: 'Active' },
        { id: 9, stateId: 'ST0009', code: 'WB', name: 'West Bengal', countryCode: 'IND', gstStateCode: '19', status: 'Active' },
        { id: 10, stateId: 'ST0010', code: 'UP', name: 'Uttar Pradesh', countryCode: 'IND', gstStateCode: '09', status: 'Active' },
        { id: 11, stateId: 'ST0011', code: 'CA', name: 'California', countryCode: 'USA', gstStateCode: '', status: 'Active' },
        { id: 12, stateId: 'ST0012', code: 'TX', name: 'Texas', countryCode: 'USA', gstStateCode: '', status: 'Active' },
        { id: 13, stateId: 'ST0013', code: 'DXB', name: 'Dubai', countryCode: 'UAE', gstStateCode: '', status: 'Active' }
      ];

  const countryNameOptions = countryList.map(c => c.name);
  const selectedCountryObj = countryList.find(c => c.name.toLowerCase() === (partyCountry || 'india').toLowerCase() || c.code.toLowerCase() === (partyCountry || 'ind').toLowerCase());
  const selectedCountryCode = selectedCountryObj ? selectedCountryObj.code : 'IND';

  const filteredStatesForParty = stateList
    .filter(s => s.countryCode.toLowerCase() === selectedCountryCode.toLowerCase())
    .map(s => s.name);

  const stateOptionsForParty = filteredStatesForParty.length > 0
    ? filteredStatesForParty
    : stateList.map(s => s.name);

  const handleSaveParty = () => {
    if (!partyName) return;
    const formattedAddress = [partyAddr1, partyAddr2, partyAddr3, partyAddr4].filter(Boolean).join(', ');

    addParty({
      name: partyName,
      partyType: partyType,
      contactNumber: partyPhone || '+91 98420 12345',
      phone: partyPhone || '+91 98420 12345',
      email: partyEmail || `${partyName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
      gstin: partyGstin || '33AAACS1234F1Z9',
      pan: partyPan || 'AAACS1234F',
      addr1: partyAddr1 || 'Door No. 12/4',
      addr2: partyAddr2 || 'Main Road',
      addr3: partyAddr3 || 'Industrial Estate',
      addr4: partyAddr4 || 'District Zone',
      address: formattedAddress || 'Door No. 12/4, Main Road, Industrial Estate',
      city: partyCity || 'Coimbatore',
      state: partyState || 'Tamil Nadu',
      country: partyCountry || 'India',
      pincode: partyPincode || '641001',
      location: `${partyCity || 'Coimbatore'}, ${partyState || 'Tamil Nadu'}`
    });

    setIsPartyFormOpen(false);
    setPartyName('');
    setPartyAddr1('');
    setPartyAddr2('');
    setPartyAddr3('');
    setPartyAddr4('');
    setPartyCity('');
    setPartyPincode('');
    setPartyPhone('');
    setPartyEmail('');
    setPartyGstin('');
    setPartyPan('');
  };

  const handleSaveProduct = () => {
    if (!pName) return;
    addProduct({
      name: pName,
      itemType: pItemType || itemTypeOptions[0] || 'Raw Material',
      brand: pBrand || brandOptions[0] || 'Generic',
      uom: pUom || uomOptions[0] || 'KG',
      majorGroup: pMajor || majorOptions[0] || 'Yarn',
      subGroup: pSub || subOptions[0] || 'Cotton Yarn',
      subSubGroup: pSubSub || subSubOptions[0] || 'Combed Cotton',
      openingStock: parseFloat(pStock || 0),
      purchaseRate: parseFloat(pRate || 100),
      sellingPrice: parseFloat(pSellingRate || 120),
      minReorderLevel: parseFloat(pMinLevel || 50),
      hsnCode: pHsn,
      gstRate: parseFloat(pGst),
      description: pDesc
    });
    setIsProdFormOpen(false);
    setPName('');
  };

  const handleQuickAddSave = () => {
    if (!quickAddName) return;
    if (quickAddType === 'itemType') {
      addItemType(quickAddName, quickAddCode);
      setPItemType(quickAddName);
    } else if (quickAddType === 'brand') {
      addBrand(quickAddName);
      setPBrand(quickAddName);
    } else if (quickAddType === 'major') {
      addMajorCategory(quickAddName, quickAddCode);
      setPMajor(quickAddName);
    } else if (quickAddType === 'sub') {
      const majObj = (state.categories?.major || []).find(m => m.name === pMajor) || state.categories?.major[0];
      if (majObj) {
        addSubCategory(majObj.id, quickAddName);
        setPSub(quickAddName);
      }
    } else if (quickAddType === 'subSub') {
      const subObj = (state.categories?.sub || []).find(s => s.name === pSub) || state.categories?.sub[0];
      if (subObj) {
        addSubSubCategory(subObj.id, quickAddName);
        setPSubSub(quickAddName);
      }
    } else if (quickAddType === 'uom') {
      addUOM(quickAddCode || quickAddName.substring(0, 3).toUpperCase(), quickAddName, 2);
      setPUom(quickAddCode || quickAddName.substring(0, 3).toUpperCase());
    } else if (quickAddType === 'country') {
      addCountry({
        name: quickAddName,
        code: (quickAddCode || quickAddName.substring(0, 3)).toUpperCase(),
        currencyCode: quickAddExtra1 || 'INR',
        phoneCode: quickAddExtra2 || '+91'
      });
      setPartyCountry(quickAddName);
    } else if (quickAddType === 'state') {
      addState({
        name: quickAddName,
        code: (quickAddCode || quickAddName.substring(0, 2)).toUpperCase(),
        countryCode: quickAddExtra1 || selectedCountryCode,
        gstStateCode: quickAddExtra2 || ''
      });
      setPartyState(quickAddName);
    }
    setQuickAddType(null);
    setQuickAddName('');
    setQuickAddCode('');
    setQuickAddExtra1('');
    setQuickAddExtra2('');
  };

  const masterCards = [
    { id: 'parties', title: 'Parties Master', desc: 'Manage Customers & Suppliers with 4-line addresses', count: `${state.parties?.length || 0} Parties`, icon: 'Users' },
    { id: 'products', title: 'Products (Item Master)', desc: 'Item Master, UOMs, and Stock Specs', count: `${state.products?.length || 0} Products`, icon: 'Box' },
    { id: 'countries', title: 'Country Master', desc: 'International ISO codes, currencies & dial codes', count: `${countryList.length} Countries`, icon: 'Globe' },
    { id: 'states', title: 'State Master', desc: 'States & Provinces with GST State Codes', count: `${stateList.length} States`, icon: 'MapPin' },
    { id: 'itemTypes', title: 'Item Types', desc: 'Raw Material, Finished Goods, Services, etc.', count: `${(state.itemTypes || []).length} Types`, icon: 'Tags' },
    { id: 'brands', title: 'Brands', desc: 'User-defined Brands & Trademarks', count: `${(state.brands || []).length} Brands`, icon: 'Bookmark' },
    { id: 'categories', title: 'Categories & Hierarchies', desc: 'Major Groups, Sub Groups, and Sub-Sub Groups', count: `${state.categories?.major?.length || 0} Groups`, icon: 'FolderTree' },
    { id: 'uom', title: 'Units of Measure (UOM)', desc: 'Kilograms, Meters, Pieces, Boxes, etc.', count: `${state.uoms?.length || 0} UOMs`, icon: 'Ruler' }
  ];

  // --- OVERVIEW SUB-TAB ---
  if (subTab === 'overview') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Master Data Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">Dedicated master hubs for Country, State, Parties (4-Line Address), Item Types, Categories, Brands, UOMs, and Products</p>
          </div>
          <Button variant="danger" size="sm" onClick={clearAllData}>
            <Icon name="Trash2" className="w-3.5 h-3.5" /> Clear Mock Data
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {masterCards.map(c => (
            <div
              key={c.id}
              onClick={() => setSubTab(c.id)}
              className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Icon name={c.icon} className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-500 font-mono">{c.count}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{c.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.desc}</p>
              </div>
              <div className="flex items-center text-xs font-semibold text-slate-600 group-hover:text-slate-900 gap-1 pt-2 border-t border-slate-100">
                <span>Configure & Edit</span>
                <Icon name="ArrowRight" className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- COUNTRY MASTER SUB-TAB ---
  if (subTab === 'countries') {
    const filteredCountries = countryList.filter(c =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
      (c.currencyCode && c.currencyCode.toLowerCase().includes(countrySearch.toLowerCase()))
    );

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
          <button onClick={() => setSubTab('overview')} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <Icon name="ArrowLeft" className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Country Master</h1>
            <p className="text-xs text-slate-500 mt-0.5">Dedicated master repository of countries, international ISO codes, standard currencies, and phone dialing codes</p>
          </div>
        </div>

        {/* Add Country Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
            <Icon name="Globe" className="w-4 h-4 text-indigo-600" /> Add New Country
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <Input label="Country Name *" placeholder="E.g. India" value={newCountryName} onChange={(e) => setNewCountryName(e.target.value)} />
            <Input label="ISO Code *" placeholder="E.g. IND" value={newCountryCode} onChange={(e) => setNewCountryCode(e.target.value)} />
            <Input label="Currency Code" placeholder="E.g. INR" value={newCountryCurrency} onChange={(e) => setNewCountryCurrency(e.target.value)} />
            <Input label="Phone Code" placeholder="E.g. +91" value={newCountryPhone} onChange={(e) => setNewCountryPhone(e.target.value)} />
            <div className="flex items-end">
              <Button variant="primary" size="md" onClick={() => {
                if (!newCountryName || !newCountryCode) return;
                addCountry({
                  name: newCountryName,
                  code: newCountryCode.toUpperCase(),
                  currencyCode: newCountryCurrency.toUpperCase() || 'INR',
                  phoneCode: newCountryPhone || '+91'
                });
                setNewCountryName('');
                setNewCountryCode('');
                setNewCountryCurrency('INR');
                setNewCountryPhone('+91');
              }}>
                <Icon name="Plus" className="w-4 h-4" /> Save Country
              </Button>
            </div>
          </div>
        </div>

        {/* Country Search & List */}
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="w-72">
            <Input icon="Search" placeholder="Search country name, ISO code..." value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} />
          </div>
          <span className="text-xs font-semibold text-slate-500">{filteredCountries.length} Countries Registered</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">ISO Code</th>
                <th className="py-3 px-4">Country Name</th>
                <th className="py-3 px-4 text-center">Currency Code</th>
                <th className="py-3 px-4 text-center">Phone Code</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredCountries.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold font-mono text-slate-900 bg-slate-50/50 w-24">{c.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-600">{c.currencyCode || 'INR'}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-600">{c.phoneCode || '+91'}</td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={c.status || 'Active'} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => deleteCountry(c.id || c.countryId || c.code)} className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors" title="Delete Country">
                      <Icon name="Trash2" className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- STATE MASTER SUB-TAB ---
  if (subTab === 'states') {
    const filteredStates = stateList.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(stateSearch.toLowerCase()) ||
        (s.gstStateCode && s.gstStateCode.includes(stateSearch));
      const matchesCountry = stateCountryFilter === 'All' || s.countryCode.toLowerCase() === stateCountryFilter.toLowerCase();
      return matchesSearch && matchesCountry;
    });

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
          <button onClick={() => setSubTab('overview')} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <Icon name="ArrowLeft" className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">State Master</h1>
            <p className="text-xs text-slate-500 mt-0.5">Dedicated master repository of states, provinces, and official GST 2-digit State Codes</p>
          </div>
        </div>

        {/* Add State Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
            <Icon name="MapPin" className="w-4 h-4 text-indigo-600" /> Add New State
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <Input label="State Name *" placeholder="E.g. Tamil Nadu" value={newStateName} onChange={(e) => setNewStateName(e.target.value)} />
            <Input label="State Code *" placeholder="E.g. TN" value={newStateCode} onChange={(e) => setNewStateCode(e.target.value)} />
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Country *</label>
              <select
                value={newStateCountry}
                onChange={(e) => setNewStateCountry(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              >
                {countryList.map(c => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <Input label="GST State Code" placeholder="E.g. 33 for TN" value={newStateGstCode} onChange={(e) => setNewStateGstCode(e.target.value)} />
            <div className="flex items-end">
              <Button variant="primary" size="md" onClick={() => {
                if (!newStateName || !newStateCode) return;
                addState({
                  name: newStateName,
                  code: newStateCode.toUpperCase(),
                  countryCode: newStateCountry || 'IND',
                  gstStateCode: newStateGstCode
                });
                setNewStateName('');
                setNewStateCode('');
                setNewStateGstCode('');
              }}>
                <Icon name="Plus" className="w-4 h-4" /> Save State
              </Button>
            </div>
          </div>
        </div>

        {/* State Filter & List */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="w-full sm:w-72">
            <Input icon="Search" placeholder="Search state, code, GST code..." value={stateSearch} onChange={(e) => setStateSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-medium text-slate-600">
            <span className="text-[11px] font-bold text-slate-400">Filter Country:</span>
            {['All', ...countryList.map(c => c.code)].map(cCode => (
              <button
                key={cCode}
                onClick={() => setStateCountryFilter(cCode)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  stateCountryFilter === cCode ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cCode}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">State Code</th>
                <th className="py-3 px-4">State Name</th>
                <th className="py-3 px-4 text-center">Country</th>
                <th className="py-3 px-4 text-center">GST State Code</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredStates.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold font-mono text-slate-900 bg-slate-50/50 w-24">{s.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-600">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{s.countryCode}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {s.gstStateCode ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                        {s.gstStateCode}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={s.status || 'Active'} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => deleteState(s.id || s.stateId || s.code)} className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors" title="Delete State">
                      <Icon name="Trash2" className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- ITEM TYPES SUB-TAB ---
  if (subTab === 'itemTypes') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
          <button onClick={() => setSubTab('overview')} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <Icon name="ArrowLeft" className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Item Types Master</h1>
            <p className="text-xs text-slate-500 mt-0.5">User-configured Item Types for categorizing inventory (Raw Material, Finished Goods, etc.)</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900">Add New Item Type</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Item Type Name" placeholder="E.g. Spare Parts" value={newItemTypeName} onChange={(e) => setNewItemTypeName(e.target.value)} />
            <Input label="Type Code (Optional)" placeholder="E.g. SPR" value={newItemTypeCode} onChange={(e) => setNewItemTypeCode(e.target.value)} />
            <div className="flex items-end">
              <Button variant="primary" size="md" onClick={() => {
                if (!newItemTypeName) return;
                addItemType(newItemTypeName, newItemTypeCode);
                setNewItemTypeName('');
                setNewItemTypeCode('');
              }}>
                <Icon name="Plus" className="w-4 h-4" /> Save Item Type
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Item Type Name</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {(state.itemTypes || []).map((it, idx) => {
                const name = typeof it === 'string' ? it : it.name;
                const code = typeof it === 'string' ? it.substring(0, 3).toUpperCase() : (it.code || 'TYP');
                const id = typeof it === 'string' ? it : it.id;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold font-mono text-slate-900">{code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{name}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => deleteItemType(id)} className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors" title="Delete Item Type">
                        <Icon name="Trash2" className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- BRANDS SUB-TAB ---
  if (subTab === 'brands') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
          <button onClick={() => setSubTab('overview')} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <Icon name="ArrowLeft" className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Brands Master</h1>
            <p className="text-xs text-slate-500 mt-0.5">User-defined brands, trademarks, and manufacturer lines</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900">Add New Brand</h3>
          <div className="flex items-end gap-3 max-w-md">
            <div className="flex-1">
              <Input label="Brand Name" placeholder="E.g. CottonPure" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} />
            </div>
            <Button variant="primary" size="md" onClick={() => {
              if (!newBrandName) return;
              addBrand(newBrandName);
              setNewBrandName('');
            }}>
              <Icon name="Plus" className="w-4 h-4" /> Save Brand
            </Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs max-w-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Brand Name</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {(state.brands || []).map((b, idx) => {
                const name = typeof b === 'string' ? b : b.name;
                const id = typeof b === 'string' ? b : b.id;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{name}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => deleteBrand(id)} className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors" title="Delete Brand">
                        <Icon name="Trash2" className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- CATEGORIES SUB-TAB ---
  if (subTab === 'categories') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
          <button onClick={() => setSubTab('overview')} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <Icon name="ArrowLeft" className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Category Hierarchies Master</h1>
            <p className="text-xs text-slate-500 mt-0.5">User-controlled Major Category Groups, Sub Groups, and Sub-Sub Groups</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900">Add New Major Category Group</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Major Group Name" placeholder="E.g. Dyes & Chemicals" value={newMajName} onChange={(e) => setNewMajName(e.target.value)} />
            <Input label="Code (Optional)" placeholder="E.g. CHM" value={newMajCode} onChange={(e) => setNewMajCode(e.target.value)} />
            <div className="flex items-end">
              <Button variant="primary" size="md" onClick={() => {
                if (!newMajName) return;
                addMajorCategory(newMajName, newMajCode);
                setNewMajName('');
                setNewMajCode('');
              }}>
                <Icon name="Plus" className="w-4 h-4" /> Save Major Group
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-5 text-xs">
          {(state.categories?.major || []).map(mj => (
            <div key={mj.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Icon name="Folder" className="w-4 h-4 text-indigo-600" />
                  <span>{mj.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold">{mj.code}</span>
                  <button onClick={() => deleteMajorCategory(mj.id)} className="p-1 text-rose-500 hover:bg-rose-100 rounded">
                    <Icon name="Trash2" className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder={`Add Sub Group under ${mj.name}...`}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs w-64 bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  value={newSubMajId === mj.id ? newSubName : ''}
                  onChange={(e) => {
                    setNewSubMajId(mj.id);
                    setNewSubName(e.target.value);
                  }}
                />
                <Button size="sm" variant="secondary" onClick={() => {
                  if (newSubMajId === mj.id && newSubName) {
                    addSubCategory(mj.id, newSubName);
                    setNewSubName('');
                  }
                }}>
                  <Icon name="Plus" className="w-3.5 h-3.5" /> Add Sub Group
                </Button>
              </div>

              <div className="pl-4 space-y-3 pt-2">
                {(state.categories?.sub || []).filter(sb => sb.majorId === mj.id).map(sb => (
                  <div key={sb.id} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <Icon name="CornerDownRight" className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sb.name}</span>
                      </div>
                      <button onClick={() => deleteSubCategory(sb.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded">
                        <Icon name="Trash2" className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pl-5 pt-1">
                      <input
                        type="text"
                        placeholder={`Add Sub-Sub Group under ${sb.name}...`}
                        className="px-2.5 py-1 border border-slate-200 rounded-md text-xs w-56 bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                        value={newSubSubSubId === sb.id ? newSubSubName : ''}
                        onChange={(e) => {
                          setNewSubSubSubId(sb.id);
                          setNewSubSubName(e.target.value);
                        }}
                      />
                      <Button size="sm" variant="ghost" onClick={() => {
                        if (newSubSubSubId === sb.id && newSubSubName) {
                          addSubSubCategory(sb.id, newSubSubName);
                          setNewSubSubName('');
                        }
                      }}>
                        + Add Sub-Sub Group
                      </Button>
                    </div>

                    <div className="pl-6 space-y-1 pt-1">
                      {(state.categories?.subSub || []).filter(ssb => ssb.subId === sb.id).map(ssb => (
                        <div key={ssb.id} className="flex items-center justify-between text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-100">
                          <span className="font-medium text-[11px]">• {ssb.name}</span>
                          <button onClick={() => deleteSubSubCategory(ssb.id)} className="text-rose-500 hover:text-rose-700">
                            <Icon name="X" className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- UOM SUB-TAB ---
  if (subTab === 'uom') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
          <button onClick={() => setSubTab('overview')} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <Icon name="ArrowLeft" className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Units of Measure (UOM) Master</h1>
            <p className="text-xs text-slate-500 mt-0.5">User-configured standard measurement units</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900">Add New Unit of Measure</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input label="UOM Code" placeholder="E.g. LTR" value={newUomCode} onChange={(e) => setNewUomCode(e.target.value)} />
            <Input label="Full Name" placeholder="E.g. Liters" value={newUomName} onChange={(e) => setNewUomName(e.target.value)} />
            <Input label="Decimal Places" type="number" value={newUomDecimals} onChange={(e) => setNewUomDecimals(e.target.value)} />
            <div className="flex items-end">
              <Button variant="primary" size="md" onClick={() => {
                if (!newUomCode || !newUomName) return;
                addUOM(newUomCode, newUomName, newUomDecimals);
                setNewUomCode('');
                setNewUomName('');
              }}>
                <Icon name="Plus" className="w-4 h-4" /> Save UOM
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">UOM Name</th>
                <th className="py-3 px-4 text-center">Decimal Precision</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {(state.uoms || []).map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold font-mono text-slate-900">{u.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{u.name}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-500">{u.decimalPlaces} Decimals</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => deleteUOM(u.id)} className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors" title="Delete UOM">
                      <Icon name="Trash2" className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- PARTIES SUB-TAB (WITH 4-COLUMN ADDRESS & COUNTRY/STATE DROPDOWNS) ---
  if (subTab === 'parties') {
    const filteredParties = (state.parties || []).filter(p => {
      const pNameStr = p.name || '';
      const pPhoneStr = p.phone || p.contactNumber || '';
      const pLocStr = p.location || p.city || p.state || '';
      const pAddrStr = `${p.addr1 || ''} ${p.addr2 || ''} ${p.addr3 || ''} ${p.addr4 || ''} ${p.address || ''}`;

      const matchesSearch = pNameStr.toLowerCase().includes(partySearch.toLowerCase()) ||
        pPhoneStr.includes(partySearch) ||
        pLocStr.toLowerCase().includes(partySearch.toLowerCase()) ||
        pAddrStr.toLowerCase().includes(partySearch.toLowerCase());

      const matchesType = partyTypeFilter === 'All' || p.partyType === partyTypeFilter || p.type === partyTypeFilter;
      return matchesSearch && matchesType;
    });

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button onClick={() => setSubTab('overview')} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <Icon name="ArrowLeft" className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Parties Master</h1>
              <p className="text-xs text-slate-500 mt-0.5">Customer and Supplier master directory with discrete 4-column address, country, and state master links</p>
            </div>
          </div>
          <Button variant="primary" size="md" onClick={() => setIsPartyFormOpen(!isPartyFormOpen)}>
            <Icon name="UserPlus" className="w-4 h-4" />
            {isPartyFormOpen ? 'Close Form' : 'Add Party'}
          </Button>
        </div>

        {isPartyFormOpen && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add New Party Master</h3>
              <span className="text-xs text-slate-400 font-mono">4-Column Address Specification</span>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input label="Party Name *" placeholder="E.g. Sri Balaji Yarns" value={partyName} onChange={(e) => setPartyName(e.target.value)} />
              <Select label="Party Type *" options={['Supplier', 'Customer', 'Both']} value={partyType} onChange={(e) => setPartyType(e.target.value)} />
              <Input label="Phone Number" placeholder="+91 98420 12345" value={partyPhone} onChange={(e) => setPartyPhone(e.target.value)} />
              <Input label="Email Address" placeholder="contact@company.com" value={partyEmail} onChange={(e) => setPartyEmail(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="GSTIN Number" placeholder="33AAACS1234F1Z9" value={partyGstin} onChange={(e) => setPartyGstin(e.target.value)} />
              <Input label="PAN Number" placeholder="AAACS1234F" value={partyPan} onChange={(e) => setPartyPan(e.target.value)} />
            </div>

            {/* 4-Line Address Fields */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="MapPin" className="w-3.5 h-3.5 text-indigo-600" /> Discrete 4-Line Address Breakdown
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Address Line 1 (Door No / Flat / Building) *" placeholder="E.g. 142/B, Industrial Towers" value={partyAddr1} onChange={(e) => setPartyAddr1(e.target.value)} />
                <Input label="Address Line 2 (Street / Road / Industrial Area)" placeholder="E.g. Mill Road, Phase 2" value={partyAddr2} onChange={(e) => setPartyAddr2(e.target.value)} />
                <Input label="Address Line 3 (Landmark / Locality / Sector)" placeholder="E.g. Near SIDCO Complex" value={partyAddr3} onChange={(e) => setPartyAddr3(e.target.value)} />
                <Input label="Address Line 4 (Taluk / District / Region)" placeholder="E.g. Coimbatore South" value={partyAddr4} onChange={(e) => setPartyAddr4(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                <Input label="City *" placeholder="E.g. Coimbatore" value={partyCity} onChange={(e) => setPartyCity(e.target.value)} />
                
                {/* Country Dropdown linked to Country Master */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Country *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickAddType('country');
                        setQuickAddExtra1('INR');
                        setQuickAddExtra2('+91');
                      }}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                    >
                      + Master
                    </button>
                  </div>
                  <Select
                    options={countryNameOptions}
                    value={partyCountry}
                    onChange={(e) => {
                      setPartyCountry(e.target.value);
                      const selC = countryList.find(c => c.name === e.target.value);
                      if (selC) {
                        const statesForC = stateList.filter(s => s.countryCode.toLowerCase() === selC.code.toLowerCase());
                        if (statesForC.length > 0) setPartyState(statesForC[0].name);
                      }
                    }}
                  />
                </div>

                {/* State Dropdown linked to State Master (filtered by selected country) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">State *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickAddType('state');
                        setQuickAddExtra1(selectedCountryCode);
                      }}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                    >
                      + Master
                    </button>
                  </div>
                  <Select
                    options={stateOptionsForParty}
                    value={partyState}
                    onChange={(e) => setPartyState(e.target.value)}
                  />
                </div>

                <Input label="Pincode / Postal Code *" placeholder="641001" value={partyPincode} onChange={(e) => setPartyPincode(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setIsPartyFormOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSaveParty}>Save Party Master</Button>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="w-full sm:w-72">
            <Input icon="Search" placeholder="Search name, phone, address, city..." value={partySearch} onChange={(e) => setPartySearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-medium text-slate-600">
            {['All', 'Supplier', 'Customer', 'Both'].map(t => (
              <button
                key={t}
                onClick={() => setPartyTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  partyTypeFilter === t ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Parties List Table */}
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Party Name & ID</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">4-Line Address & Region</th>
                <th className="py-3 px-4">GSTIN & PAN</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredParties.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 italic">No parties found. Click "Add Party" above to create one.</td>
                </tr>
              ) : (
                filteredParties.map(p => {
                  const has4ColAddr = Boolean(p.addr1 || p.addr2 || p.addr3 || p.addr4);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 align-top">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name || p.slName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{p.partyId || p.slCode || `PTY-${p.id}`}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {p.partyType || p.type || 'Customer'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800">{p.phone || p.contactNumber || '-'}</div>
                        <div className="text-[11px] text-slate-400 font-sans">{p.email || '-'}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        {has4ColAddr ? (
                          <div className="space-y-0.5 text-[11px]">
                            {p.addr1 && <div className="text-slate-800 font-medium">{p.addr1}</div>}
                            {p.addr2 && <div className="text-slate-600">{p.addr2}</div>}
                            {p.addr3 && <div className="text-slate-500">{p.addr3}</div>}
                            {p.addr4 && <div className="text-slate-500">{p.addr4}</div>}
                            <div className="text-slate-700 font-semibold pt-0.5">
                              {[p.city, p.state, p.pincode].filter(Boolean).join(', ')} • <span className="text-indigo-600">{p.country || 'India'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-700">
                            <div>{p.address || p.address1 || '-'}</div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {[p.city, p.state, p.pincode].filter(Boolean).join(', ')} • {p.country || 'India'}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        <div><span className="text-[10px] text-slate-400 font-sans">GST: </span>{p.gstin || '-'}</div>
                        {p.pan && <div><span className="text-[10px] text-slate-400 font-sans">PAN: </span>{p.pan}</div>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={p.status || 'Active'} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- PRODUCTS / ITEM MASTER SUB-TAB ---
  if (subTab === 'products') {
    const filteredProds = (state.products || []).filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase()) || (p.id && p.id.toLowerCase().includes(prodSearch.toLowerCase())));

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button onClick={() => setSubTab('overview')} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <Icon name="ArrowLeft" className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products Master</h1>
              <p className="text-xs text-slate-500 mt-0.5">Master repository of items, types, groups, UOMs, and reorder levels</p>
            </div>
          </div>
          <Button variant="primary" size="md" onClick={() => setIsProdFormOpen(true)}>
            <Icon name="Plus" className="w-4 h-4" /> Add Item Master
          </Button>
        </div>

        {/* MODAL: CREATE ITEM MASTER */}
        {isProdFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Item Master</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Code: ITM00000{(state.products?.length || 0) + 1}</p>
                </div>
                <button onClick={() => setIsProdFormOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                  <Icon name="X" className="w-5 h-5" />
                </button>
              </div>

              <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-6 text-xs font-semibold text-slate-500">
                {[
                  { id: 'general', label: 'General' },
                  { id: 'tax', label: 'Tax & HSN' },
                  { id: 'uomStock', label: 'UOM & Stock' },
                  { id: 'purchaseSales', label: 'Purchase & Sales' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setProdModalTab(t.id)}
                    className={`py-3 border-b-2 transition-colors cursor-pointer ${
                      prodModalTab === t.id ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent hover:text-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-4 text-xs">
                {prodModalTab === 'general' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Item Code (Auto Generated)</label>
                        <input
                          disabled
                          value={`ITM00000${(state.products?.length || 0) + 1}`}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 font-mono text-slate-500 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <Input
                          label="Item Name *"
                          placeholder="E.g. Cotton Yarn 40s Combed"
                          value={pName}
                          onChange={(e) => setPName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-semibold text-slate-700">Item Type</label>
                          <button onClick={() => setQuickAddType('itemType')} className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5">
                            + New
                          </button>
                        </div>
                        <Select
                          options={itemTypeOptions}
                          value={pItemType || itemTypeOptions[0]}
                          onChange={(e) => setPItemType(e.target.value)}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-semibold text-slate-700">Major Category Group</label>
                          <button onClick={() => setQuickAddType('major')} className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5">
                            + New
                          </button>
                        </div>
                        <Select
                          options={majorOptions}
                          value={pMajor || majorOptions[0]}
                          onChange={(e) => setPMajor(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-semibold text-slate-700">Sub Category Group</label>
                          <button onClick={() => setQuickAddType('sub')} className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5">
                            + New
                          </button>
                        </div>
                        <Select
                          options={subOptions.length > 0 ? subOptions : ['No Sub Groups']}
                          value={pSub || subOptions[0]}
                          onChange={(e) => setPSub(e.target.value)}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-semibold text-slate-700">Sub-Sub Category Group</label>
                          <button onClick={() => setQuickAddType('subSub')} className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5">
                            + New
                          </button>
                        </div>
                        <Select
                          options={subSubOptions.length > 0 ? subSubOptions : ['No Sub-Sub Groups']}
                          value={pSubSub || subSubOptions[0]}
                          onChange={(e) => setPSubSub(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-semibold text-slate-700">Brand</label>
                          <button onClick={() => setQuickAddType('brand')} className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5">
                            + New
                          </button>
                        </div>
                        <Select
                          options={brandOptions}
                          value={pBrand || brandOptions[0]}
                          onChange={(e) => setPBrand(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {prodModalTab === 'tax' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="HSN / SAC Code" placeholder="E.g. 52051210" value={pHsn} onChange={(e) => setPHsn(e.target.value)} />
                      <Select label="GST Rate %" options={[0, 5, 12, 18, 28]} value={pGst} onChange={(e) => setPGst(e.target.value)} />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Item Description</label>
                      <textarea
                        rows={3}
                        placeholder="Detailed technical specifications..."
                        value={pDesc}
                        onChange={(e) => setPDesc(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                )}

                {prodModalTab === 'uomStock' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-semibold text-slate-700">Primary UOM</label>
                          <button onClick={() => setQuickAddType('uom')} className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5">
                            + New
                          </button>
                        </div>
                        <Select options={uomOptions} value={pUom || uomOptions[0]} onChange={(e) => setPUom(e.target.value)} />
                      </div>
                      <Input label="Opening Stock" type="number" value={pStock} onChange={(e) => setPStock(e.target.value)} />
                      <Input label="Min Reorder Level" type="number" value={pMinLevel} onChange={(e) => setPMinLevel(e.target.value)} />
                    </div>
                  </div>
                )}

                {prodModalTab === 'purchaseSales' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Default Purchase Rate (₹)" type="number" value={pRate} onChange={(e) => setPRate(e.target.value)} />
                      <Input label="Default Selling Rate (₹)" type="number" value={pSellingRate} onChange={(e) => setPSellingRate(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                <Button variant="secondary" size="md" onClick={() => setIsProdFormOpen(false)}>Cancel</Button>
                <Button variant="primary" size="md" onClick={handleSaveProduct}>Save Item Master</Button>
              </div>
            </div>
          </div>
        )}

        {/* QUICK ADD MODAL */}
        {quickAddType && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">
                Add New {quickAddType === 'itemType' ? 'Item Type' : quickAddType === 'major' ? 'Major Category Group' : quickAddType === 'sub' ? 'Sub Category Group' : quickAddType === 'subSub' ? 'Sub-Sub Category Group' : quickAddType === 'brand' ? 'Brand' : quickAddType === 'country' ? 'Country' : quickAddType === 'state' ? 'State' : 'Unit of Measure'}
              </h3>
              <Input
                label="Name *"
                placeholder="Enter name..."
                value={quickAddName}
                onChange={(e) => setQuickAddName(e.target.value)}
              />
              {(quickAddType === 'itemType' || quickAddType === 'major' || quickAddType === 'uom' || quickAddType === 'country' || quickAddType === 'state') && (
                <Input
                  label="Code *"
                  placeholder="E.g. Code..."
                  value={quickAddCode}
                  onChange={(e) => setQuickAddCode(e.target.value)}
                />
              )}
              {quickAddType === 'country' && (
                <>
                  <Input label="Currency Code" placeholder="E.g. INR" value={quickAddExtra1} onChange={(e) => setQuickAddExtra1(e.target.value)} />
                  <Input label="Phone Calling Code" placeholder="E.g. +91" value={quickAddExtra2} onChange={(e) => setQuickAddExtra2(e.target.value)} />
                </>
              )}
              {quickAddType === 'state' && (
                <Input label="GST State Code" placeholder="E.g. 33" value={quickAddExtra2} onChange={(e) => setQuickAddExtra2(e.target.value)} />
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={() => setQuickAddType(null)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleQuickAddSave}>Save & Select</Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs w-full sm:w-80">
          <Input icon="Search" placeholder="Search product name..." value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} />
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Item Type</th>
                <th className="py-3 px-4 text-center">UOM</th>
                <th className="py-3 px-4">Major Group</th>
                <th className="py-3 px-4">Sub Group</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredProds.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 italic">No items found. Click "Add Item Master" above to create one.</td>
                </tr>
              ) : (
                filteredProds.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-600"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{p.itemType || 'Raw Material'}</span></td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{p.uom}</td>
                    <td className="py-3 px-4 text-slate-700">{p.majorGroup}</td>
                    <td className="py-3 px-4 text-slate-600">{p.subGroup}</td>
                    <td className="py-3 px-4 text-slate-600">{p.brand || 'Generic'}</td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={p.status} />
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

  return null;
}

window.MastersView = MastersView;

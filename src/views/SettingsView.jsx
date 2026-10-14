import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import StatusBadge from '../components/StatusBadge';
import { useERP } from '../context/ERPContext';

export default function SettingsView({ onNavigate }) {
  const {
    currentUser,
    showToast,
    clearAllData,
    loadDefaultMasters,
    fetchUsers,
    deleteUser,
    updateUserRole,
    registerUser,
    state
  } = useERP();

  const [activeTab, setActiveTab] = useState('company'); // 'company' | 'masters' | 'users' | 'database'

  // Company Profile State
  const [companyName, setCompanyName] = useState(currentUser?.companyName || 'Prime ERP Enterprise');
  const [gstin, setGstin] = useState('33AAACS1234F1Z9');
  const [address, setAddress] = useState('104 Cross Cut Road, Gandhipuram, Coimbatore');
  const [stateName, setStateName] = useState('Tamil Nadu');
  const [email, setEmail] = useState(currentUser?.email || 'admin@primeerp.com');
  const [phone, setPhone] = useState('+91 98420 12345');
  const [currency, setCurrency] = useState('₹ (INR)');
  const [bankName, setBankName] = useState('HDFC Bank Ltd');
  const [accountNo, setAccountNo] = useState('50200012345678');
  const [ifsc, setIfsc] = useState('HDFC0001234');
  const [upiId, setUpiId] = useState('primeerp@okaxis');

  // Master Seeding State
  const [isSeeding, setIsSeeding] = useState(false);

  // User Management State
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Store Manager');

  // Clear data confirmation modal
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const isAdmin = currentUser?.role === 'Admin';

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      if (fetchUsers) {
        const users = await fetchUsers();
        setUsersList(Array.isArray(users) ? users : []);
      }
    } catch (e) {
      console.warn('Could not load users:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const handleSaveProfile = () => {
    const profile = {
      companyName,
      gstin,
      address,
      state: stateName,
      email,
      phone,
      currency,
      bankName,
      accountNo,
      ifsc,
      upiId
    };
    try {
      localStorage.setItem('PRIME_ERP_COMPANY_PROFILE', JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not save company profile to localStorage:', e);
    }
    showToast?.('Profile Saved', 'Company profile and GST defaults updated successfully.', 'success');
  };

  const handleSeedMasters = async () => {
    setIsSeeding(true);
    try {
      if (loadDefaultMasters) {
        await loadDefaultMasters();
      }
    } catch (err) {
      showToast?.('Seed Error', 'Failed to seed default masters.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateNewUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      showToast?.('Validation Error', 'Please provide full name, email, and password.', 'error');
      return;
    }

    try {
      if (registerUser) {
        await registerUser(newUserName, newUserEmail, newUserPassword, newUserRole, companyName);
        setIsNewUserModalOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('Store Manager');
        await loadUsers();
      }
    } catch (err) {
      console.warn('User registration note:', err);
    }
  };

  const handleDeleteUser = async (uId) => {
    if (uId === currentUser?.id || uId === currentUser?.userId) {
      showToast?.('Action Blocked', 'You cannot delete your own logged-in account.', 'error');
      return;
    }
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      if (deleteUser) {
        await deleteUser(uId);
        await loadUsers();
      }
    }
  };

  const handleRoleChange = async (uId, newRole) => {
    if (uId === currentUser?.id || uId === currentUser?.userId) {
      showToast?.('Action Blocked', 'You cannot change your own role.', 'error');
      return;
    }
    if (updateUserRole) {
      await updateUserRole(uId, newRole);
      await loadUsers();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Administration</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage company profile, cold-start masters, RBAC user permissions, and database operations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
            Role: <strong className="text-slate-900">{currentUser?.role || 'Admin'}</strong>
          </span>
        </div>
      </div>

      {/* Settings Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'company', label: 'Company Profile', icon: 'Building2' },
          { id: 'masters', label: 'Master Seeding', icon: 'Sparkles' },
          { id: 'users', label: 'User & Role Management (RBAC)', icon: 'ShieldCheck' },
          { id: 'database', label: 'Data & Security', icon: 'Database' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-slate-900 text-slate-900 bg-slate-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Icon name={tab.icon} className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: COMPANY PROFILE */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registered Legal Entity</h3>
                <p className="text-[11px] text-slate-500">Information rendered on GST Tax Invoices, Purchase Orders, and Ledger statements</p>
              </div>
              <Button variant="primary" size="sm" onClick={handleSaveProfile}>
                <Icon name="Save" className="w-3.5 h-3.5 mr-1" /> Save Profile
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Registered Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Input
                label="GSTIN Number"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Registered Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Input
                label="State & Region"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Official Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Official Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Primary Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="font-bold text-slate-900 text-xs">Bank Details for Invoicing & UPI QR</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Bank Name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
                <Input
                  label="Account Number"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                />
                <Input
                  label="IFSC Code"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                />
                <Input
                  label="UPI ID / VPA"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER SEEDING */}
      {activeTab === 'masters' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cold-Start Onboarding & Master Seed Data</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pre-populate standard enterprise ERP units, categories, and generic brands with idempotent safety checks
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleSeedMasters}
                disabled={isSeeding}
              >
                <Icon name="Sparkles" className="w-4 h-4 mr-1" />
                {isSeeding ? 'Seeding Default Masters...' : 'Load Default Masters'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Icon name="Ruler" className="w-4 h-4 text-indigo-600" /> Standard UOMs
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-600">6 Standards</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Prepopulates standard measurement units across the system:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['PCS', 'NOS', 'KG', 'BOX', 'LTR', 'MTR'].map(u => (
                    <span key={u} className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono font-bold text-[10px] text-slate-700">
                      {u}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Icon name="Tag" className="w-4 h-4 text-emerald-600" /> Default Categories
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-600">3 Default Groups</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Prepopulates root taxonomy categories for product cataloging:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['General', 'Electronics', 'Raw Materials'].map(c => (
                    <span key={c} className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-[10px] text-slate-700">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Icon name="Award" className="w-4 h-4 text-amber-600" /> Default Brand
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-600">Generic</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Creates fallback manufacturer brand for unbranded inventory items:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-[10px] text-slate-700">
                    Generic (BRD-GEN)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2.5 text-blue-900 text-[11px] leading-relaxed">
              <Icon name="Info" className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Idempotent Master Seeding Guarantee:</strong> Clicking &quot;Load Default Masters&quot; will never overwrite or duplicate existing units or categories. If records already exist, the backend safely ignores duplicates and only injects missing standard entries.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER & ROLE MANAGEMENT (RBAC) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">User Accounts & Role-Based Access Control (RBAC)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Control system access privileges across Admin, Store Manager, and Accountant / Billing roles
                </p>
              </div>
              {isAdmin && (
                <Button variant="primary" size="sm" onClick={() => setIsNewUserModalOpen(true)}>
                  <Icon name="UserPlus" className="w-3.5 h-3.5 mr-1" /> Add New User
                </Button>
              )}
            </div>

            {!isAdmin && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2 text-[11px]">
                <Icon name="ShieldAlert" className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Read-Only Access:</strong> You are currently logged in as a <strong>{currentUser?.role}</strong>. Only users with the <strong>Admin</strong> role can create new users, modify roles, or deactivate accounts.
                </div>
              </div>
            )}

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">User</th>
                    <th className="py-2.5 px-4">Email Address</th>
                    <th className="py-2.5 px-4 text-center">Assigned Role</th>
                    <th className="py-2.5 px-4 text-center">Access Scope</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">
                        {isLoadingUsers ? 'Loading system users...' : 'No users found.'}
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u, i) => {
                      const isSelf = u.email === currentUser?.email || u.userId === currentUser?.id;
                      return (
                        <tr key={u.userId || i} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.fullName}
                              {isSelf && <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 text-[9px] font-bold">You</span>}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">{u.userId}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                          <td className="py-3 px-4 text-center">
                            {isAdmin && !isSelf ? (
                              <select
                                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:border-slate-900"
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.userId, e.target.value)}
                              >
                                <option value="Admin">Admin</option>
                                <option value="Store Manager">Store Manager</option>
                                <option value="Accountant / Billing">Accountant / Billing</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.role === 'Admin' ? 'bg-rose-100 text-rose-800' :
                                u.role === 'Store Manager' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {u.role}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 text-[11px]">
                            {u.role === 'Admin' ? 'Full System & Settings Access' :
                             u.role === 'Store Manager' ? 'Purchases, GRN & Stock Adjustments' :
                             'Sales Invoicing & Ledger Statements'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isAdmin && !isSelf && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.userId)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Deactivate user"
                              >
                                <Icon name="Trash2" className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATABASE & DATA CLEARING */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-2xs space-y-5 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Database Persistence & Maintenance</h3>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <Icon name="Database" className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">PostgreSQL Relational Storage</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">Connected to ASP.NET Core 8 Web API backend with Entity Framework Core.</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                Active & Synced
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-rose-600 text-sm">Danger Zone: Clear Mock & Operational Data</h4>
                  <p className="text-[11px] text-slate-500">
                    Wipes mock records from the local workspace state. Restricted strictly to Admin role.
                  </p>
                </div>
                {isAdmin ? (
                  <Button variant="danger" size="md" onClick={() => setIsConfirmClearOpen(true)}>
                    <Icon name="AlertTriangle" className="w-4 h-4 mr-1" /> Clear All Data
                  </Button>
                ) : (
                  <Button variant="secondary" size="md" disabled title="Admin role required">
                    <Icon name="Lock" className="w-4 h-4 mr-1" /> Admin Only
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW USER */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Icon name="UserPlus" className="w-5 h-5 text-indigo-600" />
                Create New System User
              </h3>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="space-y-3 text-xs">
              <Input
                label="Full Name"
                placeholder="e.g. Anand Kumar"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="anand@primeerp.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
              />
              <Input
                label="Temporary Password"
                type="password"
                placeholder="••••••••"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
              />
              <Select
                label="Assigned System Role"
                options={['Admin', 'Store Manager', 'Accountant / Billing']}
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="secondary" size="md" onClick={() => setIsNewUserModalOpen(false)}>Cancel</Button>
                <Button variant="primary" size="md" type="submit">Create User</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR DATA MODAL */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 pb-2 border-b border-slate-100">
              <Icon name="AlertCircle" className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 text-sm">Confirm Data Clearing</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to reset all mock records? This will clear all pending invoices, purchase orders, and stock transactions. Only base master structures will remain.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="md" onClick={() => setIsConfirmClearOpen(false)}>Cancel</Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  clearAllData?.();
                  setIsConfirmClearOpen(false);
                }}
              >
                Yes, Clear All Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.SettingsView = SettingsView;

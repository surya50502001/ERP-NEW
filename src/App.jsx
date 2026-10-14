// src/App.jsx
import React from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import DashboardView from './views/DashboardView.jsx';
import PurchasesView from './views/PurchasesView.jsx';
import SalesView from './views/SalesView.jsx';
import InventoryView from './views/InventoryView.jsx';
import MastersView from './views/MastersView.jsx';
import ReportsView from './views/ReportsView.jsx';
import SettingsView from './views/SettingsView.jsx';
import PaymentsView from './views/PaymentsView.jsx';
import LoginView from './views/LoginView.jsx';
import RegisterView from './views/RegisterView.jsx';
import { ERPProvider, useERP } from './context/ERPContext.jsx';

function MainApp() {
  const navigate = useNavigate();
  const { currentUser } = useERP();

  const onNavigate = (tabId) => {
    navigate(`/${tabId}`);
  };

  const currentTab = window.location.hash.replace('#/', '') || 'dashboard';

  // If user is not authenticated, require Login / Register
  if (!currentUser) {
    if (currentTab === 'register') {
      return <RegisterView onNavigate={onNavigate} />;
    }
    return <LoginView onNavigate={onNavigate} />;
  }

  const viewMap = {
    dashboard: DashboardView,
    purchases: PurchasesView,
    sales: SalesView,
    inventory: InventoryView,
    masters: MastersView,
    payments: PaymentsView,
    reports: ReportsView,
    settings: SettingsView,
  };
  const ViewComponent = viewMap[currentTab] || DashboardView;

  return (
    <AppShell currentTab={currentTab} onNavigate={onNavigate}>
      <ViewComponent onNavigate={onNavigate} />
    </AppShell>
  );
}

export default function WrappedApp() {
  return (
    <ERPProvider>
      <HashRouter>
        <Routes>
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </HashRouter>
    </ERPProvider>
  );
}

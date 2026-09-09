import React, { useState } from "react";
import Icon from "./Icon";
import Button from "./Button";
import CommandPalette from "./CommandPalette";
import ToastContainer from "./ToastContainer";
import { useERP } from "../context/ERPContext";

export default function AppShell({ currentTab, onNavigate, children }) {
  const erp = useERP();
  const state = erp?.state || {};
  const setIsCmdPaletteOpen = erp?.setIsCmdPaletteOpen || (() => {});
  const sidebarCollapsed = erp?.sidebarCollapsed || false;
  const setSidebarCollapsed = erp?.setSidebarCollapsed || (() => {});

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { id: "purchases", label: "Purchases", icon: "ShoppingBag" },
    { id: "sales", label: "Sales", icon: "Receipt" },
    { id: "inventory", label: "Inventory", icon: "Package" },
    { divider: true },
    { id: "masters", label: "Masters", icon: "Database" },
    { id: "reports", label: "Reports", icon: "BarChart3" },
    { divider: true },
    { id: "settings", label: "Settings", icon: "Settings" },
  ];

  const unreadCount = (state.notifications || []).filter((n) => n.unread).length;

  const handleNavClick = (id) => {
    if (erp?.triggerNavReset) {
      erp.triggerNavReset(id);
    }
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-slate-200">
      <div className="flex-1 flex overflow-hidden">
        
        {/* Mobile Backdrop & Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-64 max-w-xs bg-white h-full flex flex-col z-50 shadow-2xl">
              <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavClick("dashboard")}>
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    E
                  </div>
                  <div>
                    <span className="font-bold text-sm tracking-tight text-slate-900 block leading-none">
                      PRIME ERP
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium tracking-wide block mt-0.5">
                      ENTERPRISE SAAS
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <Icon name="X" className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item, idx) => {
                  if (item.divider) {
                    return <div key={idx} className="my-2 border-t border-slate-100" />;
                  }
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <Icon name={item.icon} className={`w-4 h-4 mr-3 ${isActive ? "text-white" : "text-slate-500"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ERP Online
                  </span>
                  <span className="font-mono text-[10px]">v2.4</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside
          className={`hidden md:flex ${sidebarCollapsed ? "w-16" : "w-60"} bg-white border-r border-slate-200/80 flex-col transition-all duration-200 z-30 select-none shadow-xs`}
        >
          <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavClick("dashboard")}>
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  E
                </div>
                <div>
                  <span className="font-bold text-sm tracking-tight text-slate-900 block leading-none">
                    PRIME ERP
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-wide block mt-0.5">
                    ENTERPRISE SAAS
                  </span>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-7 h-7 mx-auto rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs cursor-pointer" onClick={() => handleNavClick("dashboard")}>
                E
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Icon name={sidebarCollapsed ? "PanelLeftOpen" : "PanelLeftClose"} className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
            {navItems.map((item, idx) => {
              if (item.divider) {
                return <div key={idx} className="my-2 border-t border-slate-100" />;
              }
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${sidebarCollapsed ? "justify-center px-0" : "px-3"} py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon name={item.icon} className={`w-4 h-4 ${sidebarCollapsed ? "" : "mr-3"} ${isActive ? "text-white" : "text-slate-500"}`} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {!sidebarCollapsed && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ERP System Online
                </span>
                <span className="font-mono text-[10px]">v2.4</span>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Header Bar */}
          <header className="h-14 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between z-20 shadow-2xs">
            
            {/* Mobile Hamburger Menu Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
              >
                <Icon name="Menu" className="w-5 h-5" />
              </button>

              {/* Global Search Bar */}
              <button
                onClick={() => setIsCmdPaletteOpen(true)}
                className="w-40 sm:w-72 md:w-80 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs text-slate-500 flex items-center justify-between transition-colors shadow-2xs group"
              >
                <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                  <Icon name="Search" className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                  <span className="truncate">Search POs, Invoices, Stock...</span>
                </div>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-white rounded border border-slate-200 shadow-2xs shrink-0">Ctrl + K</kbd>
              </button>
            </div>

            {/* Header Right Action Area */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onNavigate("purchases")}
                className="hidden lg:inline-flex"
              >
                <Icon name="Plus" className="w-3.5 h-3.5" /> New PO
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onNavigate("sales")}
                className="hidden lg:inline-flex"
              >
                <Icon name="Plus" className="w-3.5 h-3.5" /> New Invoice
              </Button>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfile(false);
                  }}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <Icon name="Bell" className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-white border border-slate-200 shadow-xl z-50 p-3 space-y-2 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                      <span className="text-[10px] text-slate-500 font-semibold">{unreadCount} new</span>
                    </div>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {(state.notifications || []).map((n) => (
                        <div key={n.id} className="p-2 rounded-lg hover:bg-slate-50 text-xs transition-colors">
                          <div className="font-semibold text-slate-800 flex items-center justify-between">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                          </div>
                          <p className="text-slate-500 mt-0.5 text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfile(!showProfile);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border border-slate-700">
                    {(erp?.currentUser?.companyName || erp?.currentUser?.fullName || 'EP').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <span className="text-xs font-semibold text-slate-800 block leading-tight">
                      {erp?.currentUser?.companyName || 'My Enterprise'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">{erp?.currentUser?.role || 'Store Manager'}</span>
                  </div>
                  <Icon name="ChevronDown" className="w-3.5 h-3.5 text-slate-400 hidden sm:inline-block" />
                </button>
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl z-50 p-2 text-xs space-y-1 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900">{erp?.currentUser?.companyName || 'My Enterprise'}</p>
                      <p className="text-[11px] font-medium text-slate-700">{erp?.currentUser?.fullName || 'Store Manager'}</p>
                      {erp?.currentUser?.email && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{erp.currentUser.email}</p>}
                    </div>
                    <button
                      onClick={() => { handleNavClick('settings'); setShowProfile(false); }}
                      className="w-full text-left px-3 py-1.5 rounded-md hover:bg-slate-100 flex items-center gap-2 text-slate-700"
                    >
                      <Icon name="Settings" className="w-3.5 h-3.5" /> System Settings
                    </button>
                    <button
                      onClick={() => { handleNavClick('masters'); setShowProfile(false); }}
                      className="w-full text-left px-3 py-1.5 rounded-md hover:bg-slate-100 flex items-center gap-2 text-slate-700"
                    >
                      <Icon name="Database" className="w-3.5 h-3.5" /> Master Data Overview
                    </button>
                    <button
                      onClick={() => {
                        setShowProfile(false);
                        if (erp?.logoutUser) erp.logoutUser();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-md hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium pt-2 border-t border-slate-100"
                    >
                      <Icon name="LogOut" className="w-3.5 h-3.5 text-rose-500" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 space-y-6">
            {children}
          </main>
        </div>
      </div>

      <CommandPalette />
      <ToastContainer />
    </div>
  );
}

window.AppShell = AppShell;

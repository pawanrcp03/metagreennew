/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CRM from './components/CRM';
import Customers from './components/Customers';
import Inventory from './components/Inventory';
import InventoryAndPO from './components/InventoryAndPO';
import Projects from './components/Projects';
import CustomerPortal from './components/CustomerPortal';
import SiteSurvey from './components/SiteSurvey';
import SolarDesign from './components/SolarDesign';
import ProposalGenerator from './components/ProposalGenerator';
import QuotationBuilder from './components/QuotationBuilder';
import InvoiceBuilder from './components/InvoiceBuilder';
import TaxInvoiceGenerator from './components/TaxInvoiceGenerator';
import SubsidyManagement from './components/SubsidyManagement';
import Procurement from './components/Procurement';
import WorkOrders from './components/WorkOrders';
import Finance from './components/Finance';
import Support from './components/Support';
import WarrantyManagement from './components/WarrantyManagement';
import DocumentManagement from './components/DocumentManagement';
import Compliance from './components/Compliance';
import HRModule from './components/HRModule';
import VendorPortal from './components/VendorPortal';
import Reporting from './components/Reporting';
import MasterSettings from './components/MasterSettings';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import ChangePasswordModal from './components/ChangePasswordModal';
import { ToastProvider, useToast } from './context/ToastContext';

import { ViewType, AuthenticatedUser } from './types';
import { 
  Sun, 
  Moon, 
  Clock, 
  LogOut, 
  Bell, 
  User as UserIcon,
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  Megaphone,
  X,
  Sparkles,
  Globe,
  KeyRound,
  Upload,
  Trash2,
  Camera,
  Check,
  Building2,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from './lib/utils';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogoProvider, useLogos } from './context/LogoContext';
import { authService } from './services/auth.service';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

function AppContent() {
  // 1. ALL HOOKS DECLARED TOGETHER AT TOP (Rule of Hooks)
  const { user, loading } = useAuth();
  const { logos, updateLogos, resetLogos } = useLogos();
  const { toast } = useToast();

  const [currentView, setView] = useState<ViewType>('dashboard');
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchTime, setPunchTime] = useState<Date | null>(null);
  const [currentFilter, setCurrentFilter] = useState<string | undefined>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSupportDrawerOpen, setIsSupportDrawerOpen] = useState(false);
  const [isLandingPageMode, setIsLandingPageMode] = useState<boolean>(() => {
    return sessionStorage.getItem('metagreen_landing') === 'true';
  });
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Profile Logo Management States
  const [profileLogoPreview, setProfileLogoPreview] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileCompanyName, setProfileCompanyName] = useState('');

  useEffect(() => {
    if (user) {
      setProfileLogoPreview(user.companyLogo || logos.companyLogo || null);
      setProfileCompanyName(user.companyName || user.vendorAccount?.companyName || logos.companyName || 'METAGREEN');
    }
  }, [user, logos, isProfileModalOpen]);

  const handleProfileLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo file size should be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfileLogo = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      const updatedLogo = profileLogoPreview || '';
      
      // 1. Update LogoContext (updates Firebase settings/branding and syncs everywhere)
      await updateLogos({
        companyLogo: updatedLogo,
        companyName: profileCompanyName || logos.companyName
      });

      // 2. Update Firestore user document
      if (user.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          companyLogo: updatedLogo,
          companyName: profileCompanyName
        });
      }

      toast.success('Company & Profile Logo updated successfully!', 'Logo Updated');
      alert('✅ Company & Profile Logo updated successfully!');
      setIsProfileModalOpen(false);
    } catch (err) {
      console.error('Error saving profile logo:', err);
      alert('Failed to update logo. Please check network connection.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleRemoveProfileLogo = async () => {
    if (window.confirm('Do you want to remove the current logo and reset to default?')) {
      setProfileLogoPreview(null);
      if (user) {
        await resetLogos();
        if (user.uid) {
          await updateDoc(doc(db, 'users', user.uid), {
            companyLogo: ''
          });
        }
        toast.info('Logo has been reset to default.', 'Logo Reset');
      }
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('metagreen_landing');
      localStorage.clear();
      sessionStorage.clear();
      await authService.logout();
      setIsLandingPageMode(true);
      setView('dashboard');
      setCurrentFilter(undefined);
      setIsProfileModalOpen(false);
      toast.info('Session ended cleanly. You have been logged out.', 'Logged Out');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (user) {
      if (sessionStorage.getItem('metagreen_landing') !== 'true') {
        setIsLandingPageMode(false);
      }

      if (user.mustChangePassword || user.isFirstLogin) {
        setIsChangePasswordModalOpen(true);
      }

      if (['Vendor', 'Vendor Employee', 'Customer', 'Survey Engineer', 'Design Engineer', 'Installer', 'Procurement Officer', 'Warehouse Manager', 'Auditor'].includes(user.role)) {
        if (user.role === 'Vendor' || user.role === 'Vendor Employee') setView('vendors');
        else if (user.role === 'Customer') setView('portal');
        else if (user.role === 'Survey Engineer') setView('site-survey');
        else if (user.role === 'Design Engineer') setView('solar-design');
        else if (user.role === 'Installer') setView('projects');
        else if (user.role === 'Procurement Officer' || user.role === 'Warehouse Manager') setView('inventory');
        else if (user.role === 'Auditor') setView('reports');
        else setView('dashboard');
      } else {
        setView('dashboard');
      }
    }
  }, [user]);

  const canPunch = user?.role === 'Installer' || 
                   user?.role === 'Survey Engineer' || 
                   user?.role === 'Sales Executive' || 
                   user?.role === 'Warehouse Manager' || 
                   user?.role === 'Design Engineer' || 
                   user?.role === 'Project Manager' || 
                   user?.role === 'Finance Manager' || 
                   user?.role === 'Customer Support';

  const handlePunch = () => {
    setIsPunchedIn(!isPunchedIn);
    setPunchTime(new Date());
  };

  const handleViewChange = (view: ViewType, filter?: string) => {
    setView(view);
    setCurrentFilter(filter);
  };

  // 2. CONDITIONAL RENDERING (AFTER ALL HOOKS HAVE BEEN EXECUTED)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Meta Green Enterprise OS...</p>
        </div>
      </div>
    );
  }

  // Always open with Public Landing Page on launch unless user enters Dashboard
  if (isLandingPageMode || !user) {
    return (
      <LandingPage 
        onLoginSuccess={() => {
          sessionStorage.removeItem('metagreen_landing');
          setIsLandingPageMode(false);
          setView('dashboard');
        }} 
      />
    );
  }

  if (user.status === 'Pending' || user.status === 'Rejected') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-800">
        <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-4">Account Pending</h2>
          <p className="text-slate-600 mb-6">
            Your account is currently {user.status.toLowerCase()}. Please wait for an administrator to review and approve your account.
          </p>
          <button 
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleViewChange} />;
      case 'crm':
        return <CRM initialFilter={currentFilter} />;
      case 'customers':
        return <Customers onNavigate={handleViewChange} />;
      case 'inventory':
        return <InventoryAndPO initialTab="po" />;
      case 'projects':
        return <Projects initialFilter={currentFilter} />;
      case 'portal':
        return <CustomerPortal />;
      case 'site-survey':
        return <SiteSurvey />;
      case 'solar-design':
        return <SolarDesign />;
      case 'proposal':
        return <ProposalGenerator />;
      case 'quotation':
        return <QuotationBuilder />;
      case 'invoice':
        return <InvoiceBuilder />;
      case 'tax-invoice':
        return <TaxInvoiceGenerator />;
      case 'subsidy':
        return <SubsidyManagement />;
      case 'procurement':
        return <InventoryAndPO initialTab="po" />;
      case 'work-orders':
        return <WorkOrders />;
      case 'finance':
        return <Finance />;
      case 'support':
        return <Support />;
      case 'warranty':
        return <WarrantyManagement />;
      case 'documents':
        return <DocumentManagement />;
      case 'compliance':
        return <Compliance />;
      case 'hr':
        return <HRModule />;
      case 'vendors':
        return <VendorPortal />;
      case 'reports':
        return <Reporting />;
      case 'settings':
        return <MasterSettings />;
      default:
        return <Dashboard onNavigate={handleViewChange} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-slate-800 overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-[#0f172a] text-white flex items-center justify-between px-4 md:px-6 shrink-0 relative z-[60] border-b border-slate-800">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          {(logos.companyLogo || user?.companyLogo || user?.vendorAccount?.companyLogo) ? (
            <img 
              src={user?.companyLogo || user?.vendorAccount?.companyLogo || logos.companyLogo} 
              alt={logos.companyName || 'Company Logo'} 
              className="h-9 w-auto max-w-[150px] max-h-9 object-contain rounded-lg bg-white/10 p-1 border border-slate-700 shadow-sm" 
            />
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 font-bold" />
            </div>
          )}
          <div>
            <span className="text-sm sm:text-lg font-black tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent block leading-tight">
              {user?.companyName || user?.vendorAccount?.companyName || logos.companyName || 'Meta Green'}
            </span>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium hidden xs:block">
              {logos.tagline || 'Solar Enterprise ERP'}
            </p>
          </div>
        </div>

        {/* Center: Notice Board / Trial Banner (Hidden on smaller screens for clean layout) */}
        <div className="hidden xl:flex items-center gap-2 px-3.5 py-1 bg-slate-900/90 border border-slate-800 rounded-full text-xs font-bold max-w-xl mx-4 overflow-hidden shadow-inner">
          {user?.role === 'Vendor' ? (
            <span className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 animate-pulse">
              <Sparkles className="w-3 h-3 fill-slate-950" /> 7-Day Trial Active
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 animate-pulse">
              <Megaphone className="w-3 h-3" /> Notice Board
            </span>
          )}
          <div className="truncate text-slate-300 text-[11px] font-medium">
            {user?.role === 'Vendor' ? (
              <span>⏳ 7-Day Free Trial: 6 Days Remaining • Plan: Starter Vendor (3 Users, 10 GB Storage)</span>
            ) : user?.role === 'Installer' ? (
              <span>🔧 Field Installer Mode Active • Assigned Site Projects, Site BOM Consumption & 3D Rooftop Engine Live</span>
            ) : (
              <span>📢 Solar Installer Login Active • PM Surya Ghar Subsidy Sync Live • 70:30 Tax Invoice Split Enabled</span>
            )}
          </div>
        </div>

        {/* Right: Actions & Theme Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={() => {
              sessionStorage.setItem('metagreen_landing', 'true');
              setIsLandingPageMode(true);
            }}
            className="flex items-center gap-1 text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-full font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-all shadow-xs cursor-pointer"
            title="Switch to Public Landing Page"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Landing Page</span>
          </button>

          {canPunch && (
            <button 
              onClick={handlePunch}
              className={cn(
                "hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold transition-all shadow-sm cursor-pointer",
                isPunchedIn ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              {isPunchedIn ? 'Punch Out' : 'Punch In'}
            </button>
          )}

          <div className="flex items-center gap-1 sm:gap-1.5 border-l border-slate-800 pl-1.5 sm:pl-3">
            {/* Dark / Light Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />}
            </button>

            {/* Profile Settings */}
            <button 
              onClick={() => setIsProfileModalOpen(true)} 
              className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer" 
              title="Profile Settings"
            >
              <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-emerald-600 rounded-full flex items-center justify-center font-black text-[11px] sm:text-xs ring-2 ring-emerald-950 text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* Logout Icon */}
            <button 
              onClick={handleLogout}
              className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-red-400 transition-colors cursor-pointer" 
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Navigation Bar with Dropdowns */}
      <Sidebar currentView={currentView} setView={handleViewChange} userRole={user.role} />
      
      <main className="flex-1 overflow-y-auto bg-slate-50 min-h-0">
        <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>

      {/* Floating MetaGreen Support / Contact Us Widget */}
      <div className="fixed bottom-3 left-3 sm:bottom-4 sm:left-4 z-40">
        <button
          onClick={() => setIsSupportDrawerOpen(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-slate-900/95 backdrop-blur-md hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 rounded-full shadow-2xl transition-all hover:scale-105 font-bold text-[11px] sm:text-xs group cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 animate-pulse" />
          <span className="hidden xs:inline">MetaGreen Support / Contact</span>
          <span className="xs:hidden">Support</span>
        </button>
      </div>

      {/* Support Contact Drawer / Modal */}
      {isSupportDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-lg">MetaGreen Support & Contact Us</h3>
              </div>
              <button onClick={() => setIsSupportDrawerOpen(false)} className="text-slate-400 hover:text-white text-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-900 space-y-1">
                <p className="font-bold">MetaGreen Enterprise Customer Care</p>
                <p className="text-xs text-emerald-700">Need help with solar installations, quotes, DISCOM approvals, or vendor accounts?</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href="tel:+919876543210" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-3 transition-colors">
                  <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Phone Support</p>
                    <p className="text-xs text-slate-500">+91 98765 43210</p>
                  </div>
                </a>

                <a href="mailto:support@gesindia.co" className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-3 transition-colors">
                  <Mail className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Email Support</p>
                    <p className="text-xs text-slate-500">support@gesindia.co</p>
                  </div>
                </a>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsSupportDrawerOpen(false);
                    setView('support');
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <MessageSquare className="w-4 h-4" /> Go to Internal Support Tickets
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal with Dynamic Logo Upload & Update */}
      {isProfileModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[200] overflow-y-auto p-4 sm:p-6 flex items-start justify-center pt-24 sm:pt-28 pb-16"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[calc(100vh-8.5rem)] flex flex-col min-h-0 overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Sticky Modal Header with Prominent Close Button */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 sticky top-0 z-30 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Profile & Business Settings</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Manage user identity, company branding & security</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsProfileModalOpen(false)} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all shadow-xs border border-red-200 hover:border-red-500 cursor-pointer shrink-0"
                title="Close Profile (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">
              {/* User Overview Card */}
              <div className="p-4 bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-600/20 shrink-0 overflow-hidden border-2 border-white">
                    {profileLogoPreview ? (
                      <img src={profileLogoPreview} alt="Logo" className="w-full h-full object-contain p-1 bg-white" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 leading-tight">{user?.name || 'User'}</h4>
                    <p className="text-xs font-semibold text-slate-500">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {user?.role || 'Team Member'}
                    </span>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-black flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </div>
              </div>

              {/* Company & Profile Logo Upload Card */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    Company Logo & Branding
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">Appears on Quotes & Invoices</span>
                </div>

                {/* Live Logo Preview Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center min-h-[110px] relative group">
                  {profileLogoPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img 
                        src={profileLogoPreview} 
                        alt="Company Logo Preview" 
                        className="max-h-16 max-w-[220px] object-contain rounded drop-shadow-xs" 
                      />
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Active Company Logo
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 gap-1">
                      <ImageIcon className="w-8 h-8 stroke-1 text-slate-300" />
                      <span className="text-xs font-semibold">No custom logo uploaded</span>
                      <span className="text-[10px] text-slate-400">Using default MetaGreen logo</span>
                    </div>
                  )}
                </div>

                {/* Upload & Action Buttons */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{profileLogoPreview ? 'Change / Upload New Logo' : 'Upload Company Logo'}</span>
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/webp,image/svg+xml" 
                        onChange={handleProfileLogoUpload} 
                        className="hidden" 
                      />
                    </label>

                    {profileLogoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveProfileLogo}
                        className="px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs font-bold transition-colors border border-slate-200 cursor-pointer flex items-center gap-1"
                        title="Remove Logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium text-center">
                    Supported: PNG, JPEG, SVG, WEBP (Max 2MB, Transparent PNG recommended)
                  </p>
                </div>

                {/* Company Name Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Company / Brand Name</label>
                  <input 
                    type="text"
                    value={profileCompanyName}
                    onChange={(e) => setProfileCompanyName(e.target.value)}
                    placeholder="e.g. Meta Green Solar Pvt Ltd"
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  />
                </div>

                {/* Save Logo Button */}
                <button
                  type="button"
                  onClick={handleSaveProfileLogo}
                  disabled={isUpdatingProfile}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isUpdatingProfile ? 'Saving Branding...' : 'Save & Apply Logo'}</span>
                </button>
              </div>

              {/* Account Details */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={user?.name || ''} 
                    disabled 
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-semibold text-xs cursor-not-allowed" 
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    disabled 
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-semibold text-xs cursor-not-allowed" 
                  />
                </div>
              </div>

              {/* Account Actions */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    setIsChangePasswordModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 font-bold rounded-xl transition-colors text-xs cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>Change Account Password</span>
                </button>

                <button 
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-xl transition-colors text-xs cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Meta Green</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        isFirstLogin={user?.mustChangePassword || user?.isFirstLogin}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onSuccess={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LogoProvider>
          <AppContent />
        </LogoProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

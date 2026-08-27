/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CRM from './components/CRM';
import Inventory from './components/Inventory';
import InventoryAndPO from './components/InventoryAndPO';
import Projects from './components/Projects';
import CustomerPortal from './components/CustomerPortal';
import SiteSurvey from './components/SiteSurvey';
import SolarDesign from './components/SolarDesign';
import ProposalGenerator from './components/ProposalGenerator';
import QuotationBuilder from './components/QuotationBuilder';
import QuoteAndInvoice from './components/QuoteAndInvoice';
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
  KeyRound
} from 'lucide-react';
import { cn } from './lib/utils';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogoProvider, useLogos } from './context/LogoContext';
import { authService } from './services/auth.service';

function AppContent() {
  // 1. ALL HOOKS DECLARED TOGETHER AT TOP (Rule of Hooks)
  const { user, loading } = useAuth();
  const { logos } = useLogos();
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
        return <QuoteAndInvoice initialSubTab="proposal" />;
      case 'quotation':
        return <QuoteAndInvoice initialSubTab="quotation" />;
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
    <div className="flex flex-col h-screen bg-white font-sans text-slate-800 overflow-hidden relative">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-[#0f172a] text-white flex items-center justify-between px-4 md:px-6 shrink-0 z-50 border-b border-slate-800">
        {/* Left: MetaGreen Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          {logos.companyLogo ? (
            <img src={logos.companyLogo} alt="MetaGreen Logo" className="h-9 max-w-[140px] object-contain" />
          ) : (
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
              <Sun className="w-5 h-5 text-slate-950 font-bold" />
            </div>
          )}
          <div className="hidden sm:block">
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              {logos.companyName || 'Meta Green'}
            </span>
            <p className="text-[10px] text-slate-400 font-medium -mt-1">
              {logos.tagline || 'Solar Enterprise ERP'}
            </p>
          </div>
        </div>

        {/* Center: Notice Board / Trial Banner */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1 bg-slate-900/90 border border-slate-800 rounded-full text-xs font-bold max-w-xl mx-4 overflow-hidden shadow-inner">
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
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              sessionStorage.setItem('metagreen_landing', 'true');
              setIsLandingPageMode(true);
            }}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-all shadow-xs"
            title="Switch to Public Landing Page"
          >
            <Globe className="w-3.5 h-3.5" /> Landing Page
          </button>

          {canPunch && (
            <button 
              onClick={handlePunch}
              className={cn(
                "hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold transition-all shadow-sm",
                isPunchedIn ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              {isPunchedIn ? 'Punch Out' : 'Punch In'}
            </button>
          )}

          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            {/* Dark / Light Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            {/* Profile Settings */}
            <button 
              onClick={() => setIsProfileModalOpen(true)} 
              className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors" 
              title="Profile Settings"
            >
              <UserIcon className="w-4 h-4" />
            </button>

            <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center font-black text-xs ring-2 ring-emerald-950 text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* Logout Icon */}
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-red-400 transition-colors" 
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Numbered & Sub-Header Navigation Bar */}
        <Sidebar currentView={currentView} setView={handleViewChange} userRole={user.role} />
        
        <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {renderView()}
            </div>
          </div>
        </main>
      </div>

      {/* Floating MetaGreen Support / Contact Us Widget */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsSupportDrawerOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 rounded-full shadow-2xl transition-all hover:scale-105 font-bold text-xs group"
        >
          <HelpCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>MetaGreen Support / Contact</span>
        </button>
      </div>

      {/* Support Contact Drawer / Modal */}
      {isSupportDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
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

      {/* Profile Settings Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Profile Settings</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center font-black text-2xl text-white shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">{user.name}</h4>
                  <p className="text-sm font-medium text-emerald-600">{user.role}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input type="text" value={user.name} disabled className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-medium cursor-not-allowed" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                <input type="email" value={user.email} disabled className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-medium cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Account Status</label>
                <div className="px-4 py-2 border border-emerald-200 bg-emerald-50 rounded-xl text-emerald-700 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Active
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6 space-y-2">
                <button 
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    setIsChangePasswordModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 font-bold rounded-xl transition-colors text-xs"
                >
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  Change Account Password
                </button>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-xl transition-colors text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out of Meta Green
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
import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Calculator, 
  MapPin, 
  Sun, 
  Package, 
  TrendingUp, 
  FileText,
  Headphones,
  Building,
  Wrench,
  DollarSign,
  UserCheck,
  Sparkles,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { MetaGreenLogo } from './MetaGreenLogo';
import { authService } from '../services/auth.service';
import { subscriptionService, SubscriptionPlan } from '../services/subscription.service';
import VendorRegistrationModal from './VendorRegistrationModal';
import { cn } from '../lib/utils';

export default function Login() {
  // Persona Tab Selector
  const [selectedPersona, setSelectedPersona] = useState<'admin' | 'vendor' | 'installer' | 'sales' | 'finance' | 'customer'>('admin');
  
  const [email, setEmail] = useState('admin@solar.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Dedicated Persona Specifications
  const PERSONAS = [
    {
      id: 'admin',
      label: '👑 Global Admin',
      email: 'admin@solar.com',
      pass: 'admin123',
      roleTitle: 'Solar Enterprise Super Admin',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Full ERP Operations, Multi-Vendor Governance, Subsidies & Executive Analytics.',
      features: ['Full Master Control', 'All Vendor POs', 'PM Surya Ghar Claims', 'System Configuration']
    },
    {
      id: 'vendor',
      label: '🏢 Vendor Portal',
      email: 'vendor@vikramsolar.com',
      pass: 'vendor123',
      roleTitle: 'Authorized Equipment Vendor (Vikram Solar)',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'Vendor-wise PO Acceptances, Dispatch Challans, Supplied Stock & Employee Accounts.',
      features: ['Vendor PO Acceptances', 'Live Catalog Supply', 'Vendor Staff Accounts', 'Address & GSTIN Sync']
    },
    {
      id: 'installer',
      label: '🔧 Field Installer',
      email: 'installer@solar.com',
      pass: 'installer123',
      roleTitle: 'Lead Site Installation Engineer',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      description: 'Project Milestones, Assigned Hardware Kit Consumption, Site Surveys & Requisitions.',
      features: ['Site Hardware Consumption', 'Task Stage Advancements', 'Material Requisitions', 'Installation Proofs']
    },
    {
      id: 'sales',
      label: '💼 Sales & Design',
      email: 'sales@solar.com',
      pass: 'sales123',
      roleTitle: 'Solar Sales & Design Specialist',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      description: 'CRM Lead Drop Pin, Rooftop Solar Design Engine, Proposals & Quotation Generators.',
      features: ['CRM Leads with Reverse Geocode', '3D Solar Design Engine', 'Instant Proposal Builder', 'Quotation PDFs']
    },
    {
      id: 'finance',
      label: '💰 Finance & Accounts',
      email: 'finance@solar.com',
      pass: 'finance123',
      roleTitle: 'Finance & Tax Accountant',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      description: 'Tax Invoices, Customer Payment Milestones, PM Surya Ghar Subsidies & Ledger.',
      features: ['GST Tax Invoices', 'Subsidies Tracking', 'Customer EMI/Payments', 'Work Orders & Payouts']
    },
    {
      id: 'customer',
      label: '👤 Customer Portal',
      email: 'customer@solar.com',
      pass: 'customer123',
      roleTitle: 'Residential Solar Rooftop Owner',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      description: 'Live Project Stage Tracker, Daily Generation Insights, AMC & Support Tickets.',
      features: ['Live Installation Progress', 'Generation Dashboard', 'AMC Warranty Vault', 'Support Tickets']
    }
  ];

  const handleSelectPersona = (pId: typeof selectedPersona) => {
    setSelectedPersona(pId);
    const target = PERSONAS.find(p => p.id === pId);
    if (target) {
      setEmail(target.email);
      setPassword(target.pass);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(email, password);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('auth/operation-not-allowed'))) {
        setError('Email/Password sign-in is disabled in Firebase Console.');
      } else {
        setError(err.message || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const activePersonaObj = PERSONAS.find(p => p.id === selectedPersona) || PERSONAS[0];

  return (
    <div className="h-screen w-screen max-h-screen max-w-vw bg-slate-950 flex flex-col justify-between font-sans text-slate-100 antialiased selection:bg-emerald-500 selection:text-white overflow-hidden p-3 sm:p-4 fixed inset-0">
      
      {/* Main Container */}
      <main className="flex-1 flex flex-col lg:flex-row items-stretch max-w-[1600px] w-full mx-auto gap-4 lg:gap-6 min-h-0 overflow-hidden">
        
        {/* LEFT HERO SECTION */}
        <div className="flex-1 bg-slate-900/90 rounded-3xl border border-slate-800 p-5 lg:p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-0 backdrop-blur-md">
          
          {/* Subtle background grid pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

          {/* Top Hero Text & Features */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <MetaGreenLogo size="md" />
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-emerald-400" /> Multi-Role Solar ERP Portal
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
              Enterprise Solar ERP & <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                Connected Operations Platform
              </span>
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
              Unified ecosystem linking Global Super Admins, Equipment Vendors, Field Installers, Sales Representatives, and Solar Customers in real-time.
            </p>

            {/* 3 Feature Bullets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="flex items-start gap-2.5 p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5 border border-emerald-500/30">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Multi-Role Governance</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Role-scoped dashboards & permissions.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5 border border-amber-500/30">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Vendor & PO Supply</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Direct PO acceptance & live stock dispatch.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl shrink-0 mt-0.5 border border-teal-500/30">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Installer Site Engine</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">BOM site consumption & photo proof uploads.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Central Solar Connected Satellite Diagram */}
          <div className="my-2 relative z-10 flex items-center justify-center flex-1 min-h-[180px]">
            {/* Outer Concentric Animated Ring */}
            <div className="w-[190px] h-[190px] lg:w-[220px] lg:h-[220px] rounded-full border-2 border-dashed border-emerald-500/40 absolute animate-[spin_45s_linear_infinite] flex items-center justify-center">
              <div className="w-[130px] h-[130px] lg:w-[150px] lg:h-[150px] rounded-full border border-teal-500/30" />
            </div>

            {/* Center Logo Hub */}
            <div className="relative z-20 w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-slate-900 shadow-2xl border-4 border-emerald-500/50 flex items-center justify-center p-2">
              <MetaGreenLogo size="sm" showText={false} />
            </div>

            {/* 6 Circular Satellite Badges */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute -top-1 bg-slate-900 border border-emerald-500/40 shadow-xl rounded-full px-2.5 py-1 flex items-center gap-1.5 pointer-events-auto">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">👑 GLOBAL ADMIN</span>
              </div>

              <div className="absolute top-4 right-1 lg:right-4 bg-slate-900 border border-amber-500/40 shadow-xl rounded-full px-2.5 py-1 flex items-center gap-1.5 pointer-events-auto">
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">🏢 VENDOR PORTAL</span>
              </div>

              <div className="absolute bottom-4 right-1 lg:right-4 bg-slate-900 border border-teal-500/40 shadow-xl rounded-full px-2.5 py-1 flex items-center gap-1.5 pointer-events-auto">
                <span className="text-[9px] font-black text-teal-400 uppercase tracking-wider">🔧 FIELD INSTALLER</span>
              </div>

              <div className="absolute -bottom-1 bg-slate-900 border border-blue-500/40 shadow-xl rounded-full px-2.5 py-1 flex items-center gap-1.5 pointer-events-auto">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider">💼 SALES & DESIGN</span>
              </div>

              <div className="absolute bottom-4 left-1 lg:left-4 bg-slate-900 border border-purple-500/40 shadow-xl rounded-full px-2.5 py-1 flex items-center gap-1.5 pointer-events-auto">
                <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider">💰 FINANCE & TAX</span>
              </div>

              <div className="absolute top-4 left-1 lg:left-4 bg-slate-900 border border-indigo-500/40 shadow-xl rounded-full px-2.5 py-1 flex items-center gap-1.5 pointer-events-auto">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">👤 CUSTOMER PORTAL</span>
              </div>
            </div>
          </div>

          {/* Bottom Hero Metrics Bar & Security Badges */}
          <div className="relative z-10 space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/80 text-center">
              <div>
                <p className="text-sm lg:text-base font-black text-white">5,000+</p>
                <p className="text-[9px] font-semibold text-slate-400">Projects Tracked</p>
              </div>
              <div>
                <p className="text-sm lg:text-base font-black text-emerald-400">₹78,000</p>
                <p className="text-[9px] font-semibold text-slate-400">Max PM Surya Ghar</p>
              </div>
              <div>
                <p className="text-sm lg:text-base font-black text-teal-400">99.9%</p>
                <p className="text-[9px] font-semibold text-slate-400">Cloud Uptime</p>
              </div>
              <div>
                <p className="text-sm lg:text-base font-black text-amber-400">Multi-Vendor</p>
                <p className="text-[9px] font-semibold text-slate-400">PO Distribution</p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT MULTI-PERSONA SIGN-IN CARD */}
        <div className="w-full lg:w-[440px] xl:w-[480px] bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-2xl flex flex-col justify-between shrink-0 overflow-y-auto max-h-full">
          <div className="space-y-4">
            
            {/* Header */}
            <div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-0.5">MetaGreen Authentication Portal</span>
              <h2 className="text-2xl font-black text-white tracking-tight">Select Sign-In Portal</h2>
              <p className="text-xs font-medium text-slate-400 mt-1">
                Choose your operational role to launch your customized workspace.
              </p>
            </div>

            {/* Persona Selector Tabs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPersona(p.id as any)}
                  className={cn(
                    "px-2.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-left flex flex-col justify-between gap-1 border",
                    selectedPersona === p.id 
                      ? "bg-slate-800 text-white border-emerald-500 shadow-md ring-1 ring-emerald-500/30" 
                      : "bg-slate-900/50 text-slate-400 border-transparent hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  <span className="truncate">{p.label}</span>
                  {selectedPersona === p.id && (
                    <span className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Active
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Selected Persona Info Box */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider", activePersonaObj.badgeColor)}>
                  {activePersonaObj.roleTitle}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {activePersonaObj.description}
              </p>

              {/* Capabilities checklist */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {activePersonaObj.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              {error && (
                <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-2xl text-xs font-bold">
                  {error}
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Login Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-12 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-emerald-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white text-[10px] font-bold"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-600 rounded border-slate-700"
                  />
                  Remember login
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In as {activePersonaObj.label.replace(/^[^\s]+\s*/, '')}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Subscription Registration Trigger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>New Vendor / Installer? Register for 7-Day Free Trial</span>
              </button>
            </div>

          </div>

          {/* Footer Copyright */}
          <div className="pt-4 border-t border-slate-800 text-center space-y-1 mt-4">
            <p className="text-[10px] text-slate-400 font-semibold">
              © 2026 MetaGreen Technologies Pvt. Ltd. • ISO 27001 Certified Solar Enterprise ERP
            </p>
          </div>

        </div>

      </main>

      {/* Subscription Registration Modal */}
      {isRegisterModalOpen && (
        <VendorRegistrationModal
          selectedPlan={{
            id: 'plan-3-user',
            name: 'Starter Solar Enterprise (3 Users)',
            userLimit: 3,
            storageGBLimit: 10,
            priceMonthly: 4999,
            trialEnabled: true,
            trialDays: 7,
            status: 'active',
            features: [
              'Up to 3 Team Users',
              '10 GB Encrypted Storage Vault',
              '7-Day Free Trial Included',
              'PO & Auto-Inventory Sync',
              'Quotes & Tax Invoice Generator',
              'Installer & Vendor Workflows'
            ]
          }}
          allPlans={[]}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false);
          }}
        />
      )}
    </div>
  );
}


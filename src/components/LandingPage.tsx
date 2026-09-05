import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  Check,
  ArrowRight,
  Sparkles,
  Users,
  HardDrive,
  ShoppingCart,
  FileText,
  Sun,
  Moon,
  Lock,
  ChevronRight,
  ChevronDown,
  Calculator,
  Building2,
  Phone,
  Mail,
  Award,
  Globe,
  Menu,
  X,
  Layers,
  BarChart3,
  TrendingUp,
  Cloud,
  Smartphone,
  Cpu,
  Headphones,
  Settings2,
  ClipboardCheck,
  LineChart,
  Box,
  Wrench,
  HelpCircle,
  IndianRupee,
  Star,
  RefreshCw,
  Share2,
  PieChart,
  PhoneCall,
  UserPlus,
  Play,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  FileSpreadsheet,
  CheckSquare,
  KeyRound,
  Shield,
  Server,
  Layers3,
  BadgeCheck,
  Flame,
  Clock,
  LayoutGrid,
  CheckCircle
} from 'lucide-react';
import { MetaGreenLogo } from './MetaGreenLogo';
import { subscriptionService, SubscriptionPlan } from '@/src/services/subscription.service';
import VendorRegistrationModal from './VendorRegistrationModal';
import LoginModal from './LoginModal';
import BookDemoModal from './BookDemoModal';
import ContactCareerModal, { ContactPurpose } from './ContactCareerModal';

interface LandingPageProps {
  onLoginSuccess: () => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBookDemoOpen, setIsBookDemoOpen] = useState(false);
  const [isContactCareerOpen, setIsContactCareerOpen] = useState(false);
  const [contactPurpose, setContactPurpose] = useState<ContactPurpose>('Sales');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeSolutionTab, setActiveSolutionTab] = useState<'design' | 'crm' | 'procurement' | 'finance' | 'audit'>('design');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Interactive Calculator State
  const [monthlyBill, setMonthlyBill] = useState(7500);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    async function loadPlans() {
      try {
        const fetchedPlans = await subscriptionService.getSubscriptionPlans();
        setPlans(fetchedPlans);
      } catch (e) {
        console.error('Failed to load plans:', e);
      }
    }
    loadPlans();

    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const DEFAULT_FALLBACK_PLAN: SubscriptionPlan = {
    id: 'plan_starter',
    name: 'Starter Solar EPC',
    userLimit: 5,
    storageGBLimit: 50,
    priceMonthly: 4999,
    trialEnabled: true,
    trialDays: 7,
    status: 'active',
    features: [
      '3D Solar CAD Rooftop Layout Engine',
      'Solar Lead CRM & Geotagged Surveys',
      'PM Surya Ghar Govt Subsidy Tracker',
      'GST Tax Invoice & E-Way Bill Generator'
    ]
  };

  const handleStartTrial = (plan?: SubscriptionPlan) => {
    setSelectedPlan(plan || plans[0] || DEFAULT_FALLBACK_PLAN);
    setIsRegisterModalOpen(true);
  };

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSolutionClick = (tabId: 'design' | 'crm' | 'procurement' | 'finance' | 'audit', e: React.MouseEvent) => {
    e.preventDefault();
    setActiveSolutionTab(tabId);
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    const el = document.getElementById('solutions-tabs');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Solar ROI Computations
  const recommendedKw = Math.max(1, Math.round((monthlyBill / 1200) * 10) / 10);
  const estimatedSubsidy = recommendedKw <= 1 ? 30000 : recommendedKw <= 2 ? 60000 : 78000;
  const annualSavings = Math.round(monthlyBill * 12 * 0.88);
  const estimatedSystemCost = Math.round(recommendedKw * 58000);
  const netInvestment = Math.max(0, estimatedSystemCost - estimatedSubsidy);
  const paybackYears = (netInvestment / Math.max(1, annualSavings)).toFixed(1);

  // Solution Categories Data
  const solutionTabs = [
    {
      id: 'design',
      label: '3D Solar & AI Layout',
      icon: Cpu,
      title: 'Automated 3D Rooftop Modeling & Shading Analysis',
      subtitle: 'Engineered for solar EPCs to generate accurate single-line diagrams, shading loss maps, and customer proposals in seconds.',
      features: [
        'AI Panel Placement & Tilt Optimization',
        '360° Sun Path & Shadow Simulation',
        'Automatic Single-Line Diagram (SLD) Export',
        'Instant Customer ROI & Payback Pitchbook'
      ],
      metric: '99.4% Generation Model Accuracy'
    },
    {
      id: 'crm',
      label: 'CRM & Lead Pipeline',
      icon: Users,
      title: 'End-to-End Customer Journey & Site Surveying',
      subtitle: 'Streamline lead capture, automated follow-ups, survey dispatching, and sales executive commission tracking.',
      features: [
        'Multi-Channel Lead Capture & Auto-Routing',
        'Mobile Geotagged Site Survey App',
        'Quotation & Contract E-Signing',
        'Real-time Customer Portal & Status Tracker'
      ],
      metric: '3.5x Faster Lead Conversion'
    },
    {
      id: 'procurement',
      label: 'Procurement & Stock',
      icon: Box,
      title: 'Multi-Warehouse Inventory & Supplier Portal',
      subtitle: 'Eliminate stockouts and track panels, inverters, and mounting structures down to the exact serial barcode.',
      features: [
        'Barcode / QR Serial Number Tracking',
        'Vendor Purchase Order (PO) Workflows',
        'Stock Threshold Alert & Reorder Triggers',
        'Warranty Registration & Tracking'
      ],
      metric: 'Zero Inventory Leakage'
    },
    {
      id: 'finance',
      label: 'Finance & GST Invoices',
      icon: IndianRupee,
      title: 'Automated GST Invoicing & Subsidy Tracking',
      subtitle: 'Comply with government subsidy (PM Surya Ghar) regulations, issue tax invoices, and reconcile payments seamlessly.',
      features: [
        '1-Click Tax Invoice & E-Way Bill Generation',
        'Milestone Payment Scheduling & Reminders',
        'PM Surya Ghar Govt Subsidy Status Tracker',
        'Seamless Sync with MetaLedger & Tally'
      ],
      metric: '100% Tax & Subsidy Compliance'
    },
    {
      id: 'audit',
      label: 'Field Audit & Quality',
      icon: ClipboardCheck,
      title: 'Geotagged Field Audits & Quality Control',
      subtitle: 'Empower field engineers and auditors with digital inspection checklists and verified compliance reports.',
      features: [
        'GPS Geotagged Quality Checklists',
        'Photo Evidence Capture & Tamper Protection',
        'Engineer Sign-off & Client Approvals',
        'Immutable Audit Logs for Regulators'
      ],
      metric: 'Zero Human Inspection Errors'
    }
  ];

  // FAQ Items
  const faqList = [
    {
      q: 'How does MetaGreen integrate with MetaCheck and the MetaEcosystem?',
      a: 'MetaGreen natively connects with MetaCheck for instant vendor, employee, and customer identity verification, and syncs seamlessly with MetaLedger for financial reconciliation and MetaHire for workforce deployment.'
    },
    {
      q: 'Can MetaGreen handle PM Surya Ghar government subsidy processing?',
      a: 'Yes! MetaGreen includes dedicated PM Surya Ghar subsidy tracking modules, document verification workflows, and automated submission logging to keep your projects 100% compliant.'
    },
    {
      q: 'Is my enterprise data secure and compliant with SOC 2 / ISO standards?',
      a: 'Absolutely. MetaGreen operates with logical tenant isolation, 256-bit AES encryption at rest and in transit, role-based access controls (RBAC), and immutable timestamped audit logs for every system transaction.'
    },
    {
      q: 'How quickly can our team migrate from spreadsheets or existing tools?',
      a: 'Most solar EPCs and enterprise teams go live within 48 hours using our automated CSV importer and guided onboarding concierge.'
    },
    {
      q: 'Do field survey engineers need an active internet connection?',
      a: 'Our mobile field survey app supports offline mode. Survey data, photos, and GPS tags automatically sync back to the cloud as soon as connection is restored.'
    }
  ];

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 overflow-x-hidden ${isDarkMode
      ? 'bg-[#050914] text-slate-100 selection:bg-emerald-500 selection:text-slate-950'
      : 'bg-[#F8FAFC] text-slate-900 selection:bg-emerald-500 selection:text-white'
      }`}>

      {/* ========================================================================= */}
      {/* 1. TOP GLASSMORPHISM NAVBAR (MetaCheck Style)                             */}
      {/* ========================================================================= */}
      <header className={`sticky top-0 z-40 transition-all backdrop-blur-xl border-b ${isDarkMode
        ? 'bg-[#080E1E]/85 border-slate-800/80 text-white'
        : 'bg-white/85 border-slate-200/80 text-slate-900'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => scrollToSection(e, 'hero')}
              className="cursor-pointer flex items-center gap-2 group"
            >
              <MetaGreenLogo size="md" variant={isDarkMode ? 'dark' : 'light'} />
            </button>
          </div>

          {/* Desktop Navigation Center */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold tracking-tight">

            {/* Solutions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('solutions')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center gap-1 hover:text-emerald-500 transition-colors py-2 cursor-pointer">
                Solutions <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'solutions' ? 'rotate-180 text-emerald-500' : ''}`} />
              </button>

              {activeDropdown === 'solutions' && (
                <div className={`absolute top-full left-0 w-84 p-3 rounded-2xl shadow-2xl border backdrop-blur-2xl transition-all duration-150 ${isDarkMode ? 'bg-[#0C152B] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                  <div className="space-y-1">
                    <a href="#solutions-tabs" onClick={(e) => handleSolutionClick('design', e)} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-500/10 transition-colors group">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs">3D Solar & AI Layout</p>
                        <p className="text-[11px] font-normal text-slate-400">Automated rooftop modeling & shading analysis.</p>
                      </div>
                    </a>

                    <a href="#solutions-tabs" onClick={(e) => handleSolutionClick('crm', e)} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-500/10 transition-colors group">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs">CRM & Lead Pipeline</p>
                        <p className="text-[11px] font-normal text-slate-400">Geotagged site surveys & customer portal.</p>
                      </div>
                    </a>

                    <a href="#solutions-tabs" onClick={(e) => handleSolutionClick('procurement', e)} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-500/10 transition-colors group">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs">Procurement & Warehouse Stock</p>
                        <p className="text-[11px] font-normal text-slate-400">Barcode QR serial tracking & PO workflows.</p>
                      </div>
                    </a>

                    <a href="#solutions-tabs" onClick={(e) => handleSolutionClick('finance', e)} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-500/10 transition-colors group">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <IndianRupee className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs">Finance & GST Invoicing</p>
                        <p className="text-[11px] font-normal text-slate-400">PM Surya Ghar subsidy status & tax invoices.</p>
                      </div>
                    </a>

                    <a href="#solutions-tabs" onClick={(e) => handleSolutionClick('audit', e)} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-500/10 transition-colors group">
                      <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                        <ClipboardCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs">Field Audit & Quality Control</p>
                        <p className="text-[11px] font-normal text-slate-400">GPS geotagged quality checklists & tamper logs.</p>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* About Link */}
            <a
              href="#about"
              onClick={(e) => scrollToSection(e, 'about')}
              className="hover:text-emerald-500 transition-colors cursor-pointer"
            >
              About
            </a>

            {/* Ecosystem Link */}
            <a
              href="#ecosystem"
              onClick={(e) => scrollToSection(e, 'ecosystem')}
              className="hover:text-emerald-500 transition-colors cursor-pointer"
            >
              MetaEcosystem
            </a>

            {/* Security & Trust */}
            <a
              href="#security"
              onClick={(e) => scrollToSection(e, 'security')}
              className="hover:text-emerald-500 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Security & Trust
            </a>

            {/* Pricing Link */}
            <a
              href="#pricing"
              onClick={(e) => scrollToSection(e, 'pricing')}
              className="hover:text-emerald-500 transition-colors cursor-pointer"
            >
              Pricing
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${isDarkMode
                ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              title="Toggle Light/Dark Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Book Demo Button */}
            <button
              onClick={() => setIsBookDemoOpen(true)}
              className={`hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isDarkMode
                ? 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-white'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                }`}
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
              Book Demo
            </button>

            {/* Sign In Button */}
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className={`hidden md:inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isDarkMode
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => handleStartTrial()}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-emerald-500/20 hover:scale-[1.02] flex items-center gap-1.5"
            >
              Start Free Trial
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className={`lg:hidden px-4 py-6 border-b space-y-4 backdrop-blur-xl ${isDarkMode ? 'bg-[#080E1E] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
            <div className="space-y-3 font-bold text-sm">
              <a href="#solutions-tabs" onClick={(e) => scrollToSection(e, 'solutions-tabs')} className="block py-1 hover:text-emerald-500">Solutions</a>
              <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="block py-1 hover:text-emerald-500">About Us</a>
              <a href="#ecosystem" onClick={(e) => scrollToSection(e, 'ecosystem')} className="block py-1 hover:text-emerald-500">MetaEcosystem</a>
              <a href="#security" onClick={(e) => scrollToSection(e, 'security')} className="block py-1 hover:text-emerald-500">Security & Trust</a>
              <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="block py-1 hover:text-emerald-500">Pricing</a>
            </div>

            <div className="pt-4 border-t border-slate-700/50 flex flex-col gap-2.5">
              <button
                onClick={() => { setMobileMenuOpen(false); setIsBookDemoOpen(true); }}
                className="w-full py-2.5 bg-emerald-500/10 text-emerald-500 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" /> Schedule Live Demo
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); setIsLoginModalOpen(true); }}
                className="w-full py-2.5 bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" /> Sign In to Dashboard
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION WITH LIVE INTERACTIVE WIDGET (MetaCheck Style)            */}
      {/* ========================================================================= */}
      <section id="hero" className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Background Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">

              {/* High-Impact Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                Verify, Design & Manage Every Solar Project with{' '}
                <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 bg-clip-text text-transparent">
                  Unmatched Precision.
                </span>
              </h1>

              {/* Sub-headline */}
              <p className={`text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                The all-in-one platform for solar EPCs and enterprise operations. Generate 3D solar layouts, automate GST & subsidy invoicing, track multi-warehouse inventory, and empower field engineers — built on an immutable trust foundation.
              </p>

              {/* CTAs & Trial Info */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => handleStartTrial()}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 rounded-2xl text-sm font-black transition-all cursor-pointer shadow-xl shadow-emerald-500/25 hover:scale-105 flex items-center justify-center gap-2 group"
                >
                  Start 14-Day Free Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setIsBookDemoOpen(true)}
                  className={`w-full sm:w-auto px-6 py-4 rounded-2xl text-sm font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${isDarkMode
                    ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-sm'
                    }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Schedule Guided Demo
                </button>
              </div>

              {/* Quick Trust Feature Chips */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> PM Surya Ghar Compliant
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant Setup in 2 Mins
                </span>
              </div>
            </div>

            {/* Right Column: Live Interactive Card Widget (MetaCheck Signature Design) */}
            <div className="lg:col-span-6 relative">

              {/* Outer Decorative Gradient Border Card */}
              <div className={`p-1 rounded-3xl bg-gradient-to-b from-emerald-500/30 via-teal-500/10 to-indigo-500/30 shadow-2xl backdrop-blur-xl transition-all duration-300 ${isDarkMode ? 'bg-slate-900/90' : 'bg-white/90'
                }`}>
                <div className={`p-5 sm:p-6 rounded-[22px] space-y-5 ${isDarkMode ? 'bg-[#0B132B]' : 'bg-slate-50/90'
                  }`}>

                  {/* Top Live Header Status Bar */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-500">System Live Stream</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" /> 100% Operational
                      </span>
                      <span className="hidden sm:inline-block">•</span>
                      <span className="hidden sm:inline-block">1,420 Checks/Hr</span>
                    </div>
                  </div>

                  {/* Operational Cards Feed */}
                  <div className="space-y-3">

                    {/* Item 1: Verification Approved */}
                    <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${isDarkMode ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                          <BadgeCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">Solar Project #MG-9402 Approved</p>
                          <p className="text-[11px] text-slate-400">Apex Solar Corp • 150 kW Commercial Rooftop</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold uppercase">
                        GST Verified
                      </span>
                    </div>

                    {/* Item 2: 3D Layout AI Generation */}
                    <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${isDarkMode ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                          <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">3D Photovoltaic Layout Computed</p>
                          <p className="text-[11px] text-slate-400">Shading Loss: 1.2% • Annual Generation: 214,000 kWh</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-extrabold uppercase">
                        AI Score 0.99
                      </span>
                    </div>

                    {/* Item 3: GST Invoice & Subsidy */}
                    <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${isDarkMode ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                          <IndianRupee className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">GST Tax Invoice #INV-8821 Issued</p>
                          <p className="text-[11px] text-slate-400">PM Surya Ghar Subsidy Tracker Synced • ₹14.5L</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-extrabold uppercase">
                        Synced
                      </span>
                    </div>

                  </div>

                  {/* Bottom Metrics Bar */}
                  <div className="pt-3 border-t border-slate-700/40 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-emerald-500/5">
                      <p className="text-sm font-black text-emerald-500">12M+</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Records Processed</p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/5">
                      <p className="text-sm font-black text-blue-500">&lt; 2 Mins</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Turnaround Time</p>
                    </div>
                    <div className="p-2 rounded-lg bg-indigo-500/5">
                      <p className="text-sm font-black text-indigo-500">99.9%</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Audit Accuracy</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. METAECOSYSTEM CROSS-PRODUCT SUITE BAR (MetaCheck Feature)              */}
      {/* ========================================================================= */}
      <section id="ecosystem" className={`py-8 border-y transition-colors ${isDarkMode ? 'bg-[#080E1E] border-slate-800' : 'bg-slate-100/70 border-slate-200'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
            Unified Ecosystem • Seamless Integrations Across Platform Suites
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">

            <a
              href="https://metadev.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-700/40 bg-slate-800/30 hover:bg-slate-800/60 hover:border-emerald-500/40 flex items-center gap-2.5 justify-center opacity-80 hover:opacity-100 transition-all group cursor-pointer"
              title="MetaDev - Developer APIs & Infrastructure"
            >
              <Cpu className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">MetaDev</span>
              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all" />
            </a>

            <a
              href="https://metaads.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-700/40 bg-slate-800/30 hover:bg-slate-800/60 hover:border-indigo-500/40 flex items-center gap-2.5 justify-center opacity-80 hover:opacity-100 transition-all group cursor-pointer"
              title="MetaAds - Solar Lead Gen & AI Marketing"
            >
              <TrendingUp className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">MetaAds</span>
              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
            </a>

            <a
              href="https://metacheck.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-700/40 bg-slate-800/30 hover:bg-slate-800/60 hover:border-emerald-500/40 flex items-center gap-2.5 justify-center opacity-80 hover:opacity-100 transition-all group cursor-pointer"
              title="MetaCheck - Identity Verification & KYB"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">MetaCheck</span>
              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all" />
            </a>

            <div className="p-3 rounded-xl border border-emerald-500/50 bg-emerald-500/10 flex items-center gap-2.5 justify-center ring-2 ring-emerald-500/30 shadow-md" title="MetaGreen Solar EPC ERP (Active App)">
              <Sun className="w-4 h-4 text-emerald-400 animate-spin-slow" />
              <span className="text-xs font-black text-emerald-400">MetaGreen</span>
            </div>

            <a
              href="https://metahire.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-700/40 bg-slate-800/30 hover:bg-slate-800/60 hover:border-blue-500/40 flex items-center gap-2.5 justify-center opacity-80 hover:opacity-100 transition-all group cursor-pointer"
              title="MetaHire - Technician Staffing & Hiring"
            >
              <Users className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">MetaHire</span>
              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
            </a>

            <a
              href="https://metaledger.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-700/40 bg-slate-800/30 hover:bg-slate-800/60 hover:border-purple-500/40 flex items-center gap-2.5 justify-center opacity-80 hover:opacity-100 transition-all group cursor-pointer"
              title="MetaLedger - GST Accounting & Financial ERP"
            >
              <IndianRupee className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">MetaLedger</span>
              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all" />
            </a>

            <a
              href="https://metape.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-700/40 bg-slate-800/30 hover:bg-slate-800/60 hover:border-amber-500/40 flex items-center gap-2.5 justify-center opacity-80 hover:opacity-100 transition-all group cursor-pointer"
              title="MetaPe - B2B Solar Payments & Escrow"
            >
              <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">MetaPe</span>
              <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all" />
            </a>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ABOUT US SECTION                                                         */}
      {/* ========================================================================= */}
      <section id="about" className={`py-20 border-t transition-colors ${isDarkMode ? 'bg-[#060B17] border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" /> About MetaGreen Enterprise
              </span>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Empowering the Future of Solar Energy Operations Across India
              </h2>

              <p className={`text-sm sm:text-base font-medium leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                MetaGreen is an all-in-one Enterprise ERP engineered specifically for Solar EPC companies, installers, and multi-branch operations. Our mission is to streamline solar project lifecycles—from AI 3D rooftop layouts and CRM lead management to QR inventory tracking, GST tax invoicing, and PM Surya Ghar government subsidy compliance.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center gap-2 justify-center mb-2 font-black">
                    <Sun className="w-5 h-5" />
                  </div>
                  <p className={`font-bold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>3D Solar Engineering</p>
                  <p className={`text-xs mt-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Precise rooftop CAD layout and shading simulation in under 2 minutes.</p>
                </div>

                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center gap-2 justify-center mb-2 font-black">
                    <Globe className="w-5 h-5" />
                  </div>
                  <p className={`font-bold text-xs ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Unified MetaEcosystem</p>
                  <p className={`text-xs mt-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Natively synced with MetaCheck, MetaLedger, MetaHire, MetaAds & MetaPe.</p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <button
                  onClick={() => setIsBookDemoOpen(true)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-2"
                >
                  Learn More & Book Demo <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Card Showcase */}
            <div className="lg:col-span-6">
              <div className={`p-8 rounded-3xl border shadow-2xl relative overflow-hidden ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="space-y-6">
                  <div className={`flex items-center justify-between border-b pb-4 ${isDarkMode ? 'border-slate-700/60' : 'border-slate-200'}`}>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-emerald-500">MetaGreen Vision</p>
                      <p className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Clean Energy • Zero Leakage Operations</p>
                    </div>
                    <MetaGreenLogo size="sm" variant={isDarkMode ? 'dark' : 'light'} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className={`font-bold text-xs ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>End-to-End Solar EPC Digitization</p>
                        <p className={`text-xs mt-0.5 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Eliminate manual paperwork with real-time field surveys, quotation builders, and automated BOQ generation.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className={`font-bold text-xs ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>Government Subsidy Automation</p>
                        <p className={`text-xs mt-0.5 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Full audit trail and direct verification logging for PM Surya Ghar and state solar subsidy schemes.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className={`font-bold text-xs ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>Enterprise Security & Compliance</p>
                        <p className={`text-xs mt-0.5 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Bank-grade encryption, SOC 2 alignment, multi-tenant isolation, and timestamped activity audit logs.</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                    <p className="text-xs font-bold">Trusted by over 500+ Solar EPCs & Contractors Nationwide</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TABBED SOLUTIONS SHOWCASE (MetaCheck Signature Interactive Grid)       */}
      {/* ========================================================================= */}
      <section id="solutions-tabs" className={`py-20 border-t transition-colors ${isDarkMode ? 'bg-[#080E1E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Platform Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Modular Solutions Built for Every Phase of Operations
            </h2>
            <p className={`text-sm sm:text-base font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Whether designing rooftop solar installations, managing field survey teams, or processing vendor purchase orders, MetaGreen provides specialized modules.
            </p>
          </div>

          {/* Interactive Category Selector Tabs */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {solutionTabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeSolutionTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSolutionTab(tab.id as any)}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-105'
                    : isDarkMode
                      ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  <IconComp className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content Display Card */}
          {(() => {
            const currentTab = solutionTabs.find((t) => t.id === activeSolutionTab) || solutionTabs[0];
            const TabIcon = currentTab.icon;

            return (
              <div className={`p-8 sm:p-12 rounded-3xl border shadow-2xl transition-all ${isDarkMode ? 'bg-[#0B132B] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                  {/* Left Specs */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-black">
                      <TabIcon className="w-4 h-4" />
                      {currentTab.label}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                      {currentTab.title}
                    </h3>

                    <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {currentTab.subtitle}
                    </p>

                    {/* Features List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {currentTab.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-4 flex items-center gap-4">
                      <button
                        onClick={() => setIsBookDemoOpen(true)}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
                      >
                        Request Module Demo <ArrowRight className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-slate-400">{currentTab.metric}</span>
                    </div>
                  </div>

                  {/* Right Graphic Preview */}
                  <div className="lg:col-span-5">
                    <div className={`p-6 rounded-2xl border space-y-4 shadow-inner ${isDarkMode ? 'bg-slate-900/90 border-slate-700/80' : 'bg-white border-slate-200'
                      }`}>
                      <div className="flex items-center justify-between border-b border-slate-700/40 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <div className="w-3 h-3 rounded-full bg-amber-500" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">module_preview.tsx</span>
                      </div>

                      <div className="space-y-3 font-mono text-xs text-emerald-400">
                        <p className="text-slate-400">// Live module status</p>
                        <p>const module = MetaGreen.{currentTab.id.toUpperCase()};</p>
                        <p>await module.verifyAndCompute({`{ accuracy: 0.99 }`});</p>
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-sans text-xs">
                          ✅ Verified: All parameters cleared with zero compliance flags.
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. INTERACTIVE SAVINGS & ROI CALCULATOR (MetaCheck Style)                 */}
      {/* ========================================================================= */}
      <section id="calculator" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className={`p-8 sm:p-12 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0B132B] border-slate-800' : 'bg-white border-slate-200'
            }`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

              {/* Left Controls */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-black uppercase">
                  <Calculator className="w-4 h-4" /> Interactive Solar ROI Estimator
                </div>

                <h2 className="text-3xl font-black tracking-tight">
                  Calculate Savings & PM Surya Ghar Subsidy
                </h2>

                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Adjust your monthly electricity expenditure to compute recommended solar plant capacity, govt subsidies, and projected payback timeframe.
                </p>

                {/* Slider */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Monthly Electricity Bill:</span>
                    <span className="text-emerald-500 text-lg font-black">₹{monthlyBill.toLocaleString()} / mo</span>
                  </div>

                  <input
                    type="range"
                    min="1500"
                    max="50000"
                    step="500"
                    value={monthlyBill}
                    onChange={(e) => setMonthlyBill(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-bold">
                    <span>₹1,500</span>
                    <span>₹25,000</span>
                    <span>₹50,000+</span>
                  </div>
                </div>
              </div>

              {/* Right Output Cards */}
              <div className="lg:col-span-6">
                <div className="grid grid-cols-2 gap-4">

                  <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                    <p className="text-xs font-bold text-slate-400 uppercase">Recommended System</p>
                    <p className="text-3xl font-black text-emerald-500 mt-1">{recommendedKw} kW</p>
                    <p className="text-[11px] text-slate-400 mt-1">Rooftop Solar Plant</p>
                  </div>

                  <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                    <p className="text-xs font-bold text-slate-400 uppercase">Govt Subsidy (Surya Ghar)</p>
                    <p className="text-3xl font-black text-blue-500 mt-1">₹{estimatedSubsidy.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Direct Bank Transfer</p>
                  </div>

                  <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                    <p className="text-xs font-bold text-slate-400 uppercase">Est. Annual Savings</p>
                    <p className="text-3xl font-black text-teal-500 mt-1">₹{annualSavings.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400 mt-1">88% Bill Reduction</p>
                  </div>

                  <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                    <p className="text-xs font-bold text-slate-400 uppercase">Payback Timeframe</p>
                    <p className="text-3xl font-black text-indigo-500 mt-1">{paybackYears} Yrs</p>
                    <p className="text-[11px] text-slate-400 mt-1">25+ Year System Life</p>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. ENTERPRISE SECURITY & AUDIT TRAIL (MetaCheck Signature)               */}
      {/* ========================================================================= */}
      <section id="security" className={`py-20 border-t transition-colors ${isDarkMode ? 'bg-[#080E1E] border-slate-800' : 'bg-slate-100/70 border-slate-200'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Security & Trust Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Enterprise-Grade Security & Immutable Audit Trails
            </h2>
            <p className={`text-sm sm:text-base font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Every proposal generated, invoice issued, and field survey signed off is backed by immutable logs and logical tenant isolation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <div className={`p-8 rounded-3xl border space-y-4 transition-all ${isDarkMode ? 'bg-[#0B132B] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 w-fit">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Logical Tenant Isolation</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Strict row-level database controls ensure complete separation of client records, quotes, employee data, and financial transactions.
              </p>
            </div>

            <div className={`p-8 rounded-3xl border space-y-4 transition-all ${isDarkMode ? 'bg-[#0B132B] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 w-fit">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Immutable Audit Logs</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Every system modification ships with immutable evidence, timestamped geolocation, and reasoning — ready for auditors and compliance teams.
              </p>
            </div>

            <div className={`p-8 rounded-3xl border space-y-4 transition-all ${isDarkMode ? 'bg-[#0B132B] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 w-fit">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Typed SDKs & Webhooks</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Integrate MetaGreen into your existing SAP, Tally, or custom ERP stack in minutes using robust REST APIs and event-driven webhooks.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. PRICING PLANS & BILLING TOGGLE                                         */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Transparent Subscriptions</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Flexible Plans for Growing Solar EPCs & Enterprises
            </h2>

            {/* Billing Toggle */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-emerald-500' : 'text-slate-400'}`}>Monthly Billing</span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${billingCycle === 'annual' ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
                  }`} />
              </button>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-emerald-500' : 'text-slate-400'}`}>
                Annual Billing
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase">
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Starter Plan */}
            <div className={`p-8 rounded-3xl border flex flex-col justify-between space-y-6 transition-all ${isDarkMode ? 'bg-[#0B132B] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
              <div className="space-y-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Starter EPC</span>
                <p className="text-4xl font-black">
                  ₹{billingCycle === 'annual' ? '1,999' : '2,499'}
                  <span className="text-xs font-normal text-slate-400">/month</span>
                </p>
                <p className="text-xs text-slate-400">Ideal for independent solar installers & small teams up to 5 users.</p>

                <div className="space-y-2.5 pt-4 text-xs font-bold">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Up to 5 Active Team Users</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 3D Solar Layout Generator</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Mobile Site Survey App</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Basic GST Invoicing</div>
                </div>
              </div>

              <button
                onClick={() => handleStartTrial(plans[0])}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer"
              >
                Start 14-Day Free Trial
              </button>
            </div>

            {/* Growth Plan (Popular) */}
            <div className={`p-8 rounded-3xl border-2 border-emerald-500 relative flex flex-col justify-between space-y-6 transition-all shadow-xl shadow-emerald-500/10 ${isDarkMode ? 'bg-[#0E1B38]' : 'bg-white'
              }`}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                Most Popular
              </div>

              <div className="space-y-4">
                <span className="text-xs font-black text-emerald-500 uppercase tracking-wider">Commercial Growth</span>
                <p className="text-4xl font-black">
                  ₹{billingCycle === 'annual' ? '5,599' : '6,999'}
                  <span className="text-xs font-normal text-slate-400">/month</span>
                </p>
                <p className="text-xs text-slate-400">Built for growing solar companies & multi-project operators.</p>

                <div className="space-y-2.5 pt-4 text-xs font-bold">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Up to 25 Active Users</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Multi-Warehouse Stock & QR</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> PM Surya Ghar Subsidy Tracker</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Vendor Purchase Order Portal</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> MetaCheck Identity Sync</div>
                </div>
              </div>

              <button
                onClick={() => handleStartTrial(plans[1])}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/25"
              >
                Start 14-Day Free Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className={`p-8 rounded-3xl border flex flex-col justify-between space-y-6 transition-all ${isDarkMode ? 'bg-[#0B132B] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
              <div className="space-y-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Enterprise & Multi-Branch</span>
                <p className="text-4xl font-black">Custom</p>
                <p className="text-xs text-slate-400">Tailored deployments, SLA guarantees, dedicated account managers.</p>

                <div className="space-y-2.5 pt-4 text-xs font-bold">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Unlimited Users & Locations</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Dedicated Cloud / On-Premise</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Custom API & Webhook Integrations</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 24/7 Priority SLA Support</div>
                </div>
              </div>

              <button
                onClick={() => setIsBookDemoOpen(true)}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer"
              >
                Contact Sales Team
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. INTERACTIVE FAQ ACCORDION (MetaCheck Style)                             */}
      {/* ========================================================================= */}
      <section className={`py-20 border-t transition-colors ${isDarkMode ? 'bg-[#080E1E] border-slate-800' : 'bg-slate-100/70 border-slate-200'
        }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Got Questions?</span>
            <h2 className="text-3xl font-black tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqList.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all overflow-hidden ${isDarkMode ? 'bg-[#0B132B] border-slate-800' : 'bg-white border-slate-200'
                    }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between font-bold text-sm cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-emerald-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-xs text-slate-400 leading-relaxed font-medium border-t border-slate-700/30 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. HIGH-IMPACT CTA BANNER & 4-COLUMN FOOTER                               */}
      {/* ========================================================================= */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-indigo-950 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest relative z-10">
              Ready to Accelerate Operations?
            </span>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight max-w-3xl mx-auto leading-tight relative z-10">
              Transform Your Solar & Enterprise Management Today.
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-medium relative z-10">
              Join hundreds of solar EPCs and enterprise operators relying on MetaGreen for intelligent 3D design, inventory control, and verified compliance.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <button
                type="button"
                onClick={() => handleStartTrial()}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-2xl text-sm font-black transition-all cursor-pointer shadow-xl shadow-emerald-400/20 hover:scale-105"
              >
                Start Free Trial Now
              </button>
              <button
                type="button"
                onClick={() => setIsBookDemoOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold border border-slate-700 transition-all cursor-pointer hover:border-slate-500"
              >
                Schedule Guided Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`py-12 border-t text-xs transition-colors ${isDarkMode ? 'bg-[#040812] border-slate-800 text-slate-400' : 'bg-slate-900 text-slate-400'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Col 1: Brand */}
            <div className="space-y-4">
              <MetaGreenLogo size="md" variant="dark" />
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Part of the MetaEcosystem. Empowering solar EPCs and enterprise operations with intelligent 3D design, GST invoicing, and verified trust.
              </p>
            </div>

            {/* Col 2: Solutions */}
            <div className="space-y-2.5">
              <p className="font-black text-white uppercase tracking-wider">Solutions & Modules</p>
              <ul className="space-y-2">
                <li><a href="#solutions-tabs" onClick={(e) => handleSolutionClick('design', e)} className="hover:text-emerald-400 transition-colors">3D Solar & AI Layout</a></li>
                <li><a href="#solutions-tabs" onClick={(e) => handleSolutionClick('crm', e)} className="hover:text-emerald-400 transition-colors">Solar Lead CRM & Pipeline</a></li>
                <li><a href="#solutions-tabs" onClick={(e) => handleSolutionClick('procurement', e)} className="hover:text-emerald-400 transition-colors">Procurement & Warehouse Stock</a></li>
                <li><a href="#solutions-tabs" onClick={(e) => handleSolutionClick('finance', e)} className="hover:text-emerald-400 transition-colors">GST Invoicing & Subsidy Tracker</a></li>
                <li><a href="#solutions-tabs" onClick={(e) => handleSolutionClick('audit', e)} className="hover:text-emerald-400 transition-colors">Geotagged Field Audit App</a></li>
              </ul>
            </div>

            {/* Col 3: Ecosystem & Trust */}
            <div className="space-y-2.5">
              <p className="font-black text-white uppercase tracking-wider">Ecosystem & Trust</p>
              <ul className="space-y-1.5">
                <li><a href="https://metadev.in/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 inline-flex items-center gap-1">MetaDev (Dev APIs) <ArrowUpRight className="w-3 h-3 text-slate-500" /></a></li>
                <li><a href="https://metaads.in/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 inline-flex items-center gap-1">MetaAds (Lead Gen) <ArrowUpRight className="w-3 h-3 text-slate-500" /></a></li>
                <li><a href="https://metacheck.in/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 inline-flex items-center gap-1">MetaCheck (Identity Verification) <ArrowUpRight className="w-3 h-3 text-slate-500" /></a></li>
                <li><a href="https://metahire.in/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 inline-flex items-center gap-1">MetaHire (Workforce & Hiring) <ArrowUpRight className="w-3 h-3 text-slate-500" /></a></li>
                <li><a href="https://metaledger.in/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 inline-flex items-center gap-1">MetaLedger (GST & Accounting) <ArrowUpRight className="w-3 h-3 text-slate-500" /></a></li>
                <li><a href="https://metape.in/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 inline-flex items-center gap-1">MetaPe (Payments & Escrow) <ArrowUpRight className="w-3 h-3 text-slate-500" /></a></li>
                <li><a href="#security" onClick={(e) => scrollToSection(e, 'security')} className="hover:text-emerald-400">SOC 2 & ISO 27001 Security</a></li>
              </ul>
            </div>

            {/* Col 4: Contact */}
            <div className="space-y-2.5">
              <p className="font-black text-white uppercase tracking-wider">Enterprise Support</p>
              <p className="text-slate-400">Headquarters: New Delhi, India</p>
              <p className="text-slate-300 font-bold">Sales & Quotes: <span className="text-emerald-400">sales@metadev.in</span></p>
              <p className="text-slate-300 font-bold">Support: <span className="text-emerald-400">support@metadev.in</span></p>
              <div className="pt-2">
                <button
                  onClick={() => { setContactPurpose('Sales'); setIsContactCareerOpen(true); }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                >
                  Contact Enterprise Sales
                </button>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs gap-4">
            <p className="text-slate-400 font-medium">© 2026 Meta Green Enterprise ERP. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-bold text-slate-300">
              <a href="#hero" onClick={(e) => scrollToSection(e, 'hero')} className="hover:text-emerald-400 transition-colors">Home</a>
              <a href="#solutions-tabs" onClick={(e) => scrollToSection(e, 'solutions-tabs')} className="hover:text-emerald-400 transition-colors">Solutions</a>
              <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="hover:text-emerald-400 transition-colors">About Us</a>
              <a href="#ecosystem" onClick={(e) => scrollToSection(e, 'ecosystem')} className="hover:text-emerald-400 transition-colors">MetaEcosystem</a>
              <a href="#security" onClick={(e) => scrollToSection(e, 'security')} className="hover:text-emerald-400 transition-colors">Security</a>
              <a href="#calculator" onClick={(e) => scrollToSection(e, 'calculator')} className="hover:text-emerald-400 transition-colors">Calculator</a>
              <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-emerald-400 transition-colors">Pricing</a>
              <button onClick={() => setIsLoginModalOpen(true)} className="hover:text-emerald-400 cursor-pointer">Sign In</button>
              <button onClick={() => setIsBookDemoOpen(true)} className="hover:text-emerald-400 cursor-pointer">Book Demo</button>
              <button onClick={(e) => scrollToSection(e, 'hero')} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 transition-all font-black flex items-center gap-1 cursor-pointer">
                Top ↑
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 11. MODALS                                                                */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <VendorRegistrationModal
          selectedPlan={selectedPlan || plans[0] || DEFAULT_FALLBACK_PLAN}
          allPlans={plans.length > 0 ? plans : [DEFAULT_FALLBACK_PLAN]}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false);
            onLoginSuccess();
          }}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            setIsLoginModalOpen(false);
            onLoginSuccess();
          }}
          onOpenSignUp={() => {
            setIsLoginModalOpen(false);
            handleStartTrial();
          }}
        />
      )}

      {isBookDemoOpen && (
        <BookDemoModal
          onClose={() => setIsBookDemoOpen(false)}
          onOpenSignUp={() => {
            setIsBookDemoOpen(false);
            handleStartTrial();
          }}
        />
      )}

      {isContactCareerOpen && (
        <ContactCareerModal
          initialPurpose={contactPurpose}
          onClose={() => setIsContactCareerOpen(false)}
        />
      )}

      {/* Floating Scroll to Top Navigation Button */}
      {showScrollTop && (
        <button
          onClick={(e) => scrollToSection(e, 'hero')}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-2xl transition-all cursor-pointer hover:scale-105 flex items-center gap-2 text-xs font-black border border-emerald-400/40"
          title="Scroll Back to Top"
        >
          <ChevronRight className="w-4 h-4 -rotate-90" />
          <span className="hidden sm:inline">Back to Top</span>
        </button>
      )}

    </div>
  );
}

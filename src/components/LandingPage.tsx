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
  ArrowUpRight
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
  
  // Interactive ROI Calculator State
  const [monthlyBill, setMonthlyBill] = useState(6500);

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
  }, []);

  const handleStartTrial = (plan?: SubscriptionPlan) => {
    setSelectedPlan(plan || plans[0] || null);
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

  // Solar Calculator Computations
  const recommendedKw = Math.max(1, Math.round((monthlyBill / 1200) * 10) / 10);
  const estimatedSubsidy = recommendedKw <= 1 ? 30000 : recommendedKw <= 2 ? 60000 : 78000;
  const annualSavings = Math.round(monthlyBill * 12 * 0.88);
  const estimatedSystemCost = Math.round(recommendedKw * 58000);
  const netInvestment = Math.max(0, estimatedSystemCost - estimatedSubsidy);
  const paybackYears = (netInvestment / Math.max(1, annualSavings)).toFixed(1);

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 overflow-x-hidden ${
      isDarkMode ? 'bg-[#060B18] text-slate-100 selection:bg-emerald-500 selection:text-slate-950' : 'bg-[#FAFCFF] text-slate-900 selection:bg-emerald-500 selection:text-white'
    }`}>
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & NAVIGATION BAR                                            */}
      {/* ========================================================================= */}
      <header className={`sticky top-0 z-40 transition-all backdrop-blur-md border-b ${
        isDarkMode 
          ? 'bg-[#0B132B]/95 border-slate-800/80 shadow-lg shadow-black/20' 
          : 'bg-white/95 border-slate-200/80 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center shrink-0 cursor-pointer" onClick={(e) => scrollToSection(e, 'hero')}>
            <MetaGreenLogo 
              className="h-9 sm:h-10 w-auto" 
              variant={isDarkMode ? 'dark' : 'light'}
              textSub="" 
            />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs xl:text-sm font-bold">
            <button 
              onClick={(e) => scrollToSection(e, 'hero')} 
              className={`relative py-2 transition-colors cursor-pointer ${
                isDarkMode ? 'text-emerald-400 font-extrabold' : 'text-emerald-600 font-extrabold'
              }`}
            >
              Home
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-full" />
            </button>

            <button 
              onClick={(e) => scrollToSection(e, 'features')} 
              className={`py-2 transition-colors cursor-pointer ${
                isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-emerald-600'
              }`}
            >
              Features
            </button>

            <button 
              onClick={(e) => scrollToSection(e, 'solutions')} 
              className={`py-2 transition-colors cursor-pointer ${
                isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-emerald-600'
              }`}
            >
              Solutions
            </button>

            <button 
              onClick={(e) => scrollToSection(e, 'pricing')} 
              className={`py-2 transition-colors cursor-pointer ${
                isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-emerald-600'
              }`}
            >
              Pricing
            </button>

            <button 
              onClick={(e) => scrollToSection(e, 'impact')} 
              className={`py-2 transition-colors cursor-pointer ${
                isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-emerald-600'
              }`}
            >
              Customers
            </button>

            {/* Resources Dropdown */}
            <div className="relative group">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'resources' ? null : 'resources')}
                className={`py-2 flex items-center gap-1 transition-colors cursor-pointer ${
                  isDarkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-emerald-600'
                }`}
              >
                <span>Resources</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
              </button>

              <div className={`absolute top-full left-0 mt-2 w-64 rounded-2xl p-2 shadow-2xl border transition-all duration-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-700'
              }`}>
                <button 
                  onClick={(e) => scrollToSection(e, 'calculator')} 
                  className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-colors ${
                    isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-emerald-50'
                  }`}
                >
                  <Calculator className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Solar ROI Calculator</p>
                    <p className="text-[10px] text-slate-500">Estimate PM Surya Ghar subsidy & savings</p>
                  </div>
                </button>

                <button 
                  onClick={(e) => scrollToSection(e, 'solutions')} 
                  className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-colors ${
                    isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-emerald-50'
                  }`}
                >
                  <FileText className="w-4 h-4 text-teal-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">70:30 GST Compliance</p>
                    <p className="text-[10px] text-slate-500">Solar tax invoice regulations guide</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Company Dropdown */}
            <div className="relative group">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'company' ? null : 'company')}
                className={`py-2 flex items-center gap-1 transition-colors cursor-pointer ${
                  isDarkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-emerald-600'
                }`}
              >
                <span>Company</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
              </button>

              <div className={`absolute top-full left-0 mt-2 w-56 rounded-2xl p-2 shadow-2xl border transition-all duration-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-700'
              }`}>
                <button 
                  onClick={(e) => scrollToSection(e, 'impact')} 
                  className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-colors ${
                    isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-emerald-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">About MetaGreen</p>
                    <p className="text-[10px] text-slate-500">Pan-India Solar ERP Platform</p>
                  </div>
                </button>

                <button 
                  onClick={() => setIsBookDemoOpen(true)} 
                  className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-colors ${
                    isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-emerald-50'
                  }`}
                >
                  <Phone className="w-4 h-4 text-teal-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Contact & Support</p>
                    <p className="text-[10px] text-slate-500">Connect with enterprise advisors</p>
                  </div>
                </button>
              </div>
            </div>
          </nav>

          {/* Header Action Buttons & Theme Switcher */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            
            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Login Button */}
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className={`px-5 py-2.5 text-xs xl:text-sm font-bold rounded-xl transition-all flex items-center gap-2 border cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-800 shadow-sm' 
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs'
              }`}
            >
              Login
            </button>

            {/* Book Demo CTA Button */}
            <button
              onClick={() => setIsBookDemoOpen(true)}
              className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs xl:text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Book Demo
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg border transition-all ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsLoginModalOpen(true)}
              className={`px-3 py-1.5 text-xs font-black rounded-lg border ${
                isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-200'
              }`}
            >
              Login
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className={`lg:hidden border-b px-4 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200 shadow-2xl ${
            isDarkMode ? 'bg-[#0B132B] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <nav className="flex flex-col gap-3 font-bold text-sm">
              <button onClick={(e) => scrollToSection(e, 'hero')} className="hover:text-emerald-500 text-left py-1 cursor-pointer">Home</button>
              <button onClick={(e) => scrollToSection(e, 'features')} className="hover:text-emerald-500 text-left py-1 cursor-pointer">Features</button>
              <button onClick={(e) => scrollToSection(e, 'solutions')} className="hover:text-emerald-500 text-left py-1 cursor-pointer">Solutions</button>
              <button onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-emerald-500 text-left py-1 cursor-pointer">Pricing</button>
              <button onClick={(e) => scrollToSection(e, 'impact')} className="hover:text-emerald-500 text-left py-1 cursor-pointer">Customers</button>
              <button onClick={(e) => scrollToSection(e, 'calculator')} className="hover:text-emerald-500 text-left py-1 cursor-pointer">Solar ROI Calculator</button>
            </nav>

            <div className="pt-4 border-t border-slate-800/20 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsBookDemoOpen(true);
                }}
                className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                Book Live Demo
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleStartTrial();
                }}
                className="w-full py-3 bg-[#10B981] text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md"
              >
                <Sparkles className="w-4 h-4 fill-white" /> Start 7-Day Free Trial
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (MATCHING REFERENCE IMAGE 1)                              */}
      {/* ========================================================================= */}
      <section id="hero" className="relative pt-10 sm:pt-16 pb-16 sm:pb-24 overflow-hidden">
        {/* Background glow flares */}
        {isDarkMode ? (
          <>
            <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-20 right-10 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            {/* Celestial Moon in Dark Mode */}
            <div className="absolute top-8 right-12 hidden xl:block opacity-75 pointer-events-none">
              <div className="w-16 h-16 rounded-full shadow-[inset_-8px_-4px_0_0_#93C5FD] filter drop-shadow-[0_0_12px_rgba(147,197,253,0.4)]" />
            </div>
          </>
        ) : (
          <>
            <div className="absolute top-0 right-0 w-[700px] h-[500px] bg-gradient-to-bl from-amber-100/50 via-emerald-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />
            {/* Sun Burst in Light Mode */}
            <div className="absolute top-6 right-8 hidden xl:flex items-center justify-center pointer-events-none">
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 blur-sm opacity-80 animate-pulse" />
                <Sun className="w-16 h-16 text-amber-500 absolute" />
              </div>
            </div>
          </>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Column: Hero Typography & CTAs */}
            <div className="lg:col-span-5 space-y-6 text-left">
              
              {/* Badge: All-in-One Solar Business Platform */}
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all ${
                isDarkMode 
                  ? 'bg-slate-900/90 border-slate-700/80 text-blue-400 shadow-inner' 
                  : 'bg-blue-50/80 border-blue-200/80 text-blue-700 shadow-2xs'
              }`}>
                <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                  <Zap className="w-3 h-3 fill-current" />
                </div>
                <span>All-in-One Solar Business Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className={`text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight leading-[1.08] ${
                isDarkMode ? 'text-white' : 'text-[#0F172A]'
              }`}>
                Powering a <br />
                <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  Smarter Solar Future
                </span>
              </h1>

              {/* Subheading */}
              <p className={`text-sm sm:text-base leading-relaxed font-medium max-w-lg ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                AI-powered CRM, Sales, Project Management & Service Platform built specifically for Solar Businesses.
              </p>

              {/* 4 Checklist Features */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 max-w-md pt-1">
                {[
                  'AI-Powered',
                  'Cloud Based',
                  'Secure',
                  'Easy to Use'
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span className={`text-xs sm:text-sm font-bold ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {feat}
                    </span>
                  </div>
                ))}
              </div>

              {/* Dual CTA Buttons */}
              <div className="pt-3 flex flex-wrap items-center gap-3 sm:gap-4">
                <button
                  onClick={() => setIsBookDemoOpen(true)}
                  className={`px-6 py-3.5 text-xs sm:text-sm font-black rounded-xl transition-all shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' 
                      : 'bg-[#0F172A] hover:bg-slate-800 text-white shadow-slate-900/20'
                  }`}
                >
                  Book Demo
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleStartTrial()}
                  className="px-6 py-3.5 bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-500/25 flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Social Proof Avatar Stack & 4.8/5 Rating */}
              <div className="pt-2 flex items-center gap-3">
                <div className="flex -space-x-2 overflow-hidden">
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Solar installer 1" />
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Solar installer 2" />
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" alt="Solar installer 3" />
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80" alt="Solar installer 4" />
                </div>
                <div>
                  <div className="flex items-center text-amber-400 text-xs">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className={`text-[11px] font-bold mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Rated <span className="font-extrabold text-amber-400">4.8/5</span> by <strong className="text-slate-900 dark:text-white">500+ Users</strong>
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column: Visual Composite (Solar Villa + SaaS Dashboard Card side-by-side as in reference) */}
            <div className="lg:col-span-7 relative">
              
              {/* Outer Curved Container */}
              <div className={`relative rounded-3xl p-3 sm:p-4 border transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-[#0B132B]/80 via-slate-900/60 to-[#060B18]/90 border-slate-800 shadow-2xl shadow-black/40' 
                  : 'bg-gradient-to-br from-white/90 via-slate-50/80 to-emerald-50/30 border-slate-200/90 shadow-xl'
              }`}>
                
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
                  
                  {/* 1. 3D Modern Solar Villa Image Frame (Left of Dashboard) */}
                  <div className="xl:col-span-5 relative rounded-2xl overflow-hidden shadow-lg border border-slate-200/60 dark:border-slate-800 h-64 sm:h-80 xl:h-[390px] group">
                    <img 
                      src="/solar_house_hero.jpg" 
                      alt="Solar Rooftop Smart Villa" 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                    
                    {/* Overlay Tag on House */}
                    <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/20 text-white text-[10px] font-bold flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">25 kW Smart Hybrid Solar Villa</span>
                    </div>
                  </div>

                  {/* 2. SaaS CRM Dashboard Card (Right of Solar Villa) */}
                  <div className={`xl:col-span-7 rounded-2xl p-3.5 sm:p-4 shadow-xl backdrop-blur-xl border transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-[#0B132B]/95 border-slate-700/80 text-white' 
                      : 'bg-white border-slate-200/90 text-slate-900 shadow-md'
                  }`}>
                    
                    {/* Dashboard Header Bar */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="text-xs font-black ml-1 text-slate-800 dark:text-slate-200">Dashboard</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-black">Live Sync</span>
                        <span>May 2026</span>
                      </div>
                    </div>

                    {/* 4 Metric Tiles */}
                    <div className="grid grid-cols-2 gap-2 mt-2.5">
                      <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase">Total Revenue</p>
                        <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">₹12.45 Cr</p>
                        <span className="text-[8px] font-black text-emerald-500">+15.2%</span>
                      </div>

                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">Active Projects</p>
                        <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">320</p>
                        <span className="text-[8px] font-black text-emerald-500">+12.4%</span>
                      </div>

                      <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <p className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">New Leads</p>
                        <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">1,250</p>
                        <span className="text-[8px] font-black text-emerald-500">+28.5%</span>
                      </div>

                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase">Pending Tasks</p>
                        <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">180</p>
                        <span className="text-[8px] font-black text-rose-500">-5.1%</span>
                      </div>
                    </div>

                    {/* Quick Mini Charts */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mt-2.5">
                      
                      {/* Mini Line Chart: Sales Overview */}
                      <div className="sm:col-span-7 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between text-[9px] font-bold mb-0.5">
                          <span className="text-slate-700 dark:text-slate-300 font-extrabold">Sales Overview</span>
                          <span className="text-emerald-500">₹12.45 Cr</span>
                        </div>
                        <div className="h-12 w-full flex items-end">
                          <svg className="w-full h-full" viewBox="0 0 200 60" fill="none">
                            <defs>
                              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path d="M 0,45 Q 30,50 60,30 T 120,25 T 160,10 L 200,8 L 200,60 L 0,60 Z" fill="url(#chartGrad)" />
                            <path d="M 0,45 Q 30,50 60,30 T 120,25 T 160,10 L 200,8" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                            <circle cx="160" cy="10" r="3.5" fill="#10B981" stroke="#ffffff" strokeWidth="1.5" />
                          </svg>
                        </div>
                      </div>

                      {/* Leads by Source Mini Donut */}
                      <div className="sm:col-span-5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                        <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300">Leads by Source</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-8 h-8 rounded-full border-3 border-emerald-500 border-r-blue-500 border-b-amber-500 border-l-teal-500 shrink-0" />
                          <div className="text-[8px] space-y-0.5 font-bold">
                            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Web 42%</div>
                            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Ref 28%</div>
                            <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Walk 18%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Projects Status Mini Table */}
                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase">
                        <span>Recent Project</span>
                        <span>Customer</span>
                        <span>Progress</span>
                      </div>

                      <div className="flex items-center justify-between text-[9px] py-0.5 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="font-bold text-slate-800 dark:text-white truncate max-w-[100px]">25kW On-Grid</span>
                        <span className="text-slate-500 truncate max-w-[90px]">Sunshine Energy</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="w-3/4 h-full bg-emerald-500 rounded-full" />
                          </div>
                          <span className="font-bold text-emerald-500 text-[8px]">75%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] py-0.5 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="font-bold text-slate-800 dark:text-white truncate max-w-[100px]">50kW Plant</span>
                        <span className="text-slate-500 truncate max-w-[90px]">Green Infra Ltd</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="w-[90%] h-full bg-blue-500 rounded-full" />
                          </div>
                          <span className="font-bold text-blue-500 text-[8px]">90%</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION: DELIVERING IMPACT & SOCIAL PROOF (MATCHING REFERENCE IMAGE 2) */}
      {/* ========================================================================= */}
      <section id="impact" className={`py-16 sm:py-24 border-t transition-colors ${
        isDarkMode ? 'bg-[#060D1F] border-slate-800/80' : 'bg-slate-50/70 border-slate-200/80'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-emerald-500 font-extrabold text-xs uppercase tracking-widest mb-3">
              <span className="h-px w-6 bg-emerald-500" />
              <span>TRUSTED BY SOLAR BUSINESSES ACROSS INDIA</span>
              <span className="h-px w-6 bg-emerald-500" />
            </div>

            <h2 className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#0F172A]'
            }`}>
              Delivering Impact. Driving the Solar Revolution.
            </h2>

            <p className={`mt-3 text-xs sm:text-base font-medium max-w-2xl mx-auto ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Thousands of solar companies trust MetaGreen to streamline operations, boost sales and scale their business.
            </p>
          </div>

          {/* 6 Key Stats Cards Grid (Matching Reference Image 2 Top Half) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            
            {/* Card 1: 750+ Active Installers */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200/90 hover:border-blue-300'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <p className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                750+
              </p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                Active Installers
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Across residential, commercial & utility solar
              </p>
            </div>

            {/* Card 2: 75,000+ Projects Managed */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200/90 hover:border-emerald-300'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <Sun className="w-5 h-5" />
              </div>
              <p className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                75,000+
              </p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                Projects Managed
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                From lead to installation & beyond
              </p>
            </div>

            {/* Card 3: ₹750 Cr+ Solar Business Managed */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-amber-500/50' : 'bg-white border-slate-200/90 hover:border-amber-300'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                <IndianRupee className="w-5 h-5" />
              </div>
              <p className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                ₹750 Cr+
              </p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                Solar Business Managed
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Value of projects tracked on MetaGreen
              </p>
            </div>

            {/* Card 4: 120%+ Average Growth */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-200/90 hover:border-indigo-300'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5" />
              </div>
              <p className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                120%+
              </p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                Average Growth
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Our customers' average business growth
              </p>
            </div>

            {/* Card 5: 98% Customer Satisfaction */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200/90 hover:border-emerald-300'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <Award className="w-5 h-5" />
              </div>
              <p className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                98%
              </p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                Customer Satisfaction
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Rated by 500+ happy customers
              </p>
            </div>

            {/* Card 6: 24/7 Support Available */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-cyan-500/50' : 'bg-white border-slate-200/90 hover:border-cyan-300'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-3">
                <Headphones className="w-5 h-5" />
              </div>
              <p className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                24/7
              </p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                Support Available
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Real humans. Real fast. Always here.
              </p>
            </div>

          </div>

          {/* 6 Feature Value Badges (Matching Reference Image 2 Bottom Half) */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            
            <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/70 shadow-2xs'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">100% Secure</p>
                <p className="text-[10px] text-slate-500">Enterprise-grade security</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/70 shadow-2xs'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">Cloud Based</p>
                <p className="text-[10px] text-slate-500">Access business anywhere</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/70 shadow-2xs'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">Lightning Fast</p>
                <p className="text-[10px] text-slate-500">Built for speed & scale</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/70 shadow-2xs'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">Mobile First</p>
                <p className="text-[10px] text-slate-500">Powerful app on the go</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/70 shadow-2xs'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">Easy Integration</p>
                <p className="text-[10px] text-slate-500">Connects with your tools</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/70 shadow-2xs'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">Dedicated Onboarding</p>
                <p className="text-[10px] text-slate-500">Personalized training sessions</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION: EVERYTHING YOU NEED / 10 MODULES (MATCHING REFERENCE IMAGE 3) */}
      {/* ========================================================================= */}
      <section id="features" className={`py-16 sm:py-24 border-t transition-colors ${
        isDarkMode ? 'bg-[#060B18] border-slate-800/80' : 'bg-white border-slate-200/80'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-emerald-500 font-extrabold text-xs uppercase tracking-widest mb-3">
              <span className="h-px w-6 bg-emerald-500" />
              <span>COMPLETE SOLAR BUSINESS PLATFORM</span>
              <span className="h-px w-6 bg-emerald-500" />
            </div>

            <h2 className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#0F172A]'
            }`}>
              Everything You Need. All in One Platform.
            </h2>

            <p className={`mt-3 text-xs sm:text-base font-medium max-w-2xl mx-auto ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              From lead to installation and beyond — manage your entire solar business in one integrated platform.
            </p>
          </div>

          {/* 10 Modular Grid Cards (2 Rows of 5, Matching Reference Image 3) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            
            {/* 1. CRM */}
            <div className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-pointer ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-blue-500/60' : 'bg-slate-50/80 border-slate-200/90 hover:border-blue-400 hover:bg-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">CRM</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Manage customers, follow-ups and relationships effortlessly.
              </p>
            </div>

            {/* 2. Lead Management */}
            <div className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-pointer ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-emerald-500/60' : 'bg-slate-50/80 border-slate-200/90 hover:border-emerald-400 hover:bg-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Lead Management</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Capture, score and nurture leads to boost conversion.
              </p>
            </div>

            {/* 3. Proposal Generator */}
            <div className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-pointer ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-amber-500/60' : 'bg-slate-50/80 border-slate-200/90 hover:border-amber-400 hover:bg-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Proposal Generator</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Create professional proposals and quotations in minutes.
              </p>
            </div>

            {/* 4. Site Survey */}
            <div className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-pointer ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-teal-500/60' : 'bg-slate-50/80 border-slate-200/90 hover:border-teal-400 hover:bg-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Site Survey</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Digital surveys, checklists and geo-tagged reports.
              </p>
            </div>

            {/* 5. Project Tracking */}
            <div className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-pointer ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-indigo-500/60' : 'bg-slate-50/80 border-slate-200/90 hover:border-indigo-400 hover:bg-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <LineChart className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Project Tracking</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Track every project stage in real-time with full visibility.
              </p>
            </div>

            {/* 6. Inventory */}
            <div className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-pointer ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-emerald-500/60' : 'bg-slate-50/80 border-slate-200/90 hover:border-emerald-400 hover:bg-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Box className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Inventory</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Real-time stock tracking across multiple warehouses.
              </p>
            </div>

            {/* 7. Procurement */}
            <div className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-pointer ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-blue-500/60' : 'bg-slate-50/80 border-slate-200/90 hover:border-blue-400 hover:bg-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Procurement</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Manage suppliers, POs and purchases efficiently.
              </p>
            </div>

            {/* 8. Installation */}
            <div className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-pointer ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-amber-500/60' : 'bg-slate-50/80 border-slate-200/90 hover:border-amber-400 hover:bg-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Installation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Plan resources, schedule teams and track installation progress.
              </p>
            </div>

            {/* 9. Service & AMC */}
            <div className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-pointer ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-teal-500/60' : 'bg-slate-50/80 border-slate-200/90 hover:border-teal-400 hover:bg-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Service & AMC</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Raise tickets, manage AMC and ensure top-notch service.
              </p>
            </div>

            {/* 10. Mobile App */}
            <div className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-pointer ${
              isDarkMode ? 'bg-[#0B132B] border-slate-800 hover:border-indigo-500/60' : 'bg-slate-50/80 border-slate-200/90 hover:border-indigo-400 hover:bg-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Mobile App</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Powerful mobile app for your team on the go.
              </p>
            </div>

          </div>

          {/* Bottom 5-Pillar Guarantee Strip (Matching Reference Image 3 Bottom Bar) */}
          <div className={`mt-10 p-6 sm:p-8 rounded-3xl border ${
            isDarkMode 
              ? 'bg-[#081226]/80 border-blue-500/30 shadow-2xl shadow-blue-500/5' 
              : 'bg-slate-50/90 border-slate-200/90 shadow-sm'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              
              {/* Guarantee 1 */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">100% Secure & Reliable</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Enterprise-grade security for your business data.</p>
                </div>
              </div>

              {/* Guarantee 2 */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">99.9% Uptime Guarantee</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Always available when you need it.</p>
                </div>
              </div>

              {/* Guarantee 3 */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0 mt-0.5">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">Real-time Data Sync</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Instant updates across all devices and teams.</p>
                </div>
              </div>

              {/* Guarantee 4 */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">50+ Integrations</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Connect with your favorite tools and software.</p>
                </div>
              </div>

              {/* Guarantee 5 */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">Customizable Built for You</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Tailor workflows and modules to your business needs.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE SOLAR ROI & PM SURYA GHAR CALCULATOR SECTION               */}
      {/* ========================================================================= */}
      <section id="calculator" className={`py-16 sm:py-24 border-t transition-colors ${
        isDarkMode ? 'bg-[#060D1F] border-slate-800/80' : 'bg-slate-50/70 border-slate-200/80'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 text-emerald-500 font-extrabold text-xs uppercase tracking-widest">
                <Calculator className="w-4 h-4" />
                <span>INTERACTIVE ROI & SUBSIDY ESTIMATOR</span>
              </div>

              <h2 className={`text-2xl sm:text-4xl font-black tracking-tight ${
                isDarkMode ? 'text-white' : 'text-[#0F172A]'
              }`}>
                Calculate PM Surya Ghar Benefits & Solar Payback in Real-Time
              </h2>

              <p className={`text-xs sm:text-sm font-medium leading-relaxed ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Generate instant proposals with 70:30 GST tax split, MNRE central subsidies, and payback timeline charts for your clients.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => setIsBookDemoOpen(true)}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  Try Proposal Generator in Demo
                </button>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
                isDarkMode ? 'bg-[#0B132B] border-slate-800' : 'bg-white border-slate-200/90'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Monthly Electricity Bill</span>
                  <span className="text-2xl font-black text-emerald-500">₹{monthlyBill.toLocaleString('en-IN')}/mo</span>
                </div>

                <div className="py-6">
                  <input 
                    type="range" 
                    min="1500" 
                    max="35000" 
                    step="500"
                    value={monthlyBill}
                    onChange={(e) => setMonthlyBill(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                    <span>₹1,500/mo (1 kW)</span>
                    <span>₹15,000/mo (12 kW)</span>
                    <span>₹35,000/mo (30 kW)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">System Sizing</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{recommendedKw} kW</p>
                    <span className="text-[9px] font-semibold text-emerald-500">Rooftop Area: {Math.round(recommendedKw * 85)} sqft</span>
                  </div>

                  <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Govt. Subsidy</p>
                    <p className="text-lg font-black text-emerald-500 mt-0.5">₹{estimatedSubsidy.toLocaleString('en-IN')}</p>
                    <span className="text-[9px] font-semibold text-slate-400">PM Surya Ghar</span>
                  </div>

                  <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Annual Savings</p>
                    <p className="text-lg font-black text-blue-500 mt-0.5">₹{annualSavings.toLocaleString('en-IN')}</p>
                    <span className="text-[9px] font-semibold text-slate-400">Per Year</span>
                  </div>

                  <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">ROI Payback</p>
                    <p className="text-lg font-black text-amber-500 mt-0.5">{paybackYears} Yrs</p>
                    <span className="text-[9px] font-semibold text-slate-400">25-Yr System</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TRANSPARENT PRICING & PLANS SECTION                                    */}
      {/* ========================================================================= */}
      <section id="pricing" className={`py-16 sm:py-24 border-t transition-colors ${
        isDarkMode ? 'bg-[#060B18] border-slate-800/80' : 'bg-white border-slate-200/80'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-emerald-500 font-extrabold text-xs uppercase tracking-widest mb-3">
              <span className="h-px w-6 bg-emerald-500" />
              <span>TRANSPARENT & SCALABLE TIERS</span>
              <span className="h-px w-6 bg-emerald-500" />
            </div>

            <h2 className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#0F172A]'
            }`}>
              Flexible Subscription Plans for Every Solar Team
            </h2>

            <p className={`mt-3 text-xs sm:text-base font-medium max-w-2xl mx-auto ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Select any plan below to activate your <strong className="text-emerald-500">7-Day Free Trial</strong>. Upgrade, downgrade, or cancel anytime.
            </p>

            {/* Monthly / Annual Toggle Switch */}
            <div className={`mt-8 inline-flex items-center p-1.5 rounded-2xl border ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>

              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 rounded-md text-[9px] font-black uppercase">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
            {(plans.length > 0 ? plans : [
              {
                id: 'starter',
                name: 'Starter Solar',
                priceMonthly: 4999,
                userLimit: 3,
                storageGBLimit: 10,
                trialDays: 7,
                features: ['Solar CRM & Lead Scoring', '70:30 GST Quotations', 'PM Surya Ghar Status Sync', 'Vendor PO Generation']
              },
              {
                id: 'growth',
                name: 'Professional EPC',
                priceMonthly: 12999,
                userLimit: 10,
                storageGBLimit: 50,
                trialDays: 7,
                features: ['Unlimited Solar Quotes & Proposals', 'Auto-Stock Multi-Warehouse Sync', 'Automated DISCOM Workflows', 'Mobile Survey & Geo-Tagging', 'Priority 24/7 Phone Support']
              },
              {
                id: 'enterprise',
                name: 'Enterprise Utility',
                priceMonthly: 29999,
                userLimit: 50,
                storageGBLimit: 250,
                trialDays: 7,
                features: ['Full ERP & Procurement Engine', 'Custom DISCOM Form Workflows', 'Dedicated Account Manager', 'Custom API Integrations', 'Custom Domain & White Labeling']
              }
            ]).map((plan, idx) => {
              const isPopular = idx === 1;
              const displayPrice = billingCycle === 'annual' ? Math.round(plan.priceMonthly * 0.8) : plan.priceMonthly;

              return (
                <div
                  key={plan.id || idx}
                  className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                    isPopular
                      ? isDarkMode
                        ? 'bg-[#0B132B] border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/20 transform lg:-translate-y-2'
                        : 'bg-white border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 transform lg:-translate-y-2'
                      : isDarkMode
                        ? 'bg-[#0B132B]/70 border border-slate-800 hover:border-slate-700'
                        : 'bg-slate-50/80 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg whitespace-nowrap">
                      Most Popular for Solar EPCs
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      Engineered for solar installers & vendors
                    </p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                        ₹{displayPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">/ month</span>
                    </div>

                    <div className="mt-4 p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-500 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 fill-emerald-500" /> 7-Day Free Trial
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${
                        isDarkMode ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                      }`}>
                        {plan.trialDays || 7} Days Free
                      </span>
                    </div>

                    {/* Limit Specs */}
                    <div className="mt-6 space-y-3 pt-5 border-t border-slate-200/60 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-500" /> Authorized Team Users
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg border font-black ${
                          isDarkMode ? 'bg-slate-950 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'
                        }`}>
                          Up to {plan.userLimit} Users
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-teal-500" /> Cloud Storage Vault
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg border font-black ${
                          isDarkMode ? 'bg-slate-950 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'
                        }`}>
                          {plan.storageGBLimit} GB Limit
                        </span>
                      </div>
                    </div>

                    {/* Feature Highlights */}
                    <ul className="mt-6 space-y-3">
                      {(plan.features || [
                        'Vendor PO & Inventory Sync',
                        '70:30 GST Quotation Builder',
                        'PM Surya Ghar Subsidy Release',
                        'Customer Direct Walk-in Entry'
                      ]).map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/80">
                    <button
                      onClick={() => handleStartTrial(plan)}
                      className={`w-full py-3.5 font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isPopular
                          ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-lg shadow-emerald-500/20 transform hover:-translate-y-0.5'
                          : isDarkMode 
                            ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      Start 7-Day Free Trial
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. HIGH CONVERSION ACTION BANNER                                          */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Ready to Supercharge Your Solar Business?
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-emerald-100 max-w-2xl mx-auto font-medium">
            Join 750+ solar contractors, vendors & installers driving India's rooftop solar transition.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleStartTrial()}
              className="w-full sm:w-auto px-8 py-4 bg-slate-950 hover:bg-slate-900 text-white font-black text-sm rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Start 7-Day Free Trial Now
            </button>

            <button
              onClick={() => setIsBookDemoOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              Schedule 1-on-1 Demo
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className={`py-12 border-t transition-colors ${
        isDarkMode ? 'bg-[#040813] border-slate-900 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
            
            {/* Col 1: Brand */}
            <div className="space-y-4">
              <MetaGreenLogo className="h-8 w-auto" variant="dark" textSub="ENTERPRISE SOLAR PLATFORM" />
              <p className="text-xs text-slate-400 leading-relaxed">
                India's all-in-one solar CRM, 70:30 GST quotation builder, automated vendor procurement, and PM Surya Ghar subsidy tracking operating system.
              </p>
            </div>

            {/* Col 2: Platform Modules */}
            <div className="space-y-2.5 text-xs">
              <p className="font-black text-white uppercase tracking-wider">Solutions & Modules</p>
              <ul className="space-y-2">
                <li><button onClick={(e) => scrollToSection(e, 'features')} className="hover:text-emerald-400 cursor-pointer">Solar CRM & Leads</button></li>
                <li><button onClick={(e) => scrollToSection(e, 'features')} className="hover:text-emerald-400 cursor-pointer">70:30 GST Quotation</button></li>
                <li><button onClick={(e) => scrollToSection(e, 'features')} className="hover:text-emerald-400 cursor-pointer">Vendor PO & Auto-Stock</button></li>
                <li><button onClick={(e) => scrollToSection(e, 'features')} className="hover:text-emerald-400 cursor-pointer">Surya Ghar Subsidy Tracker</button></li>
                <li><button onClick={(e) => scrollToSection(e, 'features')} className="hover:text-emerald-400 cursor-pointer">Mobile Field Survey App</button></li>
              </ul>
            </div>

            {/* Col 3: Resources */}
            <div className="space-y-2.5 text-xs">
              <p className="font-black text-white uppercase tracking-wider">Resources & Careers</p>
              <ul className="space-y-2">
                <li><button onClick={(e) => scrollToSection(e, 'calculator')} className="hover:text-emerald-400 cursor-pointer">Solar ROI Calculator</button></li>
                <li><button onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-emerald-400 cursor-pointer">Subscription Pricing</button></li>
                <li><button onClick={() => { setContactPurpose('Careers'); setIsContactCareerOpen(true); }} className="hover:text-emerald-400 cursor-pointer text-emerald-400 font-bold">🚀 Solar Careers & Hiring</button></li>
                <li><button onClick={() => setIsBookDemoOpen(true)} className="hover:text-emerald-400 cursor-pointer">Schedule Guided Demo</button></li>
                <li><button onClick={() => setIsLoginModalOpen(true)} className="hover:text-emerald-400 cursor-pointer">Solar Installer & Supplier Sign In</button></li>
              </ul>
            </div>

            {/* Col 4: Contact & Help */}
            <div className="space-y-2.5 text-xs">
              <p className="font-black text-white uppercase tracking-wider">Enterprise Communication</p>
              <p className="text-slate-400">Headquarters: New Delhi, India</p>
              <p className="text-slate-300 font-bold">Sales & Quotes: <span className="text-emerald-400">sales@metadev.in</span></p>
              <p className="text-slate-300 font-bold">Chat Support: <span className="text-emerald-400">support@metadev.in</span></p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => { setContactPurpose('Sales'); setIsContactCareerOpen(true); }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm text-center"
                >
                  Contact Us / Careers Form
                </button>
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
            <p>© 2026 Meta Green Enterprise ERP. All rights reserved.</p>
            <div className="flex gap-6 font-semibold">
              <button onClick={() => { setContactPurpose('Sales'); setIsContactCareerOpen(true); }} className="hover:text-white cursor-pointer">Contact Us</button>
              <button onClick={() => { setContactPurpose('Careers'); setIsContactCareerOpen(true); }} className="hover:text-white cursor-pointer">Careers</button>
              <button onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-white cursor-pointer">Pricing</button>
              <button onClick={() => setIsLoginModalOpen(true)} className="hover:text-white cursor-pointer">Sign In</button>
              <button onClick={() => setIsBookDemoOpen(true)} className="hover:text-white cursor-pointer">Book Demo</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 9. MODALS                                                                 */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <VendorRegistrationModal
          selectedPlan={selectedPlan || plans[0]}
          allPlans={plans}
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

    </div>
  );
}

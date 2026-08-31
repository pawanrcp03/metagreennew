import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Sun, 
  Package, 
  IndianRupee, 
  Settings,
  PenTool,
  FileText,
  Calculator,
  Landmark,
  ShoppingCart,
  Wrench,
  ShieldCheck,
  FolderOpen,
  UserCheck,
  Truck,
  Sliders,
  ChevronDown,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Menu,
  X,
  Search,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ViewType, UserRole } from '@/src/types';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  userRole?: UserRole;
}

interface NavSubItem {
  id: ViewType;
  label: string;
  subHeader: string;
  description: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

interface NavCategory {
  id: string;
  title: string;
  badge?: string;
  icon: React.ElementType;
  directView?: ViewType;
  items: NavSubItem[];
}

export default function Sidebar({ currentView, setView, userRole }: SidebarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Navigation Structure with merged submenus
  const navigationCategories: NavCategory[] = [
    {
      id: 'dashboard-group',
      title: 'Dashboard',
      icon: LayoutDashboard,
      directView: 'dashboard',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          subHeader: 'Overview & Solar Generation Hub',
          description: 'Key performance indicators, daily solar metrics & project stages overview',
          icon: LayoutDashboard
        }
      ]
    },
    {
      id: 'crm-group',
      title: 'CRM',
      badge: 'Sales',
      icon: Users,
      items: [
        {
          id: 'crm',
          label: 'Leads',
          subHeader: 'Lead Pipeline & GPS Location',
          description: 'Customer inquiries, expected system size (KW/MW) & monthly electricity range',
          icon: Users,
          roles: ['Super Admin', 'Solar Company Admin', 'Regional Manager', 'Sales Executive', 'Vendor', 'Vendor Employee', 'Installer', 'Solar Installer', 'Survey Engineer', 'Project Manager']
        },
        {
          id: 'solar-design',
          label: 'Design',
          subHeader: 'PV System Design & 3D Rooftop',
          description: 'CAD 3D layout, shading analysis, solar module placement & string sizing',
          icon: PenTool,
          roles: ['Super Admin', 'Solar Company Admin', 'Design Engineer', 'Project Manager', 'Solar Installer', 'Installer', 'Vendor', 'Vendor Employee', 'Sales Executive']
        }
      ]
    },
    {
      id: 'quotes-invoices-group',
      title: 'Quotes & Invoices',
      badge: 'Billing',
      icon: Calculator,
      items: [
        {
          id: 'proposal',
          label: 'Quotations',
          subHeader: 'Customer Sales Proposals & ROI',
          description: 'System generation estimates, branding headers & quotation approvals',
          icon: FileText,
          roles: ['Super Admin', 'Solar Company Admin', 'Sales Executive', 'Vendor', 'Vendor Employee', 'Installer', 'Solar Installer', 'Project Manager']
        },
        {
          id: 'quotation',
          label: 'Invoice',
          subHeader: 'Estimates & 70:30 Billing Rule',
          description: '70% Goods & 30% Services tax calculation rule & automated CRM sync',
          icon: Calculator,
          roles: ['Super Admin', 'Solar Company Admin', 'Sales Executive', 'Finance Manager', 'Vendor', 'Vendor Employee', 'Installer', 'Solar Installer']
        },
        {
          id: 'tax-invoice',
          label: 'Tax Invoice',
          subHeader: 'Official GST Tax Invoice Generator',
          description: 'Full GST 70:30 Tax Invoice generator with QR code and PDF print download',
          icon: IndianRupee,
          roles: ['Super Admin', 'Solar Company Admin', 'Finance Manager', 'Auditor', 'Sales Executive', 'Vendor', 'Installer']
        }
      ]
    },
    {
      id: 'project-supply-group',
      title: 'Project & Supply',
      badge: 'Supply',
      icon: Package,
      items: [
        {
          id: 'vendors',
          label: 'Solar Supplier',
          subHeader: 'Solar Supplier Portal & Stock',
          description: 'Accept POs, manage hardware catalog & fulfill supplier shipments',
          icon: Truck,
          roles: ['Super Admin', 'Solar Company Admin', 'Solar Supplier', 'Vendor', 'Vendor Employee', 'Procurement Officer', 'Finance Manager']
        },
        {
          id: 'inventory',
          label: 'Inventory',
          subHeader: 'Stock & Hardware Control',
          description: 'Panels, Inverters, Cables stock calculated by KW, MW, MTR, TON, KG & PCS',
          icon: Package,
          roles: ['Super Admin', 'Solar Company Admin', 'Warehouse Manager', 'Procurement Officer', 'Solar Installer', 'Installer']
        },
        {
          id: 'procurement',
          label: 'Purchase Orders (PO)',
          subHeader: 'Create Purchase Order / RFQ',
          description: 'Multi-unit live price calculations by Meter, KW, MW, TON, KG with GST summary',
          icon: ShoppingCart,
          roles: ['Super Admin', 'Solar Company Admin', 'Procurement Officer', 'Warehouse Manager']
        }
      ]
    },
    {
      id: 'project-group',
      title: 'Project',
      badge: 'Field',
      icon: Sun,
      items: [
        {
          id: 'projects',
          label: 'Projects',
          subHeader: '10-Stage Minimizable Kanban',
          description: 'Initial -> In Process -> Installation -> Department Verification -> Subsidy',
          icon: Sun,
          roles: ['Super Admin', 'Solar Company Admin', 'Regional Manager', 'Project Manager', 'Solar Installer', 'Installer']
        },
        {
          id: 'work-orders',
          label: 'Tasks',
          subHeader: 'Field Team Tasks & Work Orders',
          description: 'Task checklists inheriting direct employee assignment from Employee Cards',
          icon: Wrench,
          roles: ['Super Admin', 'Solar Company Admin', 'Project Manager', 'Solar Installer', 'Installer']
        }
      ]
    },
    {
      id: 'finance-group',
      title: 'Finance',
      badge: 'Ledger',
      icon: IndianRupee,
      directView: 'finance',
      items: [
        {
          id: 'finance',
          label: 'Finance / Ledger',
          subHeader: 'Dynamic Expense Types & Ledgers',
          description: 'Customer payments, manageable expense categories, loans & balance ledgers',
          icon: IndianRupee,
          roles: ['Super Admin', 'Solar Company Admin', 'Finance Manager', 'Auditor']
        }
      ]
    },
    {
      id: 'subsidy-group',
      title: 'Subsidy',
      badge: 'Portal',
      icon: Landmark,
      directView: 'subsidy',
      items: [
        {
          id: 'subsidy',
          label: 'Subsidy & Claim Tracking',
          subHeader: 'PM Surya Ghar DBT Claims',
          description: '6-Stage subsidy tracking, application ref numbers, JIR reports & direct benefit transfers',
          icon: Landmark,
          roles: ['Super Admin', 'Solar Company Admin', 'Finance Manager', 'Customer Support']
        }
      ]
    },
    {
      id: 'support-docs-group',
      title: 'Support & Docs',
      badge: 'Care',
      icon: Settings,
      items: [
        {
          id: 'support',
          label: 'Support & Tickets',
          subHeader: 'Customer Care & Ticket Helpdesk',
          description: 'Multi-channel enterprise care, complaint categories, SLA tracking & engineer assignment',
          icon: MessageSquare,
          roles: ['Super Admin', 'Solar Company Admin', 'Customer Support', 'Project Manager']
        },
        {
          id: 'documents',
          label: 'Documents Vault',
          subHeader: 'Separated Photo Galleries',
          description: 'Separated Material Photos, Site Before Photos & Site After Photos',
          icon: FolderOpen,
          roles: ['Super Admin', 'Solar Company Admin', 'Project Manager', 'Sales Executive', 'Finance Manager']
        },
        {
          id: 'projects',
          label: 'Department Verification',
          subHeader: 'DISCOM Inspection & Approval',
          description: 'Departmental inspection verification, safety certificates & net metering sync',
          icon: ShieldCheck,
          roles: ['Super Admin', 'Solar Company Admin', 'Project Manager', 'Solar Installer']
        }
      ]
    },
    {
      id: 'admin-hr-group',
      title: 'Admin & HR',
      badge: 'Config',
      icon: Sliders,
      items: [
        {
          id: 'hr',
          label: 'HR & Payroll',
          subHeader: 'Direct Project Assignment & Payroll',
          description: 'Employee cards, direct project assignment, fixed salary & commission (% / kW)',
          icon: UserCheck,
          roles: ['Super Admin', 'Solar Company Admin', 'Regional Manager']
        },
        {
          id: 'settings',
          label: 'Master Settings',
          subHeader: 'System Configuration & Branding',
          description: 'Company logos, HSN codes, bank info, SMTP routing & user permissions',
          icon: Sliders,
          roles: ['Super Admin', 'Solar Company Admin']
        }
      ]
    }
  ];

  const filterSubItems = (items: NavSubItem[]) => {
    // All modules are visible in both Vendor, Installer, and Admin logins
    return items;
  };

  const isCategoryActive = (category: NavCategory) => {
    if (category.directView && currentView === category.directView) return true;
    return category.items.some(item => item.id === currentView);
  };

  // Find active item info for mobile header
  const getActiveItemInfo = () => {
    for (const cat of navigationCategories) {
      if (cat.directView === currentView) {
        return { category: cat.title, label: cat.title, icon: cat.icon };
      }
      const found = cat.items.find(i => i.id === currentView);
      if (found) {
        return { category: cat.title, label: found.label, icon: found.icon };
      }
    }
    return { category: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard };
  };

  const activeInfo = getActiveItemInfo();

  const handleCategoryClick = (category: NavCategory) => {
    // If category has directView or only 1 item, navigate directly
    if (category.directView) {
      setView(category.directView);
      setOpenDropdown(null);
      return;
    }

    const validItems = filterSubItems(category.items);
    if (validItems.length <= 1) {
      if (validItems.length === 1) {
        setView(validItems[0].id);
      }
      setOpenDropdown(null);
      return;
    }

    // Toggle dropdown for multi-item categories
    setOpenDropdown(prev => (prev === category.id ? null : category.id));
  };

  // Filtered list for mobile search
  const filteredCategoriesForMobile = navigationCategories.map(cat => {
    const valid = filterSubItems(cat.items);
    if (!mobileSearchQuery.trim()) return { ...cat, items: valid };
    const q = mobileSearchQuery.toLowerCase();
    const matchingItems = valid.filter(i => 
      i.label.toLowerCase().includes(q) || 
      i.subHeader.toLowerCase().includes(q) || 
      i.description.toLowerCase().includes(q)
    );
    return { ...cat, items: matchingItems };
  }).filter(cat => cat.items.length > 0);

  return (
    <div 
      ref={navRef}
      className="w-full bg-[#0a0f1d] border-b border-slate-800 text-slate-200 z-40 relative shadow-md select-none overflow-visible"
    >
      {/* Invisible backdrop to dismiss open dropdown on click anywhere */}
      {openDropdown && (
        <div 
          className="fixed inset-0 z-[90] bg-black/10" 
          onClick={() => setOpenDropdown(null)} 
        />
      )}

      {/* --- DESKTOP NAVIGATION BAR (lg screens and above) --- */}
      <div className="hidden lg:flex px-3 xl:px-6 py-2 items-center justify-between relative z-[95] overflow-visible">
        <div className="flex items-center gap-1 xl:gap-2.5 w-full overflow-visible">
          {navigationCategories.map((category, idx) => {
            const validItems = filterSubItems(category.items);
            if (validItems.length === 0) return null;

            const isActive = isCategoryActive(category);
            const hasSubmenu = !category.directView && validItems.length > 1;
            const isOpen = openDropdown === category.id;
            const isRightAligned = idx >= 6; // Align right for Subsidy, Support & Docs, Admin & HR

            return (
              <div key={category.id} className="relative shrink-0 overflow-visible">
                {/* Main Heading Pill Button */}
                <button
                  type="button"
                  onClick={() => handleCategoryClick(category)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-[11.5px] xl:text-xs font-black transition-all duration-200 border cursor-pointer select-none",
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                      : isOpen
                      ? "bg-slate-800 text-white border-slate-700 ring-2 ring-emerald-500/30"
                      : "border-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  )}
                  title={category.title}
                >
                  <category.icon className={cn(
                    "w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0 transition-colors",
                    isActive ? "text-emerald-400" : "text-slate-400"
                  )} />
                  <span className="whitespace-nowrap">{category.title}</span>

                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  )}

                  {hasSubmenu && (
                    <ChevronDown className={cn(
                      "w-3 h-3 xl:w-3.5 xl:h-3.5 transition-transform duration-200 text-slate-400 shrink-0",
                      isOpen ? "rotate-180 text-emerald-400" : ""
                    )} />
                  )}
                </button>

                {/* Submenu Dropdown on Click */}
                {isOpen && hasSubmenu && (
                  <div 
                    className={cn(
                      "absolute top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 z-[100] animate-in fade-in zoom-in-95 duration-150 ring-1 ring-slate-800 text-slate-200 block",
                      isRightAligned ? "right-0 left-auto" : "left-0 right-auto"
                    )}
                  >
                    <div className="px-3 py-2 border-b border-slate-800 mb-1.5 flex justify-between items-center bg-slate-950/60 rounded-xl">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <category.icon className="w-3.5 h-3.5 text-emerald-400" />
                        {category.title} Modules
                      </span>
                      {category.badge && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {category.badge}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                      {validItems.map((subItem, subIdx) => {
                        const isSubActive = currentView === subItem.id;
                        const IconComp = subItem.icon;

                        return (
                          <button
                            key={`${subItem.id}-${subIdx}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setView(subItem.id);
                              setOpenDropdown(null);
                            }}
                            className={cn(
                              "w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-start gap-3 group border cursor-pointer",
                              isSubActive
                                ? "bg-emerald-500/15 border-emerald-500/30 text-white shadow-sm"
                                : "border-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-lg shrink-0 mt-0.5 transition-colors",
                              isSubActive
                                ? "bg-emerald-500 text-slate-950 font-bold"
                                : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-emerald-400"
                            )}>
                              <IconComp className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  "text-xs font-black truncate",
                                  isSubActive ? "text-emerald-300" : "text-slate-200 group-hover:text-white"
                                )}>
                                  {subItem.label}
                                </span>
                                {isSubActive && (
                                  <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20 flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-bold text-slate-400 truncate mt-0.5">
                                {subItem.subHeader}
                              </p>
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                                {subItem.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MOBILE & TABLET RESPONSIVE BAR (< lg screens) --- */}
      <div className="flex lg:hidden px-3 py-2 items-center justify-between relative z-[95]">
        {/* Left: Active Module Quick Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-black text-xs transition-all shadow-xs cursor-pointer"
        >
          <activeInfo.icon className="w-4 h-4 text-emerald-400" />
          <span className="truncate max-w-[160px] sm:max-w-[240px]">
            {activeInfo.category}: <span className="text-white">{activeInfo.label}</span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
        </button>

        {/* Right: All Modules Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
        >
          <Menu className="w-4 h-4 text-emerald-400" />
          <span>Modules</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {/* --- FULL MOBILE NAVIGATION SLIDE-OVER DRAWER --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm sm:max-w-md bg-[#0a0f1d] h-full shadow-2xl flex flex-col border-l border-slate-800 text-slate-200 animate-in slide-in-from-right duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center justify-center text-emerald-400">
                  <Menu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">MetaGreen Solar Navigation</h3>
                  <p className="text-[10px] text-slate-400">Select any module to navigate directly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500 hover:text-white text-slate-300 text-xs font-black transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>

            {/* Live Search Across All Modules */}
            <div className="p-3 border-b border-slate-800 bg-slate-950/40 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={mobileSearchQuery}
                  onChange={e => setMobileSearchQuery(e.target.value)}
                  placeholder="Search leads, quotes, invoices, subsidy..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                />
                {mobileSearchQuery && (
                  <button 
                    onClick={() => setMobileSearchQuery('')} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Categories List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {filteredCategoriesForMobile.map((category) => {
                const isCatActive = isCategoryActive(category);

                return (
                  <div 
                    key={category.id} 
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 space-y-1.5"
                  >
                    {/* Category Title Header */}
                    <div className="px-2.5 py-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <category.icon className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                          {category.title}
                        </span>
                      </div>
                      {category.badge && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {category.badge}
                        </span>
                      )}
                    </div>

                    {/* Submenu Items */}
                    <div className="space-y-1">
                      {category.items.map((subItem) => {
                        const isSubActive = currentView === subItem.id;
                        const IconComp = subItem.icon;

                        return (
                          <button
                            key={subItem.id}
                            type="button"
                            onClick={() => {
                              setView(subItem.id);
                              setIsMobileMenuOpen(false);
                              setMobileSearchQuery('');
                            }}
                            className={cn(
                              "w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 border cursor-pointer",
                              isSubActive
                                ? "bg-emerald-500/20 border-emerald-500/40 text-white font-bold shadow-xs"
                                : "border-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-lg shrink-0 transition-colors",
                              isSubActive
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-slate-800 text-slate-400"
                            )}>
                              <IconComp className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  "text-xs font-bold truncate",
                                  isSubActive ? "text-emerald-300" : "text-slate-200"
                                )}>
                                  {subItem.label}
                                </span>
                                {isSubActive ? (
                                  <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20 flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Active
                                  </span>
                                ) : (
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100" />
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {subItem.subHeader}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredCategoriesForMobile.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <p className="text-sm font-bold">No modules found matching "{mobileSearchQuery}"</p>
                  <button 
                    onClick={() => setMobileSearchQuery('')}
                    className="text-xs text-emerald-400 font-bold hover:underline mt-2 inline-block"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer with Quick Dashboard Button */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 shrink-0 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setView('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


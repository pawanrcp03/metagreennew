import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Sun, 
  Package, 
  IndianRupee, 
  Settings,
  UserCircle,
  Map,
  PenTool,
  FileText,
  Calculator,
  Landmark,
  ShoppingCart,
  Wrench,
  ShieldCheck,
  FolderOpen,
  ClipboardCheck,
  UserCheck,
  Truck,
  BarChart,
  Sliders,
  ChevronDown,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ViewType, UserRole } from '@/src/types';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  userRole?: UserRole;
}

interface SubHeaderItem {
  id: ViewType;
  label: string;
  subHeader: string;
  description: string;
  icon: React.ElementType;
  roles: UserRole[];
}

interface CategoryMenu {
  id: string;
  title: string;
  badge?: string;
  icon: React.ElementType;
  items: SubHeaderItem[];
}

// 10 Numbered Workflow Modules as sketched in PDF Wireframe Page 12
const PDF_WORKFLOW_STEPS: { num: number; id: ViewType; label: string; tooltip: string }[] = [
  { num: 1, id: 'crm', label: 'CRM / Leads', tooltip: '1. Lead entry, GPS drop pin & estimated generation popup' },
  { num: 2, id: 'quotation', label: 'Quote & Invoice', tooltip: '2. Proposal generator, Quote builder & 70:30 tax calculation' },
  { num: 3, id: 'inventory', label: 'Inventory & PO', tooltip: '3. Procurement, stock addition & vendor auto-inventory import' },
  { num: 4, id: 'projects', label: 'Projects & Tasks', tooltip: '4. Stage tracking: Initiate to Net Meter & Subsidy' },
  { num: 5, id: 'finance', label: 'Finance & Ledger', tooltip: '5. Customer & employee payments, tax invoices & reports' },
  { num: 6, id: 'support', label: 'Support & Tickets', tooltip: '6. Internal assign & contact ticket management' },
  { num: 7, id: 'hr', label: 'HR & Payroll', tooltip: '7. Staff directory, fixed & commission payroll' },
  { num: 8, id: 'settings', label: 'Master Settings', tooltip: '8. User roles, HSN codes, bank info & logo import' },
  { num: 9, id: 'documents', label: 'Documents Vault', tooltip: '9. Foldered docs: Before/after photos, Power bills & DCR' },
  { num: 10, id: 'subsidy', label: 'Subsidy Portal', tooltip: '10. PM Surya Ghar subsidy claims & disbursal tracking' },
];

export default function Sidebar({ currentView, setView, userRole }: SidebarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
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

  // Categorized headers with sub-headers & descriptions
  const headerCategories: CategoryMenu[] = [
    {
      id: 'sales-design',
      title: 'Sales & Design',
      badge: 'CRM',
      icon: Users,
      items: [
        {
          id: 'crm',
          label: 'CRM & Leads',
          subHeader: 'Lead Pipeline & GPS Drop Pin',
          description: 'Add lead via manual GPS or interactive map pin with trash bin support',
          icon: Users,
          roles: ['Super Admin', 'Solar Company Admin', 'Regional Manager', 'Sales Executive']
        },
        {
          id: 'site-survey',
          label: 'Site Survey',
          subHeader: 'Roof & Site Inspection',
          description: 'Roof measurements, before/after photos & power bill uploads',
          icon: Map,
          roles: ['Super Admin', 'Solar Company Admin', 'Regional Manager', 'Survey Engineer', 'Project Manager', 'Installer']
        },
        {
          id: 'solar-design',
          label: 'Solar 3D Design',
          subHeader: 'PV System Design',
          description: 'CAD 3D layout, shading analysis & string sizing',
          icon: PenTool,
          roles: ['Super Admin', 'Solar Company Admin', 'Design Engineer', 'Project Manager', 'Installer']
        },
        {
          id: 'proposal',
          label: 'Proposal Generator',
          subHeader: 'Customer Sales Proposals',
          description: 'ROI calculation, estimated generation & logo header integration',
          icon: FileText,
          roles: ['Super Admin', 'Solar Company Admin', 'Sales Executive']
        },
        {
          id: 'quotation',
          label: 'Quotation & Invoice',
          subHeader: 'Estimates & 70:30 Tax Split',
          description: '70% Goods & 30% Services tax calculation rule & auto DB save',
          icon: Calculator,
          roles: ['Super Admin', 'Solar Company Admin', 'Sales Executive', 'Finance Manager']
        }
      ]
    },
    {
      id: 'projects-ops',
      title: 'Projects & Supply',
      badge: 'Ops',
      icon: Sun,
      items: [
        {
          id: 'procurement',
          label: 'Purchase Orders & PO Creation',
          subHeader: 'First Procurement Step',
          description: 'Create PO / RFQ with panel, inverter, AC/DC lines & vendor auto stock',
          icon: ShoppingCart,
          roles: ['Super Admin', 'Solar Company Admin', 'Procurement Officer', 'Warehouse Manager']
        },
        {
          id: 'inventory',
          label: 'Inventory Control',
          subHeader: 'Stock & Auto Receipts',
          description: 'Auto-add vendor accepted PO items into warehouse stock',
          icon: Package,
          roles: ['Super Admin', 'Solar Company Admin', 'Warehouse Manager', 'Procurement Officer', 'Installer']
        },
        {
          id: 'projects',
          label: 'Projects & Tasks',
          subHeader: '10-Stage Workflow',
          description: 'Initiate -> Installation -> Net Meter -> Subsidy Release -> Review',
          icon: Sun,
          roles: ['Super Admin', 'Solar Company Admin', 'Regional Manager', 'Project Manager', 'Installer']
        },
        {
          id: 'work-orders',
          label: 'Work Orders',
          subHeader: 'Field Team Tasks',
          description: 'Assign site jobs, civil work & installer checklists',
          icon: Wrench,
          roles: ['Super Admin', 'Solar Company Admin', 'Project Manager', 'Installer']
        },
        {
          id: 'vendors',
          label: 'Vendor Portal & Tasks',
          subHeader: 'POs, Staff & Employee Tasks',
          description: 'Accept POs, manage vendor staff (User Limit enforced) & assign employee tasks',
          icon: Truck,
          roles: ['Super Admin', 'Solar Company Admin', 'Vendor', 'Vendor Employee', 'Procurement Officer', 'Finance Manager']
        }
      ]
    },
    {
      id: 'finance-legal',
      title: 'Finance & Legal',
      badge: 'GST',
      icon: IndianRupee,
      items: [
        {
          id: 'finance',
          label: 'Finance & Invoicing',
          subHeader: 'Payments & Ledgers',
          description: 'Customer payments, employee commission, PO tax invoices & reports',
          icon: IndianRupee,
          roles: ['Super Admin', 'Solar Company Admin', 'Finance Manager', 'Auditor']
        },
        {
          id: 'subsidy',
          label: 'Subsidy Management',
          subHeader: 'PM Surya Ghar Portal',
          description: 'Expected subsidy amount input, document verification & approval status',
          icon: Landmark,
          roles: ['Super Admin', 'Solar Company Admin', 'Finance Manager', 'Customer Support']
        },
        {
          id: 'compliance',
          label: 'Compliance & Approvals',
          subHeader: 'DISCOM & Net Metering',
          description: 'Net metering permits, DISCOM NOCs & electrical inspection',
          icon: ClipboardCheck,
          roles: ['Super Admin', 'Solar Company Admin', 'Finance Manager', 'Auditor']
        }
      ]
    },
    {
      id: 'customer-care',
      title: 'Customer Care',
      badge: 'Support',
      icon: Settings,
      items: [
        {
          id: 'support',
          label: 'Support & Tickets',
          subHeader: 'Internal & Contact Us',
          description: 'Assign complaints internally or handle contact us inquiries',
          icon: Settings,
          roles: ['Super Admin', 'Solar Company Admin', 'Customer Support', 'Project Manager']
        },
        {
          id: 'warranty',
          label: 'Warranty Tracking',
          subHeader: 'Custom Serial List',
          description: 'Track serial numbers, warranty start dates & validity (years/months/days)',
          icon: ShieldCheck,
          roles: ['Super Admin', 'Solar Company Admin', 'Customer Support']
        },
        {
          id: 'documents',
          label: 'Document Vault',
          subHeader: 'Foldered Documents',
          description: 'Before/after photos, power bills, Aadhar, passbook & DCR certificates',
          icon: FolderOpen,
          roles: ['Super Admin', 'Solar Company Admin', 'Project Manager', 'Sales Executive', 'Finance Manager']
        },
        {
          id: 'portal',
          label: 'Customer Portal',
          subHeader: 'Self-Service Portal',
          description: 'Solar generation dashboard, bill savings & review submissions',
          icon: UserCircle,
          roles: ['Super Admin', 'Customer', 'Customer Support']
        }
      ]
    },
    {
      id: 'admin-hr',
      title: 'Admin & Settings',
      badge: 'Config',
      icon: Sliders,
      items: [
        {
          id: 'reports',
          label: 'Reports & Analytics',
          subHeader: 'Business Intelligence',
          description: 'Revenue trends, team performance & conversion metrics',
          icon: BarChart,
          roles: ['Super Admin', 'Solar Company Admin', 'Regional Manager', 'Finance Manager', 'Auditor']
        },
        {
          id: 'hr',
          label: 'HR & Payroll',
          subHeader: 'Staff & Commission',
          description: 'Employee directory, fixed salary, commission & fixed+commission payroll',
          icon: UserCheck,
          roles: ['Super Admin', 'Solar Company Admin', 'Regional Manager']
        },
        {
          id: 'settings',
          label: 'Master Settings & Logos',
          subHeader: 'System Config & Branding',
          description: 'Import company logos, set HSN/GST rules, bank details & storage rates',
          icon: Sliders,
          roles: ['Super Admin', 'Solar Company Admin']
        }
      ]
    }
  ];

  const isCategoryActive = (category: CategoryMenu) => {
    return category.items.some(item => item.id === currentView);
  };

  const filterItems = (items: SubHeaderItem[]) => {
    if (!userRole) return items;
    return items.filter(item => item.roles.includes(userRole));
  };

  return (
    <div 
      ref={navRef}
      className="w-full bg-slate-900 border-b border-slate-800 text-slate-200 z-40 relative shadow-md flex flex-col"
    >
      {/* Top Categorized Menu Bar */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Direct Dashboard Button */}
          <button
            onClick={() => {
              setView('dashboard');
              setOpenDropdown(null);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 border",
              currentView === 'dashboard'
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                : "border-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <LayoutDashboard className={cn(
              "w-4 h-4",
              currentView === 'dashboard' ? "text-emerald-400" : "text-slate-400"
            )} />
            <span>Dashboard</span>
          </button>

          {/* Categorized Headers with Sub-Headers */}
          {headerCategories.map((category) => {
            const validItems = filterItems(category.items);
            if (validItems.length === 0) return null;

            const isActive = isCategoryActive(category);
            const isOpen = openDropdown === category.id;

            return (
              <div 
                key={category.id} 
                className="relative shrink-0"
                onMouseEnter={() => setOpenDropdown(category.id)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  onClick={() => {
                    if (validItems.length > 0) {
                      if (!isActive) {
                        setView(validItems[0].id);
                      }
                      setOpenDropdown(isOpen ? null : category.id);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border cursor-pointer",
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                      : isOpen
                      ? "bg-slate-800 text-white border-slate-700"
                      : "border-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <category.icon className={cn(
                    "w-4 h-4",
                    isActive ? "text-emerald-400" : "text-slate-400"
                  )} />
                  <span>{category.title}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  <ChevronDown className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200 text-slate-400",
                    isOpen ? "rotate-180 text-white" : ""
                  )} />
                </button>

                {isOpen && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-800/80 mb-1 flex justify-between items-center bg-slate-950/40 rounded-xl">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <category.icon className="w-3 h-3 text-emerald-400" />
                        {category.title} Modules
                      </span>
                      {category.badge && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {category.badge}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                      {validItems.map((subItem) => {
                        const isSubActive = currentView === subItem.id;
                        const IconComp = subItem.icon;

                        return (
                          <button
                            key={subItem.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setView(subItem.id);
                              setOpenDropdown(null);
                            }}
                            className={cn(
                              "w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-start gap-3 group border cursor-pointer",
                              isSubActive
                                ? "bg-emerald-500/15 border-emerald-500/30 text-white shadow-sm"
                                : "border-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white"
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
                                  "text-xs font-bold truncate",
                                  isSubActive ? "text-emerald-300" : "text-slate-200 group-hover:text-white"
                                )}>
                                  {subItem.label}
                                </span>
                                {isSubActive && (
                                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
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

        {/* Quick Action Button for Importing Logos (Global Admin Only) */}
        {(userRole === 'Super Admin' || userRole === 'Solar Company Admin') && (
          <button
            onClick={() => {
              setView('settings');
              setOpenDropdown(null);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all shadow-sm shrink-0 ml-2 cursor-pointer"
            title="Import Company Logos & Branding Assets"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Import Logos</span>
          </button>
        )}
      </div>

      {/* --- PDF WIREFRAME PAGE 12 NUMBERED WORKFLOW BAR (1 to 10) --- */}
      <div className="px-4 py-1.5 bg-slate-950/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold border-t border-slate-800/40 shadow-inner [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setView('dashboard')}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
          title="Dashboard Overview"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
        </button>
        <span className="text-slate-600 font-normal px-1">|</span>

        {PDF_WORKFLOW_STEPS.filter(step => {
          if (!userRole) return true;
          const adminOnlyViews = ['settings', 'hr'];
          if (adminOnlyViews.includes(step.id) && userRole !== 'Super Admin' && userRole !== 'Solar Company Admin') {
            return false;
          }
          if (step.id === 'finance' && !['Super Admin', 'Solar Company Admin', 'Finance Manager', 'Auditor'].includes(userRole)) {
            return false;
          }
          return true;
        }).map((step) => {
          const isActive = currentView === step.id;

          return (
            <button
              key={step.num}
              onClick={() => setView(step.id)}
              title={step.tooltip}
              className={cn(
                "flex items-center px-2.5 py-1 rounded-full transition-all shrink-0 border text-[11px] cursor-pointer",
                isActive
                  ? "bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-sm"
                  : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
              )}
            >
              <span className="whitespace-nowrap">{step.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

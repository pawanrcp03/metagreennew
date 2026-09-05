import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Sun, 
  Zap, 
  Calendar, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Download, 
  Filter, 
  UserCheck, 
  Building2, 
  X, 
  Check, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { cn, formatCurrency } from '@/src/lib/utils';
import { ViewType } from '@/src/types';

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  district?: string;
  state: string;
  pincode?: string;
  sanctionedLoad?: string | number;
  roofType?: string;
  systemCapacityKw?: number;
  totalProjectValue?: number;
  notes?: string;
  status?: 'Active' | 'Lead' | 'Installed' | 'Archived';
  source?: string;
  assignedTo?: string;
  installerId?: string;
  creatorId?: string;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface CustomersProps {
  onNavigate?: (view: ViewType, filter?: string) => void;
}

export default function Customers({ onNavigate }: CustomersProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoofFilter, setSelectedRoofFilter] = useState('ALL');
  const [selectedStateFilter, setSelectedStateFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [roofTypes, setRoofTypes] = useState<string[]>([
    'RCC Flat Roof',
    'Tin / Metal Shed',
    'Tiled / Mangalore Roof',
    'Asbestos Sheet',
    'Ground Mount Structure',
    'Elevated Super Structure'
  ]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    state: 'Andhra Pradesh',
    pincode: '',
    sanctionedLoad: '5',
    roofType: 'RCC Flat Roof',
    systemCapacityKw: 5,
    totalProjectValue: 350000,
    notes: '',
    status: 'Active' as const
  });

  const userRole = user?.role || 'Super Admin';
  const isVendor = userRole === 'Vendor' || userRole === 'Vendor Employee' || userRole === 'Solar Supplier';
  const isInstaller = userRole === 'Installer' || userRole === 'Solar Installer' || userRole === 'Technician';
  const isGlobalAdmin = !isVendor && !isInstaller;

  // 1. Fetch Customers Collection
  useEffect(() => {
    const qCustomers = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CustomerRecord));
      setCustomers(docs);
    });

    // 2. Also listen to Roof Types Master
    const unsubRoofs = onSnapshot(collection(db, 'roofTypes'), (snapshot) => {
      if (!snapshot.empty) {
        const types = snapshot.docs.map(d => d.data().name).filter(Boolean);
        if (types.length > 0) {
          setRoofTypes(Array.from(new Set([...types])));
        }
      }
    });

    // 3. Listen to Projects to show project count
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      setProjectsList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubCustomers();
      unsubRoofs();
      unsubProjects();
    };
  }, []);

  // Strict Role-Based Customer Filtering
  const roleScopedCustomers = customers.filter(c => {
    if (isGlobalAdmin) return true;

    const uId = user?.uid || '';
    const uEmail = (user?.email || '').toLowerCase();
    const uName = (user?.name || '').toLowerCase();
    const uCompany = (user?.companyName || '').toLowerCase();

    if (isInstaller) {
      return (
        c.creatorId === uId ||
        c.createdBy === uEmail ||
        c.installerId === uId ||
        (c.assignedTo && c.assignedTo.toLowerCase().includes(uName)) ||
        projectsList.some(p => (p.installerId === uId || p.createdBy === uEmail) && p.customerName?.toLowerCase() === c.name.toLowerCase())
      );
    }

    if (isVendor) {
      return (
        c.creatorId === uId ||
        c.createdBy === uEmail ||
        (c.assignedTo && c.assignedTo.toLowerCase().includes(uCompany)) ||
        (c.notes && c.notes.toLowerCase().includes(uCompany))
      );
    }

    return (
      c.creatorId === uId ||
      c.createdBy === uEmail ||
      (c.assignedTo && c.assignedTo.toLowerCase().includes(uName))
    );
  });

  const filteredCustomers = roleScopedCustomers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRoof = selectedRoofFilter === 'ALL' || c.roofType === selectedRoofFilter;
    const matchesState = selectedStateFilter === 'ALL' || c.state === selectedStateFilter;

    return matchesSearch && matchesRoof && matchesState;
  });

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.warning("Customer Name and Phone are required.", "Missing Fields");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        sanctionedLoad: formData.sanctionedLoad,
        roofType: formData.roofType,
        systemCapacityKw: Number(formData.systemCapacityKw) || 0,
        totalProjectValue: Number(formData.totalProjectValue) || 0,
        notes: formData.notes.trim(),
        status: formData.status,
        creatorId: user?.uid || 'admin',
        createdBy: user?.email || 'admin',
        assignedTo: user?.name || user?.companyName || 'Solar Team',
        installerId: isInstaller ? (user?.uid || '') : '',
        updatedAt: serverTimestamp()
      };

      if (editingCustomerId) {
        await updateDoc(doc(db, 'customers', editingCustomerId), payload);
        toast.success(`Customer "${formData.name}" updated successfully!`, "Customer Updated");
      } else {
        await addDoc(collection(db, 'customers'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        toast.success(`Customer "${formData.name}" registered successfully!`, "Customer Created");
      }

      setIsModalOpen(false);
      setEditingCustomerId(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        district: '',
        state: 'Andhra Pradesh',
        pincode: '',
        sanctionedLoad: '5',
        roofType: 'RCC Flat Roof',
        systemCapacityKw: 5,
        totalProjectValue: 350000,
        notes: '',
        status: 'Active'
      });
    } catch (err: any) {
      console.error('Error saving customer:', err);
      toast.error('Failed to save customer: ' + (err.message || err));
    }
  };

  const handleEdit = (c: CustomerRecord) => {
    setEditingCustomerId(c.id);
    setFormData({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      city: c.city || '',
      district: c.district || '',
      state: c.state || 'Andhra Pradesh',
      pincode: c.pincode || '',
      sanctionedLoad: c.sanctionedLoad ? String(c.sanctionedLoad) : '5',
      roofType: c.roofType || 'RCC Flat Roof',
      systemCapacityKw: c.systemCapacityKw || 5,
      totalProjectValue: c.totalProjectValue || 350000,
      notes: c.notes || '',
      status: c.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"?`)) {
      try {
        await deleteDoc(doc(db, 'customers', id));
        toast.info(`Customer "${name}" removed.`, "Deleted");
      } catch (err: any) {
        console.error('Error deleting customer:', err);
        toast.error('Failed to delete customer.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn(
              "px-3 py-0.5 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 border",
              isInstaller ? "bg-teal-500/20 text-teal-300 border-teal-500/40" :
              isVendor ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
              "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            )}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {isInstaller ? 'Solar Installer Client Directory' : isVendor ? 'Supplier Customer Scope' : 'Global Customer Database'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-emerald-400" /> Customers & Client Accounts
          </h1>
          <p className="text-slate-400 text-xs font-medium mt-1">
            {roleScopedCustomers.length} registered accounts visible to your login ({user?.email || 'admin'})
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomerId(null);
            setFormData({
              name: '',
              phone: '',
              email: '',
              address: '',
              city: '',
              district: '',
              state: 'Andhra Pradesh',
              pincode: '',
              sanctionedLoad: '5',
              roofType: roofTypes[0] || 'RCC Flat Roof',
              systemCapacityKw: 5,
              totalProjectValue: 350000,
              notes: '',
              status: 'Active'
            });
            setIsModalOpen(true);
          }}
          className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Customer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">Total Customers</span>
          <h3 className="text-2xl font-black text-slate-900">{roleScopedCustomers.length}</h3>
          <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">Account isolated</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">Installed Capacity</span>
          <h3 className="text-2xl font-black text-slate-900">
            {roleScopedCustomers.reduce((sum, c) => sum + (c.systemCapacityKw || 0), 0)} kW
          </h3>
          <span className="text-[11px] font-semibold text-teal-600 mt-1 block">Contracted solar</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">Total Project Value</span>
          <h3 className="text-2xl font-black text-slate-900">
            {formatCurrency(roleScopedCustomers.reduce((sum, c) => sum + (c.totalProjectValue || 0), 0))}
          </h3>
          <span className="text-[11px] font-semibold text-purple-600 mt-1 block">Lifetime value</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">Linked Projects</span>
          <h3 className="text-2xl font-black text-slate-900">
            {projectsList.filter(p => roleScopedCustomers.some(c => c.name.toLowerCase() === (p.customerName || '').toLowerCase())).length}
          </h3>
          <span className="text-[11px] font-semibold text-amber-600 mt-1 block">Active on-site</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, phone, email, city, address..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedRoofFilter}
            onChange={e => setSelectedRoofFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 outline-none"
          >
            <option value="ALL">All Roof Types</option>
            {roofTypes.map(rt => (
              <option key={rt} value={rt}>{rt}</option>
            ))}
          </select>

          <select
            value={selectedStateFilter}
            onChange={e => setSelectedStateFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 outline-none"
          >
            <option value="ALL">All States</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Telangana">Telangana</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Maharashtra">Maharashtra</option>
          </select>
        </div>
      </div>

      {/* Customers Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-700">No Customers Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No customers match your search criteria or none have been assigned to your account yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
            const linkedProjs = projectsList.filter(p => p.customerName?.toLowerCase() === customer.name.toLowerCase());
            return (
              <div 
                key={customer.id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {customer.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {customer.city ? `${customer.city}, ${customer.state}` : customer.address || customer.state}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEdit(customer)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id, customer.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 my-3">
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-black flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-emerald-600" />
                      {customer.systemCapacityKw || 3} kW System
                    </span>
                    <span className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs font-bold">
                      🏠 {customer.roofType || 'RCC Flat'}
                    </span>
                    {customer.sanctionedLoad && (
                      <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold">
                        ⚡ {customer.sanctionedLoad} kW Load
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 my-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${customer.phone}`} className="font-semibold text-slate-900 hover:underline">{customer.phone}</a>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[200px]">{customer.email}</span>
                      </div>
                    )}
                    {customer.totalProjectValue && (
                      <div className="flex items-center gap-2 text-slate-700 font-bold pt-1">
                        <span>Project Value:</span>
                        <span className="text-emerald-700 font-black">{formatCurrency(customer.totalProjectValue)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold text-slate-400">
                    {linkedProjs.length > 0 ? `${linkedProjs.length} Active Project(s)` : 'No active project'}
                  </span>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('projects', customer.name)}
                      className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      View Projects <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Client CRM Directory</span>
                  <h3 className="text-lg font-black text-white">{editingCustomerId ? 'Edit Customer Account' : 'Register New Customer Account'}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form id="customer-form" onSubmit={handleSubmitCustomer} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 text-xs bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Full Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. Uyyuru Nageswara Rao"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile / Phone Number *</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="customer@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Roof Type *</label>
                  <select
                    value={formData.roofType}
                    onChange={e => setFormData({ ...formData, roofType: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    {roofTypes.map(rt => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">System Size (kW) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={formData.systemCapacityKw}
                    onChange={e => setFormData({ ...formData, systemCapacityKw: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sanctioned Load (kW)</label>
                  <input
                    type="text"
                    value={formData.sanctionedLoad}
                    onChange={e => setFormData({ ...formData, sanctionedLoad: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Est. Project Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalProjectValue}
                    onChange={e => setFormData({ ...formData, totalProjectValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="350000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Street Address / Landmark</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. 2-201, Shivalayam Street, T.Narasapuram"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City / Village</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Eluru"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Andhra Pradesh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="534467"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Installation Requirements</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. 3-phase connection required, south-facing shadow-free roof."
                />
              </div>
            </form>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="customer-form"
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" /> {editingCustomerId ? 'Update Customer' : 'Save Customer Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

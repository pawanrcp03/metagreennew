import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { InventoryItem } from '@/src/types';
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  ArrowRight, 
  Zap, 
  Layers, 
  Cpu, 
  ArrowUpDown, 
  Edit2, 
  Trash2,
  ShieldCheck,
  Wrench,
  Truck,
  CheckCircle2,
  FileSpreadsheet,
  Building,
  UserCheck,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';

export default function Inventory() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'warehouse' | 'installer_bom' | 'vendor_catalog'>('warehouse');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Installer Site Consumption Modal
  const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false);
  const [selectedItemForConsumption, setSelectedItemForConsumption] = useState<InventoryItem | null>(null);
  const [consumeQty, setConsumeQty] = useState<number>(1);
  const [consumeProjectName, setConsumeProjectName] = useState<string>('PMSG Residential Solar 3kW');
  const [consumeNotes, setConsumeNotes] = useState<string>('');

  // Requisition / Material Request Modal
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
  const [requisitionItemName, setRequisitionItemName] = useState('');
  const [requisitionQty, setRequisitionQty] = useState(1);

  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [products, setProducts] = useState<{id: string, name: string}[]>([]);
  const [selectedVendorForInstaller, setSelectedVendorForInstaller] = useState<string>('ALL');

  // Strict Role Scoping based on Logged In Account
  const userRole = user?.role || 'Super Admin';
  const isVendor = userRole === 'Vendor' || userRole === 'Vendor Employee';
  const isInstaller = userRole === 'Installer' || userRole === 'Survey Engineer';
  const isGlobalAdmin = !isVendor && !isInstaller;

  const [newItem, setNewItem] = useState({ name: '', category: 'Solar Panels', quantity: 0, unit: 'Units', minThreshold: 10, serialNumber: '', warranty: '', vendor: '' });

  useEffect(() => {
    const qCategories = query(collection(db, 'inventoryCategories'), orderBy('name', 'asc'));
    const unsubCategories = onSnapshot(qCategories, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });

    const qProducts = query(collection(db, 'inventoryProducts'), orderBy('name', 'asc'));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });

    const qItems = query(collection(db, 'inventory'), orderBy('name', 'asc'));
    const unsubItems = onSnapshot(qItems, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
    });

    return () => {
      unsubCategories();
      unsubProducts();
      unsubItems();
    };
  }, []);

  // Filter Items based on user role & search term & vendor selection
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (isVendor) {
      // Vendor only sees items supplied by their specific company account
      const vendorCo = user?.companyName || 'Vikram Solar';
      const itemVendor = item.vendor || '';
      return matchesSearch && (itemVendor.toLowerCase().includes(vendorCo.toLowerCase()) || item.vendorId === user?.uid);
    }

    if (isInstaller && selectedVendorForInstaller !== 'ALL') {
      const itemVendor = item.vendor || '';
      return matchesSearch && itemVendor.toLowerCase().includes(selectedVendorForInstaller.toLowerCase());
    }

    return matchesSearch;
  });

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItemId) {
        await updateDoc(doc(db, 'inventory', editingItemId), {
          ...newItem,
          lastUpdated: serverTimestamp()
        });
        toast.success(`Inventory item "${newItem.name}" updated successfully!`, 'Stock Updated');
      } else {
        await addDoc(collection(db, 'inventory'), {
          ...newItem,
          lastUpdated: serverTimestamp()
        });
        toast.success(`New component "${newItem.name}" added to Warehouse Stock!`, 'Stock Provisioned');
      }
      setIsModalOpen(false);
      setEditingItemId(null);
      setNewItem({ name: '', category: 'Solar Panels', quantity: 0, unit: 'Units', minThreshold: 10, serialNumber: '', warranty: '', vendor: '' });
    } catch (err) {
      console.error('Error saving inventory item:', err);
      toast.error('Failed to save inventory item.', 'Error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
        toast.success('Inventory SKU removed from stock list.', 'Item Deleted');
      } catch (err) {
        console.error('Error deleting inventory item:', err);
      }
    }
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    try {
      await updateDoc(doc(db, 'inventory', id), { quantity: Math.max(0, newQuantity) });
      toast.info(`Stock quantity updated to ${newQuantity}`, 'Quantity Adjusted');
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  // Installer Mark Consumed on Site
  const handleMarkConsumedOnSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForConsumption) return;

    const remainingQty = Math.max(0, selectedItemForConsumption.quantity - consumeQty);

    try {
      // 1. Update Inventory Stock
      await updateDoc(doc(db, 'inventory', selectedItemForConsumption.id), {
        quantity: remainingQty,
        lastUpdated: serverTimestamp()
      });

      // 2. Log Site Consumption Record
      await addDoc(collection(db, 'siteConsumptions'), {
        itemId: selectedItemForConsumption.id,
        itemName: selectedItemForConsumption.name,
        category: selectedItemForConsumption.category,
        consumedQuantity: consumeQty,
        unit: selectedItemForConsumption.unit,
        projectName: consumeProjectName,
        installerEmail: user?.email || 'installer@solar.com',
        installerName: user?.name || 'Lead Installer',
        notes: consumeNotes,
        timestamp: serverTimestamp()
      });

      toast.success(
        `⚡ ${consumeQty} ${selectedItemForConsumption.unit} of "${selectedItemForConsumption.name}" marked as Consumed on Site for ${consumeProjectName}!`, 
        'Site Hardware Consumed'
      );
      setIsConsumeModalOpen(false);
      setSelectedItemForConsumption(null);
      setConsumeNotes('');
    } catch (err) {
      console.error('Error marking stock consumed:', err);
      toast.error('Failed to log site stock consumption.', 'Error');
    }
  };

  // Installer Material Requisition Submit
  const handleRequisitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'stockRequisitions'), {
        itemName: requisitionItemName,
        requestedQuantity: requisitionQty,
        requesterEmail: user?.email || 'installer@solar.com',
        requesterName: user?.name || 'Lead Installer',
        status: 'Pending Warehouse Approval',
        timestamp: serverTimestamp()
      });
      toast.success(`📝 Material Requisition for ${requisitionQty} x "${requisitionItemName}" submitted to Warehouse & Vendor!`, 'Requisition Sent');
      setIsRequisitionModalOpen(false);
      setRequisitionItemName('');
      setRequisitionQty(1);
    } catch (err) {
      console.error('Error submitting requisition:', err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Solar Panels': return Zap;
      case 'Inverters': return Cpu;
      case 'Batteries': return Layers;
      default: return Package;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      
      {/* ROLE SCOPE BADGE & HEADER */}
      <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-xl shadow-slate-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "px-3 py-0.5 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 border",
              isVendor && "bg-amber-500/20 text-amber-300 border-amber-500/40",
              isInstaller && "bg-teal-500/20 text-teal-300 border-teal-500/40",
              isGlobalAdmin && "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            )}>
              <ShieldCheck className="w-3.5 h-3.5" />
              USER ROLE: {userRole.toUpperCase()} ({user?.email || 'admin'})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-emerald-400" /> Warehouse & Live Site Stock Engine
          </h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            {isInstaller 
              ? '🔧 Field Installer Mode: Track assigned project BOM kits, log site consumption & request materials.'
              : isVendor 
                ? '🏢 Vendor Supply Mode: Manage supplied solar panels, inverters & dispatch PO shipments.'
                : '👑 Global Admin Scope: Full warehouse stock control, low-threshold alerts & installer site usage tracking.'}
          </p>
        </div>
      </div>

      {/* TABS & ACTION BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 no-scrollbar">
          <button
            onClick={() => setActiveTab('warehouse')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer",
              activeTab === 'warehouse'
                ? "bg-slate-900 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Package className="w-4 h-4 text-emerald-500" />
            Live Warehouse Stock ({filteredItems.length})
          </button>

          <button
            onClick={() => setActiveTab('installer_bom')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer",
              activeTab === 'installer_bom'
                ? "bg-slate-900 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Wrench className="w-4 h-4 text-teal-500" />
            Installer Site BOM & Consumptions
          </button>

          <button
            onClick={() => setActiveTab('vendor_catalog')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer",
              activeTab === 'vendor_catalog'
                ? "bg-slate-900 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Building className="w-4 h-4 text-amber-500" />
            Vendor Supplied Catalog
          </button>
        </div>

        {/* Action Buttons & Vendor Selector for Installers */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {isInstaller && (
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-200">
              <Building className="w-4 h-4 text-emerald-600 ml-2" />
              <span className="text-xs font-black text-slate-600">Vendor:</span>
              <select
                value={selectedVendorForInstaller}
                onChange={(e) => setSelectedVendorForInstaller(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer shadow-xs"
              >
                <option value="ALL">All Authorized Vendors</option>
                <option value="Vikram Solar">Vikram Solar (PV Modules & Inverters)</option>
                <option value="Waaree Energies">Waaree Energies Ltd.</option>
                <option value="Tata Power Solar">Tata Power Solar Systems</option>
              </select>
            </div>
          )}

          {isInstaller && (
            <button
              onClick={() => setIsRequisitionModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black rounded-2xl transition-all shadow-md shadow-teal-600/20 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" /> Request Materials
            </button>
          )}

          {!isInstaller && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl transition-all shadow-md shadow-emerald-600/20 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Provision Stock
            </button>
          )}
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Inventory SKUs</p>
              <h3 className="text-2xl font-black text-slate-900">{items.length} Component Types</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Low Stock Reorder Alerts</p>
              <h3 className="text-2xl font-black text-amber-600">
                {items.filter(item => item.quantity <= item.minThreshold).length} Low Stock Items
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-teal-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Assigned Site Kits</p>
              <h3 className="text-2xl font-black text-teal-700">
                {items.reduce((acc, curr) => acc + (curr.quantity || 0), 0)} Total Units Available
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH BAR & STOCK LIST TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by component SKU, category, or vendor..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold transition-all"
            />
          </div>
          <span className="text-xs font-black text-slate-500">
            Showing {filteredItems.length} items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Component SKU & Category</th>
                <th className="px-6 py-4">Supplier / Vendor</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Stock Status</th>
                <th className="px-6 py-4 text-right">Role Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const Icon = getCategoryIcon(item.category);
                const isLow = item.quantity <= item.minThreshold;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{item.name}</p>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category} {item.serialNumber ? `• S/N: ${item.serialNumber}` : ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {item.vendor || 'Vikram Solar'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {!isInstaller && (
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                          >
                            -
                          </button>
                        )}
                        <span className="font-mono font-black text-slate-900 text-sm">{item.quantity} {item.unit}</span>
                        {!isInstaller && (
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Low Stock ({item.quantity} left)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Optimal Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Installer Specific Action: Consume on Site */}
                        {(isInstaller || isGlobalAdmin) && (
                          <button
                            onClick={() => {
                              setSelectedItemForConsumption(item);
                              setConsumeQty(1);
                              setIsConsumeModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1 cursor-pointer"
                            title="Mark item quantity consumed during site installation"
                          >
                            <Wrench className="w-3.5 h-3.5" /> Consume on Site
                          </button>
                        )}

                        {/* Admin Controls */}
                        {isGlobalAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setEditingItemId(item.id);
                                setNewItem({
                                  name: item.name,
                                  category: item.category,
                                  quantity: item.quantity,
                                  unit: item.unit,
                                  minThreshold: item.minThreshold,
                                  serialNumber: item.serialNumber || '',
                                  warranty: item.warranty || '',
                                  vendor: item.vendor || ''
                                });
                                setIsModalOpen(true);
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                              title="Edit SKU Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MARK CONSUMED ON SITE MODAL */}
      {isConsumeModalOpen && selectedItemForConsumption && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 font-sans">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Field Installer Site Log</span>
                <h3 className="text-xl font-black">Mark Hardware Consumed on Site</h3>
              </div>
              <button onClick={() => setIsConsumeModalOpen(false)} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">&times;</button>
            </div>

            <form onSubmit={handleMarkConsumedOnSite} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl flex items-center gap-3">
                <Wrench className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <p className="font-black text-teal-950 text-sm">{selectedItemForConsumption.name}</p>
                  <p className="text-[11px] font-bold text-teal-700">Current Warehouse Stock: {selectedItemForConsumption.quantity} {selectedItemForConsumption.unit}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Project Name *</label>
                <input required type="text" value={consumeProjectName} onChange={e => setConsumeProjectName(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:border-emerald-500" placeholder="e.g. Ramesh Kumar 3kW Installation" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantity Consumed *</label>
                <input required type="number" min="1" max={selectedItemForConsumption.quantity} value={consumeQty} onChange={e => setConsumeQty(Number(e.target.value))} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-emerald-600 outline-none focus:border-emerald-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Installation Notes / Serial Numbers</label>
                <textarea rows={2} value={consumeNotes} onChange={e => setConsumeNotes(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-500" placeholder="e.g. Mounted 6 panels on south-facing roof rail. Serial: PANEL-2026-9812." />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsConsumeModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-black text-xs rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black text-xs rounded-xl shadow-md shadow-teal-600/20 hover:from-teal-500 hover:to-emerald-500 transition-all">Confirm Site Usage</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MATERIAL REQUISITION MODAL */}
      {isRequisitionModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 font-sans">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Installer Requisition Engine</span>
                <h3 className="text-xl font-black">Request Stock / Material Issue</h3>
              </div>
              <button onClick={() => setIsRequisitionModalOpen(false)} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">&times;</button>
            </div>

            <form onSubmit={handleRequisitionSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Required Component Name *</label>
                <input required type="text" value={requisitionItemName} onChange={e => setRequisitionItemName(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:border-emerald-500" placeholder="e.g. 540W Mono PERC Panel / 4mm DC Cable" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Requested Quantity *</label>
                <input required type="number" min="1" value={requisitionQty} onChange={e => setRequisitionQty(Number(e.target.value))} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-emerald-600 outline-none focus:border-emerald-500" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsRequisitionModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-black text-xs rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition-all">Submit Requisition</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROVISION NEW STOCK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 font-sans">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Warehouse Management</span>
                <h3 className="text-xl font-black">{editingItemId ? 'Edit Component SKU' : 'Provision New Stock SKU'}</h3>
              </div>
              <button onClick={() => {setIsModalOpen(false); setEditingItemId(null);}} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">&times;</button>
            </div>

            <form onSubmit={handleSubmitItem} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Component Name *</label>
                <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:border-emerald-500" placeholder="e.g. Vikram 540W Mono PERC Panel" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category *</label>
                  <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:border-emerald-500">
                    <option value="Solar Panels">Solar Panels</option>
                    <option value="Inverters">Inverters</option>
                    <option value="Batteries">Batteries</option>
                    <option value="Cables & Accessories">Cables & Accessories</option>
                    <option value="Mounting Structures">Mounting Structures</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Supplier / Vendor *</label>
                  <input type="text" value={newItem.vendor} onChange={e => setNewItem({...newItem, vendor: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:border-emerald-500" placeholder="e.g. Vikram Solar" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stock Quantity *</label>
                  <input required type="number" min="0" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-emerald-600 outline-none focus:border-emerald-500" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unit *</label>
                  <input required type="text" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:border-emerald-500" placeholder="Units / Meters" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Min Threshold *</label>
                  <input required type="number" min="1" value={newItem.minThreshold} onChange={e => setNewItem({...newItem, minThreshold: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-amber-600 outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsModalOpen(false); setEditingItemId(null);}} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-black text-xs rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition-all">Save SKU</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

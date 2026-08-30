import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Store, 
  FileText, 
  Truck, 
  Receipt, 
  CreditCard,
  Star,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle, Edit2, Trash2, ArrowRight, PackageCheck, Zap, Package, ShieldCheck, Check, Lock, Percent, Layers, Building2, User
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';

export type ProductType = 'Panel' | 'Inverter' | 'AC/DC Cable' | 'Battery' | 'Structure' | 'Accessories' | 'Other';
export type POItemUnit = 'KW' | 'MW' | 'MTR' | 'TON' | 'KG' | 'PCS';

export interface POItemRow {
  id: string;
  name: string;
  type: ProductType;
  unit: POItemUnit;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export default function Procurement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'purchase' | 'vendors'>('purchase');
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');

  const [vendors, setVendors] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

  useEffect(() => {
    const qVendors = query(collection(db, 'vendors'), orderBy('name', 'asc'));
    const unsubVendors = onSnapshot(qVendors, (snapshot) => {
      if (!snapshot.empty) {
        setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });

    const qPOs = query(collection(db, 'purchaseOrders'), orderBy('date', 'desc'));
    const unsubPOs = onSnapshot(qPOs, (snapshot) => {
      setPurchaseOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubVendors(); unsubPOs(); };
  }, []);

  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);

  const [newVendor, setNewVendor] = useState({ name: '', category: 'Solar Panels', contact: '', phone: '' });

  // PO Dynamic Items Form State with Unit (MTR / KW / MW / TON / KG / PCS)
  const [selectedVendorName, setSelectedVendorName] = useState('');
  const [poItems, setPoItems] = useState<POItemRow[]>([
    { id: '1', name: 'Vikram Solar Mono PERC 550W Panels', type: 'Panel', unit: 'KW', quantity: 20, unitPrice: 22000, taxRate: 12 },
    { id: '2', name: 'GroWatt 5kW On-Grid Solar Inverter', type: 'Inverter', unit: 'KW', quantity: 5, unitPrice: 9500, taxRate: 18 },
    { id: '3', name: 'Polycab 4 sq mm Solar DC Cable Red/Black', type: 'AC/DC Cable', unit: 'MTR', quantity: 300, unitPrice: 48, taxRate: 18 }
  ]);

  const poTaxableSubtotal = poItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const poTotalTaxAmount = poItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
  const poGrandTotal = poTaxableSubtotal + poTotalTaxAmount;

  const isGlobalAdmin = !user || user.role === 'Super Admin' || user.role === 'Solar Company Admin';

  // Vendor-specific strict PO filtering
  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    // 1. Search Query Filter
    const matchesSearch = !searchQuery || 
                          po.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          po.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          po.displayId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          po.items?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Vendor Login Scope: If logged in as Vendor, ONLY show POs for this vendor!
    if (user?.role === 'Vendor') {
      const vendorMatch = po.vendor?.toLowerCase().includes(user.name?.toLowerCase() || '') ||
                          po.vendor?.toLowerCase().includes((user.email || '').split('@')[0].toLowerCase());
      return vendorMatch;
    }

    // 3. Selected Vendor Filter Dropdown
    if (vendorFilter !== 'ALL' && po.vendor !== vendorFilter) {
      return false;
    }

    return true;
  });

  // Group POs Vendor-Wise for Global Admin View
  const vendorWiseGroupedPOs = filteredPurchaseOrders.reduce((acc: Record<string, any[]>, po) => {
    const vName = po.vendor || 'Unassigned Vendor';
    if (!acc[vName]) acc[vName] = [];
    acc[vName].push(po);
    return acc;
  }, {});

  const handleAddPoItemRow = () => {
    setPoItems([
      ...poItems,
      { id: Date.now().toString(), name: '', type: 'Panel', unit: 'KW', quantity: 10, unitPrice: 22000, taxRate: 12 }
    ]);
  };

  const handleRemovePoItemRow = (id: string) => {
    setPoItems(poItems.filter(item => item.id !== id));
  };

  const handleUpdatePoItemRow = (id: string, field: keyof POItemRow, value: any) => {
    setPoItems(poItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmitVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendorId) {
        await updateDoc(doc(db, 'vendors', editingVendorId), {
          name: newVendor.name,
          category: newVendor.category,
          contact: newVendor.contact,
          phone: newVendor.phone
        });
      } else {
        const newId = `VEN-${String(vendors.length + 1).padStart(3, '0')}`;
        await addDoc(collection(db, 'vendors'), {
          displayId: newId,
          name: newVendor.name,
          category: newVendor.category,
          contact: newVendor.contact,
          phone: newVendor.phone,
          rating: 4.8,
          metrics: { delivery: 4.8, quality: 4.9, pricing: 4.5, support: 4.7 },
          status: 'Active',
          createdAt: serverTimestamp()
        });
      }
      setIsVendorModalOpen(false);
      setEditingVendorId(null);
      setNewVendor({ name: '', category: 'Solar Panels', contact: '', phone: '' });
    } catch (err) {
      console.error('Error saving vendor', err);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        await deleteDoc(doc(db, 'vendors', id));
      } catch (err) {
        console.error('Error deleting vendor:', err);
      }
    }
  };

  const handleSubmitPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorName) {
      toast.warning("Please select a vendor for this PO.", "Vendor Required");
      return;
    }
    if (poItems.length === 0) {
      toast.warning("Please add at least one item row to the PO.", "Items Required");
      return;
    }

    const itemsSummaryStr = poItems.map(i => `${i.quantity} ${i.unit || 'PCS'} x ${i.name} (${i.type}) @ ₹${i.unitPrice.toLocaleString('en-IN')}/${i.unit || 'Unit'} (+${i.taxRate}% GST)`).join(', ');

    try {
      if (editingPoId) {
        await updateDoc(doc(db, 'purchaseOrders', editingPoId), {
          vendor: selectedVendorName,
          poItems,
          items: itemsSummaryStr,
          taxableAmount: poTaxableSubtotal,
          taxAmount: poTotalTaxAmount,
          amount: poGrandTotal,
          createdBy: user?.email || 'admin'
        });
        toast.success(`Purchase Order updated for ${selectedVendorName}!`, 'PO Updated');
      } else {
        const newId = `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`;
        await addDoc(collection(db, 'purchaseOrders'), {
          displayId: newId,
          vendor: selectedVendorName,
          poItems,
          items: itemsSummaryStr,
          taxableAmount: poTaxableSubtotal,
          taxAmount: poTotalTaxAmount,
          amount: poGrandTotal,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
          status: 'Pending Vendor Acceptance',
          expectedDelivery: '7 Days',
          stage: 1,
          createdBy: user?.email || 'admin',
          creatorRole: user?.role || 'Super Admin',
          createdAt: serverTimestamp()
        });
        toast.success(`Purchase Order created for ${selectedVendorName}! Shown exclusively to ${selectedVendorName} and Global Admin.`, 'PO Created');
      }
      setIsPoModalOpen(false);
      setEditingPoId(null);
      setSelectedVendorName('');
      setPoItems([
        { id: '1', name: 'Vikram Solar Mono PERC 550W Panels', type: 'Panel', unit: 'KW', quantity: 20, unitPrice: 22000, taxRate: 12 },
        { id: '2', name: 'GroWatt 5kW On-Grid Solar Inverter', type: 'Inverter', unit: 'KW', quantity: 5, unitPrice: 9500, taxRate: 18 },
        { id: '3', name: 'Polycab 4 sq mm Solar DC Cable Red/Black', type: 'AC/DC Cable', unit: 'MTR', quantity: 300, unitPrice: 48, taxRate: 18 }
      ]);
    } catch (err) {
      console.error('Error saving PO', err);
      toast.error('Failed to save Purchase Order.', 'PO Error');
    }
  };

  // Vendor Action: Accept PO
  const handleVendorAcceptPO = async (poId: string) => {
    try {
      await updateDoc(doc(db, 'purchaseOrders', poId), {
        status: 'Accepted',
        stage: 2,
        acceptedAt: serverTimestamp()
      });
      toast.success("PO Accepted by Vendor! Payment & Inventory Receiving are now enabled.", "PO Accepted");
    } catch (err) {
      console.error("Error accepting PO", err);
      toast.error("Failed to accept Purchase Order.", "PO Error");
    }
  };

  // Receive PO Stock & Auto Add to Inventory
  const handleReceiveStockAndInvoice = async (po: any) => {
    if (po.status !== 'Accepted') {
      toast.error("Cannot add to Inventory: Vendor must accept the PO first!", "Acceptance Required");
      return;
    }

    if (!window.confirm(`Receive stock for ${po.displayId || po.id} and auto-add items to Inventory?`)) return;

    try {
      await addDoc(collection(db, 'vendorInvoices'), {
        poId: po.id,
        displayId: po.displayId || po.id,
        vendor: po.vendor,
        taxableAmount: po.taxableAmount || po.amount,
        taxAmount: po.taxAmount || 0,
        amount: po.amount,
        items: po.poItems || [],
        date: new Date().toISOString().split('T')[0],
        status: 'Unpaid',
        createdBy: user?.email || 'admin',
        createdAt: serverTimestamp()
      });

      const itemsToStock: POItemRow[] = po.poItems || [
        { id: '1', name: po.items || 'Solar Equipment', type: 'Panel', unit: 'KW', quantity: 10, unitPrice: po.amount / 10, taxRate: 12 }
      ];

      for (const item of itemsToStock) {
        const invQuery = query(collection(db, 'inventory'), where('name', '==', item.name));
        const invSnap = await getDocs(invQuery);

        if (!invSnap.empty) {
          const existingDoc = invSnap.docs[0];
          const currentQty = existingDoc.data().quantity || 0;
          await updateDoc(doc(db, 'inventory', existingDoc.id), {
            quantity: currentQty + item.quantity,
            unit: item.unit || existingDoc.data().unit || 'PCS',
            price: item.unitPrice,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            gst: item.taxRate,
            lastUpdated: serverTimestamp()
          });
        } else {
          await addDoc(collection(db, 'inventory'), {
            name: item.name,
            type: item.type === 'AC/DC Cable' ? 'Wire' : item.type,
            category: item.type === 'Panel' ? 'Solar Panels' : 
                      item.type === 'Inverter' ? 'Inverters' : 
                      item.type === 'Battery' ? 'Batteries' : 
                      item.type === 'AC/DC Cable' ? 'Cables & Accessories' : 'Mounting Structures',
            quantity: item.quantity,
            unit: item.unit || 'PCS',
            minThreshold: 5,
            vendor: po.vendor,
            price: item.unitPrice,
            unitPrice: item.unitPrice,
            gst: item.taxRate,
            taxRate: item.taxRate,
            pricingBasis: ['TON', 'KG'].includes(item.unit) ? 'Per Weight' : 'Per Unit',
            lastUpdated: serverTimestamp()
          });
        }
      }

      await updateDoc(doc(db, 'purchaseOrders', po.id), {
        status: 'Received & Invoiced',
        stage: 4
      });

      toast.success(`Stock for ${po.displayId || po.id} received and auto-added to Inventory with units!`, 'Stock Received');
    } catch (err) {
      console.error('Error receiving stock', err);
      toast.error("Failed to process stock receipt.", "Error");
    }
  };

  const handleDeletePo = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this PO?")) {
      try {
        await deleteDoc(doc(db, 'purchaseOrders', id));
      } catch (err) {
        console.error('Error deleting PO:', err);
      }
    }
  };

  const advanceStage = async (id: string, currentStage: number) => {
    if (currentStage >= 5) return;
    try {
      await updateDoc(doc(db, 'purchaseOrders', id), {
        stage: currentStage + 1,
        status: getStageName(currentStage + 1)
      });
    } catch (err) {
      console.error('Error advancing stage:', err);
    }
  };

  const getStageColor = (currentStage: number, stage: number) => {
    if (currentStage > stage) return 'bg-emerald-500 text-white border-emerald-500';
    if (currentStage === stage) return 'bg-blue-500 text-white border-blue-500';
    return 'bg-white text-slate-400 border-slate-200';
  };

  const getStageIcon = (stage: number) => {
    switch (stage) {
      case 1: return <FileText className="w-4 h-4" />;
      case 2: return <ShoppingCart className="w-4 h-4" />;
      case 3: return <Truck className="w-4 h-4" />;
      case 4: return <Receipt className="w-4 h-4" />;
      case 5: return <CreditCard className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getStageName = (stage: number) => {
    switch (stage) {
      case 1: return 'RFQ';
      case 2: return 'PO Accepted';
      case 3: return 'Delivery Tracking';
      case 4: return 'Received & Invoiced';
      case 5: return 'Payment Completed';
      default: return '';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={cn(
              "w-3.5 h-3.5",
              star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
            )} 
          />
        ))}
      </div>
    );
  };

  const renderSinglePOCard = (po: any) => {
    const isAccepted = po.status === 'Accepted';
    const isReceived = po.status === 'Received & Invoiced';
    const isPending = !isAccepted && !isReceived;

    return (
      <div key={po.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {po.stage < 5 && (
            <button onClick={() => advanceStage(po.id, po.stage)} title="Advance Stage" className="p-1.5 hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => handleDeletePo(po.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pr-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-slate-900 text-white text-xs font-black rounded-md">
                {po.displayId || po.id}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">{po.vendor}</h3>
            </div>
            
            {po.poItems && po.poItems.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {po.poItems.map((item: any, idx: number) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-semibold">
                    <span className="font-black text-emerald-700">{item.quantity} {item.unit || 'PCS'}</span>
                    <span className="truncate max-w-[200px]">{item.name || item.type}</span>
                    <span className="text-slate-500 font-mono text-[11px]">@ ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}/{item.unit || 'Unit'}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600 font-medium mt-1">
                {po.items}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mt-2">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Date: {po.date}</span>
              <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5"/> Exp. Delivery: {po.expectedDelivery}</span>
              {po.createdBy && <span className="text-slate-400">| Created by: {po.createdBy}</span>}
            </div>
          </div>

          <div className="flex flex-col lg:items-end gap-2 shrink-0">
            <div className="text-[11px] font-bold text-slate-400">
              Taxable: ₹{po.taxableAmount?.toLocaleString()} | Tax: ₹{po.taxAmount?.toLocaleString()}
            </div>
            <div className="text-2xl font-black text-slate-900">₹{po.amount?.toLocaleString()}</div>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                "text-xs font-extrabold px-3 py-1 rounded-full uppercase border flex items-center gap-1",
                isAccepted ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                isReceived ? "bg-purple-100 text-purple-800 border-purple-200" :
                "bg-amber-50 text-amber-800 border-amber-200"
              )}>
                {isAccepted ? <Check className="w-3.5 h-3.5" /> : isPending ? <Clock className="w-3.5 h-3.5" /> : <PackageCheck className="w-3.5 h-3.5" />}
                {po.status}
              </span>

              {/* VENDOR ACCEPTANCE TRIGGER BUTTON */}
              {isPending && (
                <button
                  onClick={() => handleVendorAcceptPO(po.id)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition-all shadow-sm flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Accept PO (Vendor)
                </button>
              )}

              {/* RECEIVE STOCK & AUTO-ADD TO INVENTORY ACTION BUTTON */}
              {isAccepted && (
                <button
                  onClick={() => handleReceiveStockAndInvoice(po)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center gap-1.5"
                >
                  <PackageCheck className="w-4 h-4" /> Receive Stock & Add Inventory
                </button>
              )}

              {isPending && (
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                  <Lock className="w-3 h-3 text-slate-400" /> Inventory Locked until Vendor Accepts
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="relative pt-4 border-t border-slate-100">
           <div className="absolute top-8 left-4 right-4 h-0.5 bg-slate-100 -z-10" />
           <div className="flex justify-between">
              {[1, 2, 3, 4, 5].map((stageNumber) => (
                 <div key={stageNumber} className="flex flex-col items-center gap-2 w-24">
                    <div className={cn(
                       "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors bg-white",
                       getStageColor(po.stage, stageNumber)
                    )}>
                       {po.stage > stageNumber ? <CheckCircle2 className="w-4 h-4" /> : getStageIcon(stageNumber)}
                    </div>
                    <span className={cn(
                       "text-[10px] font-bold text-center",
                       po.stage >= stageNumber ? "text-slate-700" : "text-slate-400"
                    )}>
                       {getStageName(stageNumber)}
                    </span>
                 </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              User Scope: {user?.role || 'Super Admin'} ({user?.email || 'admin'})
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-emerald-600" /> Vendor-Wise Purchase Orders
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            POs are shown exclusively to their specific vendor, while Global Admin views vendor-grouped POs.
          </p>
        </div>
      </header>

      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar border-b border-slate-100">
        {[
          { id: 'purchase', label: '1. Purchase Orders (PO Workflow)', icon: ShoppingCart },
          { id: 'vendors', label: '2. Registered Vendors Catalog', icon: Store },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.id 
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200" 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64 flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'purchase' ? "Search POs..." : "Search Solar Suppliers..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          {/* Supplier Filter Dropdown for Admin */}
          {activeTab === 'purchase' && isGlobalAdmin && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Supplier Scope:</label>
              <select
                value={vendorFilter}
                onChange={e => setVendorFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ALL">All Suppliers (Supplier-Wise Grouping)</option>
                {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
            </div>
          )}

          {activeTab === 'purchase' && isGlobalAdmin && (
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-bold">
              <button 
                onClick={() => setViewMode('grouped')}
                className={cn("px-2.5 py-1 rounded-md transition-all", viewMode === 'grouped' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500")}
              >
                Supplier Grouped
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("px-2.5 py-1 rounded-md transition-all", viewMode === 'list' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500")}
              >
                All List
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
           <button 
             onClick={() => activeTab === 'purchase' ? setIsPoModalOpen(true) : setIsVendorModalOpen(true)}
             className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl transition-all flex items-center gap-2 text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
           >
             <Plus className="w-4 h-4" /> {activeTab === 'purchase' ? '+ Create Purchase Order' : '+ Add Solar Supplier'}
           </button>
        </div>
      </div>

      {activeTab === 'purchase' && (
        <div className="space-y-6">
          {/* GLOBAL ADMIN VIEW: VENDOR-WISE GROUPED PURCHASE ORDERS */}
          {isGlobalAdmin && viewMode === 'grouped' && (
            <div className="space-y-8">
              {Object.keys(vendorWiseGroupedPOs).length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold">No Purchase Orders found for the selected criteria.</p>
                </div>
              ) : (
                Object.entries(vendorWiseGroupedPOs).map(([vName, vPOs]: [string, any[]]) => {
                  const vTotalAmount = vPOs.reduce((s, p) => s + (p.amount || 0), 0);
                  const vAcceptedCount = vPOs.filter(p => p.status === 'Accepted' || p.status === 'Received & Invoiced').length;

                  return (
                    <div key={vName} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-4">
                      {/* Vendor Group Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                              {vName}
                              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                {vPOs.length} PO{vPOs.length > 1 ? 's' : ''}
                              </span>
                            </h2>
                            <p className="text-xs text-slate-500 font-semibold">
                              Vendor Accepted: {vAcceptedCount} of {vPOs.length} Orders
                            </p>
                          </div>
                        </div>

                        <div className="text-right bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Total Vendor Order Value</p>
                          <p className="text-lg font-black text-slate-900">₹{vTotalAmount.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Vendor PO Cards */}
                      <div className="grid grid-cols-1 gap-4">
                        {vPOs.map(po => renderSinglePOCard(po))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* LIST VIEW / VENDOR SPECIFIC VIEW */}
          {(!isGlobalAdmin || viewMode === 'list') && (
            <div className="grid grid-cols-1 gap-4">
              {filteredPurchaseOrders.map(po => renderSinglePOCard(po))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {vendors.map(vendor => (
              <div key={vendor.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full relative group">
                 <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => { setEditingVendorId(vendor.id); setNewVendor({ name: vendor.name, category: vendor.category, contact: vendor.contact, phone: vendor.phone }); setIsVendorModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
                     <Edit2 className="w-4 h-4" />
                   </button>
                   <button onClick={() => handleDeleteVendor(vendor.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
                 <div className="flex justify-between items-start mb-4 pr-16">
                    <div>
                       <h3 className="text-lg font-bold text-slate-900">{vendor.name}</h3>
                       <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mt-1">{vendor.category}</p>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-lg font-black text-slate-900">{(vendor.rating || 4.8).toFixed(1)}</span>
                       {renderStars(vendor.rating || 4.8)}
                    </div>
                 </div>
                 
                 <div className="text-sm text-slate-600 mb-6 space-y-1">
                    <p>{vendor.contact}</p>
                    <p>{vendor.phone}</p>
                 </div>

                 <div className="mt-auto space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Stock Level & Catalog</h4>
                    <p className="text-xs text-slate-500 font-medium">Registered vendor for solar equipment procurement</p>
                 </div>
              </div>
           ))}
        </div>
      )}

      {/* CREATE PO / RFQ MODAL */}
      {isPoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Fixed Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  {editingPoId ? 'Edit PO' : 'Create Purchase Order / RFQ'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Calculate PO items by Meter (MTR), Kilowatts (KW), Megawatts (MW), Tons (TON), KG, or Pieces (PCS)
                </p>
              </div>
              <button onClick={() => setIsPoModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer">&times;</button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitPo} className="flex-1 overflow-y-auto flex flex-col">
              <div className="p-5 sm:p-6 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Registered Vendor *</label>
                  <select 
                    required 
                    value={selectedVendorName} 
                    onChange={e => setSelectedVendorName(e.target.value)} 
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white"
                  >
                    <option value="">-- Choose Registered Vendor --</option>
                    {vendors.map(v => <option key={v.id} value={v.name}>{v.name} ({v.category})</option>)}
                  </select>
                </div>

                {/* Items Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="text-xs font-black uppercase text-slate-800">PO Items & Unit Calculations</span>
                      <p className="text-[11px] text-slate-400 font-medium">Auto calculates Line Total = (Quantity × Unit Rate) + GST</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddPoItemRow}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Add Item Row
                    </button>
                  </div>

                  {/* Column Headers for larger screens */}
                  <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600">
                    <div className="w-28 shrink-0">Type</div>
                    <div className="flex-1 min-w-[140px]">Item Description</div>
                    <div className="w-36 shrink-0">Unit</div>
                    <div className="w-20 shrink-0 text-center">Qty</div>
                    <div className="w-32 shrink-0 text-right">Rate (₹ / Unit)</div>
                    <div className="w-24 shrink-0 text-center">GST %</div>
                    <div className="w-32 shrink-0 text-right">Total (₹)</div>
                    <div className="w-8 shrink-0 text-center"></div>
                  </div>

                  <div className="space-y-2.5">
                    {poItems.map((item) => {
                      const rowTaxable = item.quantity * item.unitPrice;
                      const rowTax = rowTaxable * (item.taxRate / 100);
                      const rowTotal = rowTaxable + rowTax;
                      return (
                        <div key={item.id} className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 text-xs transition-colors space-y-2">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
                            {/* Type Selector */}
                            <div className="lg:w-28 shrink-0">
                              <label className="block lg:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">Type</label>
                              <select
                                value={item.type}
                                onChange={e => {
                                  const newType = e.target.value as ProductType;
                                  let defaultUnit: POItemUnit = item.unit || 'PCS';
                                  if (newType === 'Panel' || newType === 'Inverter') defaultUnit = 'KW';
                                  else if (newType === 'AC/DC Cable') defaultUnit = 'MTR';
                                  else if (newType === 'Structure') defaultUnit = 'TON';
                                  else if (newType === 'Battery') defaultUnit = 'KW';
                                  else if (newType === 'Accessories') defaultUnit = 'PCS';
                                  
                                  setPoItems(poItems.map(p => p.id === item.id ? { ...p, type: newType, unit: defaultUnit } : p));
                                }}
                                className="w-full p-2 border border-slate-200 rounded-lg font-bold bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                              >
                                <option value="Panel">Panel</option>
                                <option value="Inverter">Inverter</option>
                                <option value="AC/DC Cable">AC/DC Cable</option>
                                <option value="Battery">Battery</option>
                                <option value="Structure">Structure</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>

                            {/* Item Name / Description */}
                            <div className="flex-1 min-w-[140px]">
                              <label className="block lg:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">Description</label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={e => handleUpdatePoItemRow(item.id, 'name', e.target.value)}
                                placeholder={
                                  item.unit === 'MTR' ? 'e.g. 4 sq mm DC Solar Cable Red' :
                                  item.unit === 'MW' ? 'e.g. 1.5 MW Bifacial PV Array' :
                                  item.unit === 'KW' ? 'e.g. Vikram 550W Mono PERC Panels' :
                                  'Product Description'
                                }
                                className="w-full p-2 border border-slate-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                                required
                              />
                            </div>

                            {/* Unit Dropdown (MTR / KW / MW / TON / KG / PCS) */}
                            <div className="lg:w-36 shrink-0">
                              <label className="block lg:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">Unit (Calculation Basis)</label>
                              <select
                                value={item.unit || 'KW'}
                                onChange={e => handleUpdatePoItemRow(item.id, 'unit', e.target.value as POItemUnit)}
                                className="w-full p-2 border border-emerald-300 rounded-lg font-bold bg-emerald-50 text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer text-xs"
                              >
                                <option value="KW">KW (Kilowatts)</option>
                                <option value="MW">MW (Megawatts)</option>
                                <option value="MTR">MTR (Meters)</option>
                                <option value="TON">TON (Tons)</option>
                                <option value="KG">KG (Kilograms)</option>
                                <option value="PCS">PCS (Units)</option>
                              </select>
                            </div>

                            {/* Quantity / Capacity */}
                            <div className="lg:w-20 shrink-0">
                              <label className="block lg:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">Qty ({item.unit})</label>
                              <input
                                type="number"
                                step="any"
                                min="0.1"
                                value={item.quantity || ''}
                                onChange={e => handleUpdatePoItemRow(item.id, 'quantity', Number(e.target.value))}
                                placeholder="Qty"
                                className="w-full p-2 border border-slate-200 rounded-lg font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                                required
                              />
                            </div>

                            {/* Unit Rate (₹ / Unit) */}
                            <div className="lg:w-32 shrink-0">
                              <label className="block lg:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">Rate (₹ / {item.unit})</label>
                              <div className="relative flex items-center">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={item.unitPrice || ''}
                                  onChange={e => handleUpdatePoItemRow(item.id, 'unitPrice', Number(e.target.value))}
                                  placeholder={`₹ / ${item.unit}`}
                                  className="w-full p-2 pr-10 border border-slate-200 rounded-lg font-bold text-right outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white text-xs"
                                  required
                                />
                                <span className="absolute right-2 text-[10px] font-bold text-slate-400 pointer-events-none">
                                  /{item.unit}
                                </span>
                              </div>
                            </div>

                            {/* GST Rate */}
                            <div className="lg:w-24 shrink-0">
                              <label className="block lg:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">GST %</label>
                              <select
                                value={item.taxRate}
                                onChange={e => handleUpdatePoItemRow(item.id, 'taxRate', Number(e.target.value))}
                                className="w-full p-2 border border-slate-200 rounded-lg font-bold bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                              >
                                <option value={5}>5% GST</option>
                                <option value={12}>12% GST</option>
                                <option value={18}>18% GST</option>
                                <option value={28}>28% GST</option>
                                <option value={0}>0% GST</option>
                              </select>
                            </div>

                            {/* Line Total */}
                            <div className="lg:w-32 shrink-0 text-right">
                              <label className="block lg:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">Total (₹)</label>
                              <span className="block font-black text-slate-900 text-xs">
                                ₹{Math.round(rowTotal).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                +₹{Math.round(rowTax).toLocaleString('en-IN')} GST
                              </span>
                            </div>

                            {/* Delete Button */}
                            <div className="lg:w-8 shrink-0 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemovePoItemRow(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Unit-Wise Live Summary Box */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-lg">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-b border-slate-800 pb-3">
                    {/* Solar Capacity Total */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Solar Capacity</p>
                      <p className="text-sm font-black text-emerald-400">
                        {poItems.filter(i => i.unit === 'KW').reduce((s, i) => s + (Number(i.quantity) || 0), 0)} KW
                        {poItems.some(i => i.unit === 'MW') && ` + ${poItems.filter(i => i.unit === 'MW').reduce((s, i) => s + (Number(i.quantity) || 0), 0)} MW`}
                      </p>
                    </div>

                    {/* Total Cable / Wire Length */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Cable / Wire Length</p>
                      <p className="text-sm font-black text-teal-400">
                        {poItems.filter(i => i.unit === 'MTR').reduce((s, i) => s + (Number(i.quantity) || 0), 0)} Meters
                      </p>
                    </div>

                    {/* Taxable Subtotal */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Taxable Subtotal</p>
                      <p className="text-sm font-black text-white">
                        ₹{Math.round(poTaxableSubtotal).toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* GST Total */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total GST Amount</p>
                      <p className="text-sm font-black text-amber-400">
                        +₹{Math.round(poTotalTaxAmount).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Purchase Order Grand Total</span>
                      <h3 className="text-2xl font-black text-emerald-400">₹{Math.round(poGrandTotal).toLocaleString('en-IN')}</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-300">
                      Calculated by Meter (MTR), KW & MW unit rates + GST
                    </span>
                  </div>
                </div>
              </div>

              {/* Fixed Bottom Action Dock */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsPoModalOpen(false)} 
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl transition-all text-xs shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save & Send to Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD VENDOR MODAL */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{editingVendorId ? 'Edit Vendor' : 'Add New Vendor'}</h3>
              <button onClick={() => {setIsVendorModalOpen(false); setEditingVendorId(null); setNewVendor({ name: '', category: 'Solar Panels', contact: '', phone: '' });}} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmitVendor} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
                <input required type="text" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select value={newVendor.category} onChange={e => setNewVendor({...newVendor, category: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  <option value="Solar Panels">Solar Panels</option>
                  <option value="Inverters">Inverters</option>
                  <option value="Batteries">Batteries</option>
                  <option value="Cables & Accessories">Cables & Accessories</option>
                  <option value="Mounting Structures">Mounting Structures</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                  <input required type="email" value={newVendor.contact} onChange={e => setNewVendor({...newVendor, contact: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input required type="tel" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsVendorModalOpen(false); setEditingVendorId(null); setNewVendor({ name: '', category: 'Solar Panels', contact: '', phone: '' });}} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg transition-colors shadow-md shadow-emerald-600/20 cursor-pointer">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

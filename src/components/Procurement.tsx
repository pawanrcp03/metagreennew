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
  CheckCircle,
  X,
  Clock,
  AlertCircle, Edit2, Trash2, ArrowRight, PackageCheck, Zap, Package, ShieldCheck, Check, Lock, Percent, Layers, Building2, User,
  Inbox, Send, XCircle, AlertTriangle, UserCheck, IndianRupee, Copy
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';

export type ProductType = 'Panel' | 'Inverter' | 'AC/DC Cable' | 'Battery' | 'Structure' | 'Accessories' | 'Other';
export type POItemUnit = 'KW' | 'MW' | 'MTR' | 'TON' | 'KG' | 'PCS' | 'UNIT';

export interface POItemRow {
  id: string;
  name: string;
  type: ProductType;
  unit: POItemUnit;
  size?: number; // Size (Watts / Rating) e.g. 550 for Panels
  wattPrice?: number; // Watt Price = (GST + Price) ÷ Size
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
  const [registeredVendors, setRegisteredVendors] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

  useEffect(() => {
    const qVendors = query(collection(db, 'vendors'), orderBy('name', 'asc'));
    const unsubVendors = onSnapshot(qVendors, (snapshot) => {
      setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const regList = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(u => u.role === 'Vendor' || u.role === 'Solar Supplier');
      setRegisteredVendors(regList);
    });

    const qInventory = query(collection(db, 'inventory'));
    const unsubInventory = onSnapshot(qInventory, (snap) => {
      setInventoryItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    const qPOs = query(collection(db, 'purchaseOrders'), orderBy('date', 'desc'));
    const unsubPOs = onSnapshot(qPOs, (snapshot) => {
      setPurchaseOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qVendorCats = query(collection(db, 'vendorCategories'), orderBy('name', 'asc'));
    const unsubVendorCats = onSnapshot(qVendorCats, (snap) => {
      setCustomCategories(snap.docs.map(d => d.data().name as string).filter(Boolean));
    });

    return () => {
      unsubVendors();
      unsubUsers();
      unsubInventory();
      unsubPOs();
      unsubVendorCats();
    };
  }, []);

  const DEFAULT_VENDOR_CATEGORIES = [
    'Solar Panels (Mono/Poly PV)',
    'Inverters (String/Micro/Hybrid)',
    'Cables & AC/DC Wiring',
    'Mounting Structures (GI/Aluminium)',
    'Batteries & Energy Storage',
    'All-in-One Solar Supplier',
    'Other Components'
  ];

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const allVendorCategories = Array.from(
    new Set([...DEFAULT_VENDOR_CATEGORIES, ...customCategories])
  );

  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);

  const [newVendor, setNewVendor] = useState({
    name: '',
    category: 'Solar Panels (Mono/Poly PV)',
    categories: ['Solar Panels (Mono/Poly PV)'] as string[],
    contact: '',
    phone: '',
    email: '',
    address: '',
    gstin: ''
  });

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    badge?: string;
    details?: { label: string; value: string }[];
    primaryBtnText?: string;
    onPrimaryClick?: () => void;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    badge: '',
    details: []
  });

  const [isQuickAddVendorOpen, setIsQuickAddVendorOpen] = useState(false);
  const [quickVendor, setQuickVendor] = useState({
    name: '',
    category: 'Solar Panels (Mono/Poly PV)',
    categories: ['Solar Panels (Mono/Poly PV)'] as string[],
    contact: '',
    phone: '',
    email: '',
    address: '',
    gstin: ''
  });

  const handleAddNewCategory = async (targetForm: 'quick' | 'newVendor') => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.warning("Please enter a category name.", "Category Required");
      return;
    }

    if (allVendorCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      const matched = allVendorCategories.find(c => c.toLowerCase() === trimmed.toLowerCase()) || trimmed;
      if (targetForm === 'quick') {
        const cur = quickVendor.categories || [];
        if (!cur.includes(matched)) {
          const next = [...cur, matched];
          setQuickVendor({ ...quickVendor, categories: next, category: next.join(', ') });
        }
      } else {
        const cur = newVendor.categories || [];
        if (!cur.includes(matched)) {
          const next = [...cur, matched];
          setNewVendor({ ...newVendor, categories: next, category: next.join(', ') });
        }
      }
      setIsAddingNewCategory(false);
      setNewCategoryName('');
      toast.info(`Category "${matched}" selected!`, "Category Selected");
      return;
    }

    try {
      await addDoc(collection(db, 'vendorCategories'), {
        name: trimmed,
        createdAt: serverTimestamp(),
        createdBy: user?.email || 'admin'
      });

      if (targetForm === 'quick') {
        const next = [...(quickVendor.categories || []), trimmed];
        setQuickVendor({ ...quickVendor, categories: next, category: next.join(', ') });
      } else {
        const next = [...(newVendor.categories || []), trimmed];
        setNewVendor({ ...newVendor, categories: next, category: next.join(', ') });
      }

      setCustomCategories(prev => Array.from(new Set([...prev, trimmed])));
      setIsAddingNewCategory(false);
      setNewCategoryName('');
      toast.success(`New Category "${trimmed}" created and selected!`, "Category Created");
    } catch (err: any) {
      console.error("Error creating category:", err);
      toast.error("Failed to create category: " + (err.message || err));
    }
  };

  // PO Dynamic Items Form State
  const [selectedVendorName, setSelectedVendorName] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedVendorType, setSelectedVendorType] = useState<'Registered' | 'Unregistered'>('Registered');

  const [poItems, setPoItems] = useState<POItemRow[]>([
    { id: '1', name: 'Vikram Solar Mono PERC 550W Panels', type: 'Panel', unit: 'KW', size: 550, quantity: 20, unitPrice: 22000, taxRate: 12 },
    { id: '2', name: 'GroWatt 5kW On-Grid Solar Inverter', type: 'Inverter', unit: 'KW', size: 5000, quantity: 5, unitPrice: 9500, taxRate: 18 },
    { id: '3', name: 'Polycab 4 sq mm Solar DC Cable Red/Black', type: 'AC/DC Cable', unit: 'MTR', size: 0, quantity: 300, unitPrice: 48, taxRate: 18 }
  ]);

  // Compute sellable items for the currently selected Registered Vendor
  const vendorSellableStock = inventoryItems.filter(item => {
    if (selectedVendorType !== 'Registered') return false;
    const matchesOwner = (selectedVendorId && item.stockOwner === selectedVendorId) ||
      (item.vendor && selectedVendorName && item.vendor.toLowerCase().includes(selectedVendorName.toLowerCase()));
    return matchesOwner && item.availableForSelling === true && (item.availableQuantity === undefined || item.availableQuantity > 0);
  });

  const poTaxableSubtotal = poItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const poTotalTaxAmount = poItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
  const poGrandTotal = poTaxableSubtotal + poTotalTaxAmount;

  const userRole = user?.role || 'Super Admin';
  const isVendor = userRole === 'Vendor' || userRole === 'Vendor Employee' || userRole === 'Solar Supplier';
  const isInstaller = userRole === 'Installer' || userRole === 'Solar Installer' || userRole === 'Technician';
  const isGlobalAdmin = !isVendor && !isInstaller;

  const [vendorPoTab, setVendorPoTab] = useState<'received_requests' | 'my_pos'>('received_requests');

  // Filter Unregistered Vendors: Only show those created by the logged-in user (or all if Global Admin)
  const visibleUnregisteredVendors = vendors.filter(v => {
    if (isGlobalAdmin) return true;
    const isCreator = v.creatorId === user?.uid ||
      v.createdBy === user?.email ||
      v.createdBy === user?.uid;
    return isCreator;
  });

  // 1. Installer: strictly POs created by THIS installer
  const installerPOs = purchaseOrders.filter(po => {
    return po.creatorId === user?.uid ||
      po.createdBy === user?.email ||
      (!po.creatorId && po.stockOwner === user?.uid);
  });

  // 2. Vendor: Received Requests from Installers
  const vendorReceivedRequests = purchaseOrders.filter(po => {
    const isTargetVendor = (po.vendorId && po.vendorId === user?.uid) ||
      (po.vendor && ((user?.companyName && po.vendor.toLowerCase().includes(user.companyName.toLowerCase())) ||
        (user?.name && po.vendor.toLowerCase().includes(user.name.toLowerCase()))));
    const notOwnPO = po.creatorId !== user?.uid && po.createdBy !== user?.email;
    return isTargetVendor && notOwnPO;
  });

  // 3. Vendor: Own Sourcing POs
  const vendorOwnPOs = purchaseOrders.filter(po => {
    return po.creatorId === user?.uid || po.createdBy === user?.email;
  });

  // 4. Combined Filtered Purchase Orders based on Active Role, Sub-tab & Search Query
  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    // Search Query Filter
    const matchesSearch = !searchQuery ||
      po.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.displayId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.items?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (po.creatorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (po.createdBy || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Strict Role Scoping:
    if (isInstaller) {
      // Installer sees ONLY their own created POs
      const isCreator = po.creatorId === user?.uid ||
        po.createdBy === user?.email ||
        (!po.creatorId && po.stockOwner === user?.uid);
      return isCreator;
    }

    if (isVendor) {
      const isTargetVendor = (po.vendorId && po.vendorId === user?.uid) ||
        (po.vendor && ((user?.companyName && po.vendor.toLowerCase().includes(user.companyName.toLowerCase())) ||
          (user?.name && po.vendor.toLowerCase().includes(user.name.toLowerCase()))));
      const isCreator = po.creatorId === user?.uid || po.createdBy === user?.email;

      if (vendorPoTab === 'received_requests') {
        return isTargetVendor && !isCreator;
      } else {
        return isCreator;
      }
    }

    // Admin Filter by specific vendor if selected
    if (isGlobalAdmin && vendorFilter !== 'ALL' && po.vendor !== vendorFilter) {
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
      { id: Date.now().toString(), name: '', type: 'Panel', unit: 'KW', size: 550, quantity: 10, unitPrice: 22000, taxRate: 12 }
    ]);
  };

  const handleRemovePoItemRow = (id: string) => {
    setPoItems(poItems.filter(item => item.id !== id));
  };

  const handleUpdatePoItemRow = (id: string, field: keyof POItemRow, value: any) => {
    setPoItems(poItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDuplicatePO = (po: any) => {
    setSelectedVendorName(po.vendor || '');
    setSelectedVendorId(po.vendorId || '');
    setSelectedVendorType(po.vendorType || 'Registered');

    if (po.poItems && po.poItems.length > 0) {
      setPoItems(po.poItems.map((item: any) => ({
        ...item,
        id: `clone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      })));
    } else {
      setPoItems([
        { id: Date.now().toString(), name: po.items || 'Solar Equipment', type: 'Panel', unit: 'KW', size: 550, quantity: 1, unitPrice: po.amount || 10000, taxRate: 12 }
      ]);
    }

    setEditingPoId(null);
    setIsPoModalOpen(true);
    toast.info(`📋 Replicated PO details from ${po.displayId || po.id}. You can edit items and content!`, 'PO Replicated');
  };

  const handleSubmitVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedCats = newVendor.categories && newVendor.categories.length > 0
        ? newVendor.categories
        : [newVendor.category || 'Solar Panels (Mono/Poly PV)'];
      const catStr = selectedCats.join(', ');

      if (editingVendorId) {
        await updateDoc(doc(db, 'vendors', editingVendorId), {
          name: newVendor.name,
          category: catStr,
          categories: selectedCats,
          contact: newVendor.contact,
          phone: newVendor.phone,
          email: newVendor.email,
          address: newVendor.address,
          gstin: newVendor.gstin
        });
      } else {
        const newId = `VEN-${String(vendors.length + 1).padStart(3, '0')}`;
        await addDoc(collection(db, 'vendors'), {
          displayId: newId,
          name: newVendor.name,
          category: catStr,
          categories: selectedCats,
          contact: newVendor.contact,
          phone: newVendor.phone,
          email: newVendor.email,
          address: newVendor.address,
          gstin: newVendor.gstin,
          rating: 4.8,
          metrics: { delivery: 4.8, quality: 4.9, pricing: 4.5, support: 4.7 },
          status: 'Active',
          vendorType: 'Unregistered',
          isRegistered: false,
          creatorId: user?.uid || '',
          createdBy: user?.email || 'admin',
          creatorName: user?.name || user?.companyName || 'User',
          creatorRole: user?.role || '',
          createdAt: serverTimestamp()
        });
      }
      setIsVendorModalOpen(false);
      setEditingVendorId(null);
      setNewVendor({
        name: '',
        category: 'Solar Panels (Mono/Poly PV)',
        categories: ['Solar Panels (Mono/Poly PV)'],
        contact: '',
        phone: '',
        email: '',
        address: '',
        gstin: ''
      });
      toast.success("Vendor details saved successfully.", "Vendor Saved");
    } catch (err: any) {
      console.error('Error saving vendor', err);
      toast.error('Failed to save vendor: ' + (err.message || err));
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        await deleteDoc(doc(db, 'vendors', id));
        toast.info("Vendor deleted.", "Vendor Removed");
      } catch (err) {
        console.error('Error deleting vendor:', err);
      }
    }
  };

  // Quick Add / Unregistered Vendor Submit with Duplicate Check against Registered Vendors
  const handleQuickSubmitVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const vendorInputName = quickVendor.name.trim();
    if (!vendorInputName) {
      toast.warning("Please enter vendor / supplier name.", "Name Required");
      return;
    }

    const selectedCats = quickVendor.categories && quickVendor.categories.length > 0
      ? quickVendor.categories
      : [quickVendor.category || 'Solar Panels (Mono/Poly PV)'];
    const catStr = selectedCats.join(', ');

    // 1. Check if name matches an existing registered vendor
    const existingReg = registeredVendors.find(r =>
      (r.companyName && r.companyName.toLowerCase() === vendorInputName.toLowerCase()) ||
      (r.name && r.name.toLowerCase() === vendorInputName.toLowerCase())
    );

    if (existingReg) {
      const regName = existingReg.companyName || existingReg.name;
      setSelectedVendorName(regName);
      setSelectedVendorId(existingReg.id);
      setSelectedVendorType('Registered');
      setIsQuickAddVendorOpen(false);
      toast.info(`"${regName}" is already a Registered MetaGreen Solar Supplier. Auto-selected registered account!`, "Registered Vendor Found");
      return;
    }

    try {
      const newId = `UNREG-${String(vendors.length + 1).padStart(3, '0')}`;
      await addDoc(collection(db, 'vendors'), {
        displayId: newId,
        name: vendorInputName,
        category: catStr,
        categories: selectedCats,
        contact: quickVendor.contact,
        phone: quickVendor.phone,
        email: quickVendor.email,
        address: quickVendor.address,
        gstin: quickVendor.gstin,
        vendorType: 'Unregistered',
        isRegistered: false,
        rating: 5.0,
        status: 'Active',
        creatorId: user?.uid || '',
        createdBy: user?.email || 'admin',
        creatorName: user?.name || user?.companyName || 'User',
        creatorRole: user?.role || '',
        createdAt: serverTimestamp()
      });

      // Automatically select this unregistered vendor in the PO form
      setSelectedVendorName(vendorInputName);
      setSelectedVendorId('');
      setSelectedVendorType('Unregistered');
      setIsQuickAddVendorOpen(false);
      setQuickVendor({
        name: '',
        category: 'Solar Panels (Mono/Poly PV)',
        categories: ['Solar Panels (Mono/Poly PV)'],
        contact: '',
        phone: '',
        email: '',
        address: '',
        gstin: ''
      });
      toast.success(`Unregistered Supplier "${vendorInputName}" saved and selected as source! (Categories: ${catStr})`, "Supplier Selected");
    } catch (err: any) {
      console.error('Error adding quick vendor:', err);
      toast.error('Failed to save supplier: ' + (err.message || err));
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

    const itemsSummaryStr = poItems.map(i => {
      const gross = i.unitPrice + (i.unitPrice * (i.taxRate / 100));
      const wp = (Number(i.size) > 0) ? ` (₹${(gross / Number(i.size)).toFixed(2)}/W)` : '';
      return `${i.quantity} ${i.unit || 'PCS'} x ${i.name} (${i.type}${i.size ? `, ${i.size}W` : ''}${wp}) @ ₹${i.unitPrice.toLocaleString('en-IN')}/${i.unit || 'Unit'} (+${i.taxRate}% GST)`;
    }).join(', ');

    try {
      const matchedRegVendor = registeredVendors.find(rv =>
        (selectedVendorId && rv.id === selectedVendorId) ||
        (rv.companyName && rv.companyName.toLowerCase() === selectedVendorName.toLowerCase()) ||
        (rv.name && rv.name.toLowerCase() === selectedVendorName.toLowerCase())
      );
      const isReg = !!matchedRegVendor || selectedVendorType === 'Registered';
      const resolvedVendorId = matchedRegVendor ? matchedRegVendor.id : (isReg ? selectedVendorId : '');
      const resolvedVendorName = matchedRegVendor ? (matchedRegVendor.companyName || matchedRegVendor.name) : selectedVendorName;

      const creatorUID = user?.uid || 'admin';
      const creatorTitle = user?.name || user?.companyName || (isVendor ? 'Solar Supplier' : 'Solar Installer');
      const stockOwnerUID = isReg ? (resolvedVendorId || resolvedVendorName) : creatorUID;
      const stockOwnerTitle = isReg ? resolvedVendorName : creatorTitle;

      if (editingPoId) {
        await updateDoc(doc(db, 'purchaseOrders', editingPoId), {
          vendor: resolvedVendorName,
          vendorId: resolvedVendorId,
          vendorType: isReg ? 'Registered' : 'Unregistered',
          stockOwner: stockOwnerUID,
          stockOwnerName: stockOwnerTitle,
          poItems,
          items: itemsSummaryStr,
          taxableAmount: poTaxableSubtotal,
          taxAmount: poTotalTaxAmount,
          amount: poGrandTotal,
          createdBy: user?.email || 'admin'
        });
        toast.success(`Purchase Order updated for ${resolvedVendorName}!`, 'PO Updated');
      } else {
        const newId = `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`;
        const newInvoiceId = `INV-${newId}`;

        if (isReg) {
          // ==========================================
          // 1. REGISTERED VENDOR FLOW
          // ==========================================
          // Request is sent to vendor -> Vendor must accept/reject in Received Requests
          const poDocRef = await addDoc(collection(db, 'purchaseOrders'), {
            displayId: newId,
            vendor: resolvedVendorName,
            vendorId: resolvedVendorId,
            vendorType: 'Registered',
            stockOwner: resolvedVendorId,
            stockOwnerName: resolvedVendorName,
            creatorId: creatorUID,
            creatorName: creatorTitle,
            creatorRole: user?.role || (isVendor ? 'Solar Supplier' : 'Solar Installer'),
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
            createdAt: serverTimestamp()
          });

          // Reserve quantities on registered vendor's live sellable inventory
          for (const item of poItems) {
            const matchedInv = inventoryItems.find(inv =>
              (inv.stockOwner === resolvedVendorId || inv.vendor === resolvedVendorName) &&
              inv.name.toLowerCase() === item.name.toLowerCase()
            );
            if (matchedInv) {
              const currentRes = matchedInv.reservedQuantity || 0;
              const currentAvail = matchedInv.availableQuantity !== undefined ? matchedInv.availableQuantity : matchedInv.quantity;
              await updateDoc(doc(db, 'inventory', matchedInv.id), {
                reservedQuantity: currentRes + item.quantity,
                availableQuantity: Math.max(0, currentAvail - item.quantity),
                lastUpdated: serverTimestamp()
              });
            }
          }

          toast.success(
            `Purchase Order created for ${resolvedVendorName}! (Sent to Registered Vendor for Acceptance)`,
            'PO Request Sent'
          );
        } else {
          // ==========================================
          // 2. UNREGISTERED VENDOR FLOW (AUTOMATIC ACCEPTANCE & INVOICE)
          // ==========================================
          // Rule: Vendor is NOT registered in MetaGreen -> Automatically Accept PO, Automatically Generate Invoice, Stock is Added directly to PO Creator's Inventory!

          // A. Create Auto-Accepted PO
          const poDocRef = await addDoc(collection(db, 'purchaseOrders'), {
            displayId: newId,
            vendor: resolvedVendorName,
            vendorId: '',
            vendorType: 'Unregistered',
            stockOwner: creatorUID,
            stockOwnerName: creatorTitle,
            creatorId: creatorUID,
            creatorName: creatorTitle,
            creatorRole: user?.role || (isVendor ? 'Solar Supplier' : 'Solar Installer'),
            poItems,
            items: itemsSummaryStr,
            taxableAmount: poTaxableSubtotal,
            taxAmount: poTotalTaxAmount,
            amount: poGrandTotal,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
            status: 'Accepted & Stock Received',
            autoAccepted: true,
            invoiceGenerated: true,
            invoiceNumber: newInvoiceId,
            expectedDelivery: 'Direct / On-The-Spot',
            stage: 5,
            acceptedAt: serverTimestamp(),
            receivedAt: serverTimestamp(),
            createdBy: user?.email || 'admin',
            createdAt: serverTimestamp()
          });

          // B. Automatically Generate Vendor Invoice
          await addDoc(collection(db, 'vendorInvoices'), {
            poId: poDocRef.id,
            displayId: newId,
            invoiceNumber: newInvoiceId,
            vendor: resolvedVendorName,
            vendorType: 'Unregistered',
            taxableAmount: poTaxableSubtotal,
            taxAmount: poTotalTaxAmount,
            amount: poGrandTotal,
            items: poItems,
            recipientId: creatorUID,
            recipientName: creatorTitle,
            recipientRole: user?.role || (isVendor ? 'Solar Supplier' : 'Solar Installer'),
            date: new Date().toISOString().split('T')[0],
            status: 'Auto-Generated',
            createdBy: user?.email || 'admin',
            createdAt: serverTimestamp()
          });

          // C. Add Stock directly to PO Creator's Inventory (PO Creator = Inventory Owner)
          for (const item of poItems) {
            await addDoc(collection(db, 'inventory'), {
              name: item.name,
              type: item.type === 'AC/DC Cable' ? 'Wire' : item.type,
              category: item.type === 'Panel' ? 'Solar Panels' :
                item.type === 'Inverter' ? 'Inverters' :
                  item.type === 'Battery' ? 'Batteries' :
                    item.type === 'AC/DC Cable' ? 'Cables & Accessories' : 'Mounting Structures',
              quantity: item.quantity,
              availableQuantity: item.quantity,
              reservedQuantity: 0,
              soldQuantity: 0,
              unit: item.unit || 'PCS',
              size: item.size || 0,
              wattPrice: Number(item.size) > 0 ? Number(((item.unitPrice + (item.unitPrice * (item.taxRate / 100))) / Number(item.size)).toFixed(2)) : 0,
              minThreshold: 5,
              vendor: resolvedVendorName, // Unregistered vendor stored as supplier/source only
              vendorType: 'Unregistered',
              vendorId: '',
              stockOwner: creatorUID, // PO Creator = Inventory Owner
              stockOwnerName: creatorTitle,
              price: item.unitPrice,
              purchasePrice: item.unitPrice,
              sellingPrice: isVendor ? item.unitPrice : 0,
              availableForSelling: isVendor ? true : false,
              gst: item.taxRate,
              pricingBasis: ['TON', 'KG'].includes(item.unit) ? 'Per Weight' : item.unit === 'MTR' ? 'Per Meter' : 'Per Unit',
              sourcePoId: poDocRef.id,
              sourcePoDisplayId: newId,
              createdAt: serverTimestamp(),
              lastUpdated: serverTimestamp()
            });
          }

          toast.success(
            `⚡ Unregistered Supplier PO (${resolvedVendorName}): Auto-Accepted, Invoice #${newInvoiceId} Generated & ${poItems.length} items added to your Inventory!`,
            'PO Auto-Accepted'
          );
        }
      }
      setIsPoModalOpen(false);
      setEditingPoId(null);
      setSelectedVendorName('');
      setSelectedVendorId('');
      setSelectedVendorType('Registered');
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

  // Vendor Action: Accept PO Request
  const handleVendorAcceptPO = async (poId: string) => {
    try {
      await updateDoc(doc(db, 'purchaseOrders', poId), {
        status: 'Accepted',
        stage: 2,
        acceptedAt: serverTimestamp()
      });
      toast.success("PO Request Accepted! The installer has been notified and can track shipment.", "PO Accepted");
    } catch (err) {
      console.error("Error accepting PO", err);
      toast.error("Failed to accept Purchase Order.", "PO Error");
    }
  };

  // Vendor Action: Reject PO Request & Restore Reserved Stock
  const handleVendorRejectPO = async (po: any) => {
    if (!window.confirm(`Are you sure you want to reject the PO request (${po.displayId || po.id}) from ${po.creatorName || po.createdBy || 'Installer'}?`)) return;

    try {
      // 1. Restore reserved quantities on vendor's inventory back to available
      if (po.poItems && po.poItems.length > 0) {
        for (const item of po.poItems) {
          const matchedInv = inventoryItems.find(inv =>
            (inv.stockOwner === user?.uid || inv.vendorId === user?.uid || (inv.vendor && user?.companyName && inv.vendor.toLowerCase().includes(user.companyName.toLowerCase()))) &&
            inv.name.toLowerCase() === item.name.toLowerCase()
          );
          if (matchedInv) {
            const currentRes = matchedInv.reservedQuantity || 0;
            const currentAvail = matchedInv.availableQuantity !== undefined ? matchedInv.availableQuantity : matchedInv.quantity;
            await updateDoc(doc(db, 'inventory', matchedInv.id), {
              reservedQuantity: Math.max(0, currentRes - item.quantity),
              availableQuantity: currentAvail + item.quantity,
              lastUpdated: serverTimestamp()
            });
          }
        }
      }

      // 2. Mark PO as Rejected
      await updateDoc(doc(db, 'purchaseOrders', po.id), {
        status: 'Rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: user?.email || 'vendor'
      });

      toast.info(`Request ${po.displayId || po.id} rejected. Reserved stock released back to your available inventory.`, "Request Rejected");
    } catch (err: any) {
      console.error("Error rejecting PO request:", err);
      toast.error("Failed to reject PO request.");
    }
  };

  // Receive PO Stock & Auto Add to Inventory (Applying Strict Stock Ownership Rules)
  const handleReceiveStockAndInvoice = async (po: any) => {
    if (po.vendorType === 'Registered' && po.status !== 'Accepted') {
      toast.error("Cannot add to Inventory: Registered Vendor must accept the PO first!", "Acceptance Required");
      return;
    }

    if (!window.confirm(`Receive stock for ${po.displayId || po.id} and auto-add items to Inventory?`)) return;

    try {
      // 1. Generate Vendor Invoice Record
      await addDoc(collection(db, 'vendorInvoices'), {
        poId: po.id,
        displayId: po.displayId || po.id,
        vendor: po.vendor,
        vendorType: po.vendorType || 'Registered',
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

      // 2. If Registered Vendor: deduct vendor's stock
      if (po.vendorType === 'Registered') {
        for (const item of itemsToStock) {
          const matchedInv = inventoryItems.find(inv =>
            (inv.stockOwner === po.vendorId || inv.vendor === po.vendor) &&
            inv.name.toLowerCase() === item.name.toLowerCase()
          );
          if (matchedInv) {
            const currentQty = matchedInv.quantity || 0;
            const currentRes = matchedInv.reservedQuantity || 0;
            const currentSold = matchedInv.soldQuantity || 0;
            await updateDoc(doc(db, 'inventory', matchedInv.id), {
              quantity: Math.max(0, currentQty - item.quantity),
              reservedQuantity: Math.max(0, currentRes - item.quantity),
              soldQuantity: currentSold + item.quantity,
              availableQuantity: Math.max(0, (matchedInv.availableQuantity !== undefined ? matchedInv.availableQuantity : currentQty) - item.quantity),
              lastUpdated: serverTimestamp()
            });
          }
        }
      }

      // 3. Add Received Stock to PO Creator's Inventory (Installer / PO Creator is Stock Owner)
      const recipientUID = user?.uid || po.creatorId || 'admin';
      const recipientName = user?.name || po.creatorName || 'Solar Installer';

      for (const item of itemsToStock) {
        await addDoc(collection(db, 'inventory'), {
          name: item.name,
          type: item.type === 'AC/DC Cable' ? 'Wire' : item.type,
          category: item.type === 'Panel' ? 'Solar Panels' :
            item.type === 'Inverter' ? 'Inverters' :
              item.type === 'Battery' ? 'Batteries' :
                item.type === 'AC/DC Cable' ? 'Cables & Accessories' : 'Mounting Structures',
          quantity: item.quantity,
          availableQuantity: item.quantity,
          reservedQuantity: 0,
          soldQuantity: 0,
          unit: item.unit || 'PCS',
          size: item.size || 0,
          wattPrice: Number(item.size) > 0 ? Number(((item.unitPrice + (item.unitPrice * (item.taxRate / 100))) / Number(item.size)).toFixed(2)) : 0,
          minThreshold: 5,
          vendor: po.vendor,
          vendorType: po.vendorType || 'Unregistered',
          vendorId: po.vendorId || '',
          stockOwner: recipientUID,
          stockOwnerName: recipientName,
          price: item.unitPrice,
          purchasePrice: item.unitPrice,
          sellingPrice: 0,
          availableForSelling: false, // private to installer by default
          gst: item.taxRate,
          pricingBasis: ['TON', 'KG'].includes(item.unit) ? 'Per Weight' : item.unit === 'MTR' ? 'Per Meter' : 'Per Unit',
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        });
      }

      await updateDoc(doc(db, 'purchaseOrders', po.id), {
        status: 'Received & Invoiced',
        stage: 4,
        receivedAt: serverTimestamp()
      });

      toast.success(
        `✅ Stock for ${po.displayId || po.id} received and added directly to your Inventory under your ownership! (Supplier: ${po.vendor})`,
        'Stock Received'
      );
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

  const handleMarkPaymentPaid = async (po: any) => {
    try {
      // 1. Update purchaseOrders doc
      await updateDoc(doc(db, 'purchaseOrders', po.id), {
        paymentStatus: 'Paid',
        paidAt: serverTimestamp(),
        status: po.status === 'Accepted' ? 'Paid & Accepted' : po.status,
        updatedAt: serverTimestamp()
      });

      // 2. Update matching vendorInvoices
      try {
        const invQuery = query(collection(db, 'vendorInvoices'), where('poId', '==', po.id));
        const invSnap = await getDocs(invQuery);
        invSnap.forEach(async (d) => {
          await updateDoc(doc(db, 'vendorInvoices', d.id), {
            status: 'Paid',
            paymentStatus: 'Paid',
            paidAt: serverTimestamp()
          });
        });
      } catch (err) {
        console.warn('Vendor invoice sync error:', err);
      }

      // 3. Record in transactions collection
      const settledAmount = Number(po.grandTotal) || Number(po.amount) || 0;
      await addDoc(collection(db, 'transactions'), {
        projectId: po.displayId || po.id,
        type: 'Expense',
        category: 'Expense',
        expenseType: 'Vendor Payment',
        amount: settledAmount,
        status: 'Completed',
        notes: `Supplier payment marked as Paid for PO ${po.displayId || po.id} (${po.vendor})`,
        date: new Date().toISOString().split('T')[0],
        vendorName: po.vendor,
        createdAt: serverTimestamp()
      });

      setSuccessModal({
        isOpen: true,
        title: "Supplier Payment Marked as Paid!",
        subtitle: `Payment of ₹${settledAmount.toLocaleString('en-IN')} for PO ${po.displayId || po.id} is now registered as Paid.`,
        badge: "💰 Payment Settled",
        details: [
          { label: "Purchase Order", value: po.displayId || po.id },
          { label: "Supplier / Vendor", value: po.vendor },
          { label: "Amount Settled", value: `₹${settledAmount.toLocaleString('en-IN')}` },
          { label: "Payment Status", value: "Paid (Completed)" },
          { label: "Updated At", value: new Date().toLocaleDateString('en-IN') }
        ],
        primaryBtnText: "Done"
      });

      toast.success(`Payment for PO ${po.displayId || po.id} marked as Paid!`, "Payment Updated");
    } catch (err: any) {
      console.error('Error marking payment as paid:', err);
      toast.error('Failed to update payment status: ' + err.message);
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
    const isAutoAccepted = po.autoAccepted === true || (po.vendorType === 'Unregistered' && (po.status === 'Accepted & Stock Received' || po.status === 'Accepted'));
    const isAccepted = (po.status === 'Accepted' || po.stage === 2) && !isAutoAccepted;
    const isReceived = (po.status === 'Received & Invoiced' || po.stage >= 4) && !isAutoAccepted;
    const isRejected = po.status === 'Rejected';
    const isPending = (po.status === 'Pending Vendor Acceptance' || po.status === 'Requested' || po.status === 'Issued') && !isAutoAccepted && !isAccepted && !isReceived && !isRejected;

    // Is this a request received by the logged in vendor from an installer?
    const isReceivedRequestForVendor = isVendor && (
      po.creatorId !== user?.uid && po.createdBy !== user?.email
    );

    return (
      <div key={po.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {po.stage < 5 && isGlobalAdmin && (
            <button onClick={() => advanceStage(po.id, po.stage)} title="Advance Stage" className="p-1.5 hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {(isGlobalAdmin || po.creatorId === user?.uid) && (
            <button onClick={() => handleDeletePo(po.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pr-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-slate-900 text-white text-xs font-black rounded-md">
                {po.displayId || po.id}
              </span>

              {isReceivedRequestForVendor ? (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-300 text-xs font-black rounded-xl flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    Request from: {po.creatorName || po.createdBy || 'Solar Installer'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    ({po.creatorRole || 'Installer'})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900">{po.vendor}</h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                    po.vendorType === 'Registered' ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200"
                  )}>
                    {po.vendorType === 'Registered' ? '⭐ Registered Vendor' : '📦 Unregistered Supplier'}
                  </span>
                </div>
              )}
            </div>

            {po.poItems && po.poItems.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {po.poItems.map((item: any, idx: number) => {
                  const gross = (Number(item.unitPrice) || 0) * (1 + ((Number(item.taxRate) || 0) / 100));
                  const wp = Number(item.size) > 0 ? (gross / Number(item.size)) : null;
                  return (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-semibold">
                      <span className="font-black text-emerald-700">{item.quantity} {item.unit || 'PCS'}</span>
                      <span className="truncate max-w-[200px]">{item.name || item.type}</span>
                      {item.size ? (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                          {item.size}W
                        </span>
                      ) : null}
                      <span className="text-slate-500 font-mono text-[11px]">@ ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}/{item.unit || 'Unit'}</span>
                      {wp !== null && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                          ⚡ ₹{wp.toFixed(2)}/W
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-600 font-medium mt-1">
                {po.items}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 mt-2">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Date: {po.date}</span>
              <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Exp. Delivery: {po.expectedDelivery}</span>
              {po.creatorName && <span className="text-slate-400">| Sourced by: {po.creatorName} ({po.createdBy})</span>}
            </div>
          </div>

          <div className="flex flex-col lg:items-end gap-2 shrink-0">
            <div className="text-[11px] font-bold text-slate-400">
              Taxable: ₹{po.taxableAmount?.toLocaleString()} | Tax: ₹{po.taxAmount?.toLocaleString()}
            </div>
            <div className="text-2xl font-black text-slate-900">₹{po.amount?.toLocaleString()}</div>

            <div className="flex flex-wrap items-center gap-2">
              {isAutoAccepted ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-black px-3 py-1 rounded-full uppercase border flex items-center gap-1 bg-emerald-100 text-emerald-800 border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ⚡ Auto-Accepted & Stock Added
                  </span>
                  {po.invoiceNumber && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-slate-500" />
                      {po.invoiceNumber}
                    </span>
                  )}
                </div>
              ) : (
                <span className={cn(
                  "text-xs font-extrabold px-3 py-1 rounded-full uppercase border flex items-center gap-1",
                  isAccepted ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                    isReceived ? "bg-purple-100 text-purple-800 border-purple-200" :
                      isRejected ? "bg-rose-100 text-rose-800 border-rose-200" :
                        "bg-amber-50 text-amber-800 border-amber-200"
                )}>
                  {isAccepted ? <Check className="w-3.5 h-3.5" /> :
                    isReceived ? <PackageCheck className="w-3.5 h-3.5" /> :
                      isRejected ? <XCircle className="w-3.5 h-3.5 text-rose-600" /> :
                        <Clock className="w-3.5 h-3.5" />}
                  {po.status}
                </span>
              )}

              {/* VENDOR ACTIONS ON RECEIVED REQUESTS */}
              {isReceivedRequestForVendor && isPending && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleVendorAcceptPO(po.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept Request
                  </button>
                  <button
                    onClick={() => handleVendorRejectPO(po)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" /> Reject
                  </button>
                </div>
              )}

              {/* Payment Status Badge */}
              <span className={cn(
                "text-xs font-extrabold px-3 py-1 rounded-full uppercase border flex items-center gap-1",
                po.paymentStatus === 'Paid'
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              )}>
                <IndianRupee className="w-3.5 h-3.5" />
                Payment: {po.paymentStatus === 'Paid' ? 'Paid' : 'Pending'}
              </span>

              {/* SUPPLIER PAYMENT ACTION: When supplier marks payment as Paid, updates PO and invoices */}
              {(isVendor || isGlobalAdmin) && po.paymentStatus !== 'Paid' && (
                <button
                  onClick={() => handleMarkPaymentPaid(po)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center gap-1.5 cursor-pointer"
                  title="Mark this Supplier Payment as Paid"
                >
                  <IndianRupee className="w-3.5 h-3.5" /> Mark as Paid
                </button>
              )}

              {/* INSTALLER ACTIONS ON THEIR OWN REGISTERED VENDOR POs */}
              {isInstaller && isAccepted && !isAutoAccepted && (
                <button
                  onClick={() => handleReceiveStockAndInvoice(po)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" /> Receive Stock & Add to My Inventory
                </button>
              )}

              {/* GLOBAL ADMIN FALLBACK ACTIONS */}
              {isGlobalAdmin && isPending && !isAutoAccepted && (
                <button
                  onClick={() => handleVendorAcceptPO(po.id)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Accept PO (Admin)
                </button>
              )}

              {isGlobalAdmin && isAccepted && !isAutoAccepted && (
                <button
                  onClick={() => handleReceiveStockAndInvoice(po)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" /> Receive Stock & Add Inventory
                </button>
              )}

              <button
                onClick={() => handleDuplicatePO(po)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Create a replica of this PO with same items to edit content"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" /> Duplicate / Replica
              </button>
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
                  isAutoAccepted ? "bg-emerald-500 text-white border-emerald-500" : getStageColor(po.stage, stageNumber)
                )}>
                  {isAutoAccepted || po.stage > stageNumber ? <CheckCircle2 className="w-4 h-4" /> : getStageIcon(stageNumber)}
                </div>
                <span className={cn(
                  "text-[10px] font-bold text-center",
                  isAutoAccepted || po.stage >= stageNumber ? "text-slate-700" : "text-slate-400"
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
            <span className={cn(
              "px-2.5 py-0.5 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1 border",
              isVendor && "bg-amber-100 text-amber-900 border-amber-300",
              isInstaller && "bg-teal-100 text-teal-900 border-teal-300",
              isGlobalAdmin && "bg-emerald-100 text-emerald-800 border-emerald-200"
            )}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Role Scope: {userRole.toUpperCase()} ({user?.email || 'admin'})
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-emerald-600" />
            {isVendor
              ? 'Solar Supplier Order & Request Hub'
              : isInstaller
                ? 'My Purchase Orders & Requests'
                : 'Vendor-Wise Purchase Orders Engine'}
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {isVendor
              ? 'Manage incoming stock requests from installers for your sellable inventory and track your own sourcing POs.'
              : isInstaller
                ? 'Strictly view and manage only Purchase Orders created by your installer account.'
                : 'POs are shown exclusively to their specific vendor, while Global Admin views vendor-grouped POs.'}
          </p>
        </div>
      </header>

      {/* Main Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="flex overflow-x-auto gap-2 no-scrollbar">
          {[
            { id: 'purchase', label: isVendor ? '1. Purchase Orders & Requests' : isInstaller ? '1. My Purchase Orders' : '1. Purchase Orders (PO Workflow)', icon: ShoppingCart },
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

        {/* VENDOR SUB-TABS (Received Requests vs My Sourcing POs) */}
        {isVendor && activeTab === 'purchase' && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setVendorPoTab('received_requests')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                vendorPoTab === 'received_requests'
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-200"
              )}
            >
              <Inbox className="w-3.5 h-3.5 text-emerald-400" />
              <span>Received Requests</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {vendorReceivedRequests.length}
              </span>
            </button>

            <button
              onClick={() => setVendorPoTab('my_pos')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                vendorPoTab === 'my_pos'
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-200"
              )}
            >
              <Send className="w-3.5 h-3.5 text-blue-400" />
              <span>My Sourcing POs</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700">
                {vendorOwnPOs.length}
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64 flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'purchase' ? "Search POs, requesters, or items..." : "Search Solar Suppliers..."}
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
            <Plus className="w-4 h-4" /> {activeTab === 'purchase' ? '+ Create Purchase Order / Request' : '+ Add Solar Supplier'}
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

          {/* LIST VIEW / ROLE SPECIFIC VIEW */}
          {(!isGlobalAdmin || viewMode === 'list') && (
            filteredPurchaseOrders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 shadow-xs space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                  {isVendor && vendorPoTab === 'received_requests' ? (
                    <Inbox className="w-7 h-7" />
                  ) : (
                    <ShoppingCart className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-800">
                    {isVendor
                      ? (vendorPoTab === 'received_requests' ? 'No Received Requests from Installers' : 'No Sourcing Purchase Orders Yet')
                      : isInstaller
                        ? 'No Purchase Orders Created Yet'
                        : 'No Purchase Orders Found'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    {isVendor
                      ? (vendorPoTab === 'received_requests'
                        ? 'When solar installers order sellable items from your catalog, incoming requests will appear here for your review and acceptance.'
                        : 'You have not created any direct sourcing purchase orders yet.')
                      : isInstaller
                        ? 'Create a Purchase Order to request sellable components from registered solar suppliers or direct suppliers.'
                        : 'Try adjusting your search criteria or filter scope.'}
                  </p>
                </div>
                {isInstaller && (
                  <button
                    onClick={() => setIsPoModalOpen(true)}
                    className="mt-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Create Your First PO
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredPurchaseOrders.map(po => renderSinglePOCard(po))}
              </div>
            )
          )}
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="space-y-8">
          {/* SECTION 1: REGISTERED METAGREEN SOLAR SUPPLIERS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-800 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Registered MetaGreen Solar Suppliers
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">Verified Marketplace Suppliers</h3>
              </div>
              <span className="text-xs font-bold text-slate-500">{registeredVendors.length} Verified Suppliers</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {registeredVendors.length === 0 ? (
                <div className="col-span-full p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
                  <Store className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-sm">No registered suppliers active in MetaGreen yet.</p>
                </div>
              ) : (
                registeredVendors.map(rv => (
                  <div key={rv.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-md">
                            ⭐ Registered Supplier
                          </span>
                          <h4 className="text-base font-black text-slate-900 mt-1.5 leading-tight">{rv.companyName || rv.name}</h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{rv.email}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-base font-black text-slate-900">5.0</span>
                          {renderStars(5)}
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs text-slate-600 font-medium">
                        <p><span className="font-bold text-slate-400 uppercase text-[10px]">Contact:</span> {rv.name || 'Official Representative'}</p>
                        <p><span className="font-bold text-slate-400 uppercase text-[10px]">Phone:</span> {rv.phone || 'Verified on Platform'}</p>
                        {rv.companyGst && <p><span className="font-bold text-slate-400 uppercase text-[10px]">GSTIN:</span> {rv.companyGst}</p>}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Live Catalog Enabled
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVendorName(rv.companyName || rv.name);
                          setSelectedVendorId(rv.id);
                          setSelectedVendorType('Registered');
                          setIsPoModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        + Create PO
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 2: MY DIRECT / UNREGISTERED SUPPLIERS (CREATED BY USER) */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-3 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  {isGlobalAdmin ? 'Direct / Unregistered Suppliers (All Users)' : 'My Direct / Offline Suppliers (Created by You)'}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">Direct Procurement Sources</h3>
                <p className="text-xs text-slate-500">Unregistered suppliers created for POs are private and only visible to you.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsVendorModalOpen(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> + Add Direct Supplier
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {visibleUnregisteredVendors.length === 0 ? (
                <div className="col-span-full p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
                  <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-sm">No direct suppliers added yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Click "+ Add Direct Supplier" to add suppliers private to your account.</p>
                </div>
              ) : (
                visibleUnregisteredVendors.map(vendor => (
                  <div key={vendor.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative group">
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingVendorId(vendor.id); setNewVendor({ name: vendor.name, category: vendor.category, contact: vendor.contact, phone: vendor.phone }); setIsVendorModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors bg-white shadow-xs border border-slate-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteVendor(vendor.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors bg-white shadow-xs border border-slate-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <div className="pr-12">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded-md border border-slate-200">
                          {vendor.category || 'Direct Supplier'}
                        </span>
                        <h4 className="text-base font-black text-slate-900 mt-1.5 leading-tight">{vendor.name}</h4>
                        {vendor.email && <p className="text-xs text-slate-500 font-medium mt-0.5">{vendor.email}</p>}
                      </div>

                      <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs text-slate-600 font-medium">
                        {vendor.contact && <p><span className="font-bold text-slate-400 uppercase text-[10px]">Contact:</span> {vendor.contact}</p>}
                        {vendor.phone && <p><span className="font-bold text-slate-400 uppercase text-[10px]">Phone:</span> {vendor.phone}</p>}
                        {vendor.gstin && <p><span className="font-bold text-slate-400 uppercase text-[10px]">GSTIN:</span> {vendor.gstin}</p>}
                        {isGlobalAdmin && vendor.createdBy && (
                          <p className="text-[11px] text-teal-700 font-bold mt-1">Creator: {vendor.createdBy}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Direct Sourcing
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVendorName(vendor.name);
                          setSelectedVendorId('');
                          setSelectedVendorType('Unregistered');
                          setIsPoModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        + Create PO
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
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
                {/* Dual-Vendor Dropdown (Registered vs Unregistered) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Select Supplier / Vendor *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQuickAddVendorOpen(true)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-[11px] rounded-lg border border-emerald-300 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Add Unregistered Supplier
                    </button>
                  </div>

                  <select
                    required
                    value={
                      selectedVendorType === 'Registered'
                        ? `REG__${selectedVendorId}__${selectedVendorName}`
                        : selectedVendorName ? `UNREG__${selectedVendorName}` : ''
                    }
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '__ADD_NEW__') {
                        setIsQuickAddVendorOpen(true);
                      } else if (val.startsWith('REG__')) {
                        const parts = val.split('__');
                        setSelectedVendorType('Registered');
                        setSelectedVendorId(parts[1]);
                        setSelectedVendorName(parts[2]);
                      } else if (val.startsWith('UNREG__')) {
                        const parts = val.split('__');
                        setSelectedVendorType('Unregistered');
                        setSelectedVendorId('');
                        setSelectedVendorName(parts[1]);
                      } else {
                        setSelectedVendorName('');
                        setSelectedVendorId('');
                      }
                    }}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white"
                  >
                    <option value="">-- Choose Vendor / Supplier --</option>

                    <optgroup label="⭐ REGISTERED METAGREEN SOLAR SUPPLIERS (Live Catalog)">
                      {registeredVendors.map(rv => (
                        <option
                          key={rv.id}
                          value={`REG__${rv.id}__${rv.companyName || rv.name}`}
                        >
                          ⭐ {rv.companyName || rv.name} ({rv.email}) - Registered Supplier
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="📦 MY DIRECT / UNREGISTERED SUPPLIERS (Created by You)">
                      {visibleUnregisteredVendors.map(uv => (
                        <option
                          key={uv.id}
                          value={`UNREG__${uv.name}`}
                        >
                          📦 {uv.name} ({uv.category || 'Direct Supplier'})
                        </option>
                      ))}
                    </optgroup>

                    <option value="__ADD_NEW__" className="text-emerald-700 font-black bg-emerald-50">
                      + Add New Unregistered Supplier (On-The-Spot)...
                    </option>
                  </select>
                </div>

                {/* Sellable Stock Auto-Fill Banner for Registered Vendor */}
                {selectedVendorType === 'Registered' && selectedVendorName && (
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200/80 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5 uppercase tracking-wide">
                        <Store className="w-4 h-4 text-emerald-600" />
                        {selectedVendorName}'s Live Sellable Catalog
                      </span>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/60 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        {vendorSellableStock.length} Sellable SKUs Live
                      </span>
                    </div>

                    {vendorSellableStock.length > 0 ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <select
                          defaultValue=""
                          onChange={e => {
                            const selectedItem = vendorSellableStock.find(i => i.id === e.target.value);
                            if (selectedItem) {
                              const sPrice = selectedItem.sellingPrice || selectedItem.purchasePrice || selectedItem.price || 0;
                              const newRowId = String(Date.now());
                              const productType = selectedItem.type === 'AC/DC Cable' ? 'AC/DC Cable' : (selectedItem.type || 'Panel');

                              setPoItems([
                                ...poItems.filter(p => p.name.trim() !== ''),
                                {
                                  id: newRowId,
                                  name: selectedItem.name,
                                  type: productType as any,
                                  unit: (selectedItem.unit as any) || 'KW',
                                  quantity: 1,
                                  unitPrice: sPrice,
                                  taxRate: selectedItem.gst !== undefined ? selectedItem.gst : 18
                                }
                              ]);
                              toast.success(`Added "${selectedItem.name}" at Vendor Selling Price ₹${sPrice.toLocaleString('en-IN')}/${selectedItem.unit}!`, "Product Added to PO");
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                        >
                          <option value="">-- Choose Product from Vendor's Sellable Catalog to Auto-Fill Row --</option>
                          {vendorSellableStock.map(item => {
                            const sPrice = item.sellingPrice || item.purchasePrice || item.price || 0;
                            const avail = item.availableQuantity !== undefined ? item.availableQuantity : item.quantity;
                            return (
                              <option key={item.id} value={item.id}>
                                {item.name} — ₹{sPrice.toLocaleString('en-IN')} / {item.unit} ({avail} {item.unit} available)
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">
                        This registered vendor has not published sellable stock yet. You can still define custom items manually below.
                      </p>
                    )}
                  </div>
                )}

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
                    <div className="w-24 shrink-0">Type</div>
                    <div className="flex-1 min-w-[130px]">Item Description</div>
                    <div className="w-32 shrink-0">Unit of Measure</div>
                    <div className="w-24 shrink-0 text-center">Size (W / Rating)</div>
                    <div className="w-16 shrink-0 text-center">Qty</div>
                    <div className="w-28 shrink-0 text-right">Rate (₹ / Unit)</div>
                    <div className="w-20 shrink-0 text-center">GST %</div>
                    <div className="w-28 shrink-0 text-right">Total (₹)</div>
                    <div className="w-8 shrink-0 text-center"></div>
                  </div>

                  <div className="space-y-2.5">
                    {poItems.map((item) => {
                      const rowTaxable = item.quantity * item.unitPrice;
                      const rowTax = rowTaxable * (item.taxRate / 100);
                      const rowTotal = rowTaxable + rowTax;
                      const unitGross = item.unitPrice + (item.unitPrice * (item.taxRate / 100));
                      const wattPrice = Number(item.size) > 0 ? (unitGross / Number(item.size)) : 0;
                      return (
                        <div key={item.id} className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 text-xs transition-colors space-y-2">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
                            {/* Type Selector */}
                            <div className="lg:w-24 shrink-0">
                              <label className="block lg:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">Type</label>
                              <select
                                value={item.type}
                                onChange={e => {
                                  const newType = e.target.value as ProductType;
                                  let defaultUnit: POItemUnit = item.unit || 'PCS';
                                  let defaultSize = item.size || 0;
                                  if (newType === 'Panel') { defaultUnit = 'KW'; defaultSize = defaultSize || 550; }
                                  else if (newType === 'Inverter') { defaultUnit = 'KW'; defaultSize = defaultSize || 5000; }
                                  else if (newType === 'AC/DC Cable') defaultUnit = 'MTR';
                                  else if (newType === 'Structure') defaultUnit = 'TON';
                                  else if (newType === 'Battery') defaultUnit = 'KW';
                                  else if (newType === 'Accessories') defaultUnit = 'PCS';

                                  setPoItems(poItems.map(p => p.id === item.id ? { ...p, type: newType, unit: defaultUnit, size: defaultSize } : p));
                                }}
                                className="w-full p-2 border border-slate-200 rounded-lg font-bold bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
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
                            <div className="flex-1 min-w-[130px]">
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
                                className="w-full p-2 border border-slate-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white text-xs"
                                required
                              />
                            </div>

                            {/* Unit of Measure Dropdown (MTR / KW / MW / TON / KG / PCS) */}
                            <div className="lg:w-32 shrink-0">
                              <label className="block lg:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">Unit of Measure</label>
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
                                <option value="PCS">PCS (Pieces)</option>
                                <option value="UNIT">UNIT</option>
                              </select>
                            </div>

                            {/* Size (Watts / Rating) */}
                            <div className="lg:w-24 shrink-0">
                              <label className="block lg:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">Size (Watts / Rating)</label>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.size || ''}
                                onChange={e => handleUpdatePoItemRow(item.id, 'size', Number(e.target.value))}
                                placeholder="e.g. 550"
                                className="w-full p-2 border border-slate-200 rounded-lg font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white text-xs"
                              />
                            </div>

                            {/* Quantity / Capacity */}
                            <div className="lg:w-16 shrink-0">
                              <label className="block lg:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">Qty ({item.unit})</label>
                              <input
                                type="number"
                                step="any"
                                min="0.1"
                                value={item.quantity || ''}
                                onChange={e => handleUpdatePoItemRow(item.id, 'quantity', Number(e.target.value))}
                                placeholder="Qty"
                                className="w-full p-2 border border-slate-200 rounded-lg font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white text-xs"
                                required
                              />
                            </div>

                            {/* Unit Rate (₹ / Unit) */}
                            <div className="lg:w-28 shrink-0">
                              <label className="block lg:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">Rate (₹ / {item.unit})</label>
                              <div className="relative flex items-center">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={item.unitPrice || ''}
                                  onChange={e => handleUpdatePoItemRow(item.id, 'unitPrice', Number(e.target.value))}
                                  placeholder={`₹ / ${item.unit}`}
                                  className="w-full p-2 pr-8 border border-slate-200 rounded-lg font-bold text-right outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white text-xs"
                                  required
                                />
                                <span className="absolute right-2 text-[9px] font-bold text-slate-400 pointer-events-none">
                                  /{item.unit}
                                </span>
                              </div>
                            </div>

                            {/* GST Rate */}
                            <div className="lg:w-20 shrink-0">
                              <label className="block lg:hidden text-[10px] font-bold text-slate-500 uppercase mb-0.5">GST %</label>
                              <select
                                value={item.taxRate}
                                onChange={e => handleUpdatePoItemRow(item.id, 'taxRate', Number(e.target.value))}
                                className="w-full p-2 border border-slate-200 rounded-lg font-bold bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                              >
                                <option value={5}>5%</option>
                                <option value={12}>12%</option>
                                <option value={18}>18%</option>
                                <option value={28}>28%</option>
                                <option value={0}>0%</option>
                              </select>
                            </div>

                            {/* Line Total */}
                            <div className="lg:w-28 shrink-0 text-right">
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

                          {/* Watt Price Formula Calculation Live Badge (Replica of Inventory Formula) */}
                          {Number(item.size) > 0 && (
                            <div className="p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <div>
                                <span className="font-black text-emerald-900 block text-[11px]">⚡ Calculated Watt Price = (GST + Price) ÷ Size:</span>
                                <span className="text-[10px] text-emerald-700 font-medium">
                                  (₹{Math.round(unitGross).toLocaleString('en-IN')} with {item.taxRate}% GST) ÷ {item.size} Watts
                                </span>
                              </div>
                              <div className="sm:text-right">
                                <span className="text-[9px] font-black uppercase text-emerald-600 block tracking-wider">Per Watt Price</span>
                                <span className="text-xs font-black text-emerald-800 font-mono">
                                  ₹{wattPrice.toFixed(2)} / W
                                </span>
                              </div>
                            </div>
                          )}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 font-sans">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" /> Supplier Directory
                </span>
                <h3 className="text-xl font-black">{editingVendorId ? 'Edit Solar Supplier' : 'Add New Solar Supplier'}</h3>
              </div>
              <button
                onClick={() => {
                  setIsVendorModalOpen(false);
                  setEditingVendorId(null);
                  setNewVendor({ name: '', category: 'Solar Panels (Mono/Poly PV)', categories: ['Solar Panels (Mono/Poly PV)'], contact: '', phone: '', email: '', address: '', gstin: '' });
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitVendor} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vendor / Supplier Company Name *</label>
                <input
                  required
                  type="text"
                  value={newVendor.name}
                  onChange={e => setNewVendor({ ...newVendor, name: e.target.value })}
                  placeholder="e.g. Vikram Solar Ltd / Polycab Cables"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                />
              </div>

              {/* Multi-Select Category Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Supplier Categories (Select Multiple) *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {newVendor.categories?.length || 0} Selected
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = (newVendor.categories?.length || 0) === allVendorCategories.length;
                        const next = allSelected ? [] : [...allVendorCategories];
                        setNewVendor({
                          ...newVendor,
                          categories: next,
                          category: next.join(', ')
                        });
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                    >
                      {(newVendor.categories?.length || 0) === allVendorCategories.length ? 'Clear All' : 'Select All'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200 max-h-44 overflow-y-auto">
                  {allVendorCategories.map(cat => {
                    const isSelected = (newVendor.categories || []).includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          const current = newVendor.categories || [];
                          const updated = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
                          setNewVendor({ ...newVendor, categories: updated, category: updated.join(', ') });
                        }}
                        className={cn(
                          "p-2 rounded-xl text-left text-[11px] font-bold transition-all border flex items-center justify-between gap-1.5 cursor-pointer",
                          isSelected
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <span className="truncate">{cat}</span>
                        <div className={cn(
                          "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors",
                          isSelected ? "bg-white/20 border-white text-white" : "border-slate-300 bg-white"
                        )}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Inline Create Another Category Control */}
                <div className="mt-2">
                  {isAddingNewCategory ? (
                    <div className="flex items-center gap-1.5 p-2 bg-emerald-50/70 border border-emerald-300 rounded-xl animate-in fade-in duration-150">
                      <input
                        type="text"
                        autoFocus
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewCategory('newVendor');
                          } else if (e.key === 'Escape') {
                            setIsAddingNewCategory(false);
                            setNewCategoryName('');
                          }
                        }}
                        placeholder="e.g. Solar Pumps / Earthing / BOS Hardware"
                        className="flex-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNewCategory('newVendor')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewCategory(false);
                          setNewCategoryName('');
                        }}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCategory(true)}
                      className="text-[11px] font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Create Another Category...
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={newVendor.contact}
                    onChange={e => setNewVendor({ ...newVendor, contact: e.target.value, email: e.target.value })}
                    placeholder="sales@supplier.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newVendor.phone}
                    onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsVendorModalOpen(false);
                    setEditingVendorId(null);
                    setNewVendor({ name: '', category: 'Solar Panels (Mono/Poly PV)', categories: ['Solar Panels (Mono/Poly PV)'], contact: '', phone: '', email: '', address: '', gstin: '' });
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-black rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD VENDOR MODAL (ON-THE-SPOT CREATION WITH MULTIPLE SELECT CATEGORIES & CUSTOM CATEGORY CREATION) */}
      {isQuickAddVendorOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 font-sans">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" /> Supplier Registration
                </span>
                <h3 className="text-lg font-black">Register New Vendor On-The-Spot</h3>
              </div>
              <button
                onClick={() => setIsQuickAddVendorOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-700 transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleQuickSubmitVendor} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Vendor / Supplier Name *
                </label>
                <input
                  required
                  type="text"
                  value={quickVendor.name}
                  onChange={e => setQuickVendor({ ...quickVendor, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                  placeholder="e.g. Vikram Solar Ltd / Havells India"
                />
              </div>

              {/* Multi-Select Category Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Supplier Categories (Select Multiple) *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {quickVendor.categories.length} Selected
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = quickVendor.categories.length === allVendorCategories.length;
                        const next = allSelected ? [] : [...allVendorCategories];
                        setQuickVendor({
                          ...quickVendor,
                          categories: next,
                          category: next.join(', ')
                        });
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                    >
                      {quickVendor.categories.length === allVendorCategories.length ? 'Clear All' : 'Select All'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200 max-h-44 overflow-y-auto">
                  {allVendorCategories.map(cat => {
                    const isSelected = quickVendor.categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          const current = quickVendor.categories || [];
                          const updated = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
                          setQuickVendor({ ...quickVendor, categories: updated, category: updated.join(', ') });
                        }}
                        className={cn(
                          "p-2 rounded-xl text-left text-[11px] font-bold transition-all border flex items-center justify-between gap-1.5 cursor-pointer",
                          isSelected
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <span className="truncate">{cat}</span>
                        <div className={cn(
                          "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors",
                          isSelected ? "bg-white/20 border-white text-white" : "border-slate-300 bg-white"
                        )}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Inline Create Another Category Control */}
                <div className="mt-2">
                  {isAddingNewCategory ? (
                    <div className="flex items-center gap-1.5 p-2 bg-emerald-50/70 border border-emerald-300 rounded-xl animate-in fade-in duration-150">
                      <input
                        type="text"
                        autoFocus
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewCategory('quick');
                          } else if (e.key === 'Escape') {
                            setIsAddingNewCategory(false);
                            setNewCategoryName('');
                          }
                        }}
                        placeholder="e.g. Solar Pumps / Earthing / BOS Hardware"
                        className="flex-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNewCategory('quick')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewCategory(false);
                          setNewCategoryName('');
                        }}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCategory(true)}
                      className="text-[11px] font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Create Another Category...
                    </button>
                  )}
                </div>

                {quickVendor.categories.length === 0 && (
                  <p className="text-[11px] text-amber-600 font-semibold mt-1">Please select at least one category.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={quickVendor.contact}
                    onChange={e => setQuickVendor({ ...quickVendor, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                    placeholder="e.g. Rajesh Kumar"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                  <input
                    required
                    type="tel"
                    value={quickVendor.phone}
                    onChange={e => setQuickVendor({ ...quickVendor, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={quickVendor.email}
                    onChange={e => setQuickVendor({ ...quickVendor, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                    placeholder="sales@supplier.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={quickVendor.gstin}
                    onChange={e => setQuickVendor({ ...quickVendor, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                    placeholder="36AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsQuickAddVendorOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-black text-xs rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save & Select Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CENTERED SUCCESS MODAL */}
      {successModal.isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center space-y-4 border border-slate-100 animate-in zoom-in-95 duration-200 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>

            {successModal.badge && (
              <span className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black rounded-full uppercase tracking-wider">
                {successModal.badge}
              </span>
            )}

            <h3 className="text-xl font-black text-slate-900 tracking-tight">{successModal.title}</h3>
            {successModal.subtitle && (
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{successModal.subtitle}</p>
            )}

            {successModal.details && successModal.details.length > 0 && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-left space-y-2 text-xs">
                {successModal.details.map((d, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700 border-b border-slate-200/60 pb-1.5 last:border-b-0 last:pb-0">
                    <span className="text-slate-500 font-medium">{d.label}:</span>
                    <span className="font-bold text-slate-900">{d.value}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (successModal.onPrimaryClick) successModal.onPrimaryClick();
                setSuccessModal({ ...successModal, isOpen: false });
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" /> {successModal.primaryBtnText || 'Done / Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

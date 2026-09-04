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
  ClipboardList,
  Store,
  ShoppingCart,
  Lock,
  Eye,
  EyeOff,
  Check,
  Tag,
  Info,
  X,
  Scale,
  Coins,
  PackageCheck
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';

export default function Inventory({ onNavigateToPO }: { onNavigateToPO?: (vendorName?: string, item?: any) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'warehouse' | 'marketplace' | 'installer_bom'>('warehouse');

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

  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string, name: string }[]>([]);
  const [selectedVendorForInstaller, setSelectedVendorForInstaller] = useState<string>('ALL');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectIdForConsume, setSelectedProjectIdForConsume] = useState<string>('');

  // Strict Role Scoping based on Logged In Account
  const userRole = user?.role || 'Super Admin';
  const isVendor = userRole === 'Vendor' || userRole === 'Vendor Employee' || userRole === 'Solar Supplier';
  const isInstaller = userRole === 'Installer' || userRole === 'Solar Installer' || userRole === 'Technician';
  const isGlobalAdmin = !isVendor && !isInstaller;

  const [newItem, setNewItem] = useState<{
    name: string;
    type: 'Panel' | 'Wire' | 'Inverter' | 'Battery' | 'Structure' | 'Accessories' | 'Other';
    category: string;
    manufacturer: string;
    description: string;
    weight: number;
    weightUnit: 'KG' | 'TON';
    quantity: number;
    unit: 'KW' | 'MW' | 'MTR' | 'TON' | 'KG' | 'PCS' | 'UNIT' | string;
    size: number;
    wattPrice: number;
    purchasePrice: number;
    price: number;
    gst: number;
    pricingBasis: 'Per Unit' | 'Per Weight' | 'Per Meter';
    minThreshold: number;
    serialNumber: string;
    warranty: string;
    vendor: string;
    vendorType: 'Registered' | 'Unregistered';
    availableForSelling: boolean;
    sellingPrice: number;
    sellingPriceMode: 'purchase' | 'custom';
  }>({
    name: '',
    type: 'Panel',
    category: 'Solar Panels',
    manufacturer: 'Vikram Solar',
    description: '',
    weight: 0,
    weightUnit: 'KG',
    quantity: 0,
    unit: 'KW',
    size: 550,
    wattPrice: 0,
    purchasePrice: 0,
    price: 0,
    gst: 18,
    pricingBasis: 'Per Unit',
    minThreshold: 10,
    serialNumber: '',
    warranty: '25 Years Performance',
    vendor: '',
    vendorType: 'Registered',
    availableForSelling: false,
    sellingPrice: 0,
    sellingPriceMode: 'purchase'
  });

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

  const [vendorsList, setVendorsList] = useState<any[]>([]);
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

  const handleAddNewCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.warning("Please enter a category name.", "Category Required");
      return;
    }

    if (allVendorCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      const matched = allVendorCategories.find(c => c.toLowerCase() === trimmed.toLowerCase()) || trimmed;
      const cur = quickVendor.categories || [];
      if (!cur.includes(matched)) {
        const next = [...cur, matched];
        setQuickVendor({ ...quickVendor, categories: next, category: next.join(', ') });
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

      const next = [...(quickVendor.categories || []), trimmed];
      setQuickVendor({ ...quickVendor, categories: next, category: next.join(', ') });
      setCustomCategories(prev => Array.from(new Set([...prev, trimmed])));
      setIsAddingNewCategory(false);
      setNewCategoryName('');
      toast.success(`New Category "${trimmed}" created and selected!`, "Category Created");
    } catch (err: any) {
      console.error("Error creating category:", err);
      toast.error("Failed to create category: " + (err.message || err));
    }
  };

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
      setNewItem(prev => ({ ...prev, vendor: regName }));
      setIsQuickAddVendorOpen(false);
      toast.info(`"${regName}" is already a Registered MetaGreen Solar Supplier. Auto-selected registered account!`, "Registered Vendor Found");
      return;
    }

    try {
      const newId = `VEN-${String(vendorsList.length + 1).padStart(3, '0')}`;
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
        rating: 5.0,
        metrics: { delivery: 5.0, quality: 5.0, pricing: 5.0, support: 5.0 },
        status: 'Active',
        vendorType: 'Unregistered',
        isRegistered: false,
        creatorId: user?.uid || '',
        createdBy: user?.email || 'admin',
        creatorName: user?.name || user?.companyName || 'User',
        creatorRole: user?.role || '',
        createdAt: serverTimestamp()
      });

      // Automatically select this new vendor in the item form
      setNewItem(prev => ({ ...prev, vendor: vendorInputName }));
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
      setSuccessModal({
        isOpen: true,
        title: "Supplier Registered & Selected!",
        subtitle: `"${vendorInputName}" has been successfully registered and selected as the supplier for this component.`,
        badge: "📦 Supplier Registered",
        details: [
          { label: "Supplier Name", value: vendorInputName },
          { label: "Categories", value: catStr },
          { label: "Phone", value: quickVendor.phone },
          { label: "Status", value: "Selected in SKU Form" }
        ],
        primaryBtnText: "Continue Provisioning SKU"
      });
      toast.success(`Supplier "${vendorInputName}" registered and selected! (Categories: ${catStr})`, "Supplier Registered");
    } catch (err: any) {
      console.error('Error adding quick vendor:', err);
      toast.error('Failed to register vendor: ' + (err.message || err));
    }
  };

  const [registeredVendors, setRegisteredVendors] = useState<any[]>([]);

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

    const qVendors = query(collection(db, 'vendors'), orderBy('name', 'asc'));
    const unsubVendors = onSnapshot(qVendors, (snapshot) => {
      setVendorsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qProjects = query(collection(db, 'projects'));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const regList = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(u => u.role === 'Vendor' || u.role === 'Solar Supplier');
      setRegisteredVendors(regList);
    });

    const qVendorCats = query(collection(db, 'vendorCategories'), orderBy('name', 'asc'));
    const unsubVendorCats = onSnapshot(qVendorCats, (snap) => {
      setCustomCategories(snap.docs.map(d => d.data().name as string).filter(Boolean));
    });

    return () => {
      unsubCategories();
      unsubProducts();
      unsubItems();
      unsubVendors();
      unsubProjects();
      unsubUsers();
      unsubVendorCats();
    };
  }, []);

  // Filter Unregistered Vendors: Only show those created by the logged-in user (or all if Global Admin)
  const visibleUnregisteredVendors = vendorsList.filter(v => {
    if (isGlobalAdmin) return true;
    return v.creatorId === user?.uid ||
      v.createdBy === user?.email ||
      v.createdBy === user?.uid;
  });

  // Filter Items based on Active Tab & Role Scope
  const warehouseItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.manufacturer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (isVendor) {
      // Vendor sees items they own or supplied
      const isOwner = item.stockOwner === user?.uid || item.vendorId === user?.uid || (item.vendor && user?.companyName && item.vendor.toLowerCase().includes(user.companyName.toLowerCase()));
      return isOwner;
    }

    if (isInstaller) {
      // Installer sees received items they own or directly provisioned
      const isOwner = item.stockOwner === user?.uid || item.stockOwnerName === user?.name || (!item.stockOwner && item.vendorType === 'Unregistered');
      return isOwner;
    }

    // Global Admin sees all items
    return true;
  });

  // Marketplace: Live Sellable Stock from Registered Vendors
  const marketplaceSellableItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.manufacturer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.vendor || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Only items explicitly marked Available for Selling = true with available qty > 0
    const isSellable = item.availableForSelling === true && (item.availableQuantity === undefined || item.availableQuantity > 0);
    return isSellable;
  });

  // Toggle Available for Selling directly from list
  const handleToggleAvailableForSelling = async (item: InventoryItem) => {
    try {
      const newStatus = !item.availableForSelling;
      const baseBuyPrice = Number(item.purchasePrice) || Number(item.price) || 0;
      const newSellingPrice = newStatus && (!item.sellingPrice || item.sellingPrice === 0)
        ? baseBuyPrice
        : (item.sellingPrice || baseBuyPrice);

      await updateDoc(doc(db, 'inventory', item.id), {
        availableForSelling: newStatus,
        sellingPrice: newSellingPrice,
        availableQuantity: item.availableQuantity !== undefined ? item.availableQuantity : item.quantity,
        lastUpdated: serverTimestamp()
      });
      toast.success(
        newStatus
          ? `🟢 "${item.name}" is now marked Available for Selling to Installers at ₹${newSellingPrice.toLocaleString('en-IN')}/${item.unit}!`
          : `🔒 "${item.name}" is now marked as Private Stock (hidden from installers).`,
        newStatus ? "Available for Selling Enabled" : "Stock Made Private"
      );
    } catch (err: any) {
      console.error("Error toggling sellable status", err);
      toast.error("Failed to update selling status.");
    }
  };

  // Quick Selling Price Update
  const handleUpdateSellingPrice = async (item: InventoryItem, price: number) => {
    try {
      await updateDoc(doc(db, 'inventory', item.id), {
        sellingPrice: Number(price),
        lastUpdated: serverTimestamp()
      });
      toast.success(`Selling price updated to ₹${Number(price).toLocaleString('en-IN')}/${item.unit}`, "Price Updated");
    } catch (err: any) {
      console.error("Error updating selling price", err);
      toast.error("Failed to update selling price.");
    }
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pPrice = Number(newItem.purchasePrice) || Number(newItem.price) || 0;
      const gstRate = Number(newItem.gst) || 0;
      const sizeVal = Number(newItem.size) || 0;
      const totalPriceWithGst = pPrice + (pPrice * gstRate) / 100;
      const computedWattPrice = sizeVal > 0 ? Number((totalPriceWithGst / sizeVal).toFixed(2)) : 0;

      const sPrice = newItem.availableForSelling 
        ? (newItem.sellingPriceMode === 'purchase' ? pPrice : (Number(newItem.sellingPrice) || pPrice))
        : 0;

      const payload = {
        name: newItem.name.trim(),
        type: newItem.type,
        category: newItem.category,
        manufacturer: newItem.manufacturer.trim(),
        description: newItem.description.trim(),
        weight: Number(newItem.weight) || 0,
        weightUnit: newItem.weightUnit,
        quantity: Number(newItem.quantity),
        availableQuantity: Number(newItem.quantity),
        reservedQuantity: 0,
        soldQuantity: 0,
        unit: newItem.unit,
        size: sizeVal,
        wattPrice: computedWattPrice,
        price: pPrice,
        purchasePrice: pPrice,
        sellingPrice: sPrice,
        availableForSelling: newItem.availableForSelling,
        gst: gstRate,
        pricingBasis: newItem.pricingBasis,
        minThreshold: Number(newItem.minThreshold),
        serialNumber: newItem.serialNumber.trim(),
        warranty: newItem.warranty.trim(),
        vendor: newItem.vendor || user?.companyName || 'Self / Warehouse',
        vendorType: isVendor ? 'Registered' : (newItem.vendorType || 'Unregistered'),
        vendorId: isVendor ? (user?.uid || '') : '',
        stockOwner: user?.uid || 'admin',
        stockOwnerName: user?.companyName || user?.name || (isVendor ? 'Solar Supplier' : 'Solar Installer'),
        lastUpdated: serverTimestamp()
      };

      if (editingItemId) {
        await updateDoc(doc(db, 'inventory', editingItemId), payload);
        setSuccessModal({
          isOpen: true,
          title: "Hardware SKU Updated!",
          subtitle: `Component "${payload.name}" has been successfully updated with your latest changes.`,
          badge: "✏️ Stock SKU Updated",
          details: [
            { label: "Component SKU", value: payload.name },
            { label: "Classification", value: `${payload.type} (${payload.category})` },
            { label: "Updated Quantity", value: `${payload.quantity} ${payload.unit}` },
            { label: "Size (Watts)", value: payload.size ? `${payload.size} W` : 'N/A' },
            { label: "Watt Price", value: payload.wattPrice ? `₹${payload.wattPrice}/W` : 'N/A' },
            { label: "Internal Cost", value: `₹${payload.purchasePrice.toLocaleString('en-IN')}` },
            { label: "Marketplace Visibility", value: payload.availableForSelling ? `🟢 Sellable (₹${payload.sellingPrice.toLocaleString('en-IN')}/${payload.unit})` : "🔒 Private Stock" },
            { label: "Supplier / Source", value: payload.vendor }
          ],
          primaryBtnText: "Done / View Stock"
        });
        toast.success(`Inventory item "${newItem.name}" updated successfully!`, 'Stock Updated');
      } else {
        await addDoc(collection(db, 'inventory'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        setSuccessModal({
          isOpen: true,
          title: "Component SKU Provisioned!",
          subtitle: `"${payload.name}" has been successfully added to your warehouse stock under your ownership.`,
          badge: "📦 Stock SKU Provisioned",
          details: [
            { label: "Component SKU", value: payload.name },
            { label: "Classification", value: `${payload.type} (${payload.category})` },
            { label: "Initial Quantity", value: `${payload.quantity} ${payload.unit}` },
            { label: "Size (Watts)", value: payload.size ? `${payload.size} W` : 'N/A' },
            { label: "Watt Price", value: payload.wattPrice ? `₹${payload.wattPrice}/W` : 'N/A' },
            { label: "Internal Cost", value: `₹${payload.purchasePrice.toLocaleString('en-IN')}` },
            { label: "Marketplace Visibility", value: payload.availableForSelling ? `🟢 Sellable (₹${payload.sellingPrice.toLocaleString('en-IN')}/${payload.unit})` : "🔒 Private Stock" },
            { label: "Supplier / Source", value: payload.vendor },
            { label: "Stock Owner", value: payload.stockOwnerName }
          ],
          primaryBtnText: "Done / View Stock"
        });
        toast.success(`New component "${newItem.name}" added to Stock!`, 'Stock Provisioned');
      }
      setIsModalOpen(false);
      setEditingItemId(null);
      setNewItem({
        name: '',
        type: 'Panel',
        category: 'Solar Panels',
        manufacturer: 'Vikram Solar',
        description: '',
        weight: 0,
        weightUnit: 'KG',
        quantity: 0,
        unit: 'KW',
        size: 550,
        wattPrice: 0,
        purchasePrice: 0,
        price: 0,
        gst: 18,
        pricingBasis: 'Per Unit',
        minThreshold: 10,
        serialNumber: '',
        warranty: '25 Years Performance',
        vendor: '',
        vendorType: 'Registered',
        availableForSelling: false,
        sellingPrice: 0,
        sellingPriceMode: 'purchase'
      });
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
      await updateDoc(doc(db, 'inventory', id), {
        quantity: Math.max(0, newQuantity),
        availableQuantity: Math.max(0, newQuantity)
      });
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
    const selectedProj = projects.find(p => p.id === selectedProjectIdForConsume);
    const targetProjectName = selectedProj ? `${selectedProj.customerName} (${selectedProj.capacityKw} kW)` : consumeProjectName;
    const targetCustomerName = selectedProj?.customerName || consumeProjectName;
    const unitPrice = selectedItemForConsumption.purchasePrice || selectedItemForConsumption.price || 0;
    const totalCost = consumeQty * unitPrice;

    try {
      // 1. Update Inventory Stock
      await updateDoc(doc(db, 'inventory', selectedItemForConsumption.id), {
        quantity: remainingQty,
        availableQuantity: Math.max(0, (selectedItemForConsumption.availableQuantity !== undefined ? selectedItemForConsumption.availableQuantity : selectedItemForConsumption.quantity) - consumeQty),
        lastUpdated: serverTimestamp()
      });

      // 2. Log Site Consumption Record with Unit Cost & Project linkage
      await addDoc(collection(db, 'siteConsumptions'), {
        itemId: selectedItemForConsumption.id,
        itemName: selectedItemForConsumption.name,
        category: selectedItemForConsumption.category,
        consumedQuantity: consumeQty,
        unit: selectedItemForConsumption.unit,
        unitPrice: unitPrice,
        totalCost: totalCost,
        projectId: selectedProjectIdForConsume || '',
        projectName: targetProjectName,
        customerName: targetCustomerName,
        installerEmail: user?.email || 'installer@solar.com',
        installerName: user?.name || 'Lead Installer',
        notes: consumeNotes,
        timestamp: serverTimestamp()
      });

      setSuccessModal({
        isOpen: true,
        title: "Site Hardware Consumed!",
        subtitle: `${consumeQty} ${selectedItemForConsumption.unit} of "${selectedItemForConsumption.name}" was successfully logged as consumed on site for ${targetProjectName}.`,
        badge: "⚡ Site Consumption Logged",
        details: [
          { label: "Hardware SKU", value: selectedItemForConsumption.name },
          { label: "Consumed Quantity", value: `${consumeQty} ${selectedItemForConsumption.unit}` },
          { label: "Total Value", value: `₹${totalCost.toLocaleString('en-IN')}` },
          { label: "Target Site / Project", value: targetProjectName },
          { label: "Remaining in Stock", value: `${remainingQty} ${selectedItemForConsumption.unit}` }
        ],
        primaryBtnText: "Done"
      });

      toast.success(
        `⚡ ${consumeQty} ${selectedItemForConsumption.unit} of "${selectedItemForConsumption.name}" (₹${totalCost.toLocaleString('en-IN')}) marked as Consumed on Site for ${targetProjectName}!`,
        'Site Hardware Consumed'
      );
      setIsConsumeModalOpen(false);
      setSelectedItemForConsumption(null);
      setSelectedProjectIdForConsume('');
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

      setSuccessModal({
        isOpen: true,
        title: "Material Requisition Submitted!",
        subtitle: `Your requisition request for ${requisitionQty} x "${requisitionItemName}" has been logged and sent for warehouse approval.`,
        badge: "📋 Requisition Sent",
        details: [
          { label: "Required Component", value: requisitionItemName },
          { label: "Requested Quantity", value: `${requisitionQty} Units` },
          { label: "Requester", value: user?.name || user?.email || 'Lead Installer' },
          { label: "Initial Status", value: "Pending Warehouse Approval" }
        ],
        primaryBtnText: "Done"
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
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl shadow-slate-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
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
            <Package className="w-8 h-8 text-emerald-400" /> Warehouse & Vendor Stock Control
          </h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            {isInstaller
              ? '🔧 Field Installer Stock: Track received project hardware, log site consumption & order sellable items from registered suppliers.'
              : isVendor
                ? '🏢 Registered Vendor Supply: Manage your inventory, choose items Available for Selling & set Selling Prices for Installers.'
                : '👑 Global Admin Scope: Full inventory oversight, sellable stock flags, vendor pricing & installer PO tracking.'}
          </p>
        </div>
      </div>

      {/* TABS & ACTION BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('warehouse')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer",
              activeTab === 'warehouse'
                ? "bg-slate-900 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Package className="w-4 h-4 text-emerald-500" />
            {isVendor ? '🏢 My Vendor Stock' : isInstaller ? '🔧 My Received Stock' : '🏢 Warehouse Stock'} ({warehouseItems.length})
          </button>

          <button
            onClick={() => setActiveTab('marketplace')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer",
              activeTab === 'marketplace'
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Store className="w-4 h-4 text-amber-400" />
            <span>Marketplace Catalog (Sellable Stock)</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-500/30">
              {marketplaceSellableItems.length} Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab('installer_bom')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer",
              activeTab === 'installer_bom'
                ? "bg-slate-900 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Wrench className="w-4 h-4 text-teal-500" />
            Site Consumption & BOM
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {isInstaller && (
            <button
              onClick={() => setIsRequisitionModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black rounded-2xl transition-all shadow-md shadow-teal-600/20 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" /> Request Materials
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl transition-all shadow-md shadow-emerald-600/20 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Provision New Stock SKU
          </button>
        </div>
      </div>

      {/* METRIC STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Inventory Items</p>
              <h3 className="text-xl font-black text-slate-900">{items.length} SKUs</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-xs relative overflow-hidden group">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Available for Selling</p>
              <h3 className="text-xl font-black text-emerald-700">
                {items.filter(i => i.availableForSelling).length} Sellable SKUs
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-xs relative overflow-hidden group">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Low Stock Alerts</p>
              <h3 className="text-xl font-black text-amber-600">
                {items.filter(item => item.quantity <= item.minThreshold).length} Reorder Needed
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-teal-200 shadow-xs relative overflow-hidden group">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Stock Units</p>
              <h3 className="text-xl font-black text-teal-700">
                {items.reduce((acc, curr) => acc + (curr.quantity || 0), 0)} Units on Hand
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: WAREHOUSE & MY STOCK */}
      {activeTab === 'warehouse' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search stock by SKU, product type, or supplier..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold transition-all bg-white"
              />
            </div>
            <span className="text-xs font-black text-slate-500">
              Showing {warehouseItems.length} items in your warehouse scope
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="px-6 py-4">Component SKU & Details</th>
                  <th className="px-6 py-4">Stock Owner & Supplier</th>
                  <th className="px-6 py-4">Stock & Unit of Measure</th>
                  <th className="px-6 py-4">Size & Watt Price</th>
                  <th className="px-6 py-4">Purchase Price</th>
                  <th className="px-6 py-4">Available for Selling & Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {warehouseItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <Package className="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-1" />
                      <p className="text-sm font-bold text-slate-600">No inventory items found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Click "Provision New Stock SKU" or receive goods via Purchase Orders</p>
                    </td>
                  </tr>
                ) : (
                  warehouseItems.map((item) => {
                    const Icon = getCategoryIcon(item.category);
                    const isLow = item.quantity <= item.minThreshold;
                    const pCost = item.purchasePrice || item.price || 0;
                    const sPrice = item.sellingPrice || pCost;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shrink-0">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm leading-tight">{item.name}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                  {item.type || item.category}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">
                                  {item.manufacturer || 'Standard'} • {item.pricingBasis || 'Per Unit'}
                                </span>
                                {item.serialNumber && <span className="text-[10px] font-mono text-slate-400">• S/N: {item.serialNumber}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                              <Building className="w-3.5 h-3.5 text-emerald-600" />
                              {item.vendor || item.stockOwnerName || 'Warehouse'}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider w-fit border",
                              item.vendorType === 'Registered' || isVendor
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            )}>
                              {item.vendorType === 'Registered' || isVendor ? '⭐ Registered Vendor' : '📦 Unregistered Supplier'}
                            </span>
                            {item.stockOwnerName && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                Owner: {item.stockOwnerName}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              {!isInstaller && (
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center transition-colors"
                                >
                                  -
                                </button>
                              )}
                              <span className="font-mono font-black text-slate-900 text-sm">
                                {item.quantity} {item.unit}
                              </span>
                              {!isInstaller && (
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center transition-colors"
                                >
                                  +
                                </button>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              Avail: {item.availableQuantity !== undefined ? item.availableQuantity : item.quantity} | Sold: {item.soldQuantity || 0}
                            </div>
                            {isLow && (
                              <span className="text-[9px] font-black text-amber-600 flex items-center gap-0.5 mt-0.5">
                                <AlertTriangle className="w-3 h-3" /> Low Stock
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            {item.size ? (
                              <>
                                <span className="font-mono font-black text-slate-900 text-sm">
                                  {item.size} W
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit mt-0.5 border border-emerald-200">
                                  ₹{((pCost * (1 + (item.gst !== undefined ? item.gst : 18) / 100)) / item.size).toFixed(2)} / W
                                </span>
                              </>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400">—</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-sm">
                              ₹{pCost.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">/ {item.unit}</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">+ GST {item.gst !== undefined ? item.gst : 18}%</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {isVendor || isGlobalAdmin ? (
                            <div className="flex flex-col gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleAvailableForSelling(item)}
                                className={cn(
                                  "px-2.5 py-1 rounded-xl font-black text-[10px] uppercase flex items-center gap-1.5 border transition-all cursor-pointer w-fit",
                                  item.availableForSelling
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs"
                                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                )}
                              >
                                {item.availableForSelling ? (
                                  <>
                                    <Eye className="w-3 h-3 text-emerald-600" />
                                    <span>Available for Selling: YES</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3 h-3 text-slate-400" />
                                    <span>Private Stock: NO</span>
                                  </>
                                )}
                              </button>

                              {item.availableForSelling && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] font-black text-emerald-700">
                                    Sell @ ₹{sPrice.toLocaleString('en-IN')}/{item.unit}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const input = prompt(`Enter Selling Price for ${item.name} (₹ per ${item.unit}):`, String(sPrice));
                                      if (input && !isNaN(Number(input))) {
                                        handleUpdateSellingPrice(item, Number(input));
                                      }
                                    }}
                                    className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-500">
                              {item.availableForSelling ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Sellable @ ₹{sPrice.toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="text-slate-400 flex items-center gap-1">
                                  <Lock className="w-3.5 h-3.5" /> Private Stock
                                </span>
                              )}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Installer Specific Action: Consume on Site */}
                            {(isInstaller || isGlobalAdmin) && (
                              <button
                                onClick={() => {
                                  setSelectedItemForConsumption(item);
                                  setConsumeQty(1);
                                  setIsConsumeModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                title="Mark item quantity consumed during site installation"
                              >
                                <Wrench className="w-3.5 h-3.5" /> Consume on Site
                              </button>
                            )}

                            {/* Admin / Vendor SKU Edit Controls */}
                            {(!isInstaller || isGlobalAdmin) && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingItemId(item.id);
                                    setNewItem({
                                      name: item.name,
                                      type: item.type || 'Panel',
                                      category: item.category,
                                      manufacturer: item.manufacturer || item.vendor || 'Vikram Solar',
                                      description: item.description || '',
                                      weight: item.weight || 0,
                                      weightUnit: (item.weightUnit as any) || 'KG',
                                      quantity: item.quantity,
                                      unit: (item.unit as any) || 'KW',
                                      size: item.size || 550,
                                      wattPrice: item.wattPrice || 0,
                                      purchasePrice: item.purchasePrice || item.price || 0,
                                      price: item.purchasePrice || item.price || 0,
                                      gst: item.gst !== undefined ? item.gst : 18,
                                      pricingBasis: (item.pricingBasis as any) || 'Per Unit',
                                      minThreshold: item.minThreshold,
                                      serialNumber: item.serialNumber || '',
                                      warranty: item.warranty || '',
                                      vendor: item.vendor || '',
                                      vendorType: item.vendorType || (isVendor ? 'Registered' : 'Unregistered'),
                                      availableForSelling: item.availableForSelling || false,
                                      sellingPrice: item.sellingPrice || 0,
                                      sellingPriceMode: item.sellingPrice === (item.purchasePrice || item.price) ? 'purchase' : 'custom'
                                    });
                                    setIsModalOpen(true);
                                  }}
                                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                                  title="Edit SKU Details"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MARKETPLACE / REGISTERED SUPPLIERS CATALOG */}
      {activeTab === 'marketplace' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-800/40">
            <div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                <Store className="w-3.5 h-3.5" /> Registered Solar Suppliers Catalog
              </span>
              <h2 className="text-2xl font-black mt-2">Browse Sellable Stock from Registered Vendors</h2>
              <p className="text-slate-300 text-xs mt-1 max-w-2xl">
                Installers can browse real-time available stock marked for selling by registered MetaGreen suppliers.
                Order directly via Purchase Order at the vendor's official selling price.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketplaceSellableItems.length === 0 ? (
              <div className="col-span-full p-12 bg-white rounded-3xl text-center border border-slate-200">
                <Store className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                <h4 className="text-base font-black text-slate-800">No Sellable Stock in Marketplace</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Registered vendors have not marked any items as "Available for Selling" yet.
                </p>
              </div>
            ) : (
              marketplaceSellableItems.map((item) => {
                const Icon = getCategoryIcon(item.category);
                const sPrice = item.sellingPrice || item.purchasePrice || item.price || 0;
                const availQty = item.availableQuantity !== undefined ? item.availableQuantity : item.quantity;

                return (
                  <div key={item.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Store className="w-3 h-3 text-amber-600" /> {item.vendor || 'Registered Supplier'}
                        </span>
                      </div>

                      <div className="mt-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded border border-slate-200">
                          {item.type || item.category}
                        </span>
                        <h4 className="font-black text-slate-900 text-base mt-1.5 leading-tight">{item.name}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">
                          {item.description || `${item.manufacturer} certified solar component with ${item.warranty || 'standard warranty'}.`}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Available Stock</span>
                          <p className="font-black text-emerald-700 text-sm">{availQty} {item.unit}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Pricing Basis</span>
                          <p className="font-black text-slate-800 text-sm">{item.pricingBasis || 'Per Unit'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Vendor Selling Price</span>
                        <p className="text-lg font-black text-slate-900 leading-none mt-0.5">
                          ₹{sPrice.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">/ {item.unit}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateToPO) {
                            onNavigateToPO(item.vendor, item);
                          } else {
                            toast.info(`To order "${item.name}", open Purchase Orders tab and select "${item.vendor}".`, "Create PO");
                          }
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Order via PO
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: INSTALLER SITE BOM & CONSUMPTIONS */}
      {activeTab === 'installer_bom' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Assigned Project BOM Kits & Site Hardware</h3>
              <p className="text-xs text-slate-500">Track items consumed during customer site surveys, solar installations, and structure fabrication.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-black uppercase rounded">
                      {item.type || item.category}
                    </span>
                    <span className="text-xs font-black text-slate-800">{item.quantity} {item.unit}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">{item.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Supplier: {item.vendor || 'Direct Store'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItemForConsumption(item);
                    setConsumeQty(1);
                    setIsConsumeModalOpen(true);
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5 text-teal-400" /> Log Site Consumption
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Solar Project / Customer *</label>
                {projects.length > 0 ? (
                  <select
                    value={selectedProjectIdForConsume}
                    onChange={e => {
                      setSelectedProjectIdForConsume(e.target.value);
                      const found = projects.find(p => p.id === e.target.value);
                      if (found) {
                        setConsumeProjectName(`${found.customerName} (${found.capacityKw} kW)`);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="">-- Choose Active Solar Project / Customer --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.customerName} • {p.capacityKw} kW ({p.status || 'In Progress'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input required type="text" value={consumeProjectName} onChange={e => setConsumeProjectName(e.target.value)} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:border-emerald-500" placeholder="e.g. Ramesh Kumar 3kW Installation" />
                )}
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 font-sans">
            {/* Fixed Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                    Warehouse Inventory Engine
                  </span>
                  <h3 className="text-xl font-black text-white">{editingItemId ? 'Edit Hardware SKU' : 'Provision New Hardware SKU'}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setEditingItemId(null); }}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="stock-sku-form" onSubmit={handleSubmitItem} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-xs bg-slate-50/60">
              {/* SECTION 1: COMPONENT IDENTITY */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">1. Component Classification & Identity</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Item Type *</label>
                    <select
                      value={newItem.type}
                      onChange={e => {
                        const t = e.target.value as any;
                        let defaultUnit = 'PCS';
                        let defaultBasis = 'Per Unit';
                        let defaultCat = 'Other';
                        if (t === 'Panel') { defaultUnit = 'KW'; defaultBasis = 'Per Unit'; defaultCat = 'Solar Panels'; }
                        else if (t === 'Wire') { defaultUnit = 'MTR'; defaultBasis = 'Per Unit'; defaultCat = 'Cables & Accessories'; }
                        else if (t === 'Inverter') { defaultUnit = 'KW'; defaultBasis = 'Per Unit'; defaultCat = 'Inverters'; }
                        else if (t === 'Structure') { defaultUnit = 'KG'; defaultBasis = 'Per Weight'; defaultCat = 'Mounting Structures'; }
                        else if (t === 'Battery') { defaultUnit = 'KW'; defaultBasis = 'Per Unit'; defaultCat = 'Batteries'; }

                        setNewItem({
                          ...newItem,
                          type: t,
                          unit: defaultUnit,
                          pricingBasis: defaultBasis as any,
                          category: defaultCat
                        });
                      }}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                    >
                      <option value="Panel">☀️ Panel (Solar PV)</option>
                      <option value="Wire">⚡ Wire (DC/AC Cables)</option>
                      <option value="Inverter">🔌 Inverter (String/Micro/Hybrid)</option>
                      <option value="Battery">🔋 Battery Storage</option>
                      <option value="Structure">🏗️ Mounting Structure</option>
                      <option value="Other">📦 Other Component</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Component SKU / Name *</label>
                    <input
                      required
                      type="text"
                      value={newItem.name}
                      onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="e.g. Vikram Solar 540W Mono PERC Bifacial Module"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Manufacturer / Brand *</label>
                    <input
                      required
                      type="text"
                      value={newItem.manufacturer}
                      onChange={e => setNewItem({ ...newItem, manufacturer: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="e.g. Vikram Solar / Polycab / Havells / Growatt"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase">Sourcing Supplier / Vendor</label>
                      <button
                        type="button"
                        onClick={() => setIsQuickAddVendorOpen(true)}
                        className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Quick Add Supplier
                      </button>
                    </div>
                    <select
                      value={newItem.vendor}
                      onChange={e => {
                        if (e.target.value === '__ADD_NEW__') {
                          setIsQuickAddVendorOpen(true);
                        } else {
                          setNewItem({ ...newItem, vendor: e.target.value });
                        }
                      }}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white text-xs"
                    >
                      <option value="">-- Choose Vendor / Supplier --</option>

                      <optgroup label="⭐ REGISTERED METAGREEN SOLAR SUPPLIERS">
                        {registeredVendors.map(rv => (
                          <option key={rv.id} value={rv.companyName || rv.name}>
                            ⭐ {rv.companyName || rv.name} ({rv.email})
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="📦 MY DIRECT / UNREGISTERED SUPPLIERS (Created by You)">
                        {visibleUnregisteredVendors.map(uv => (
                          <option key={uv.id} value={uv.name}>
                            📦 {uv.name} ({uv.category || 'Direct Supplier'})
                          </option>
                        ))}
                      </optgroup>

                      <option value="__ADD_NEW__" className="text-emerald-700 font-bold bg-emerald-50">+ Add New Vendor (Quick Register)...</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Description / Technical Specs</label>
                  <textarea
                    rows={2}
                    value={newItem.description}
                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                    placeholder="e.g. 540W Bifacial Dual Glass Half-Cut Mono PERC module with 25 yrs performance warranty."
                  />
                </div>
              </div>

              {/* SECTION 2: SPECIFICATIONS, UNITS & PRICING BASIS */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Scale className="w-4 h-4 text-teal-600" />
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">2. Physical Units & Pricing Basis</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Weight of Item</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={newItem.weight || ''}
                        onChange={e => setNewItem({ ...newItem, weight: Number(e.target.value) })}
                        placeholder="e.g. 28.5"
                        className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <select
                        value={newItem.weightUnit}
                        onChange={e => setNewItem({ ...newItem, weightUnit: e.target.value as any })}
                        className="w-20 px-2 py-2.5 border border-slate-300 rounded-xl font-bold bg-white outline-none"
                      >
                        <option value="KG">KG</option>
                        <option value="TON">TON</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pricing Basis *</label>
                    <select
                      value={newItem.pricingBasis}
                      onChange={e => setNewItem({ ...newItem, pricingBasis: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="Per Unit">Per Unit (e.g. per KW / MTR / PCS)</option>
                      <option value="Per Weight">Per Weight (e.g. per KG / TON)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unit of Measure *</label>
                    <select
                      value={newItem.unit}
                      onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="KW">KW (Kilowatt)</option>
                      <option value="MW">MW (Megawatt)</option>
                      <option value="MTR">MTR (Meter)</option>
                      <option value="TON">TON</option>
                      <option value="KG">KG</option>
                      <option value="PCS">PCS (Pieces)</option>
                      <option value="UNIT">UNIT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Size (Watts / Rating) *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={newItem.size || ''}
                      onChange={e => setNewItem({ ...newItem, size: Number(e.target.value) })}
                      placeholder="e.g. 550"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">e.g. 550W Module</span>
                  </div>
                </div>

                {Number(newItem.size) > 0 && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-3">
                    <div>
                      <span className="font-black text-emerald-900 block text-xs">⚡ Calculated Watt Price = (GST + Price) ÷ Size:</span>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        (₹{(Number(newItem.purchasePrice || newItem.price || 0) + (Number(newItem.purchasePrice || newItem.price || 0) * (Number(newItem.gst) || 0) / 100)).toLocaleString('en-IN')} with {newItem.gst}% GST) ÷ {newItem.size} Watts
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] font-black uppercase text-emerald-600 block tracking-wider">Per Watt Price</span>
                      <span className="text-base font-black text-emerald-800">
                        ₹{((Number(newItem.purchasePrice || newItem.price || 0) + (Number(newItem.purchasePrice || newItem.price || 0) * (Number(newItem.gst) || 0) / 100)) / Number(newItem.size)).toFixed(2)} / W
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: STOCK QUANTITY & INTERNAL PROCUREMENT COST */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">3. Stock Quantity & Purchase Cost</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Stock Qty *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="any"
                      value={newItem.quantity}
                      onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Low Stock Threshold *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={newItem.minThreshold}
                      onChange={e => setNewItem({ ...newItem, minThreshold: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-amber-600 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Internal Buy Price (₹) *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="any"
                      value={newItem.purchasePrice || newItem.price || ''}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setNewItem({
                          ...newItem,
                          purchasePrice: val,
                          price: val,
                          sellingPrice: newItem.sellingPriceMode === 'purchase' ? val : newItem.sellingPrice
                        });
                      }}
                      placeholder="e.g. 18000"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Confidential purchase rate</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GST Rate (%) *</label>
                    <select
                      value={newItem.gst}
                      onChange={e => setNewItem({ ...newItem, gst: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value={5}>5% (Solar PV/EPC)</option>
                      <option value={12}>12% (Equipment)</option>
                      <option value={18}>18% (Standard GST)</option>
                      <option value={28}>28% (Luxury)</option>
                      <option value={0}>0% (Exempt)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: MARKETPLACE SELLING SETTINGS */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">4. Marketplace Selling & Catalog Visibility</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !newItem.availableForSelling;
                      const baseP = newItem.purchasePrice || newItem.price || 0;
                      setNewItem({
                        ...newItem,
                        availableForSelling: next,
                        sellingPrice: next && (!newItem.sellingPrice || newItem.sellingPrice === 0) ? baseP : newItem.sellingPrice
                      });
                    }}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl font-black text-xs uppercase transition-all shadow-xs flex items-center gap-1 cursor-pointer",
                      newItem.availableForSelling
                        ? "bg-emerald-600 text-white shadow-emerald-600/20"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    )}
                  >
                    {newItem.availableForSelling ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{newItem.availableForSelling ? 'YES (Sellable Live)' : 'NO (Private to Warehouse)'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500 font-medium">
                  {newItem.availableForSelling
                    ? '🟢 Sellable: This stock will be listed in the Marketplace catalog so installers can purchase via Purchase Orders.'
                    : '🔒 Private: This stock is reserved for your own internal project installations and hidden from other installers.'}
                </p>

                {newItem.availableForSelling && (
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3 animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-emerald-950 uppercase">
                      Vendor Selling Price Configuration *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewItem({
                          ...newItem,
                          sellingPriceMode: 'purchase',
                          sellingPrice: newItem.purchasePrice || newItem.price || 0
                        })}
                        className={cn(
                          "p-3 rounded-xl border text-left font-semibold text-xs transition-all cursor-pointer",
                          newItem.sellingPriceMode === 'purchase'
                            ? "bg-white border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs"
                            : "bg-white/80 border-slate-200 text-slate-700 hover:bg-white"
                        )}
                      >
                        <span className="font-black block text-[11px] uppercase text-emerald-950">Option 1: Sell at Purchase Price</span>
                        <span className="text-sm font-black text-emerald-700">₹{(newItem.purchasePrice || newItem.price || 0).toLocaleString('en-IN')} / {newItem.unit}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Zero markup pass-through rate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewItem({ ...newItem, sellingPriceMode: 'custom' })}
                        className={cn(
                          "p-3 rounded-xl border text-left font-semibold text-xs transition-all cursor-pointer",
                          newItem.sellingPriceMode === 'custom'
                            ? "bg-white border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs"
                            : "bg-white/80 border-slate-200 text-slate-700 hover:bg-white"
                        )}
                      >
                        <span className="font-black block text-[11px] uppercase text-slate-900">Option 2: Custom Selling Price</span>
                        <span className="text-sm font-black text-teal-700">₹{(newItem.sellingPrice || 0).toLocaleString('en-IN')} / {newItem.unit}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Sell at higher custom margin</span>
                      </button>
                    </div>

                    {newItem.sellingPriceMode === 'custom' && (
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Custom Selling Price (₹ per {newItem.unit}) *
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required={newItem.availableForSelling}
                          value={newItem.sellingPrice || ''}
                          onChange={e => setNewItem({ ...newItem, sellingPrice: Number(e.target.value) })}
                          placeholder="e.g. 22500"
                          className="w-full px-3.5 py-2.5 border border-emerald-300 rounded-xl font-black text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white text-sm"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Installers will see this selling price (₹{Number(newItem.sellingPrice || 0).toLocaleString('en-IN')}/{newItem.unit}). Your internal buy cost (₹{Number(newItem.purchasePrice || 0).toLocaleString('en-IN')}) will remain strictly confidential.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 5: SERIAL NUMBER & WARRANTY */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">5. Batch Tracking & Warranty</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Serial / Batch Number</label>
                    <input
                      type="text"
                      value={newItem.serialNumber}
                      onChange={e => setNewItem({ ...newItem, serialNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="e.g. SN-2026-PANEL-881"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Warranty Term</label>
                    <input
                      type="text"
                      value={newItem.warranty}
                      onChange={e => setNewItem({ ...newItem, warranty: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="e.g. 25 Years Performance"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Fixed Action Footer Dock */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-white shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Stock Owner: {user?.name || user?.companyName || 'Your Account'}
                </span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingItemId(null); }}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="stock-sku-form"
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Component SKU
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD VENDOR MODAL */}
      {isQuickAddVendorOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 font-sans">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" /> Supplier Registration
                </span>
                <h3 className="text-lg font-black">Register New Vendor / Supplier</h3>
              </div>
              <button
                onClick={() => setIsQuickAddVendorOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-700 transition-colors"
              >
                &times;
              </button>
            </div>

            <form id="quick-vendor-form" onSubmit={handleQuickSubmitVendor} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
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
                      onClick={() => setQuickVendor({ ...quickVendor, categories: [...allVendorCategories], category: allVendorCategories.join(', ') })}
                      className="text-[10px] font-black text-emerald-700 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setQuickVendor({ ...quickVendor, categories: [], category: '' })}
                      className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      Clear
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
                            handleAddNewCategory();
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
                        onClick={handleAddNewCategory}
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
            </form>

            <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsQuickAddVendorOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-black text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="quick-vendor-form"
                disabled={quickVendor.categories.length === 0}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Register Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* CENTERED SUCCESS MODAL (IN MIDDLE NOT AS TOAST)           */}
      {/* ========================================================== */}
      {successModal.isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 text-center relative p-6 sm:p-8"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSuccessModal({ ...successModal, isOpen: false })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Animated Glowing Icon */}
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-lg shadow-emerald-500/10">
              <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
            </div>

            {/* Badge */}
            {successModal.badge && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  {successModal.badge}
                </span>
              </div>
            )}

            {/* Title & Subtitle */}
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{successModal.title}</h3>
            {successModal.subtitle && (
              <p className="text-xs text-slate-500 font-medium mb-5 leading-relaxed">
                {successModal.subtitle}
              </p>
            )}

            {/* Details Box */}
            {successModal.details && successModal.details.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 mb-6 text-xs">
                {successModal.details.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-bold">{d.label}</span>
                    <span className="text-slate-900 font-black text-right max-w-[220px] truncate">{d.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => {
                if (successModal.onPrimaryClick) successModal.onPrimaryClick();
                setSuccessModal({ ...successModal, isOpen: false });
              }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> {successModal.primaryBtnText || 'Continue / Done'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

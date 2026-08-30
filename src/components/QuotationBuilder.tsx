import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Save, 
  History, 
  CheckCircle, 
  Send,
  FileText,
  Clock,
  ArrowRight,
  Download,
  Mail,
  Building2,
  Printer,
  User,
  Sparkles,
  UserPlus,
  MapPin,
  Phone,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Lead } from '@/src/types';
import { useLogos } from '@/src/context/LogoContext';
import { useAuth } from '@/src/context/AuthContext';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

type ItemCategory = 'Panel' | 'Inverter' | 'Battery' | 'Structure' | 'Wiring';

interface QuotationItem {
  id: string;
  category: ItemCategory;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface QuotationVersion {
  id: string;
  versionNumber: number;
  date: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';
  items: QuotationItem[];
  labourCost: number;
  transportCost: number;
  discount: number;
  gstRate: number;
  use7030Split?: boolean;
  totalValue: number;
}

const defaultItems: QuotationItem[] = [
  { id: '1', category: 'Panel', name: 'Solar Panel 400W Mono', quantity: 12, unitPrice: 12000 },
  { id: '2', category: 'Inverter', name: 'String Inverter 5kW', quantity: 1, unitPrice: 45000 },
  { id: '3', category: 'Structure', name: 'GI Mounting Structure (per kW)', quantity: 5, unitPrice: 3500 },
  { id: '4', category: 'Wiring', name: 'DC/AC Cables & Conduits (Lot)', quantity: 1, unitPrice: 15000 },
];

export default function QuotationBuilder() {
  const { logos } = useLogos();
  const { user } = useAuth();

  const vendorCompanyName = user?.companyName || user?.vendorAccount?.companyName || logos.companyName || 'META GREEN SOLAR SOLUTIONS';
  const vendorLogo = user?.companyLogo || user?.vendorAccount?.companyLogo || logos.companyLogo;
  const vendorDoorNo = user?.doorNo || user?.vendorAccount?.doorNo;
  const vendorAddressText = user?.companyAddress 
    ? `${vendorDoorNo ? `${vendorDoorNo}, ` : ''}${user.companyAddress}, ${user.city || ''}, ${user.state || ''} ${user.pincode || ''}`
    : (user?.vendorAccount?.companyAddress ? `${vendorDoorNo ? `${vendorDoorNo}, ` : ''}${user.vendorAccount.companyAddress}, ${user.vendorAccount.city || ''}, ${user.vendorAccount.state || ''} ${user.vendorAccount.pincode || ''}` : 'Vijayawada, Telangana / AP');
  const vendorGstin = user?.gstin || user?.vendorAccount?.gstin;

  const [versions, setVersions] = useState<QuotationVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Walk-in Customer Modal state
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);
  const [walkinData, setWalkinData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    state: 'Andhra Pradesh',
    pincode: '',
    systemSize: '5 kWp'
  });

  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'quotationVersions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedVersions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as QuotationVersion));
      
      if (fetchedVersions.length > 0) {
        setVersions(fetchedVersions);
        setActiveVersionId(currentId => {
          if (!currentId || !fetchedVersions.find(v => v.id === currentId)) {
            return fetchedVersions[0].id;
          }
          return currentId;
        });
      } else {
        const initialVersion: any = {
          versionNumber: 1,
          date: new Date().toISOString().split('T')[0],
          status: 'Draft',
          items: [...defaultItems],
          labourCost: 20000,
          transportCost: 5000,
          discount: 10000,
          gstRate: 12,
          totalValue: 260400,
          createdAt: serverTimestamp()
        };
        addDoc(collection(db, 'quotationVersions'), initialVersion);
      }
    });
    return () => unsub();
  }, []);

  const activeVersion = versions.find(v => v.id === activeVersionId) || {
    id: 'draft',
    versionNumber: 1,
    date: new Date().toISOString().split('T')[0],
    status: 'Draft' as const,
    items: defaultItems,
    labourCost: 20000,
    transportCost: 5000,
    discount: 10000,
    gstRate: 12,
    use7030Split: true,
    totalValue: 260400
  };

  const [customerDetails, setCustomerDetails] = useState({
    name: 'K. Srimannarayana',
    mobile: '9492161474',
    addressLine1: 'D.No: 1-13-1',
    city: 'Pedapadu Village',
    district: 'Eluru District',
    state: 'Andhra Pradesh',
    pincode: '534001',
    systemSize: '5 kWp'
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [isEmailing, setIsEmailing] = useState(false);

  const subtotal = activeVersion.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalBeforeTax = subtotal + activeVersion.labourCost + activeVersion.transportCost - activeVersion.discount;
  
  let gstAmount = 0;
  if (activeVersion.use7030Split) {
    const component70 = totalBeforeTax * 0.7;
    const component30 = totalBeforeTax * 0.3;
    gstAmount = (component70 * 0.12) + (component30 * 0.18);
  } else {
    gstAmount = totalBeforeTax * (activeVersion.gstRate / 100);
  }
  
  const grandTotal = totalBeforeTax + gstAmount;

  // Add Walk-in Lead directly to Firestore
  const handleAddWalkinCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newLeadDoc = {
        name: walkinData.name,
        phone: walkinData.phone,
        email: `${walkinData.phone}@walkin.solar`,
        address: walkinData.address,
        city: walkinData.city,
        district: walkinData.district,
        state: walkinData.state,
        pincode: walkinData.pincode,
        expectedLoad: walkinData.systemSize.replace('kWp', '').trim(),
        source: 'Walk-in' as const,
        status: 'New Lead' as const,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'leads'), newLeadDoc);

      setCustomerDetails({
        name: walkinData.name,
        mobile: walkinData.phone,
        addressLine1: walkinData.address,
        city: walkinData.city,
        district: walkinData.district,
        state: walkinData.state,
        pincode: walkinData.pincode,
        systemSize: walkinData.systemSize
      });

      alert(`✅ Walk-in Customer "${walkinData.name}" added to CRM leads & selected!`);
      setIsWalkinModalOpen(false);
      setWalkinData({ name: '', phone: '', address: '', city: '', district: '', state: 'Andhra Pradesh', pincode: '', systemSize: '5 kWp' });
    } catch (err) {
      console.error('Error adding walk-in customer:', err);
      alert('Failed to add walk-in customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateVersionInDb = async (versionId: string, updatedData: Partial<QuotationVersion>) => {
    if (versionId === 'draft') return;
    try {
      await updateDoc(doc(db, 'quotationVersions', versionId), {
        ...updatedData,
        totalValue: grandTotal
      });
    } catch (err) {
      console.error('Error updating version', err);
    }
  };

  const handleAddItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      category: 'Panel',
      name: 'New Solar Component',
      quantity: 1,
      unitPrice: 5000
    };
    const updatedItems = [...activeVersion.items, newItem];
    updateVersionInDb(activeVersion.id, { items: updatedItems });
  };

  // Fixed & Unblocked Item Deletion
  const handleRemoveItem = (id: string) => {
    if (activeVersion.items.length <= 1) {
      if (!window.confirm("This is the only item left. Do you want to remove it?")) return;
    }
    const updatedItems = activeVersion.items.filter(item => item.id !== id);
    updateVersionInDb(activeVersion.id, { items: updatedItems });
  };

  // Delete entire quotation version from Firestore
  const handleDeleteVersion = async (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete this quotation version?`)) return;
    
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'quotationVersions', versionId));
      const remaining = versions.filter(v => v.id !== versionId);
      setVersions(remaining);
      if (remaining.length > 0) {
        setActiveVersionId(remaining[0].id);
      }
      alert('✅ Quotation version deleted successfully.');
    } catch (err) {
      console.error('Error deleting quotation version:', err);
      alert('Failed to delete quotation version.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItem = (id: string, field: keyof QuotationItem, value: any) => {
    const updatedItems = activeVersion.items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    updateVersionInDb(activeVersion.id, { items: updatedItems });
  };

  const handleUpdateCost = (field: keyof QuotationVersion, value: any) => {
    updateVersionInDb(activeVersion.id, { [field]: value });
  };

  const handleCreateNewVersion = async () => {
    setIsSubmitting(true);
    try {
      const newVersion: any = {
        ...activeVersion,
        versionNumber: versions.length + 1,
        date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        createdAt: serverTimestamp()
      };
      delete newVersion.id;
      const docRef = await addDoc(collection(db, 'quotationVersions'), newVersion);
      setActiveVersionId(docRef.id);
      setIsHistoryOpen(false);
      alert(`✅ Created new quotation version v${newVersion.versionNumber}!`);
    } catch (err) {
      console.error('Error creating version:', err);
      alert('Failed to create new version.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendForApproval = async () => {
    if (!activeVersionId) return;
    setIsSubmitting(true);
    try {
      await updateVersionInDb(activeVersionId, { status: 'Pending Approval' });
      alert('✅ Quotation submitted for Manager Approval successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to send quotation for approval.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!activeVersionId) return;
    setIsSubmitting(true);
    try {
      await updateVersionInDb(activeVersionId, { status: 'Approved' });
      alert('✅ Quotation approved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to approve quotation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('quotation-preview-container');
    if (!element) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Quotation_GES25-${activeVersion.versionNumber.toString().padStart(6, '0')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
      alert('Error generating PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmailQuotation = async () => {
    if (!customerEmail) {
      alert('Please enter a customer email.');
      return;
    }
    setIsEmailing(true);
    try {
      await addDoc(collection(db, 'mail'), {
        to: customerEmail,
        message: {
          subject: 'Solar Quotation from Meta Green Solutions',
          html: `<p>Please find your solar quotation attached or viewable in your portal.</p>`,
        }
      });
      alert('Quotation emailed to customer successfully.');
    } catch (error) {
      console.error(error);
      alert('Error sending email. Ensure Firebase is configured.');
    } finally {
      setIsEmailing(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 lg:p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-emerald-600" /> Quotation Builder
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Build quotes with dynamic company logo and direct walk-in customer addition
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            type="button"
            onClick={() => setIsWalkinModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 text-white font-extrabold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 text-xs shadow-md shadow-emerald-200 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> + Direct Add Walk-in Lead
          </button>
          <button 
            type="button"
            onClick={handleCreateNewVersion}
            disabled={isSubmitting}
            className="px-3.5 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 text-emerald-400" />}
            <span>New Version</span>
          </button>
          <button 
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="px-3.5 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2 text-xs cursor-pointer"
          >
            <History className="w-4 h-4" /> Version History (v{activeVersion.versionNumber})
          </button>
        </div>
      </header>

      {/* Version History Drawer with Working Deletion */}
      {isHistoryOpen && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-2 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Saved Quotation Versions</h3>
            <span className="text-[10px] text-slate-500 font-medium">Click version to switch, or click trash to delete</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {versions.map(v => (
              <div
                key={v.id}
                onClick={() => setActiveVersionId(v.id)}
                className={cn(
                  "flex-shrink-0 flex flex-col items-start p-3 rounded-xl border min-w-[170px] text-left transition-all cursor-pointer relative group",
                  activeVersionId === v.id 
                    ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex justify-between w-full mb-1">
                  <span className="font-black text-slate-900 text-xs">v{v.versionNumber}.0</span>
                  <span className={cn(
                    "text-[9px] font-bold px-2 py-0.5 rounded-full",
                    v.status === 'Draft' ? "bg-slate-100 text-slate-600" :
                    v.status === 'Pending Approval' ? "bg-amber-100 text-amber-700" :
                    v.status === 'Approved' ? "bg-emerald-100 text-emerald-700" :
                    "bg-red-100 text-red-700"
                  )}>{v.status}</span>
                </div>
                <span className="text-[10px] text-slate-500">{v.date}</span>
                <div className="flex items-center justify-between w-full mt-1.5">
                  <span className="text-xs font-black text-emerald-700">₹{v.totalValue?.toLocaleString()}</span>
                  {versions.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteVersion(v.id, e)}
                      className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete this version"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SIDE-BY-SIDE CONTAINER: EDITOR (LEFT) & LIVE DOCUMENT PREVIEW (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Quotation Editor & Items Form */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" /> Quotation Line Items & Tax Split
            </span>
            <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              Live Editor
            </span>
          </div>

          {/* Customer Selection & Walk-in trigger */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" /> Customer Information
              </h3>
              <button
                type="button"
                onClick={() => setIsWalkinModalOpen(true)}
                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> + Quick Walk-in Lead
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Select Customer from CRM</label>
                <select 
                  value={customerDetails.name}
                  onChange={(e) => {
                    const selectedLead = leads.find(l => l.name === e.target.value);
                    if (selectedLead) {
                      setCustomerDetails({
                        ...customerDetails,
                        name: selectedLead.name,
                        mobile: selectedLead.phone || '',
                        addressLine1: selectedLead.address || '',
                        city: selectedLead.city || '',
                        district: selectedLead.district || '',
                        state: selectedLead.state || '',
                        pincode: selectedLead.pincode || '',
                      });
                    } else {
                      setCustomerDetails({...customerDetails, name: e.target.value});
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  <option value="">Choose Customer...</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.name}>
                      {lead.name} {lead.source === 'Walk-in' ? '(Walk-in)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">System Size (kWp)</label>
                <input 
                  type="text" 
                  value={customerDetails.systemSize}
                  onChange={(e) => setCustomerDetails({...customerDetails, systemSize: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Mobile Number</label>
                <input 
                  type="text" 
                  value={customerDetails.mobile}
                  onChange={(e) => setCustomerDetails({...customerDetails, mobile: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Address</label>
                <input 
                  type="text" 
                  value={customerDetails.addressLine1}
                  onChange={(e) => setCustomerDetails({...customerDetails, addressLine1: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quotation Line Items Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Equipment & BOQ Items
              </h3>
              <button 
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-2">
              {activeVersion.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <select
                    value={item.category}
                    onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value as ItemCategory)}
                    className="p-1.5 border border-slate-200 rounded-md font-bold bg-white text-slate-700 w-24 outline-none cursor-pointer"
                  >
                    <option value="Panel">Panel</option>
                    <option value="Inverter">Inverter</option>
                    <option value="Battery">Battery</option>
                    <option value="Structure">Structure</option>
                    <option value="Wiring">Wiring</option>
                  </select>

                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                    className="flex-1 p-1.5 border border-slate-200 rounded-md font-medium outline-none bg-white"
                    placeholder="Component description"
                  />

                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                    className="w-16 p-1.5 border border-slate-200 rounded-md font-bold text-center outline-none bg-white"
                    placeholder="Qty"
                  />

                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))}
                    className="w-24 p-1.5 border border-slate-200 rounded-md font-bold text-right outline-none bg-white"
                    placeholder="Price"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Pricing Summary Controls */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Installation Cost & GST Split Rules
            </h3>
            
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Labour & Fitting (₹)</label>
                <input 
                  type="number"
                  value={activeVersion.labourCost}
                  onChange={(e) => handleUpdateCost('labourCost', Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-right font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Transport & Freight (₹)</label>
                <input 
                  type="number"
                  value={activeVersion.transportCost}
                  onChange={(e) => handleUpdateCost('transportCost', Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-right font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Discount (₹)</label>
                <input 
                  type="number"
                  value={activeVersion.discount}
                  onChange={(e) => handleUpdateCost('discount', Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-right font-bold text-emerald-600 bg-white"
                />
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeVersion.use7030Split || false}
                  onChange={(e) => handleUpdateCost('use7030Split' as any, e.target.checked as any)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                Use Official Solar 70:30 GST Split (70% @ 12%, 30% @ 18%)
              </label>
            </div>

            <div className="bg-emerald-600 text-white p-3.5 rounded-xl flex items-center justify-between shadow-md">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-100">Grand Total (Incl. Taxes)</p>
                <p className="text-xl font-black">₹{grandTotal.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {activeVersion.status === 'Draft' && (
                  <button 
                    type="button"
                    onClick={handleSendForApproval}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-white text-emerald-800 text-xs font-extrabold rounded-lg hover:bg-emerald-50 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>{isSubmitting ? 'Submitting...' : 'Send Approval'}</span>
                  </button>
                )}
                {activeVersion.status === 'Pending Approval' && (
                  <button 
                    type="button"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-extrabold rounded-lg hover:bg-emerald-400 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>{isSubmitting ? 'Approving...' : 'Approve Quote'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Quotation Document Preview */}
        <div className="lg:col-span-6 sticky top-4 space-y-3">
          <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Live Rendered Quotation View
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDownloadPDF}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          <div className="bg-slate-200/70 p-3 rounded-2xl border border-slate-300/80 overflow-x-auto shadow-inner">
            {/* Quotation Document Preview Canvas */}
            <div 
              id="quotation-preview-container" 
              className="bg-white text-slate-800 text-xs p-8 rounded-xl shadow-lg border border-slate-200 max-w-[800px] mx-auto space-y-5 font-sans"
            >
              <div className="flex flex-col items-center border-b pb-4">
                {/* Dynamic Company Logo */}
                {vendorLogo ? (
                  <img src={vendorLogo} alt="Company Logo" className="h-12 max-w-[200px] object-contain mb-2" />
                ) : (
                  <h2 className="text-2xl font-black text-emerald-600 tracking-tight mb-1">
                    {vendorCompanyName}
                  </h2>
                )}
                <p className="text-[11px] text-slate-500 font-semibold">📍 {vendorAddressText} {vendorGstin ? `| GSTIN: ${vendorGstin}` : ''}</p>
                <h3 className="text-lg font-bold text-blue-900 mt-2">System Size: {customerDetails.systemSize}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Estimate ID</p>
                  <p className="text-sm font-bold text-blue-900">GES25-{activeVersion.versionNumber.toString().padStart(6, '0')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Quote Date</p>
                  <p className="text-sm font-bold text-blue-900">{activeVersion.date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-emerald-700 font-bold border-b border-emerald-600 pb-0.5 mb-1.5">Prepared For</h3>
                  <p className="font-bold text-slate-900">{customerDetails.name}</p>
                  <p className="text-slate-600">Mobile: {customerDetails.mobile}</p>
                  <p className="text-slate-600">{customerDetails.addressLine1}</p>
                  <p className="text-slate-600">{customerDetails.city}, {customerDetails.state}</p>
                </div>
                <div>
                  <h3 className="text-emerald-700 font-bold border-b border-emerald-600 pb-0.5 mb-1.5">Prepared By</h3>
                  <p className="font-bold text-slate-900">{vendorCompanyName}</p>
                  <p className="text-slate-600">📍 {vendorAddressText}</p>
                  {vendorGstin && <p className="text-slate-600 font-mono font-semibold">GSTIN: {vendorGstin}</p>}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-bold uppercase text-[10px] text-slate-500 mb-1.5">Equipment & Specification Table</h4>
                <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-emerald-600 text-white font-bold text-[10px] uppercase">
                      <th className="p-2">Category</th>
                      <th className="p-2">Item Description</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Rate (₹)</th>
                      <th className="p-2 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {activeVersion.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2 font-bold text-slate-700">{item.category}</td>
                        <td className="p-2 text-slate-800">{item.name}</td>
                        <td className="p-2 text-center font-semibold">{item.quantity}</td>
                        <td className="p-2 text-right">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="p-2 text-right font-bold">₹{(item.quantity * item.unitPrice).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Equipment:</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Labour & Transportation:</span>
                  <span className="font-semibold">₹{(activeVersion.labourCost + activeVersion.transportCost).toLocaleString()}</span>
                </div>
                {activeVersion.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount:</span>
                    <span>- ₹{activeVersion.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST ({activeVersion.use7030Split ? '70:30 Solar Tax Split' : `${activeVersion.gstRate}%`}):</span>
                  <span className="font-semibold">₹{gstAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                  <span>Grand Total (Incl. GST):</span>
                  <span className="text-emerald-600">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-400 text-center">
                This is a computer-generated quotation from {logos.companyName || 'MetaGreen'} Solar ERP platform.
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* QUICK ADD WALK-IN CUSTOMER MODAL */}
      {isWalkinModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[100] overflow-y-auto p-4 sm:p-6 flex items-start justify-center pt-24 sm:pt-28 pb-16"
          onClick={() => setIsWalkinModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[calc(100vh-8.5rem)] flex flex-col min-h-0 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" /> Quick Add Walk-in Customer
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Saves lead directly to CRM with 'Walk-in' tag</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsWalkinModalOpen(false)} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all shadow-xs border border-red-200 hover:border-red-500 cursor-pointer shrink-0"
                title="Close Form (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={handleAddWalkinCustomer} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Full Name *</label>
                <input
                  required
                  type="text"
                  value={walkinData.name}
                  onChange={(e) => setWalkinData({ ...walkinData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Contact *</label>
                  <input
                    required
                    type="text"
                    value={walkinData.phone}
                    onChange={(e) => setWalkinData({ ...walkinData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">System Size (kWp)</label>
                  <input
                    type="text"
                    value={walkinData.systemSize}
                    onChange={(e) => setWalkinData({ ...walkinData, systemSize: e.target.value })}
                    placeholder="e.g. 5 kWp"
                    className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Street Address *</label>
                <input
                  required
                  type="text"
                  value={walkinData.address}
                  onChange={(e) => setWalkinData({ ...walkinData, address: e.target.value })}
                  placeholder="Door No, Street Name"
                  className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={walkinData.city}
                    onChange={(e) => setWalkinData({ ...walkinData, city: e.target.value })}
                    placeholder="City"
                    className="w-full text-xs p-1.5 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">District</label>
                  <input
                    type="text"
                    value={walkinData.district}
                    onChange={(e) => setWalkinData({ ...walkinData, district: e.target.value })}
                    placeholder="District"
                    className="w-full text-xs p-1.5 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pincode</label>
                  <input
                    type="text"
                    value={walkinData.pincode}
                    onChange={(e) => setWalkinData({ ...walkinData, pincode: e.target.value })}
                    placeholder="534001"
                    className="w-full text-xs p-1.5 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsWalkinModalOpen(false)}
                  className="flex-1 px-3 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-emerald-200 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{isSubmitting ? 'Saving Lead...' : 'Save Walk-in Lead & Select'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

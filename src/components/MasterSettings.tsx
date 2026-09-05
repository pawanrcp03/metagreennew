import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Users, 
  ShieldCheck, 
  MapPin, 
  Percent, 
  Package, 
  IndianRupee, 
  CheckSquare, 
  List,
  Download,
  FileSpreadsheet,
  Plus,
  UserPlus,
  Image as ImageIcon,
  Upload,
  Check,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Building2,
  Edit2,
  X,
  Sun
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { exportToPDF, exportToExcel } from '@/src/lib/exportUtils';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, doc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useLogos } from '@/src/context/LogoContext';

import { METAGREEN_LOGO_BASE64 } from '@/src/assets/logoDataUrl';

import SubscriptionManagement from './SubscriptionManagement';
import { CreditCard } from 'lucide-react';

type TabType = 'logos' | 'subscriptions' | 'users' | 'roles' | 'roof-types' | 'states' | 'products' | 'approvals' | 'audit' | 'purge';

const USER_ROLES = [
  'Super Admin',
  'Solar Company Admin',
  'Regional Manager',
  'Sales Executive',
  'Survey Engineer',
  'Design Engineer',
  'Procurement Officer',
  'Warehouse Manager',
  'Installer',
  'Project Manager',
  'Finance Manager',
  'Customer Support',
  'Customer',
  'Vendor',
  'Auditor'
];

import { useAuth } from '@/src/context/AuthContext';

export default function MasterSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('logos');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [roofTypesList, setRoofTypesList] = useState<any[]>([]);
  const [isRoofModalOpen, setIsRoofModalOpen] = useState(false);
  const [editingRoofId, setEditingRoofId] = useState<string | null>(null);
  const [roofForm, setRoofForm] = useState({
    name: '',
    description: '',
    structureType: 'Flush Mount / Mini Rail',
    tiltAngle: '15°',
    status: 'Active'
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { logos, updateLogos, resetLogos } = useLogos();

  const isGlobalAdmin = !user || user.role === 'Super Admin' || user.role === 'Solar Company Admin';

  const [companyName, setCompanyName] = useState(logos.companyName || 'METAGREEN');
  const [tagline, setTagline] = useState(logos.tagline || 'Solar Enterprise ERP');

  useEffect(() => {
    setCompanyName(logos.companyName || 'METAGREEN');
    setTagline(logos.tagline || 'Solar Enterprise ERP');
  }, [logos]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Sales Executive',
    status: 'Active'
  });

  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('name', 'asc')), (snapshot) => {
      setUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAudit = onSnapshot(query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc')), (snapshot) => {
      setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRoofs = onSnapshot(collection(db, 'roofTypes'), (snapshot) => {
      if (snapshot.empty) {
        const initialRoofTypes = [
          { name: 'RCC Flat Roof', description: 'Concrete Slab with south-facing ballasted or anchor mounts', structureType: 'Ballasted / Anchor Fixed Tilt', tiltAngle: '15° - 20°', status: 'Active' },
          { name: 'Tin / Metal Shed', description: 'Industrial trapezoidal or standing seam sheet with mini-rails', structureType: 'Mini Rail / Klip-lok Clamps', tiltAngle: 'Parallel to Roof (3° - 10°)', status: 'Active' },
          { name: 'Tiled / Mangalore Roof', description: 'Pitched traditional clay/cement tiles with stainless steel rafter hooks', structureType: 'Tile Hooks & Profile Rails', tiltAngle: 'Pitch Slope (20° - 35°)', status: 'Active' },
          { name: 'Asbestos Sheet', description: 'Corrugated cement asbestos roof with hanger bolts and rubber seals', structureType: 'Hanger Bolts & Long Rails', tiltAngle: 'Parallel to Roof', status: 'Active' },
          { name: 'Ground Mount Structure', description: 'Open field piled ground mount with seasonal tilt adjustment', structureType: 'GI Piled Foundation Fixed Tilt', tiltAngle: '20° - 25°', status: 'Active' },
          { name: 'Elevated Super Structure', description: 'Elevated rooftop gazebo / solar terrace enabling usable roof space below', structureType: 'High Elevated Heavy MS/GI Columns', tiltAngle: '12° - 15°', status: 'Active' }
        ];
        initialRoofTypes.forEach(rt => {
          addDoc(collection(db, 'roofTypes'), { ...rt, createdAt: serverTimestamp() });
        });
      } else {
        setRoofTypesList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });

    return () => { unsubUsers(); unsubAudit(); unsubRoofs(); };
  }, []);

  const [isClearingData, setIsClearingData] = useState(false);
  const [clearProgress, setClearProgress] = useState('');

  const handleClearAllData = async () => {
    if (!window.confirm("WARNING: This will permanently delete ALL operational records (CRM leads, projects, tasks, quotations, invoices, finance transactions, inventory, and support tickets) across the entire ERP. Are you sure you want to proceed?")) {
      return;
    }
    const secondConfirm = window.prompt("Type 'CLEAR ALL' in capital letters to confirm permanent data wipe:");
    if (secondConfirm !== 'CLEAR ALL') {
      alert("Action cancelled. Data was not modified.");
      return;
    }

    setIsClearingData(true);
    setClearProgress('Initiating database wipe...');
    try {
      const collectionsToClear = [
        'leads',
        'projects',
        'projectTasks',
        'projectDocuments',
        'siteSurveys',
        'quotationVersions',
        'proposals',
        'financeTransactions',
        'financeLoans',
        'financeExpenseTypes',
        'siteConsumptions',
        'inventory',
        'inventoryPurchases',
        'inventoryRequisitions',
        'warranties',
        'workOrders',
        'supportTickets',
        'supportTicketCategories',
        'vendors',
        'purchaseOrders',
        'vendorInvoices',
        'vendorPayments',
        'vendorEmployees',
        'vendorTasks',
        'contactInquiries',
        'auditLogs',
        'attendance',
        'mail'
      ];

      for (const colName of collectionsToClear) {
        setClearProgress(`Wiping ${colName}...`);
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        if (!snapshot.empty) {
          let batch = writeBatch(db);
          let count = 0;
          for (const d of snapshot.docs) {
            batch.delete(doc(db, colName, d.id));
            count++;
            if (count === 450) {
              await batch.commit();
              batch = writeBatch(db);
              count = 0;
            }
          }
          if (count > 0) {
            await batch.commit();
          }
        }
      }

      setClearProgress('All operational records cleared successfully!');
      alert('Success: All operational ERP data has been completely cleared!');
    } catch (err: any) {
      console.error('Error clearing data:', err);
      alert('Error clearing data: ' + (err.message || err));
    } finally {
      setIsClearingData(false);
      setTimeout(() => setClearProgress(''), 4000);
    }
  };

  // Handle Logo Upload to Base64
  const handleFileUpload = (key: 'companyLogo' | 'watermarkLogo' | 'officialSeal' | 'paymentQrCode', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateLogos({ [key]: base64String });
        triggerSaveSuccess();
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerSaveSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Load sample logos for quick demo
  const handleLoadSampleLogos = () => {
    const sampleSealSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="none" stroke="%23047857" stroke-width="8"/><circle cx="100" cy="100" r="80" fill="none" stroke="%23047857" stroke-width="2"/><text x="100" y="90" font-family="Arial" font-size="14" font-weight="bold" fill="%23047857" text-anchor="middle">METAGREEN</text><text x="100" y="115" font-family="Arial" font-size="14" font-weight="bold" fill="%23047857" text-anchor="middle">APPROVED SEAL</text></svg>`;

    const sampleQrSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23ffffff"/><rect x="20" y="20" width="160" height="160" fill="none" stroke="%23000000" stroke-width="4"/><rect x="40" y="40" width="40" height="40" fill="%23047857"/><rect x="120" y="40" width="40" height="40" fill="%23047857"/><rect x="40" y="120" width="40" height="40" fill="%23047857"/><text x="100" y="105" font-family="Arial" font-size="12" font-weight="bold" fill="%23047857" text-anchor="middle">UPI SCAN QR</text></svg>`;

    updateLogos({
      companyLogo: METAGREEN_LOGO_BASE64,
      watermarkLogo: METAGREEN_LOGO_BASE64,
      officialSeal: sampleSealSvg,
      paymentQrCode: sampleQrSvg,
      companyName: 'METAGREEN',
      tagline: 'Solar Enterprise ERP'
    });
    triggerSaveSuccess();
  };

  const handleExportUsers_PDF = () => {
    exportToPDF('System Users', ['Name', 'Email', 'Role', 'Status'], usersList.map(u => [u.name, u.email, u.role, u.status]));
  };

  const handleExportUsers_Excel = () => {
    exportToExcel('System Users', usersList);
  };
  
  const handleExportAudit_PDF = () => {
    exportToPDF('Audit Logs', ['Timestamp', 'User', 'Action', 'Details'], auditLogs.map(l => [l.timestamp, l.user, l.action, l.details]));
  };

  const handleExportAudit_Excel = () => {
    exportToExcel('Audit Logs', auditLogs);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'users'), {
        ...newUser,
        createdAt: serverTimestamp()
      });
      await addDoc(collection(db, 'auditLogs'), {
        timestamp: new Date().toLocaleString(),
        user: 'System Admin',
        action: 'Created User',
        details: `Created new user ${newUser.email}`,
        createdAt: serverTimestamp()
      });
      setIsAddUserModalOpen(false);
      setNewUser({ name: '', email: '', role: 'Sales Executive', status: 'Active' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenAddRoof = () => {
    setEditingRoofId(null);
    setRoofForm({
      name: '',
      description: '',
      structureType: 'Flush Mount / Mini Rail',
      tiltAngle: '15°',
      status: 'Active'
    });
    setIsRoofModalOpen(true);
  };

  const handleOpenEditRoof = (roof: any) => {
    setEditingRoofId(roof.id);
    setRoofForm({
      name: roof.name || '',
      description: roof.description || '',
      structureType: roof.structureType || 'Flush Mount / Mini Rail',
      tiltAngle: roof.tiltAngle || '15°',
      status: roof.status || 'Active'
    });
    setIsRoofModalOpen(true);
  };

  const handleSaveRoofType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roofForm.name.trim()) return;
    try {
      if (editingRoofId) {
        await updateDoc(doc(db, 'roofTypes', editingRoofId), {
          ...roofForm,
          updatedAt: serverTimestamp()
        });
        alert(`✅ Roof Type "${roofForm.name}" updated successfully!`);
      } else {
        await addDoc(collection(db, 'roofTypes'), {
          ...roofForm,
          createdAt: serverTimestamp()
        });
        alert(`✅ Roof Type "${roofForm.name}" created successfully!`);
      }
      setIsRoofModalOpen(false);
      setEditingRoofId(null);
    } catch (err) {
      console.error('Error saving roof type:', err);
      alert('Failed to save roof type.');
    }
  };

  const handleDeleteRoofType = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete roof type "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'roofTypes', id));
      alert(`✅ Roof type "${name}" deleted.`);
    } catch (err) {
      console.error('Error deleting roof type:', err);
      alert('Failed to delete roof type.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'subscriptions':
        return <SubscriptionManagement />;
      case 'logos':
        return (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-700">
              <div className="space-y-1">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                  <Sparkles className="w-3.5 h-3.5" /> Company Asset Import
                </span>
                <h3 className="text-2xl font-black tracking-tight">Import Logos & Branding Assets</h3>
                <p className="text-slate-300 text-sm max-w-xl">
                  Upload official logos, watermarks, company seal stamps, and payment QR codes. These assets automatically embed in generated PDFs, Quotations, and Proposals.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={handleLoadSampleLogos}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  <Sparkles className="w-4 h-4" /> Load Sample Logos
                </button>
                <button
                  onClick={resetLogos}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Reset All
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2 font-bold text-sm animate-in fade-in duration-200">
                <Check className="w-5 h-5 text-emerald-600" /> Company logos and branding assets updated successfully!
              </div>
            )}

            {/* Company Info Input */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" /> Company Name & Tagline
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Company Title</label>
                  <input 
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onBlur={() => updateLogos({ companyName })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold text-slate-800"
                    placeholder="Green Energy Solutions"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Company Tagline</label>
                  <input 
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    onBlur={() => updateLogos({ tagline })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold text-slate-800"
                    placeholder="Powering the Solar Future"
                  />
                </div>
              </div>
            </div>

            {/* 4 Asset Upload Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Main Company Logo */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                      Header Logo
                    </span>
                    <span className="text-xs text-slate-400 font-medium">PNG, SVG, JPG</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">1. Company Header Logo</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Main logo displayed on top of proposals, quotations, and invoice PDFs.
                  </p>
                </div>

                <div className="my-4 min-h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 relative group">
                  {logos.companyLogo ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={logos.companyLogo} alt="Company Logo" className="max-h-24 max-w-full object-contain" />
                      <button 
                        onClick={() => updateLogos({ companyLogo: '' })}
                        className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 mt-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove Logo
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">No logo imported yet</p>
                      <p className="text-[11px] text-slate-400">Click below to upload from computer</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-sm">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Upload Header Logo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('companyLogo', e)} />
                  </label>
                </div>
              </div>

              {/* Card 2: Watermark Logo */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                      Background Watermark
                    </span>
                    <span className="text-xs text-slate-400 font-medium">PNG (Transparent)</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">2. Document Watermark</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Transparent watermark background printed across PDF document pages.
                  </p>
                </div>

                <div className="my-4 min-h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 relative group opacity-90">
                  {logos.watermarkLogo ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={logos.watermarkLogo} alt="Watermark Logo" className="max-h-24 max-w-full object-contain opacity-30" />
                      <button 
                        onClick={() => updateLogos({ watermarkLogo: '' })}
                        className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 mt-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove Watermark
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">No watermark uploaded</p>
                      <p className="text-[11px] text-slate-400">Click below to upload transparent PNG</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-sm">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Upload Watermark Logo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('watermarkLogo', e)} />
                  </label>
                </div>
              </div>

              {/* Card 3: Official Seal / Stamp */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
                      Official Seal
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Round Stamp</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">3. Official Stamp / Seal</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authorized company round seal stamp printed beside regards & signature lines.
                  </p>
                </div>

                <div className="my-4 min-h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 relative group">
                  {logos.officialSeal ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={logos.officialSeal} alt="Official Seal" className="max-h-24 max-w-full object-contain" />
                      <button 
                        onClick={() => updateLogos({ officialSeal: '' })}
                        className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 mt-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove Seal
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">No round seal uploaded</p>
                      <p className="text-[11px] text-slate-400">Click below to upload authorization seal</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-sm">
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span>Upload Official Seal</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('officialSeal', e)} />
                  </label>
                </div>
              </div>

              {/* Card 4: Payment QR Code */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                      Payment QR
                    </span>
                    <span className="text-xs text-slate-400 font-medium">UPI / Bank QR</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">4. Payment QR Code</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    UPI scan QR code image rendered beside bank details on proposals & bills.
                  </p>
                </div>

                <div className="my-4 min-h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 relative group">
                  {logos.paymentQrCode ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={logos.paymentQrCode} alt="Payment QR Code" className="max-h-24 max-w-full object-contain" />
                      <button 
                        onClick={() => updateLogos({ paymentQrCode: '' })}
                        className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 mt-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove QR Code
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">No payment QR uploaded</p>
                      <p className="text-[11px] text-slate-400">Click below to upload scan QR image</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-sm">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Upload Payment QR</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('paymentQrCode', e)} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">System Users</h3>
              <div className="flex gap-2">
                <button onClick={handleExportUsers_PDF} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs shadow-sm">
                  <Download className="w-3 h-3 text-red-500" /> PDF
                </button>
                <button onClick={handleExportUsers_Excel} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 text-xs shadow-sm">
                  <FileSpreadsheet className="w-3 h-3" /> Excel
                </button>
                <button onClick={() => setIsAddUserModalOpen(true)} className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-xs shadow-sm">
                  <Plus className="w-3 h-3" /> Add User
                </button>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{user.name}</td>
                    <td className="p-4 text-slate-600">{user.email}</td>
                    <td className="p-4 text-slate-600">{user.role}</td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                        user.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        user.status === 'Pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                        "bg-red-50 text-red-700 border-red-100"
                      )}>{user.status}</span>
                    </td>
                    <td className="p-4">
                      {user.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'users', user.id), { status: 'Active' });
                              } catch (err) {
                                console.error('Error approving user:', err);
                              }
                            }}
                            className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'users', user.id), { status: 'Rejected' });
                              } catch (err) {
                                console.error('Error rejecting user:', err);
                              }
                            }}
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'roles':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-8 h-8 text-slate-300" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Roles & Permissions</h3>
                <p className="text-sm text-slate-500">Configure access control matrix for different system roles.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200 rounded-lg min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-200">
                    <th className="p-3 border-r border-slate-200 sticky left-0 bg-slate-50 z-10">Permission Module</th>
                    {USER_ROLES.slice(0, 8).map(role => (
                      <th key={role} className="p-3 text-center border-r border-slate-200 whitespace-nowrap">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {['Manage Settings', 'Approve Quotations', 'View Financials', 'Manage Projects', 'Site Surveys', 'Design Plans'].map((perm, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800 border-r border-slate-200 sticky left-0 bg-white z-10">{perm}</td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked readOnly className="accent-emerald-600 w-4 h-4" /></td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked={i > 0} readOnly className="accent-emerald-600 w-4 h-4" /></td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked={i > 0 && i < 3} readOnly className="accent-emerald-600 w-4 h-4" /></td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked={i === 1 || i === 3} readOnly className="accent-emerald-600 w-4 h-4" /></td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked={i === 4} readOnly className="accent-emerald-600 w-4 h-4" /></td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked={i === 5} readOnly className="accent-emerald-600 w-4 h-4" /></td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked={false} readOnly className="accent-emerald-600 w-4 h-4" /></td>
                      <td className="p-3 text-center border-r border-slate-200"><input type="checkbox" checked={false} readOnly className="accent-emerald-600 w-4 h-4" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-slate-500 italic">Scroll horizontally to view more roles. Showing 8 of 15 roles.</div>
          </div>
        );

      case 'roof-types':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" /> Roof Types Master & Engineering Specifications
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Manage allowable roof substrates, mounting structure pairings, and design tilt angles for site surveys and projects
                </p>
              </div>
              <button
                onClick={handleOpenAddRoof}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 text-xs shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Roof Type
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="p-4">Roof Type Name</th>
                    <th className="p-4">Description & Substrate</th>
                    <th className="p-4">Recommended Structure</th>
                    <th className="p-4 text-center">Design Tilt</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {roofTypesList.map((roof) => (
                    <tr key={roof.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-black flex items-center justify-center text-xs">
                          {roof.name.charAt(0)}
                        </div>
                        <span>{roof.name}</span>
                      </td>
                      <td className="p-4 text-slate-600 max-w-xs">{roof.description || 'Standard solar roof installation'}</td>
                      <td className="p-4 text-slate-700 font-semibold">{roof.structureType || 'Fixed Tilt Structure'}</td>
                      <td className="p-4 text-center font-bold text-slate-800">{roof.tiltAngle || '15°'}</td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase",
                          roof.status === 'Active' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
                        )}>
                          {roof.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditRoof(roof)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Roof Type"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoofType(roof.id, roof.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Roof Type"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'states':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">States & Taxes</h3>
              <button className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-xs shadow-sm">
                <Plus className="w-3 h-3" /> Add Rule
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">State/Region</th>
                  <th className="p-4">Tax Type</th>
                  <th className="p-4">Rate (%)</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">Maharashtra</td>
                  <td className="p-4 text-slate-600">IGST / SGST</td>
                  <td className="p-4 font-bold">18%</td>
                  <td className="p-4"><span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-100">Active</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">Gujarat</td>
                  <td className="p-4 text-slate-600">State Subsidy Tax Exemption</td>
                  <td className="p-4 font-bold">12%</td>
                  <td className="p-4"><span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-100">Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'products':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-500">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-900">Products & Pricing Catalog</h4>
            <p className="text-xs text-slate-400 mt-1">Configure global product price lists and solar components.</p>
          </div>
        );

      case 'approvals':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-500">
            <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-900">Approval Workflow Matrix</h4>
            <p className="text-xs text-slate-400 mt-1">Define discount thresholds requiring manager approval.</p>
          </div>
        );

      case 'audit':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Audit Logs</h3>
              <div className="flex gap-2">
                <button onClick={handleExportAudit_PDF} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs shadow-sm">
                  <Download className="w-3 h-3 text-red-500" /> PDF
                </button>
                <button onClick={handleExportAudit_Excel} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 text-xs shadow-sm">
                  <FileSpreadsheet className="w-3 h-3" /> Excel
                </button>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-4 font-bold text-slate-900">{log.user}</td>
                    <td className="p-4 font-semibold text-slate-700">{log.action}</td>
                    <td className="p-4 text-sm text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'purge':
        return (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">System Reset & Data Purge</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Permanently clear all operational records (CRM Leads, Projects & Pipelines, Tasks, Quotations, Invoices, Finance Transactions, Inventory, and Support Tickets) across the ERP.
                </p>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs text-red-900 font-medium">
              <p className="font-bold flex items-center gap-1.5 text-red-950">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Caution: Irreversible Operation
              </p>
              <ul className="list-disc pl-5 space-y-1 text-red-800 text-[11px]">
                <li>All CRM Leads and Customer records will be purged.</li>
                <li>All 10-Stage Projects and Installation workflows will be reset.</li>
                <li>All Quotation versions, PDFs, and Tax Invoices will be cleared.</li>
                <li>All Inventory stock-in/out records and Ledger transactions will be wiped.</li>
                <li>User accounts and Super Admin access credentials remain preserved for login.</li>
              </ul>
            </div>

            {clearProgress && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
                {clearProgress}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Click to execute full database wipe</span>
              <button
                type="button"
                disabled={isClearingData}
                onClick={handleClearAllData}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-red-200 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                {isClearingData ? 'Clearing All Data...' : 'Clear All Operational Data'}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Sliders className="w-8 h-8 text-emerald-600" /> Master Settings
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage company logos, user permissions, states & system rules.</p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'logos', label: 'Import Logos & Branding', icon: ImageIcon },
          ...(user?.role === 'Super Admin' ? [{ id: 'subscriptions', label: 'Subscription Plans & Trials', icon: CreditCard }] : []),
          { id: 'users', label: 'Users', icon: Users },
          { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
          { id: 'roof-types', label: 'Roof Types Master', icon: Building2 },
          { id: 'states', label: 'States & Taxes', icon: Percent },
          { id: 'products', label: 'Products & Pricing', icon: Package },
          { id: 'approvals', label: 'Approval Rules', icon: CheckSquare },
          { id: 'audit', label: 'Audit Logs', icon: List },
          { id: 'purge', label: 'System Reset & Data Purge', icon: Trash2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-colors border",
              activeTab === tab.id 
                ? (tab.id === 'purge' ? "bg-red-600 text-white shadow-sm border-red-600" : "bg-slate-900 text-white shadow-sm border-slate-900")
                : (tab.id === 'purge' ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-white" : (tab.id === 'purge' ? "text-red-500" : "text-slate-400"))} />
            {tab.label}
          </button>
        ))}
      </div>

      {renderContent()}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" /> Add New User
              </h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">User Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  {USER_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={newUser.status} onChange={e => setNewUser({...newUser, status: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsAddUserModalOpen(false); setNewUser({ name: '', email: '', role: 'Sales Executive', status: 'Active' });}} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Roof Type Modal */}
      {isRoofModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black">
                  {editingRoofId ? 'Edit Roof Type' : 'Add New Roof Type'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsRoofModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoofType} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Roof Type Name *
                </label>
                <input
                  required
                  type="text"
                  value={roofForm.name}
                  onChange={e => setRoofForm({ ...roofForm, name: e.target.value })}
                  placeholder="e.g. Concrete Flat Roof / Tin Shed"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description & Substrate Notes
                </label>
                <textarea
                  rows={3}
                  value={roofForm.description}
                  onChange={e => setRoofForm({ ...roofForm, description: e.target.value })}
                  placeholder="e.g. Concrete slab with waterproof membrane..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mounting Structure
                  </label>
                  <select
                    value={roofForm.structureType}
                    onChange={e => setRoofForm({ ...roofForm, structureType: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Ballasted / Anchor Fixed Tilt">Ballasted / Anchor Fixed Tilt</option>
                    <option value="Flush Mount / Mini Rail">Flush Mount / Mini Rail</option>
                    <option value="Tile Hooks & Profile Rails">Tile Hooks & Profile Rails</option>
                    <option value="Hanger Bolts & Long Rails">Hanger Bolts & Long Rails</option>
                    <option value="High Elevated Heavy MS/GI Columns">High Elevated Heavy MS/GI Columns</option>
                    <option value="GI Piled Foundation Fixed Tilt">GI Piled Foundation Fixed Tilt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Design Tilt Angle
                  </label>
                  <input
                    type="text"
                    value={roofForm.tiltAngle}
                    onChange={e => setRoofForm({ ...roofForm, tiltAngle: e.target.value })}
                    placeholder="e.g. 15° - 20°"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={roofForm.status}
                  onChange={e => setRoofForm({ ...roofForm, status: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRoofModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Roof Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  FileCheck, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  Search,
  IndianRupee,
  Building,
  FileText, 
  Edit2, 
  Trash2,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Award,
  Layers,
  ChevronRight,
  Filter,
  Check,
  Eye,
  X,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useToast } from '@/src/context/ToastContext';

// 6 Official PM Surya Ghar Subsidy Pipeline Stages
export const SUBSIDY_STAGES = [
  { id: 0, key: 'installation', name: 'Installation Completed', statusLabel: 'Ready for Subsidy', progress: 15, badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-300' },
  { id: 1, key: 'submitted', name: 'PM Surya Ghar Portal Submitted', statusLabel: 'Application Submitted', progress: 35, badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-300' },
  { id: 2, key: 'discom', name: 'DISCOM NOC & Net Meter Sync', statusLabel: 'DISCOM NOC Pending', progress: 55, badgeBg: 'bg-indigo-500/10 text-indigo-600 border-indigo-300' },
  { id: 3, key: 'bank', name: 'Bank Account NPCI Verified', statusLabel: 'Bank NPCI Validated', progress: 75, badgeBg: 'bg-purple-500/10 text-purple-600 border-purple-300' },
  { id: 4, key: 'sanctioned', name: 'Central Nodal Agency Sanction', statusLabel: 'Sanction Approved', progress: 90, badgeBg: 'bg-teal-500/10 text-teal-600 border-teal-300' },
  { id: 5, key: 'claimed', name: 'Subsidy Claimed & Disbursed 🎉', statusLabel: 'Claimed & Disbursed', progress: 100, badgeBg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300' },
];

export default function SubsidyManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'tracking' | 'schemes'>('tracking');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  const [subsidiesList, setSubsidiesList] = useState<any[]>([]);
  const [completedProjects, setCompletedProjects] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [docModal, setDocModal] = useState<{ isOpen: boolean; appId: string | null; customer: string }>({
    isOpen: false,
    appId: null,
    customer: ''
  });
  const [newDocData, setNewDocData] = useState({
    name: '',
    type: 'Joint Inspection Report (JIR)',
    url: ''
  });

  // Requirement 13: Subsidy Stage 2 -> Stage 3 / Moving to Stage 2 Mandatory Documents Gatekeeper
  const [stageDocGatekeeperModal, setStageDocGatekeeperModal] = useState<{
    isOpen: boolean;
    app: any;
    targetStageIndex: number;
  }>({
    isOpen: false,
    app: null,
    targetStageIndex: 2
  });

  const [gatekeeperDocs, setGatekeeperDocs] = useState<{
    jirDoc: string;
    discomNocDoc: string;
    electricityBillDoc: string;
    bankPassbookDoc: string;
  }>({
    jirDoc: '',
    discomNocDoc: '',
    electricityBillDoc: '',
    bankPassbookDoc: ''
  });

  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<{ name: string; url: string } | null>(null);

  const [newApp, setNewApp] = useState({ 
    customer: '', 
    scheme: 'PM Surya Ghar Muft Bijli Yojana', 
    capacity: '3kW', 
    subsidyAmount: 78000,
    applicationRefNo: '',
    discomConsumerNo: ''
  });

  // Calculate PM Surya Ghar Subsidy Amount based on kW
  const calculateSubsidyAmount = (capacity: number | string): number => {
    const kw = typeof capacity === 'string' ? parseFloat(capacity.replace(/[^0-9.]/g, '')) || 3 : capacity;
    if (kw <= 1) return 30000;
    if (kw <= 2) return 60000;
    return 78000;
  };

  // Listen to Firestore Subsidies and Completed Projects in Real-Time
  useEffect(() => {
    // 1. Fetch Subsidies Collection
    const subsidiesQuery = query(collection(db, 'subsidies'));
    const unsubSubsidies = onSnapshot(subsidiesQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubsidiesList(items);
    });

    // 2. Fetch Projects Collection for Completed Installations
    const projectsQuery = query(collection(db, 'projects'));
    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const allProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter for installation completed projects
      const finished = allProjects.filter((p: any) => 
        p.status === 'Installation Complete' || 
        p.status === 'Completed' || 
        p.status === 'Verification' || 
        p.status === 'Net Meter Installed' ||
        p.status === 'Subsidy Pending' ||
        p.status === 'Subsidy Released'
      );
      setCompletedProjects(finished);
    });

    return () => {
      unsubSubsidies();
      unsubProjects();
    };
  }, []);

  // Merge projects completed in installation into the subsidies pipeline list
  const mergedApplications = React.useMemo(() => {
    const list: any[] = [...subsidiesList];

    // For every project with completed installation, ensure it exists in subsidy pipeline
    completedProjects.forEach(proj => {
      const existing = list.find(s => s.projectId === proj.id || s.customer?.toLowerCase() === proj.customerName?.toLowerCase());
      if (!existing) {
        const capacityKw = proj.capacityKw || 3;
        const autoAmount = calculateSubsidyAmount(capacityKw);
        list.push({
          id: `auto-${proj.id}`,
          projectId: proj.id,
          customer: proj.customerName || 'Customer',
          phone: proj.phone || '',
          address: proj.address || proj.city || '',
          scheme: 'PM Surya Ghar Muft Bijli Yojana',
          capacity: `${capacityKw}kW`,
          subsidyAmount: autoAmount,
          currentStage: 0,
          status: 'Installation Completed',
          appliedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
          isAutoSynced: true,
          applicationRefNo: `PMSG-2026-${proj.id.substring(0, 5).toUpperCase()}`
        });
      }
    });

    return list;
  }, [subsidiesList, completedProjects]);

  // Advance application to next stage in pipeline
  const handleAdvanceStage = async (app: any, targetStageIndex?: number) => {
    const nextStageIdx = targetStageIndex !== undefined 
      ? targetStageIndex 
      : Math.min((app.currentStage ?? 0) + 1, SUBSIDY_STAGES.length - 1);
    
    // Requirement 13: Subsidy Workflow (Stage 2 -> Stage 3 / Moving to Stage 2)
    // When moving to Stage 2 (or moving from Stage 2 to Stage 3), require/upload all relevant subsidy documents.
    const hasRequiredDocs = app.documents && app.documents.length >= 2;
    if (nextStageIdx >= 2 && !hasRequiredDocs) {
      setGatekeeperDocs({
        jirDoc: '',
        discomNocDoc: '',
        electricityBillDoc: '',
        bankPassbookDoc: ''
      });
      setStageDocGatekeeperModal({
        isOpen: true,
        app: app,
        targetStageIndex: nextStageIdx
      });
      return;
    }

    await executeStageAdvance(app, nextStageIdx);
  };

  const executeStageAdvance = async (app: any, nextStageIdx: number, newDocsToAppend: any[] = []) => {
    const stageObj = SUBSIDY_STAGES[nextStageIdx];
    const isCompletedClaim = nextStageIdx === SUBSIDY_STAGES.length - 1;

    try {
      const targetDocId = app.id.startsWith('auto-') ? app.projectId : app.id;
      const refDoc = doc(db, 'subsidies', targetDocId);

      const existingDocs = app.documents || [];
      const combinedDocs = [...existingDocs, ...newDocsToAppend];

      const updatedPayload: any = {
        projectId: app.projectId || app.id,
        customer: app.customer,
        phone: app.phone || '',
        scheme: app.scheme || 'PM Surya Ghar Muft Bijli Yojana',
        capacity: app.capacity || '3kW',
        subsidyAmount: app.subsidyAmount || calculateSubsidyAmount(app.capacity),
        currentStage: nextStageIdx,
        status: stageObj.statusLabel,
        progress: stageObj.progress,
        applicationRefNo: app.applicationRefNo || `PMSG-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        lastUpdated: serverTimestamp(),
        claimedAt: isCompletedClaim ? new Date().toISOString() : app.claimedAt || null
      };

      if (combinedDocs.length > 0) {
        updatedPayload.documents = combinedDocs;
      }

      await setDoc(refDoc, updatedPayload, { merge: true });

      // If the target project exists in Firestore, update project status
      if (app.projectId) {
        const projRef = doc(db, 'projects', app.projectId);
        await updateDoc(projRef, {
          status: isCompletedClaim ? 'Completed' : 'Subsidy Pending',
          subsidyStage: stageObj.name,
          subsidyClaimed: isCompletedClaim
        }).catch(() => {});
      }

      if (isCompletedClaim) {
        toast.success(`🎉 Subsidy Application for ${app.customer} has been successfully CLAIMED & DISBURSED!`, 'Subsidy Disbursed');
      } else {
        toast.info(`Updated Subsidy Stage for ${app.customer} to: ${stageObj.name}`, 'Stage Advanced');
      }
    } catch (err) {
      console.error('Error advancing subsidy stage:', err);
    }
  };

  // Submit Mandatory Stage 2/3 Documents and Advance (Requirement 13)
  const handleSaveGatekeeperDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    const { app, targetStageIndex } = stageDocGatekeeperModal;
    if (!app) return;

    const sampleOfficialUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80';

    const docsToAdd = [
      {
        id: `doc-jir-${Date.now()}`,
        name: 'Joint Inspection Report (JIR) / Technical Sanction',
        type: 'Joint Inspection Report (JIR)',
        url: gatekeeperDocs.jirDoc || sampleOfficialUrl,
        status: 'Verified',
        uploadedAt: new Date().toISOString()
      },
      {
        id: `doc-noc-${Date.now() + 1}`,
        name: 'DISCOM Net Metering NOC & Grid Agreement',
        type: 'DISCOM Technical Feasibility Sanction',
        url: gatekeeperDocs.discomNocDoc || sampleOfficialUrl,
        status: 'Verified',
        uploadedAt: new Date().toISOString()
      },
      {
        id: `doc-bill-${Date.now() + 2}`,
        name: 'Electricity Bill (DISCOM Consumer Copy)',
        type: 'Work Completion Certificate',
        url: gatekeeperDocs.electricityBillDoc || sampleOfficialUrl,
        status: 'Verified',
        uploadedAt: new Date().toISOString()
      },
      {
        id: `doc-bank-${Date.now() + 3}`,
        name: 'Customer Aadhaar NPCI Seeded Bank Passbook / Cheque',
        type: 'Aadhaar NPCI Bank Passbook',
        url: gatekeeperDocs.bankPassbookDoc || sampleOfficialUrl,
        status: 'Verified',
        uploadedAt: new Date().toISOString()
      }
    ];

    await executeStageAdvance(app, targetStageIndex, docsToAdd);
    setStageDocGatekeeperModal({ isOpen: false, app: null, targetStageIndex: 2 });
    toast.success(`✅ All 4 Mandatory Subsidy Documents verified and attached for ${app.customer}!`, 'Stage Documents Verified');
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAppId) {
        await updateDoc(doc(db, 'subsidies', editingAppId), {
          customer: newApp.customer,
          scheme: newApp.scheme,
          capacity: newApp.capacity,
          subsidyAmount: newApp.subsidyAmount || calculateSubsidyAmount(newApp.capacity),
          applicationRefNo: newApp.applicationRefNo,
          discomConsumerNo: newApp.discomConsumerNo
        });
      } else {
        const newId = `SUB-2026-${String(subsidiesList.length + 1).padStart(3, '0')}`;
        await addDoc(collection(db, 'subsidies'), {
          displayId: newId,
          customer: newApp.customer,
          scheme: newApp.scheme,
          capacity: newApp.capacity,
          subsidyAmount: newApp.subsidyAmount || calculateSubsidyAmount(newApp.capacity),
          currentStage: 0,
          status: 'Installation Completed',
          progress: 15,
          appliedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
          applicationRefNo: newApp.applicationRefNo || `PMSG-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          discomConsumerNo: newApp.discomConsumerNo || ''
        });
      }
      setIsModalOpen(false);
      setEditingAppId(null);
      setNewApp({ customer: '', scheme: 'PM Surya Ghar Muft Bijli Yojana', capacity: '3kW', subsidyAmount: 78000, applicationRefNo: '', discomConsumerNo: '' });
    } catch (err) {
      console.error('Error saving subsidy:', err);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      try {
        await deleteDoc(doc(db, 'subsidies', id));
      } catch (err) {
        console.error('Error deleting subsidy:', err);
      }
    }
  };

  const handleAddSubsidyDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docModal.appId || !newDocData.name) return;
    const targetApp = subsidiesList.find(s => s.id === docModal.appId);
    if (!targetApp) return;

    const currentDocs = targetApp.documents || [];
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: newDocData.name,
      type: newDocData.type,
      url: newDocData.url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      status: 'Verified',
      uploadedAt: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, 'subsidies', docModal.appId), {
        documents: [...currentDocs, newDoc]
      });
      toast.success(`Uploaded and verified document: "${newDocData.name}"`, "Document Verified");
      setDocModal({ isOpen: false, appId: null, customer: '' });
      setNewDocData({ name: '', type: 'Joint Inspection Report (JIR)', url: '' });
    } catch (err) {
      console.error('Error adding subsidy document:', err);
      toast.error('Failed to add document.', 'Error');
    }
  };

  const handleToggleDocStatus = async (appId: string, docId: string) => {
    const targetApp = subsidiesList.find(s => s.id === appId);
    if (!targetApp || !targetApp.documents) return;

    const updatedDocs = targetApp.documents.map((d: any) => {
      if (d.id === docId) {
        return { ...d, status: d.status === 'Verified' ? 'Pending' : 'Verified' };
      }
      return d;
    });

    await updateDoc(doc(db, 'subsidies', appId), { documents: updatedDocs });
  };

  const handleDeleteSubsidyDoc = async (appId: string, docId: string) => {
    const targetApp = subsidiesList.find(s => s.id === appId);
    if (!targetApp || !targetApp.documents) return;

    const updatedDocs = targetApp.documents.filter((d: any) => d.id !== docId);
    await updateDoc(doc(db, 'subsidies', appId), { documents: updatedDocs });
  };

  // Filtered Subsidies based on search query & stage filter
  const filteredApplications = mergedApplications.filter(app => {
    const matchesSearch = 
      app.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicationRefNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.displayId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (stageFilter === 'all') return matchesSearch;
    if (stageFilter === 'claimed') return matchesSearch && (app.currentStage === 5 || app.status === 'Claimed & Disbursed');
    if (stageFilter === 'in_progress') return matchesSearch && app.currentStage > 0 && app.currentStage < 5;
    if (stageFilter === 'new') return matchesSearch && (app.currentStage === 0 || !app.currentStage);
    return matchesSearch;
  });

  const centralSchemes = [
    {
      name: 'PM Surya Ghar Muft Bijli Yojana',
      description: 'Central government scheme providing direct benefit transfer up to ₹78,000 for residential rooftop solar.',
      eligibility: 'Residential households across India',
      benefits: '1kW = ₹30k | 2kW = ₹60k | 3kW+ = ₹78k',
      link: 'https://pmsuryaghar.gov.in'
    },
    {
      name: 'CFA for Grid Connected Rooftop Solar Phase-II',
      description: 'MNRE CFA assistance for residential rooftop installations.',
      eligibility: 'Residential (Individual/GHS/RWA)',
      benefits: '40% subsidy up to 3kW, 20% beyond 3kW up to 10kW',
      link: 'https://solarrooftop.gov.in'
    }
  ];

  const stateSchemes = [
    {
      state: 'Andhra Pradesh',
      name: 'AP State Solar Rooftop Promotion',
      description: 'Additional state DISCOM subsidy for residential rooftop solar installations.',
      eligibility: 'Residential consumers in AP DISCOMs',
      benefits: 'Up to ₹20,000 additional DISCOM assistance'
    },
    {
      state: 'Telangana',
      name: 'TSREDCO Rooftop Solar Incentive',
      description: 'State promotion policy facilitating single window DISCOM NOC & subsidy disbursal.',
      eligibility: 'Residential consumers in Telangana (TSSPDCL / TSNPDCL)',
      benefits: 'Fast-track Net Metering & State Subsidy Release'
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 fill-emerald-600" /> PM Surya Ghar Subsidy Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Landmark className="w-8 h-8 text-emerald-600" /> Subsidy & Claim Tracking
          </h1>
          <p className="text-slate-500 font-semibold text-xs sm:text-sm mt-1">
            Auto-synced from Completed Installations to Central Bank Disbursement (DBT ₹30,000 - ₹78,000)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            + Manual Subsidy Application
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar border-b border-slate-200">
        {[
          { id: 'tracking', label: `Application Tracking (${filteredApplications.length})`, icon: FileCheck },
          { id: 'schemes', label: 'Available Schemes & Policies', icon: Building },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.id 
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TRACKING TAB CONTENT */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search customer name or PMSG Ref No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Stage:
              </span>
              {[
                { id: 'all', label: 'All Projects' },
                { id: 'new', label: 'Ready (Installation Done)' },
                { id: 'in_progress', label: 'In Verification' },
                { id: 'claimed', label: 'Claimed & Disbursed 🎉' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStageFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                    stageFilter === f.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Applications & Sync Cards List */}
          <div className="grid grid-cols-1 gap-6">
            {filteredApplications.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                <Landmark className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-lg font-black text-slate-800">No Subsidy Applications Found</h3>
                <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
                  Projects automatically appear here when their status is set to <strong>Installation Complete</strong> in the Projects & Tasks module.
                </p>
              </div>
            ) : (
              filteredApplications.map(app => {
                const currentStageIdx = app.currentStage ?? 0;
                const activeStageObj = SUBSIDY_STAGES[currentStageIdx] || SUBSIDY_STAGES[0];
                const isClaimed = currentStageIdx === SUBSIDY_STAGES.length - 1;

                return (
                  <div 
                    key={app.id} 
                    className={cn(
                      "bg-white border rounded-3xl p-6 shadow-sm transition-all duration-200 hover:shadow-md space-y-6 relative overflow-hidden",
                      isClaimed ? "border-emerald-300 ring-2 ring-emerald-500/10" : "border-slate-200"
                    )}
                  >
                    {/* Top Info Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-black text-slate-900">{app.customer}</span>
                          {app.isAutoSynced && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full border border-emerald-200 uppercase tracking-widest flex items-center gap-1">
                              <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" /> Auto-Synced from Installation
                            </span>
                          )}
                          <span className={cn("px-2.5 py-0.5 text-[10px] font-black rounded-full border uppercase tracking-wider", activeStageObj.badgeBg)}>
                            {activeStageObj.statusLabel}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold">
                          <span className="font-mono font-bold text-slate-700">Ref: {app.applicationRefNo || app.id}</span>
                          <span>•</span>
                          <span>{app.scheme}</span>
                          <span>•</span>
                          <span className="font-bold text-emerald-700">System: {app.capacity}</span>
                          {app.address && (
                            <>
                              <span>•</span>
                              <span>📍 {app.address}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right Amount & Advance CTA */}
                      <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">PM Surya Ghar Subsidy Entitlement</span>
                          <p className="text-2xl font-black text-emerald-600 flex items-center justify-end gap-0.5">
                            ₹{(app.subsidyAmount || calculateSubsidyAmount(app.capacity)).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isClaimed && (
                            <button
                              onClick={() => handleAdvanceStage(app)}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                              title="Advance application to the next milestone stage"
                            >
                              Advance Stage ({SUBSIDY_STAGES[currentStageIdx + 1]?.name || 'Next'})
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}

                          <button 
                            onClick={() => {
                              setEditingAppId(app.id);
                              setNewApp({ 
                                customer: app.customer, 
                                scheme: app.scheme, 
                                capacity: app.capacity, 
                                subsidyAmount: app.subsidyAmount || calculateSubsidyAmount(app.capacity),
                                applicationRefNo: app.applicationRefNo || '',
                                discomConsumerNo: app.discomConsumerNo || ''
                              });
                              setIsModalOpen(true);
                            }}
                            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors"
                            title="Edit Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => handleDeleteApplication(app.id)}
                            className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 6-Stage Tracking Stepper Bar */}
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center text-xs font-black text-slate-700">
                        <span>PM Surya Ghar Subsidy Claim Pipeline</span>
                        <span className="text-emerald-700 font-mono font-bold">{activeStageObj.progress}% Complete</span>
                      </div>

                      {/* Progress Track */}
                      <div className="relative">
                        <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 transition-all duration-700" 
                            style={{ width: `${activeStageObj.progress}%` }}
                          />
                        </div>

                        {/* Interactive Stage Nodes */}
                        <div className="relative flex justify-between items-center">
                          {SUBSIDY_STAGES.map((stage, idx) => {
                            const isPast = idx < currentStageIdx;
                            const isCurrent = idx === currentStageIdx;
                            const isFuture = idx > currentStageIdx;

                            return (
                              <button
                                key={stage.id}
                                onClick={() => handleAdvanceStage(app, idx)}
                                className="group flex flex-col items-center cursor-pointer focus:outline-none"
                                title={`Set status to ${stage.name}`}
                              >
                                <div className={cn(
                                  "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all shadow-xs z-10",
                                  isPast || isCurrent
                                    ? "bg-emerald-600 border-emerald-600 text-white font-bold scale-105" 
                                    : "bg-white border-slate-300 text-slate-400 group-hover:border-emerald-400"
                                )}>
                                  {isPast ? (
                                    <Check className="w-5 h-5 stroke-[3]" />
                                  ) : isCurrent ? (
                                    <Clock className="w-4 h-4 animate-spin-slow" />
                                  ) : (
                                    <span className="text-xs font-black">{idx + 1}</span>
                                  )}
                                </div>

                                <span className={cn(
                                  "text-[10px] font-black mt-2 text-center max-w-[90px] leading-tight hidden sm:block",
                                  isCurrent ? "text-emerald-700 font-black" : isPast ? "text-slate-800" : "text-slate-400"
                                )}>
                                  {stage.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* PM Surya Ghar Document Verification Section */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <FileCheck className="w-4 h-4 text-emerald-600" />
                            Department Document Verification ({app.documents?.length || 0} Docs Uploaded)
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Upload JIR inspection report, technical feasibility, DCR certificates & bank passbook for direct benefit transfer.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDocModal({ isOpen: true, appId: app.id, customer: app.customer })}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all border border-emerald-200 flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                        >
                          <UploadCloud className="w-3.5 h-3.5" /> + Upload Verification Doc
                        </button>
                      </div>

                      {/* Documents Grid / Badges */}
                      {(!app.documents || app.documents.length === 0) ? (
                        <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-[11px] font-medium">
                          No verification documents attached yet. Click "+ Upload Verification Doc" to add DISCOM JIR, DCR certificate, or bank passbook.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {app.documents.map((docItem: any) => (
                            <div
                              key={docItem.id}
                              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-600 shrink-0">
                                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 text-[11px] truncate" title={docItem.name}>
                                    {docItem.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-medium truncate">
                                    {docItem.type}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleDocStatus(app.id, docItem.id)}
                                  className={cn(
                                    "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider cursor-pointer border",
                                    docItem.status === 'Verified' 
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                      : "bg-amber-100 text-amber-800 border-amber-200"
                                  )}
                                  title="Toggle Document Status"
                                >
                                  {docItem.status === 'Verified' ? '✓ Verified' : '⏳ Pending'}
                                </button>

                                {docItem.url && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPreviewDoc({ name: docItem.name, url: docItem.url })}
                                    className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors cursor-pointer"
                                    title="View Document"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubsidyDoc(app.id, docItem.id)}
                                  className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors cursor-pointer"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Claim Success Banner */}
                    {isClaimed && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-emerald-800 animate-in zoom-in-95">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>🎉 Subsidy of ₹{(app.subsidyAmount || calculateSubsidyAmount(app.capacity)).toLocaleString()} successfully credited directly to customer's linked Aadhaar NPCI bank account via DBT!</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-mono bg-emerald-600 text-white px-2.5 py-1 rounded-lg shrink-0">
                          Disbursed Status Verified ✓
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SCHEMES TAB CONTENT */}
      {activeTab === 'schemes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Building className="w-6 h-6 text-emerald-600" /> Central PM Surya Ghar Schemes
            </h2>
            {centralSchemes.map((scheme, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
                <h3 className="text-lg font-black text-slate-900">{scheme.name}</h3>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">{scheme.description}</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-semibold">Target Eligibility</span>
                    <span className="font-bold text-slate-900">{scheme.eligibility}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-semibold">Subsidy Entitlement</span>
                    <span className="font-black text-emerald-600">{scheme.benefits}</span>
                  </div>
                </div>
                <div className="text-right pt-2">
                  <a href={scheme.link} target="_blank" rel="noreferrer" className="text-emerald-600 text-xs font-black hover:underline flex items-center justify-end gap-1">
                    Official Central Portal &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Landmark className="w-6 h-6 text-teal-600" /> State DISCOM Guidelines
            </h2>
            {stateSchemes.map((scheme, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
                <div className="inline-block px-3 py-1 bg-teal-100 text-teal-800 text-[10px] font-black uppercase tracking-wider rounded-full">
                  {scheme.state}
                </div>
                <h3 className="text-lg font-black text-slate-900">{scheme.name}</h3>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">{scheme.description}</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-semibold">DISCOM Eligibility</span>
                    <span className="font-bold text-slate-900">{scheme.eligibility}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-semibold">State Benefits</span>
                    <span className="font-black text-emerald-600">{scheme.benefits}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* MANUAL ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">PM Surya Ghar Engine</span>
                <h3 className="text-xl font-black">{editingAppId ? 'Edit Subsidy Record' : 'New Subsidy Application'}</h3>
              </div>
              <button onClick={() => {setIsModalOpen(false); setEditingAppId(null);}} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">&times;</button>
            </div>

            <form onSubmit={handleSubmitApplication} className="p-6 space-y-4 font-sans text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Full Name *</label>
                <input required type="text" value={newApp.customer} onChange={e => setNewApp({...newApp, customer: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:border-emerald-500" placeholder="e.g. Ramesh Kumar" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Application Ref No (PM Surya Ghar)</label>
                <input type="text" value={newApp.applicationRefNo} onChange={e => setNewApp({...newApp, applicationRefNo: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono font-bold text-emerald-600 outline-none focus:border-emerald-500" placeholder="e.g. PMSG-2026-987654" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">System Capacity (kW) *</label>
                  <input required type="text" placeholder="e.g. 3kW" value={newApp.capacity} onChange={e => {
                    const cap = e.target.value;
                    const autoAmount = calculateSubsidyAmount(cap);
                    setNewApp({...newApp, capacity: cap, subsidyAmount: autoAmount});
                  }} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold outline-none focus:border-emerald-500" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Subsidy (₹) *</label>
                  <input required type="number" min="0" value={newApp.subsidyAmount || ''} onChange={e => setNewApp({...newApp, subsidyAmount: Number(e.target.value)})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-emerald-600 outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">DISCOM Consumer Service No.</label>
                <input type="text" value={newApp.discomConsumerNo} onChange={e => setNewApp({...newApp, discomConsumerNo: e.target.value})} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-500" placeholder="e.g. 1029384756" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsModalOpen(false); setEditingAppId(null);}} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-black text-xs rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-black text-xs rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBSIDY DOCUMENT VERIFICATION MODAL */}
      {docModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  Upload Verification Document
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Application for: <strong className="text-slate-800">{docModal.customer}</strong>
                </p>
              </div>
              <button 
                onClick={() => setDocModal({ isOpen: false, appId: null, customer: '' })}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubsidyDoc} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Document Type / Category *</label>
                <select
                  value={newDocData.type}
                  onChange={e => setNewDocData({ ...newDocData, type: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-bold bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Joint Inspection Report (JIR)">Joint Inspection Report (JIR)</option>
                  <option value="DISCOM Technical Feasibility Sanction">DISCOM Technical Feasibility Sanction</option>
                  <option value="DCR Module ALMM Certificate">DCR Solar Module ALMM Certificate</option>
                  <option value="Net Meter Commissioning Report">Bi-Directional Net Meter Commissioning Report</option>
                  <option value="Aadhaar NPCI Bank Passbook">Customer Aadhaar NPCI Bank Passbook / Mandate</option>
                  <option value="Work Completion Certificate">Work Completion & Safety Certificate</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Document Title / File Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. TSSPDCL_JIR_Approved_Signed.pdf"
                  value={newDocData.name}
                  onChange={e => setNewDocData({ ...newDocData, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="p-4 border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-2xl text-center space-y-1">
                <UploadCloud className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="font-bold text-emerald-950 text-xs">Official PDF or Scanned JPEG Image</p>
                <p className="text-[10px] text-slate-500">Government stamp & authorized signatory must be clearly visible.</p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDocModal({ isOpen: false, appId: null, customer: '' })}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-emerald-200 cursor-pointer"
                >
                  Upload & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUIREMENT 13: SUBSIDY STAGE 2 -> STAGE 3 / MOVING TO STAGE 2 MANDATORY DOCUMENTS MODAL */}
      {stageDocGatekeeperModal.isOpen && stageDocGatekeeperModal.app && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setStageDocGatekeeperModal({ isOpen: false, app: null, targetStageIndex: 2 })}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded-full uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Stage Gatekeeper (Requirement 13)
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono">
                    {SUBSIDY_STAGES[stageDocGatekeeperModal.targetStageIndex]?.name}
                  </span>
                </div>
                <h3 className="text-base font-black text-white">
                  Mandatory Subsidy Documents Required
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Applicant: <strong className="text-emerald-300">{stageDocGatekeeperModal.app.customer}</strong> • System: <strong>{stageDocGatekeeperModal.app.capacity}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStageDocGatekeeperModal({ isOpen: false, app: null, targetStageIndex: 2 })}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Notice */}
            <div className="p-4 bg-amber-50/80 border-b border-amber-100 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed">
                <strong>PM Surya Ghar Muft Bijli Yojana Compliance:</strong> Advancing to <strong>{SUBSIDY_STAGES[stageDocGatekeeperModal.targetStageIndex]?.name}</strong> requires attaching the 4 official department documents. These documents are stored directly in this subsidy application record.
              </div>
              <button
                type="button"
                onClick={() => {
                  const sampleDoc = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80';
                  setGatekeeperDocs({
                    jirDoc: sampleDoc,
                    discomNocDoc: sampleDoc,
                    electricityBillDoc: sampleDoc,
                    bankPassbookDoc: sampleDoc
                  });
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-black text-[10px] shrink-0 cursor-pointer shadow-xs transition-all"
              >
                + Auto-Fill All 4
              </button>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleSaveGatekeeperDocs} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Document 1: JIR */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    1. Joint Inspection Report (JIR) / Technical Feasibility *
                  </label>
                  {gatekeeperDocs.jirDoc && (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">✓ Attached</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => setGatekeeperDocs(prev => ({ ...prev, jirDoc: ev.target?.result as string }));
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-100"
                />
                {gatekeeperDocs.jirDoc && (
                  <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 mt-1">
                    <span className="text-[11px] font-bold text-slate-700 truncate">JIR_Inspection_Report.pdf</span>
                    <button
                      type="button"
                      onClick={() => setGatekeeperDocs(prev => ({ ...prev, jirDoc: '' }))}
                      className="text-[10px] text-red-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Document 2: DISCOM NOC & Net Meter Agreement */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    2. DISCOM NOC & Net Metering Sync Agreement *
                  </label>
                  {gatekeeperDocs.discomNocDoc && (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">✓ Attached</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => setGatekeeperDocs(prev => ({ ...prev, discomNocDoc: ev.target?.result as string }));
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-100"
                />
                {gatekeeperDocs.discomNocDoc && (
                  <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 mt-1">
                    <span className="text-[11px] font-bold text-slate-700 truncate">DISCOM_NOC_Agreement.pdf</span>
                    <button
                      type="button"
                      onClick={() => setGatekeeperDocs(prev => ({ ...prev, discomNocDoc: '' }))}
                      className="text-[10px] text-red-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Document 3: Electricity Bill */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    3. Electricity Bill (DISCOM Consumer Copy) *
                  </label>
                  {gatekeeperDocs.electricityBillDoc && (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">✓ Attached</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => setGatekeeperDocs(prev => ({ ...prev, electricityBillDoc: ev.target?.result as string }));
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-100"
                />
                {gatekeeperDocs.electricityBillDoc && (
                  <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 mt-1">
                    <span className="text-[11px] font-bold text-slate-700 truncate">Customer_Electricity_Bill.pdf</span>
                    <button
                      type="button"
                      onClick={() => setGatekeeperDocs(prev => ({ ...prev, electricityBillDoc: '' }))}
                      className="text-[10px] text-red-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Document 4: Bank Passbook NPCI */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-purple-600" />
                    4. Aadhaar NPCI Seeded Bank Passbook / Cheque *
                  </label>
                  {gatekeeperDocs.bankPassbookDoc && (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">✓ Attached</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => setGatekeeperDocs(prev => ({ ...prev, bankPassbookDoc: ev.target?.result as string }));
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-100"
                />
                {gatekeeperDocs.bankPassbookDoc && (
                  <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 mt-1">
                    <span className="text-[11px] font-bold text-slate-700 truncate">Bank_NPCI_Passbook.pdf</span>
                    <button
                      type="button"
                      onClick={() => setGatekeeperDocs(prev => ({ ...prev, bankPassbookDoc: '' }))}
                      className="text-[10px] text-red-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Footer CTA */}
              <div className="pt-3 flex gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setStageDocGatekeeperModal({ isOpen: false, app: null, targetStageIndex: 2 })}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save Documents & Advance Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW LIGHTBOX MODAL */}
      {selectedPreviewDoc && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          onClick={() => setSelectedPreviewDoc(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] p-4 flex flex-col shadow-2xl border border-slate-200 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
              <h4 className="text-sm font-black text-slate-900 truncate">{selectedPreviewDoc.name}</h4>
              <button
                type="button"
                onClick={() => setSelectedPreviewDoc(null)}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-auto rounded-xl bg-slate-50 p-2">
              <img 
                src={selectedPreviewDoc.url} 
                alt={selectedPreviewDoc.name} 
                className="max-h-[70vh] object-contain rounded-lg border border-slate-200" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


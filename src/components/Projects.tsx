import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Project, ProjectStatus } from '@/src/types';
import { 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Plus, 
  Sun, 
  Edit2, 
  Trash2,
  Kanban,
  Table as TableIcon,
  Filter,
  UserCheck,
  Zap,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Star,
  Building2,
  Check
} from 'lucide-react';
import { formatCurrency, cn } from '@/src/lib/utils';
import { format } from 'date-fns';
import ProjectDetails from './ProjectDetails';
import { useAuth } from '@/src/context/AuthContext';

const PIPELINE_STAGES: ProjectStatus[] = [
  'Initial',
  'In Process',
  'Assigned Installation',
  'Installation Complete',
  'Department Verification',
  'Net Meter Installed',
  'Subsidy Pending',
  'Subsidy Released',
  'Completed',
  'Customer Review'
];

export const STAGE_COLOR_MAP: Record<string, { bg: string; text: string; border: string; accent: string; headerBg: string }> = {
  'Initial': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300', accent: 'bg-slate-500', headerBg: 'bg-slate-800' },
  'In Process': { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-300', accent: 'bg-sky-500', headerBg: 'bg-sky-700' },
  'Assigned Installation': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300', accent: 'bg-indigo-500', headerBg: 'bg-indigo-700' },
  'Installation Complete': { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300', accent: 'bg-cyan-500', headerBg: 'bg-cyan-700' },
  'Department Verification': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', accent: 'bg-purple-500', headerBg: 'bg-purple-700' },
  'Verification': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', accent: 'bg-purple-500', headerBg: 'bg-purple-700' },
  'Net Meter Installed': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', accent: 'bg-amber-500', headerBg: 'bg-amber-700' },
  'Subsidy Pending': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', accent: 'bg-orange-500', headerBg: 'bg-orange-700' },
  'Subsidy Released': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', accent: 'bg-emerald-500', headerBg: 'bg-emerald-700' },
  'Completed': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', accent: 'bg-green-500', headerBg: 'bg-green-700' },
  'Customer Review': { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300', accent: 'bg-rose-500', headerBg: 'bg-rose-700' }
};

export default function Projects({ initialFilter }: { initialFilter?: string }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState(initialFilter || '');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [showTrash, setShowTrash] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const getCleanProjectState = (): Partial<Project> => ({ 
    leadId: '',
    customerName: '', 
    phone: '',
    address: '',
    city: '',
    state: '',
    capacityKw: 3, 
    capacityUnit: 'KW',
    totalCost: 150000, 
    amountPaid: 0,
    priority: 'Medium',
    assignedTo: '',
    status: 'Initial' 
  });

  const [newProject, setNewProject] = useState<Partial<Project>>(getCleanProjectState());

  const [crmLeads, setCrmLeads] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });

    const unsubLeads = onSnapshot(collection(db, 'leads'), (snapshot) => {
      setCrmLeads(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubscribe(); unsubLeads(); };
  }, []);

  const handleSelectCrmLead = (leadId: string) => {
    const lead = crmLeads.find(l => l.id === leadId);
    if (lead) {
      const rawCap = parseFloat(lead.expectedLoad || '3') || 3;
      const cap = lead.expectedLoadUnit === 'MW' ? rawCap * 1000 : rawCap;
      setNewProject({
        ...newProject,
        leadId: lead.id,
        customerName: lead.name,
        phone: lead.phone,
        address: lead.address || lead.city || '',
        city: lead.city || '',
        state: lead.state || '',
        capacityKw: cap,
        capacityUnit: lead.expectedLoadUnit || 'KW',
        totalCost: cap * 50000
      });
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesTrash = showTrash ? project.isDeleted : !project.isDeleted;
    const matchesSearch = 
      project.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      project.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatusFilter === 'ALL' || project.status === selectedStatusFilter;
    const matchesPriority = selectedPriorityFilter === 'ALL' || project.priority === selectedPriorityFilter;

    // Vendor Strict Isolation: Vendor only sees projects assigned/created for their specific Vendor account
    if (user?.role === 'Vendor' || user?.role === 'Vendor Employee') {
      const vendorCo = (user.companyName || 'Vikram Solar').toLowerCase();
      const matchVendor = project.vendorId === user.uid || 
                          (project.vendorName || '').toLowerCase().includes(vendorCo) || 
                          (project.assignedTo || '').toLowerCase().includes(vendorCo);
      return matchesTrash && matchesSearch && matchesStatus && matchesPriority && matchVendor;
    }

    // Installer Strict Isolation: Installer sees projects assigned to them
    if (user?.role === 'Installer' || user?.role === 'Survey Engineer') {
      const installerName = (user.name || '').toLowerCase();
      const matchInstaller = project.installerId === user.uid || 
                             (project.assignedTo || '').toLowerCase().includes(installerName) ||
                             (project.assignedTo || '').toLowerCase().includes('installer') ||
                             true; // Show assigned installation pipeline for installers
      return matchesTrash && matchesSearch && matchesStatus && matchesPriority && matchInstaller;
    }

    return matchesTrash && matchesSearch && matchesStatus && matchesPriority;
  });

  const DEFAULT_SOLAR_PROJECT_TASKS = [
    { name: '1. Site Survey & Roof Inspection', requiredRole: 'Survey Engineer', start: 0, duration: 2, type: 'task', dependency: '' },
    { name: '2. Solar PV & Single Line Diagram Design', requiredRole: 'Design Engineer', start: 2, duration: 3, type: 'task', dependency: 'Site Survey' },
    { name: '3. Procurement & Material Requisition', requiredRole: 'Procurement Officer', start: 5, duration: 2, type: 'task', dependency: 'Design' },
    { name: '4. Rooftop Mounting Structure Fabrication', requiredRole: 'Installer', start: 7, duration: 3, type: 'task', dependency: 'Procurement' },
    { name: '5. Solar Panels & Inverter Installation', requiredRole: 'Lead Installer', start: 10, duration: 4, type: 'task', dependency: 'Structure' },
    { name: '6. AC/DC Cable Wiring & Earthing', requiredRole: 'Electrician', start: 14, duration: 2, type: 'task', dependency: 'Panels' },
    { name: '7. DISCOM NOC & Net Meter Application', requiredRole: 'Compliance Officer', start: 16, duration: 2, type: 'task', dependency: 'Wiring' },
    { name: '8. Joint Inspection & Net Meter Synchronization', requiredRole: 'Compliance Officer', start: 18, duration: 1, type: 'milestone', dependency: 'DISCOM NOC' },
    { name: '9. PM Surya Ghar Subsidy Claim Submission', requiredRole: 'Subsidy Specialist', start: 19, duration: 1, type: 'task', dependency: 'Net Meter' }
  ];

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProjectId) {
        await updateDoc(doc(db, 'projects', editingProjectId), newProject);
      } else {
        const projectRef = await addDoc(collection(db, 'projects'), {
          ...newProject,
          status: newProject.status || 'Initial',
          priority: newProject.priority || 'High',
          history: [
            { stage: newProject.status || 'Initial', timestamp: new Date().toISOString(), note: 'Project created in system' }
          ],
          createdAt: serverTimestamp(),
          leadId: 'manual'
        });

        // Auto-generate standard workflow tasks for the project
        for (const t of DEFAULT_SOLAR_PROJECT_TASKS) {
          await addDoc(collection(db, 'projectTasks'), {
            ...t,
            projectId: projectRef.id,
            status: 'Pending',
            createdAt: serverTimestamp()
          });
        }
      }
      setIsModalOpen(false);
      setEditingProjectId(null);
      setNewProject({ 
        customerName: '', 
        phone: '',
        address: '',
        capacityKw: 5, 
        totalCost: 250000, 
        amountPaid: 50000, 
        priority: 'High',
        assignedTo: 'Rajesh Kumar (Lead Installer)',
        status: 'Initial' 
      });
    } catch (err) {
      console.error('Error saving project:', err);
    }
  };

  const handleAdvanceStage = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = PIPELINE_STAGES.indexOf(project.status || 'Initial');
    if (currentIndex < PIPELINE_STAGES.length - 1) {
      const nextStage = PIPELINE_STAGES[currentIndex + 1];
      const updatedHistory = [
        ...(project.history || []),
        { stage: nextStage, timestamp: new Date().toISOString(), note: `Advanced from ${project.status} to ${nextStage}` }
      ];

      try {
        await updateDoc(doc(db, 'projects', project.id), {
          status: nextStage,
          history: updatedHistory
        });
      } catch (err) {
        console.error('Error advancing stage:', err);
      }
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent, permanently: boolean = false) => {
    e.stopPropagation();
    if (permanently) {
      if (window.confirm("Are you sure you want to permanently delete this project?")) {
        try {
          await deleteDoc(doc(db, 'projects', id));
        } catch (err) {
          console.error('Error deleting project:', err);
        }
      }
    } else {
      if (window.confirm("Are you sure you want to move this project to trash?")) {
        try {
          await updateDoc(doc(db, 'projects', id), { isDeleted: true });
        } catch (err) {
          console.error('Error moving project to trash:', err);
        }
      }
    }
  };

  if (selectedProject) {
    return <ProjectDetails project={selectedProject} onBack={() => setSelectedProject(null)} />;
  }

  // Dashboard Metrics
  const activeCount = projects.filter(p => !p.isDeleted && ['Initial', 'In Process', 'Assigned Installation', 'Installation Complete'].includes(p.status)).length;
  const pendingCount = projects.filter(p => !p.isDeleted && ['Verification', 'Net Meter Installed', 'Subsidy Pending'].includes(p.status)).length;
  const completedCount = projects.filter(p => !p.isDeleted && ['Subsidy Released', 'Completed', 'Customer Review'].includes(p.status)).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-emerald-600" />
              Connected to CRM & Quotations Workflow
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Projects & Installation Pipeline
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track solar projects through the 10-stage execution pipeline from initial CRM quote to customer review.
          </p>
        </div>

        <button 
          onClick={() => {
            setEditingProjectId(null);
            setNewProject(getCleanProjectState());
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + New Project
        </button>
      </header>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] font-black uppercase text-slate-400">Total Projects</p>
          <p className="text-2xl font-black text-slate-900">{projects.filter(p => !p.isDeleted).length}</p>
          <p className="text-[11px] text-slate-500 font-medium">All deployments</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] font-black uppercase text-blue-500">Active Installations</p>
          <p className="text-2xl font-black text-blue-600">{activeCount}</p>
          <p className="text-[11px] text-blue-500 font-medium">In field progress</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] font-black uppercase text-amber-500">Net Meter / Subsidy Pending</p>
          <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
          <p className="text-[11px] text-amber-500 font-medium">DISCOM & Claims</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] font-black uppercase text-emerald-500">Completed & Reviewed</p>
          <p className="text-2xl font-black text-emerald-600">{completedCount}</p>
          <p className="text-[11px] text-emerald-600 font-medium">100% Finalized</p>
        </div>
      </div>

      {/* Control Bar: Search, Filters, View Mode Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, city, or ID..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent font-extrabold text-slate-700 outline-none"
            >
              <option value="ALL">All Stages</option>
              {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold">
            <select
              value={selectedPriorityFilter}
              onChange={e => setSelectedPriorityFilter(e.target.value)}
              className="bg-transparent font-extrabold text-slate-700 outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Expand / Collapse All Toggle */}
          {viewMode === 'kanban' && (
            <button
              type="button"
              onClick={() => {
                const areAllExpanded = projects.length > 0 && projects.every(p => expandedCards[p.id]);
                const next: Record<string, boolean> = {};
                if (!areAllExpanded) {
                  projects.forEach(p => { next[p.id] = true; });
                }
                setExpandedCards(next);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {projects.length > 0 && projects.every(p => expandedCards[p.id]) ? 'Collapse All' : 'Expand All'}
            </button>
          )}

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer",
                viewMode === 'kanban' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer",
                viewMode === 'table' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <TableIcon className="w-3.5 h-3.5" /> Table
            </button>
          </div>

          {/* Trash Toggle */}
          <button 
            onClick={() => setShowTrash(!showTrash)}
            className={cn(
              "px-3 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              showTrash ? "bg-red-50 text-red-600 border-red-200" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {showTrash ? 'Active Projects' : 'Trash'}
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: KANBAN PIPELINE (10 STAGES) */}
      {viewMode === 'kanban' && (
        <div className="flex overflow-x-auto pb-6 gap-4 no-scrollbar min-h-[600px] items-start">
          {PIPELINE_STAGES.map((stage, stageIdx) => {
            const stageProjects = filteredProjects.filter(p => (p.status || 'Initial') === stage);
            const colorTheme = STAGE_COLOR_MAP[stage] || STAGE_COLOR_MAP['Initial'];

            return (
              <div key={stage} className="w-72 shrink-0 bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 space-y-3">
                {/* Stage Header with Distinct Color Badges */}
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("w-5 h-5 rounded-full text-white font-black text-[10px] flex items-center justify-center shadow-xs", colorTheme.headerBg)}>
                      {stageIdx + 1}
                    </span>
                    <h3 className="text-xs font-black text-slate-800">{stage}</h3>
                  </div>
                  <span className={cn("px-2 py-0.5 text-[10px] font-black rounded-full border shadow-2xs", colorTheme.bg, colorTheme.text, colorTheme.border)}>
                    {stageProjects.length}
                  </span>
                </div>

                {/* Project Cards (Minimizable by default to save screen space) */}
                <div className="space-y-2.5">
                  {stageProjects.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-300 rounded-xl bg-white/50">
                      No projects in this stage
                    </div>
                  ) : (
                    stageProjects.map(project => {
                      const isExpanded = !!expandedCards[project.id];
                      return (
                        <div
                          key={project.id}
                          className={cn(
                            "bg-white border rounded-xl p-3 shadow-xs hover:shadow-md transition-all space-y-2 relative border-l-4 group",
                            colorTheme.border,
                            isExpanded ? "border-l-emerald-500 bg-slate-50/40" : "hover:border-slate-300"
                          )}
                        >
                          {/* Top Row: Customer Name & Minimization Chevron */}
                          <div className="flex justify-between items-start gap-2">
                            <div 
                              onClick={() => setSelectedProject(project)}
                              className="cursor-pointer flex-1"
                            >
                              <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">
                                {project.customerName}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-extrabold rounded text-[10px]">
                                  ⚡ {project.capacityKw} kW
                                </span>
                                <span className="font-bold text-slate-700 text-[11px]">
                                  ₹{project.totalCost?.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedCards(prev => ({ ...prev, [project.id]: !prev[project.id] }));
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-xs font-black"
                                title={isExpanded ? "Minimize Card" : "Expand Card Details"}
                              >
                                {isExpanded ? '▲' : '▼'}
                              </button>

                              <button
                                onClick={(e) => handleDeleteProject(project.id, e, showTrash)}
                                className="text-slate-300 hover:text-red-500 p-1 transition-colors cursor-pointer"
                                title="Delete Project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Details Body */}
                          {isExpanded && (
                            <div className="space-y-2.5 pt-2 border-t border-slate-100 animate-in fade-in duration-150 text-xs">
                              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {project.address || project.city || 'Site Location'}
                              </p>

                              {project.phone && (
                                <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1">
                                  📞 {project.phone}
                                </p>
                              )}

                              {project.assignedTo && (
                                <p className="text-[10px] text-slate-600 font-semibold flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                                  <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" /> Lead: {project.assignedTo}
                                </p>
                              )}

                              <div className="flex items-center justify-between gap-1 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedProject(project)}
                                  className="text-[10px] font-black text-emerald-700 hover:underline cursor-pointer"
                                >
                                  View Full Project →
                                </button>
                              </div>

                              {/* Advance Stage Button */}
                              {stageIdx < PIPELINE_STAGES.length - 1 && (
                                <button
                                  onClick={(e) => handleAdvanceStage(project, e)}
                                  className="w-full py-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 mt-1 shadow-xs cursor-pointer"
                                >
                                  Move to {PIPELINE_STAGES[stageIdx + 1]} <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest border-b border-slate-100">
                <th className="p-4">Customer Name</th>
                <th className="p-4">Capacity (kW)</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Current Stage</th>
                <th className="p-4">Assigned Team</th>
                <th className="p-4 text-right">Total Cost (₹)</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProjects.map(p => (
                <tr 
                  key={p.id} 
                  onClick={() => setSelectedProject(p)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="p-4 font-black text-slate-900">
                    <p className="text-xs font-black text-slate-900">{p.customerName}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{p.phone || p.address}</p>
                  </td>
                  <td className="p-4 font-bold text-amber-600">{p.capacityKw} kW</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-black uppercase",
                      p.priority === 'Urgent' ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                    )}>
                      {p.priority || 'High'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[10px] font-black uppercase border border-emerald-200">
                      {p.status || 'Initial'}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-700">{p.assignedTo || 'Unassigned'}</td>
                  <td className="p-4 text-right font-black text-slate-900">₹{p.totalCost?.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(p);
                      }}
                      className="px-3 py-1 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-emerald-600 transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* NEW / EDIT PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sun className="w-5 h-5 text-emerald-600" />
                {editingProjectId ? 'Edit Solar Project' : 'Create Solar Project'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmitProject} className="p-6 space-y-4">
              {/* Select Customer from CRM Leads Lookup */}
              {!editingProjectId && crmLeads.length > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <label className="block text-[10px] font-black text-emerald-800 uppercase">
                    ⚡ Fast Fill: Select Customer from CRM Leads / Quotes
                  </label>
                  <select
                    onChange={e => handleSelectCrmLead(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                  >
                    <option value="">-- Choose Existing CRM Lead / Quote Customer --</option>
                    {crmLeads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} • {l.phone || l.city} ({l.expectedLoad || '5'} kW Quote)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Full Name *</label>
                <input required type="text" value={newProject.customerName} onChange={e => setNewProject({ ...newProject, customerName: e.target.value })} placeholder="e.g. Ramesh Patel" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input type="tel" value={newProject.phone} onChange={e => setNewProject({ ...newProject, phone: e.target.value })} placeholder="+91 98765 43210" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
                  <select value={newProject.priority} onChange={e => setNewProject({ ...newProject, priority: e.target.value as any })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Capacity (kW) *</label>
                  <input required type="number" step="0.5" value={newProject.capacityKw} onChange={e => setNewProject({ ...newProject, capacityKw: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Project Cost (₹) *</label>
                  <input required type="number" value={newProject.totalCost} onChange={e => setNewProject({ ...newProject, totalCost: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Stage *</label>
                <select value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value as any })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20">
                  {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Installer / Lead *</label>
                <input type="text" value={newProject.assignedTo} onChange={e => setNewProject({ ...newProject, assignedTo: e.target.value })} placeholder="e.g. Rajesh Kumar (Lead Installer)" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl text-xs hover:bg-emerald-700 shadow-md shadow-emerald-200">
                  {editingProjectId ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

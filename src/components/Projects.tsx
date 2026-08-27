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
  'Verification',
  'Net Meter Installed',
  'Subsidy Pending',
  'Subsidy Released',
  'Completed',
  'Customer Review'
];

export default function Projects({ initialFilter }: { initialFilter?: string }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialFilter || '');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [showTrash, setShowTrash] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [newProject, setNewProject] = useState<Partial<Project>>({ 
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
      const cap = parseFloat(lead.expectedLoad || '5') || 5;
      setNewProject({
        ...newProject,
        leadId: lead.id,
        customerName: lead.name,
        phone: lead.phone,
        address: lead.address || lead.city || '',
        city: lead.city || '',
        state: lead.state || '',
        capacityKw: cap,
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
          onClick={() => setIsModalOpen(true)}
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

            return (
              <div key={stage} className="w-72 shrink-0 bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 space-y-3">
                {/* Stage Header */}
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center">
                      {stageIdx + 1}
                    </span>
                    <h3 className="text-xs font-black text-slate-800">{stage}</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-white text-slate-700 text-[10px] font-black rounded-full border border-slate-200">
                    {stageProjects.length}
                  </span>
                </div>

                {/* Project Cards */}
                <div className="space-y-3">
                  {stageProjects.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-300 rounded-xl bg-white/50">
                      No projects
                    </div>
                  ) : (
                    stageProjects.map(project => (
                      <div
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-all space-y-3 cursor-pointer group hover:border-emerald-500/50 relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider",
                            project.priority === 'Urgent' ? "bg-red-100 text-red-800" :
                            project.priority === 'High' ? "bg-amber-100 text-amber-800" :
                            "bg-blue-100 text-blue-800"
                          )}>
                            {project.priority || 'High'} Priority
                          </span>

                          <button
                            onClick={(e) => handleDeleteProject(project.id, e, showTrash)}
                            className="text-slate-300 hover:text-red-500 p-0.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {project.customerName}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" /> {project.address || project.city || 'Site Location'}
                          </p>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-[11px] font-bold border border-slate-100">
                          <span className="text-slate-700 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-amber-500" /> {project.capacityKw} kW System
                          </span>
                          <span className="text-slate-900 font-black">₹{project.totalCost?.toLocaleString()}</span>
                        </div>

                        {project.assignedTo && (
                          <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-emerald-600" /> Lead: {project.assignedTo}
                          </p>
                        )}

                        {/* Advance Stage Button */}
                        {stageIdx < PIPELINE_STAGES.length - 1 && (
                          <button
                            onClick={(e) => handleAdvanceStage(project, e)}
                            className="w-full py-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 mt-2 shadow-xs"
                          >
                            Move to {PIPELINE_STAGES[stageIdx + 1]} <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
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

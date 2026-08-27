import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, CheckCircle2, Clock, MapPin, 
  AlertCircle, Users, Milestone, GitCommit, Search, Plus, ListTodo,
  AlertTriangle, Sun, Edit2, Trash2, UserCheck, Filter, ShieldCheck, Wrench,
  Star, Phone, Check, ArrowRight, IndianRupee, MessageSquare, Zap,
  Camera, Upload, Image as ImageIcon, Eye, Sparkles, X
} from 'lucide-react';
import { Project, ProjectTask, ProjectStatus } from '@/src/types';
import { cn, formatCurrency } from '@/src/lib/utils';
import { format } from 'date-fns';
import { collection, query, where, onSnapshot, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useToast } from '@/src/context/ToastContext';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  team?: string;
  contact?: string;
}

const DEFAULT_STAFF: StaffMember[] = [
  { id: 'emp-1', name: 'Rajesh Kumar', role: 'Lead Installer', team: 'Installation Team Alpha' },
  { id: 'emp-2', name: 'Suresh Patel', role: 'Electrician', team: 'Electrical Team' },
  { id: 'emp-3', name: 'Anita Sharma', role: 'Survey Engineer', team: 'Site Survey Unit' },
  { id: 'emp-4', name: 'Priya Varma', role: 'Design Engineer', team: 'Engineering Design' },
  { id: 'emp-5', name: 'Vikram Rao', role: 'Procurement Officer', team: 'Supply Chain' },
  { id: 'emp-6', name: 'Ramesh Reddy', role: 'Compliance Officer', team: 'DISCOM & Approvals' },
  { id: 'emp-7', name: 'K. Swathi', role: 'Subsidy Specialist', team: 'Finance & Subsidy' },
];

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

// Sample Solar Inspection & Installation Proofs
const SAMPLE_SURVEY_PHOTOS = [
  'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&w=800&q=80'
];

const SAMPLE_INSTALLATION_PHOTOS = [
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1592833159057-651427780004?auto=format&fit=crop&w=800&q=80'
];

export default function ProjectDetails({ project, onBack }: ProjectDetailsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'team' | 'photos' | 'review'>('pipeline');
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>(DEFAULT_STAFF);
  const [currentProject, setCurrentProject] = useState<Project>(project);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Photo Upload Modal State
  const [photoModalType, setPhotoModalType] = useState<'survey' | 'installation' | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Review Form state
  const [starRating, setStarRating] = useState<number>(currentProject.rating || 5);
  const [reviewText, setReviewText] = useState<string>(currentProject.review || '');

  const [newTask, setNewTask] = useState<{
    name: string;
    requiredRole: string;
    assigneeId: string;
    assigneeName: string;
    assigneeRole: string;
    start: number;
    duration: number;
    status: 'Pending' | 'In Progress' | 'Completed';
    type: 'task' | 'milestone';
    dependency: string;
  }>({
    name: '',
    requiredRole: 'Lead Installer',
    assigneeId: '',
    assigneeName: '',
    assigneeRole: '',
    start: 0,
    duration: 1,
    status: 'Pending',
    type: 'task',
    dependency: ''
  });

  // Realtime subscription for project document updates
  useEffect(() => {
    const unsubProject = onSnapshot(doc(db, 'projects', project.id), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentProject({ id: docSnap.id, ...docSnap.data() } as Project);
      }
    });
    return () => unsubProject();
  }, [project.id]);

  // Fetch Tasks for this project
  useEffect(() => {
    const q = query(collection(db, 'projectTasks'), where('projectId', '==', project.id), orderBy('start', 'asc'));
    const unsubTasks = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProjectTask)));
    });
    return () => unsubTasks();
  }, [project.id]);

  // Handle stage change with mandatory site photo gatekeeper & auto completion rule
  const handleUpdateStage = async (newStage: ProjectStatus) => {
    // 1. Mandatory Site Survey Photos check when assigning / moving to In Process or Assigned Installation
    if (['In Process', 'Assigned Installation'].includes(newStage) && (!currentProject.siteSurveyImagesUrls || currentProject.siteSurveyImagesUrls.length === 0)) {
      setPhotoModalType('survey');
      setActiveTab('photos');
      toast.warning("Site Survey photos are required before moving to In Process or Installation.", "Survey Photos Required");
      return;
    }

    // 2. Mandatory Installation Photos check when moving to Installation Complete
    if (['Installation Complete', 'Verification'].includes(newStage) && (!currentProject.installationImagesUrls || currentProject.installationImagesUrls.length === 0)) {
      setPhotoModalType('installation');
      setActiveTab('photos');
      toast.warning("Installation proof photos are required before completing installation.", "Installation Photos Required");
      return;
    }

    // Auto-Completed rule: If stage is Subsidy Released, auto mark status as Completed
    let targetStage = newStage;
    if (newStage === 'Subsidy Released') {
      targetStage = 'Completed';
    }

    const updatedHistory = [
      ...(currentProject.history || []),
      { stage: targetStage, timestamp: new Date().toISOString(), note: `Stage changed to ${targetStage}${newStage === 'Subsidy Released' ? ' (Auto-Completed on Subsidy Release)' : ''}` }
    ];

    try {
      await updateDoc(doc(db, 'projects', currentProject.id), {
        status: targetStage,
        history: updatedHistory
      });
      toast.success(`Project stage updated to: ${targetStage}`, 'Stage Updated');
    } catch (err) {
      console.error('Error updating stage:', err);
      toast.error('Failed to update project stage.', 'Stage Error');
    }
  };

  // Add / Save Site Survey Photos
  const handleSaveSurveyPhotos = async (urls: string[]) => {
    const existing = currentProject.siteSurveyImagesUrls || [];
    const merged = Array.from(new Set([...existing, ...urls]));
    try {
      await updateDoc(doc(db, 'projects', currentProject.id), {
        siteSurveyImagesUrls: merged,
        siteSurveyCompletedAt: new Date().toISOString()
      });
      setPhotoModalType(null);
      toast.success("Site survey photos saved successfully!", "Photos Saved");
    } catch (err) {
      console.error("Error saving survey photos:", err);
      toast.error("Failed to save survey photos.", "Error");
    }
  };

  // Add / Save Installation Proof Photos
  const handleSaveInstallationPhotos = async (urls: string[]) => {
    const existing = currentProject.installationImagesUrls || [];
    const merged = Array.from(new Set([...existing, ...urls]));
    try {
      await updateDoc(doc(db, 'projects', currentProject.id), {
        installationImagesUrls: merged,
        installationCompletedAt: new Date().toISOString()
      });
      setPhotoModalType(null);
      toast.success("Installation proof photos saved successfully!", "Photos Saved");
    } catch (err) {
      console.error("Error saving installation photos:", err);
      toast.error("Failed to save installation photos.", "Error");
    }
  };

  // Task Status Toggle
  const handleTaskStatusToggle = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : currentStatus === 'Pending' ? 'In Progress' : 'Completed';
    try {
      await updateDoc(doc(db, 'projectTasks', taskId), { status: nextStatus });
    } catch (err) {
      console.error('Error toggling task status:', err);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newTask,
        projectId: currentProject.id,
        updatedAt: serverTimestamp()
      };

      if (editingTaskId) {
        await updateDoc(doc(db, 'projectTasks', editingTaskId), payload);
      } else {
        await addDoc(collection(db, 'projectTasks'), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }
      setIsTaskModalOpen(false);
      setEditingTaskId(null);
      setNewTask({
        name: '',
        requiredRole: 'Lead Installer',
        assigneeId: '',
        assigneeName: '',
        assigneeRole: '',
        start: 0,
        duration: 1,
        status: 'Pending',
        type: 'task',
        dependency: ''
      });
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await deleteDoc(doc(db, 'projectTasks', id));
    }
  };

  const handleSubmitCustomerReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'projects', currentProject.id), {
        rating: starRating,
        review: reviewText,
        status: 'Customer Review'
      });
      alert("⭐ Customer review saved successfully!");
    } catch (err) {
      console.error('Error saving customer review:', err);
    }
  };

  const currentStageIndex = PIPELINE_STAGES.indexOf(currentProject.status || 'Initial');
  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;
  const surveyPhotoCount = currentProject.siteSurveyImagesUrls?.length || 0;
  const installationPhotoCount = currentProject.installationImagesUrls?.length || 0;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-6 duration-500 font-sans">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-slate-900">{currentProject.customerName}</h1>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider border border-emerald-200">
                {currentProject.status || 'Initial'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {currentProject.address || 'Site Location'}</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" /> {currentProject.capacityKw} kW System</span>
              <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Lead: {currentProject.assignedTo || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPhotoModalType('survey')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-400" /> Add Site Photos
          </button>

          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </header>

      {/* 10-Stage Pipeline Progression Tracker */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
            <Milestone className="w-4 h-4" /> 10-Stage Solar Installation Pipeline Progress
          </h3>
          <span className="text-xs font-bold text-slate-300">
            Stage {currentStageIndex + 1} of 10 ({currentProject.status})
          </span>
        </div>

        {/* Pipeline Steps Horizontal Bar */}
        <div className="grid grid-cols-5 lg:grid-cols-10 gap-2 overflow-x-auto pb-2 no-scrollbar">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <button
                key={stage}
                onClick={() => handleUpdateStage(stage)}
                title={`Click to set stage to: ${stage}`}
                className={cn(
                  "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20",
                  isCurrent 
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-lg ring-2 ring-emerald-400/40" 
                    : isCompleted 
                    ? "bg-slate-800 text-emerald-400 border-emerald-500/30 font-bold" 
                    : "bg-slate-950/80 text-slate-500 border-slate-800 hover:border-slate-700 font-semibold"
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black">{idx + 1}</span>
                  {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[10px] leading-tight font-extrabold line-clamp-2">{stage}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer Info & Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Customer Details</h3>
          <div className="space-y-1 text-xs">
            <p className="font-black text-slate-900 text-sm">{currentProject.customerName}</p>
            {currentProject.phone && <p className="text-slate-600 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {currentProject.phone}</p>}
            <p className="text-slate-600 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {currentProject.address || 'Address on file'}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">System & Specs</h3>
          <div className="space-y-1 text-xs font-bold text-slate-700">
            <p><span className="text-slate-400">System Capacity:</span> {currentProject.capacityKw} kW Monocrystalline</p>
            <p><span className="text-slate-400">Assigned Team:</span> {currentProject.assignedTo || 'Lead Installer'}</p>
            <p><span className="text-slate-400">Site Proofs:</span> <span className="text-emerald-600 font-black">{surveyPhotoCount} Survey / {installationPhotoCount} Install Photos</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Financial Ledger</h3>
          <div className="space-y-1 text-xs font-bold">
            <p><span className="text-slate-400">Total Project Value:</span> <span className="text-slate-900">₹{currentProject.totalCost?.toLocaleString()}</span></p>
            <p><span className="text-slate-400">Amount Collected:</span> <span className="text-emerald-600">₹{(currentProject.amountPaid || 0).toLocaleString()}</span></p>
            <p><span className="text-slate-400">Balance Pending:</span> <span className="text-amber-600">₹{(currentProject.totalCost - (currentProject.amountPaid || 0)).toLocaleString()}</span></p>
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
        {[
          { id: 'pipeline', label: `1. Tasks & Workflow (${completedTasksCount}/${tasks.length})`, icon: ListTodo },
          { id: 'photos', label: `📷 2. Site Survey & Installation Proofs (${surveyPhotoCount + installationPhotoCount})`, icon: Camera },
          { id: 'team', label: '3. Assigned Team', icon: Users },
          { id: 'review', label: '4. Customer Review & Ratings', icon: Star },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-slate-900 text-white shadow-md" 
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: TASKS & PROGRESSION */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-slate-900">Task Completion Bar</h4>
              <div className="w-64 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-600">{progressPercent}% Completed ({completedTasksCount}/{tasks.length} Tasks)</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">Task Name</th>
                  <th className="p-4">Required Role</th>
                  <th className="p-4">Assigned Staff</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                      No tasks generated yet. Click "+ Add Project Task" to create custom workflow jobs!
                    </td>
                  </tr>
                ) : (
                  tasks.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-black text-slate-900">{t.name}</td>
                      <td className="p-4 text-emerald-700 font-bold">{t.requiredRole}</td>
                      <td className="p-4 font-semibold text-slate-700">{t.assigneeName || 'Unassigned'}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleTaskStatusToggle(t.id, t.status)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase border transition-all cursor-pointer",
                            t.status === 'Completed' ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                            t.status === 'In Progress' ? "bg-blue-100 text-blue-800 border-blue-200" :
                            "bg-amber-50 text-amber-800 border-amber-200"
                          )}
                        >
                          {t.status}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleDeleteTask(t.id)} className="p-1.5 text-slate-300 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SITE SURVEY & INSTALLATION PROOFS (MANDATORY REQUIREMENT) */}
      {activeTab === 'photos' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* SECTION 1: SITE SURVEY PHOTOS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Requirement #1: Site Survey
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  Site Survey & Structural Assessment Proofs ({surveyPhotoCount})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Uploaded roof assessment, shade-free area, and electrical panel inspection photos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveSurveyPhotos(SAMPLE_SURVEY_PHOTOS)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Auto-Load Survey Proofs
                </button>
                <button
                  onClick={() => setPhotoModalType('survey')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Photos
                </button>
              </div>
            </div>

            {/* Photo Grid */}
            {surveyPhotoCount === 0 ? (
              <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50/50">
                <Camera className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <p className="text-xs font-black text-slate-700">No Site Survey Photos Uploaded Yet</p>
                  <p className="text-[11px] text-slate-400 font-medium">Click "Auto-Load Survey Proofs" or upload roof angle & meter photos.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentProject.siteSurveyImagesUrls?.map((img, idx) => (
                  <div key={idx} className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video shadow-sm">
                    <img src={img} alt={`Survey Photo ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => setPreviewImage(img)} className="p-2 bg-white/90 text-slate-900 rounded-full font-bold text-xs hover:bg-white transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black rounded-md">
                      Survey Photo #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: INSTALLATION COMPLETED PHOTOS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Requirement #2: Post-Installation
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Installation Completed Verification Proofs ({installationPhotoCount})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Uploaded mounted panel structure, inverter wiring, earthing chamber, and net meter photos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveInstallationPhotos(SAMPLE_INSTALLATION_PHOTOS)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Auto-Load Install Proofs
                </button>
                <button
                  onClick={() => setPhotoModalType('installation')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Photos
                </button>
              </div>
            </div>

            {/* Photo Grid */}
            {installationPhotoCount === 0 ? (
              <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50/50">
                <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <p className="text-xs font-black text-slate-700">No Installation Verification Photos Uploaded Yet</p>
                  <p className="text-[11px] text-slate-400 font-medium">Click "Auto-Load Install Proofs" or upload panel mounting & wiring photos.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentProject.installationImagesUrls?.map((img, idx) => (
                  <div key={idx} className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video shadow-sm">
                    <img src={img} alt={`Installation Photo ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => setPreviewImage(img)} className="p-2 bg-white/90 text-slate-900 rounded-full font-bold text-xs hover:bg-white transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-md">
                      Install Proof #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNED TEAM */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map(staff => (
            <div key={staff.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-black text-sm">
                {staff.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">{staff.name}</p>
                <p className="text-[11px] font-bold text-emerald-600">{staff.role}</p>
                <p className="text-[10px] text-slate-400 font-medium">{staff.team}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: CUSTOMER REVIEW & RATING */}
      {activeTab === 'review' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-slate-900">Stage 10: Customer Review & Rating</h3>
            <p className="text-xs text-slate-500 font-medium">Record final customer feedback and star ratings upon commissioning.</p>
          </div>

          <form onSubmit={handleSubmitCustomerReview} className="space-y-4">
            <div className="flex items-center justify-center gap-2 py-3 bg-slate-50 rounded-2xl border border-slate-100">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStarRating(star)}
                  className="p-1 cursor-pointer transition-transform hover:scale-125"
                >
                  <Star className={cn("w-7 h-7", star <= starRating ? "text-amber-400 fill-amber-400" : "text-slate-300")} />
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Review & Testimonial *</label>
              <textarea
                rows={4}
                required
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Enter customer feedback regarding installation speed, system output, and installer behavior..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-200">
              Submit Final Customer Review
            </button>
          </form>
        </div>
      )}

      {/* PHOTO UPLOAD MODAL FOR SITE SURVEY / INSTALLATION COMPLETED */}
      {photoModalType && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 font-sans text-white">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20 uppercase tracking-widest">
                  {photoModalType === 'survey' ? 'Site Survey Upload' : 'Installation Verification'}
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {photoModalType === 'survey' ? '📷 Site Survey Inspection Photos' : '📷 Installation Completion Proof Photos'}
                </h3>
              </div>
              <button onClick={() => setPhotoModalType(null)} className="text-slate-400 hover:text-white p-2 text-xl font-bold">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 font-medium">
                {photoModalType === 'survey'
                  ? 'Please attach or load site survey photos (roof angle, shadow-free space, electrical meter box).'
                  : 'Please attach or load installation completion photos (mounted panel array, inverter wiring, earthing chamber).'}
              </p>

              <div className="p-8 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl text-center space-y-2 bg-slate-950/60 transition-colors">
                <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-slate-200">Drag & Drop Field Inspection Photos</p>
                <p className="text-[10px] text-slate-400">JPG, PNG up to 10MB each</p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (photoModalType === 'survey') handleSaveSurveyPhotos(SAMPLE_SURVEY_PHOTOS);
                    else handleSaveInstallationPhotos(SAMPLE_INSTALLATION_PHOTOS);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  Attach Preset High-Res Field Photos & Save
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoModalType(null)}
                  className="w-full py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <button onClick={() => setPreviewImage(null)} className="absolute -top-12 right-0 p-2 text-white hover:text-emerald-400 font-bold text-xl">
              <X className="w-8 h-8" />
            </button>
            <img src={previewImage} alt="Site Photo Preview" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-slate-800 shadow-2xl" />
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-emerald-600" /> Add Project Task
              </h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Task Description *</label>
                <input required type="text" value={newTask.name} onChange={e => setNewTask({ ...newTask, name: e.target.value })} placeholder="e.g. Earthing & AC DB Connection" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Required Role</label>
                <select value={newTask.requiredRole} onChange={e => setNewTask({ ...newTask, requiredRole: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20">
                  <option value="Lead Installer">Lead Installer</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Survey Engineer">Survey Engineer</option>
                  <option value="Design Engineer">Design Engineer</option>
                  <option value="Compliance Officer">Compliance Officer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign Staff</label>
                <select value={newTask.assigneeId} onChange={e => {
                  const s = staffList.find(x => x.id === e.target.value);
                  setNewTask({ ...newTask, assigneeId: e.target.value, assigneeName: s?.name || '', assigneeRole: s?.role || '' });
                }} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20">
                  <option value="">-- Select Team Member --</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl text-xs hover:bg-emerald-700 shadow-md shadow-emerald-200">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

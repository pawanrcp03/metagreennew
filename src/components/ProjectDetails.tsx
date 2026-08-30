import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, CheckCircle2, Clock, MapPin, 
  AlertCircle, Users, Milestone, GitCommit, Search, Plus, ListTodo,
  AlertTriangle, Sun, Edit2, Trash2, UserCheck, Filter, ShieldCheck, Wrench,
  Star, Phone, Check, ArrowRight, IndianRupee, MessageSquare, Zap,
  Camera, Upload, Image as ImageIcon, Eye, Sparkles, X, Package,
  UserPlus, Loader2, Briefcase, Layers, CheckSquare, Square
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
  { id: 'emp-1', name: 'Rajesh Kumar', role: 'Lead Installer', team: 'Installation Team Alpha', contact: '+91 98765 43210' },
  { id: 'emp-2', name: 'Suresh Patel', role: 'Electrician', team: 'Electrical Team', contact: '+91 98450 11223' },
  { id: 'emp-3', name: 'Anita Sharma', role: 'Survey Engineer', team: 'Site Survey Unit', contact: '+91 97112 33445' },
  { id: 'emp-4', name: 'Priya Varma', role: 'Design Engineer', team: 'Engineering Design', contact: '+91 99001 55667' },
  { id: 'emp-5', name: 'Vikram Rao', role: 'Procurement Officer', team: 'Supply Chain', contact: '+91 98223 77889' },
  { id: 'emp-6', name: 'Ramesh Reddy', role: 'Compliance Officer', team: 'DISCOM & Approvals', contact: '+91 98860 99001' },
  { id: 'emp-7', name: 'K. Swathi', role: 'Subsidy Specialist', team: 'Finance & Subsidy', contact: '+91 97400 22334' },
];

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

// Sample Material, Site Before, and Site After Photos
const SAMPLE_MATERIAL_PHOTOS = [
  'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80'
];

const SAMPLE_SURVEY_PHOTOS = [
  'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&w=800&q=80'
];

const SAMPLE_INSTALLATION_PHOTOS = [
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
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

  // Staff Assignment State
  const [selectedStaffForAssign, setSelectedStaffForAssign] = useState<StaffMember | null>(null);
  const [isAssignStaffModalOpen, setIsAssignStaffModalOpen] = useState(false);
  const [isSubmittingStaffAssign, setIsSubmittingStaffAssign] = useState(false);
  const [selectedTaskIdsForAssign, setSelectedTaskIdsForAssign] = useState<string[]>([]);
  
  // Add Staff Modal State
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    role: 'Lead Installer',
    team: 'Installation Unit',
    contact: ''
  });

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

  // Realtime subscription for users from Firestore to merge with staff list
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (!snapshot.empty) {
        const dbStaff: StaffMember[] = snapshot.docs.map(d => {
          const u = d.data();
          return {
            id: d.id,
            name: u.name || u.displayName || 'Employee',
            role: u.role || 'Field Engineer',
            team: u.department || u.team || 'Operations',
            contact: u.phone || u.email || ''
          };
        });

        // Merge without duplicates
        const merged = [...dbStaff];
        DEFAULT_STAFF.forEach(def => {
          if (!merged.some(m => m.name.toLowerCase() === def.name.toLowerCase())) {
            merged.push(def);
          }
        });
        setStaffList(merged);
      }
    });
    return () => unsubUsers();
  }, []);

  // Fetch Tasks for this project
  useEffect(() => {
    const q = query(collection(db, 'projectTasks'), where('projectId', '==', project.id), orderBy('start', 'asc'));
    const unsubTasks = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProjectTask)));
    });
    return () => unsubTasks();
  }, [project.id]);

  // Open Assign Modal for an Employee
  const handleOpenAssignModal = (staff: StaffMember) => {
    setSelectedStaffForAssign(staff);
    // Pre-select tasks currently assigned to this staff member
    const assignedIds = tasks.filter(t => t.assigneeId === staff.id || t.assigneeName === staff.name).map(t => t.id);
    setSelectedTaskIdsForAssign(assignedIds);
    setIsAssignStaffModalOpen(true);
  };

  // Direct 1-Click Set Project Lead
  const handleSetProjectLead = async (staff: StaffMember) => {
    setIsSubmittingStaffAssign(true);
    try {
      const updatedHistory = [
        ...(currentProject.history || []),
        {
          stage: currentProject.status,
          timestamp: new Date().toISOString(),
          note: `Assigned ${staff.name} (${staff.role}) as Project Lead`
        }
      ];

      await updateDoc(doc(db, 'projects', currentProject.id), {
        assignedTo: staff.name,
        assignedToId: staff.id,
        installerName: staff.name,
        installerId: staff.id,
        history: updatedHistory
      });

      toast.success(`Assigned ${staff.name} (${staff.role}) as Project Lead!`, 'Lead Assigned');
      setIsAssignStaffModalOpen(false);
      setSelectedStaffForAssign(null);
    } catch (err) {
      console.error('Error assigning staff lead:', err);
      toast.error('Failed to assign project lead.', 'Error');
    } finally {
      setIsSubmittingStaffAssign(false);
    }
  };

  // Assign staff to selected workflow tasks
  const handleSaveTaskAssignments = async (staff: StaffMember) => {
    setIsSubmittingStaffAssign(true);
    try {
      // Update selected tasks
      await Promise.all(
        tasks.map(t => {
          const shouldAssign = selectedTaskIdsForAssign.includes(t.id);
          if (shouldAssign) {
            return updateDoc(doc(db, 'projectTasks', t.id), {
              assigneeName: staff.name,
              assigneeId: staff.id,
              assigneeRole: staff.role
            });
          }
          return Promise.resolve();
        })
      );

      toast.success(`Assigned ${staff.name} to ${selectedTaskIdsForAssign.length} workflow task(s)!`, 'Tasks Delegated');
      setIsAssignStaffModalOpen(false);
      setSelectedStaffForAssign(null);
    } catch (err) {
      console.error('Error delegating tasks:', err);
      toast.error('Failed to delegate tasks.', 'Error');
    } finally {
      setIsSubmittingStaffAssign(false);
    }
  };

  // Add new staff member to roster and database
  const handleAddStaffMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffData.name.trim()) return;
    try {
      const newStaff: StaffMember = {
        id: `staff-${Date.now()}`,
        name: newStaffData.name.trim(),
        role: newStaffData.role,
        team: newStaffData.team,
        contact: newStaffData.contact
      };

      await addDoc(collection(db, 'users'), {
        name: newStaff.name,
        role: newStaff.role,
        department: newStaff.team,
        phone: newStaff.contact,
        createdAt: serverTimestamp()
      });

      setStaffList(prev => [newStaff, ...prev]);
      toast.success(`Added ${newStaff.name} to team roster!`, 'Staff Added');
      setIsAddStaffModalOpen(false);
      setNewStaffData({ name: '', role: 'Lead Installer', team: 'Installation Unit', contact: '' });
    } catch (err) {
      console.error('Error adding staff:', err);
      toast.error('Failed to add staff member.', 'Error');
    }
  };

  // Handle stage change with mandatory site photo gatekeeper & previous step completion check
  const handleUpdateStage = async (newStage: ProjectStatus) => {
    const currentIdx = PIPELINE_STAGES.indexOf(currentProject.status || 'Initial');
    const targetIdx = PIPELINE_STAGES.indexOf(newStage);

    // If clicking the current stage, no action needed
    if (targetIdx === currentIdx) {
      return;
    }

    // 1. Check if trying to skip ahead past uncompleted previous stages
    if (targetIdx > currentIdx + 1) {
      const skippedStages = PIPELINE_STAGES.slice(currentIdx + 1, targetIdx);
      const skippedList = skippedStages.map((s, i) => `Stage ${currentIdx + i + 2}: ${s}`).join('\n• ');

      const confirmSkip = window.confirm(
        `⚠️ Incomplete Previous Stages!\n\nYou are currently at Stage ${currentIdx + 1} (${currentProject.status || 'Initial'}).\n\nThe following previous stage(s) have not been completed:\n• ${skippedList}\n\nDo you want to complete previous stages and proceed directly to Stage ${targetIdx + 1} (${newStage})?`
      );

      if (!confirmSkip) {
        toast.warning(
          `Please complete Stage ${currentIdx + 2} (${PIPELINE_STAGES[currentIdx + 1]}) before advancing.`,
          'Prerequisite Required'
        );
        return;
      }
    }

    // 2. Mandatory Site Survey Photos check when moving to In Process or Assigned Installation
    if (['In Process', 'Assigned Installation'].includes(newStage) && (!currentProject.siteSurveyImagesUrls || currentProject.siteSurveyImagesUrls.length === 0)) {
      setPhotoModalType('survey');
      setActiveTab('photos');
      toast.warning("Site Survey photos are required before moving to In Process or Installation.", "Survey Photos Required");
      return;
    }

    // 3. Mandatory Installation Photos check when moving to Installation Complete or beyond
    if (['Installation Complete', 'Department Verification', 'Net Meter Installed'].includes(newStage) && (!currentProject.installationImagesUrls || currentProject.installationImagesUrls.length === 0)) {
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
  const handleSaveInstallationPhotos = async (urls: string[], installerNameInput?: string, categoryInput?: any) => {
    const existing = currentProject.installationImagesUrls || [];
    const merged = Array.from(new Set([...existing, ...urls]));
    const installerName = installerNameInput || currentProject.assignedTo || currentProject.installerName || 'Lead Field Installer';
    const photoCategory = categoryInput || 'Mounting Structure';

    const newRecords = urls.map((u, i) => ({
      id: `photo-${Date.now()}-${i}`,
      url: u,
      installerName: installerName,
      installerId: currentProject.installerId || 'installer-1',
      timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      category: photoCategory as any,
      caption: `${photoCategory} inspection photo by ${installerName}`
    }));

    const existingRecords = currentProject.installerPhotos || [];
    const updatedRecords = [...existingRecords, ...newRecords];

    try {
      await updateDoc(doc(db, 'projects', currentProject.id), {
        installationImagesUrls: merged,
        installerPhotos: updatedRecords,
        installationCompletedAt: new Date().toISOString()
      });
      setPhotoModalType(null);
      toast.success("Installation proof photos saved and categorized successfully!", "Photos Saved");
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
        assigneeName: currentProject.assignedTo || newTask.assigneeName || 'Assigned Field Officer',
        assigneeId: currentProject.assignedToId || newTask.assigneeId || '',
        assigneeRole: currentProject.assignedRole || newTask.requiredRole,
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
            const isNext = idx === currentStageIndex + 1;
            const isLocked = idx > currentStageIndex + 1;

            return (
              <button
                key={stage}
                onClick={() => handleUpdateStage(stage)}
                title={
                  isCurrent 
                    ? `Current Active Stage: ${stage}` 
                    : isCompleted 
                    ? `Stage ${idx + 1} (${stage}) Completed` 
                    : isNext 
                    ? `Next Step: Click to advance to Stage ${idx + 1} (${stage})` 
                    : `⚠️ Locked: Complete Stage ${currentStageIndex + 2} (${PIPELINE_STAGES[currentStageIndex + 1]}) first`
                }
                className={cn(
                  "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 relative group",
                  isCurrent 
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-lg ring-2 ring-emerald-400/40" 
                    : isCompleted 
                    ? "bg-slate-800 text-emerald-400 border-emerald-500/30 font-bold hover:bg-slate-750" 
                    : isNext
                    ? "bg-slate-900 text-emerald-300 border-emerald-500/50 hover:border-emerald-400 font-bold hover:bg-slate-850"
                    : "bg-slate-950/80 text-slate-500 border-slate-800 hover:border-amber-500/40 font-semibold"
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black">{idx + 1}</span>
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
                  ) : isNext ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ) : isLocked ? (
                    <span className="text-[10px] text-amber-500/60 group-hover:text-amber-400 transition-colors">🔒</span>
                  ) : null}
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
        <div className="space-y-6">
          {/* SECTION 1: MATERIAL PHOTOS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Category #1: Material & Hardware
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  Material Photos ({currentProject.materialPhotos?.length || 0})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Delivered solar panels, inverters, cables, and galvanized mounting structures on site.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await updateDoc(doc(db, 'projects', currentProject.id), { materialPhotos: SAMPLE_MATERIAL_PHOTOS });
                    toast.success("Sample material photos attached successfully!", "Materials Verified");
                  }}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Auto-Load Material Proofs
                </button>
                <button
                  onClick={() => setPhotoModalType('survey')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Material Photos
                </button>
              </div>
            </div>

            {(!currentProject.materialPhotos || currentProject.materialPhotos.length === 0) ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50/50">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-black text-slate-700">No Material Photos Uploaded</p>
                <p className="text-[11px] text-slate-400 font-medium">Capture solar module barcodes, inverter dispatch crates & cable rolls.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentProject.materialPhotos.map((img, idx) => (
                  <div key={idx} className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video shadow-sm">
                    <img src={img} alt={`Material ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => setPreviewImage(img)} className="p-2 bg-white/90 text-slate-900 rounded-full font-bold text-xs hover:bg-white transition-colors cursor-pointer">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black rounded-md">
                      Material #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: SITE BEFORE PHOTOS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Category #2: Pre-Installation Inspection
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  Site Before Photos ({surveyPhotoCount})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Pre-installation rooftop structure, existing electrical DB, shade orientation & DISCOM meter.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveSurveyPhotos(SAMPLE_SURVEY_PHOTOS)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Auto-Load Before Proofs
                </button>
                <button
                  onClick={() => setPhotoModalType('survey')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Site Before Photos
                </button>
              </div>
            </div>

            {/* Photo Grid */}
            {surveyPhotoCount === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50/50">
                <Camera className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-black text-slate-700">No Site Before Photos Uploaded</p>
                <p className="text-[11px] text-slate-400 font-medium">Click "Auto-Load Before Proofs" or upload pre-construction rooftop pictures.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentProject.siteSurveyImagesUrls?.map((img, idx) => (
                  <div key={idx} className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video shadow-sm">
                    <img src={img} alt={`Site Before ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => setPreviewImage(img)} className="p-2 bg-white/90 text-slate-900 rounded-full font-bold text-xs hover:bg-white transition-colors cursor-pointer">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black rounded-md">
                      Site Before #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: SITE AFTER PHOTOS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Category #3: Post-Installation Completion
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Site After Photos ({installationPhotoCount})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Commissioned solar panel array, inverter setup, AC/DC safety earthing & bi-directional net meter.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveInstallationPhotos(SAMPLE_INSTALLATION_PHOTOS)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Auto-Load After Proofs
                </button>
                <button
                  onClick={() => setPhotoModalType('installation')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Site After Photos
                </button>
              </div>
            </div>

            {/* Photo Grid - Stored & Displayed Separately */}
            {installationPhotoCount === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50/50">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-black text-slate-700">No Site After Photos Uploaded</p>
                <p className="text-[11px] text-slate-400 font-medium">Click "Auto-Load After Proofs" or upload final array & net metering photos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(currentProject.installerPhotos && currentProject.installerPhotos.length > 0 
                  ? currentProject.installerPhotos 
                  : (currentProject.installationImagesUrls || []).map((img, idx) => ({
                      id: `legacy-${idx}`,
                      url: img,
                      installerName: currentProject.assignedTo || 'Lead Solar Installer',
                      timestamp: 'Verified Commissioned Record',
                      category: idx === 0 ? 'Mounting Structure' : idx === 1 ? 'Panel Wiring' : 'Inverter Setup',
                      caption: `Site After proof #${idx + 1}`
                    }))
                ).map((photo, idx) => (
                  <div key={photo.id || idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md group flex flex-col justify-between">
                    <div className="relative aspect-video bg-slate-950 overflow-hidden">
                      <img src={photo.url} alt={photo.caption || `Proof ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => setPreviewImage(photo.url)} className="p-2.5 bg-white/90 text-slate-900 rounded-full font-bold text-xs hover:bg-white transition-colors cursor-pointer shadow-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500/90 text-slate-950 text-[9px] font-black rounded-md uppercase tracking-wider backdrop-blur-xs">
                        {photo.category || 'Site After Proof'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-emerald-400" /> {photo.installerName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{photo.timestamp}</span>
                      </div>
                      {photo.caption && (
                        <p className="text-[10px] text-slate-400 truncate font-medium">{photo.caption}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNED TEAM */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          {/* Team Roster Header Toolbar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Assigned Team Roster & Field Crew
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full border border-emerald-200">
                  {staffList.length} Personnel
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Click on any employee card to assign them as Project Lead or delegate specific workflow stages.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lead: <strong className="text-slate-900">{currentProject.assignedTo || 'None'}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Team Member</span>
              </button>
            </div>
          </div>

          {/* Employee Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map(staff => {
              const isProjectLead = currentProject.assignedTo === staff.name || currentProject.assignedToId === staff.id;
              const assignedTasks = tasks.filter(t => t.assigneeId === staff.id || t.assigneeName === staff.name);

              return (
                <div 
                  key={staff.id} 
                  onClick={() => handleOpenAssignModal(staff)}
                  className={cn(
                    "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden",
                    isProjectLead
                      ? "bg-gradient-to-br from-emerald-50/90 to-teal-50/70 border-emerald-400 shadow-md ring-2 ring-emerald-500/20"
                      : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md"
                  )}
                >
                  {/* Top: Avatar, Name & Lead Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-xs shrink-0",
                        isProjectLead 
                          ? "bg-gradient-to-br from-emerald-600 to-teal-600" 
                          : "bg-gradient-to-br from-slate-700 to-slate-900 group-hover:from-emerald-600 group-hover:to-teal-600 transition-colors"
                      )}>
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                          {staff.name}
                        </p>
                        <span className="inline-block text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md mt-0.5">
                          {staff.role}
                        </span>
                      </div>
                    </div>

                    {isProjectLead && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px] flex items-center gap-1 shadow-xs animate-pulse shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" /> Lead
                      </span>
                    )}
                  </div>

                  {/* Middle: Department & Contact */}
                  <div className="space-y-1 text-[11px] text-slate-500 font-medium border-t border-slate-100/80 pt-2">
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{staff.team || 'Installation Operations'}</span>
                    </p>
                    {staff.contact && (
                      <p className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{staff.contact}</span>
                      </p>
                    )}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-[10px]">
                    <span className={cn(
                      "font-bold px-2 py-0.5 rounded-md",
                      assignedTasks.length > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                    )}>
                      {assignedTasks.length > 0 ? `✓ ${assignedTasks.length} Task(s) Assigned` : 'No Tasks Yet'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAssignModal(staff);
                      }}
                      className={cn(
                        "px-3 py-1 rounded-xl font-black text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-xs",
                        isProjectLead
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-slate-100 text-slate-700 hover:bg-emerald-600 hover:text-white border border-slate-200 hover:border-emerald-600"
                      )}
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>{isProjectLead ? 'Manage' : 'Assign'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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

      {/* ASSIGN EMPLOYEE MODAL */}
      {isAssignStaffModalOpen && selectedStaffForAssign && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[100] overflow-y-auto p-4 sm:p-6 flex items-start justify-center pt-24 sm:pt-28 pb-16"
          onClick={() => setIsAssignStaffModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[calc(100vh-8.5rem)] flex flex-col min-h-0 overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 font-sans"
            onClick={e => e.stopPropagation()}
          >
            {/* Sticky Header with Prominent Close Button */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 sticky top-0 z-30 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Assign Employee to Project</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{currentProject.customerName} ({currentProject.capacityKw} kW Solar)</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAssignStaffModalOpen(false)} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all shadow-xs border border-red-200 hover:border-red-500 cursor-pointer shrink-0"
                title="Close Form (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">
              {/* Employee Card */}
              <div className="p-4 bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                    {selectedStaffForAssign.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{selectedStaffForAssign.name}</h4>
                    <p className="text-xs font-bold text-emerald-700">{selectedStaffForAssign.role}</p>
                    <p className="text-[11px] text-slate-500">{selectedStaffForAssign.team} {selectedStaffForAssign.contact ? `• ${selectedStaffForAssign.contact}` : ''}</p>
                  </div>
                </div>
                {currentProject.assignedTo === selectedStaffForAssign.name && (
                  <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-xs rounded-xl flex items-center gap-1 shrink-0">
                    <Check className="w-3.5 h-3.5" /> Current Lead
                  </span>
                )}
              </div>

              {/* Action 1: Set as Project Lead */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Primary Project Lead Assignment</h5>
                    <p className="text-[11px] text-slate-500 font-medium">Assigns {selectedStaffForAssign.name} as the primary lead displayed on project records.</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSubmittingStaffAssign}
                  onClick={() => handleSetProjectLead(selectedStaffForAssign)}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingStaffAssign ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  <span>{currentProject.assignedTo === selectedStaffForAssign.name ? 'Reconfirm as Project Lead' : '★ Confirm as Primary Project Lead'}</span>
                </button>
              </div>

              {/* Action 2: Delegate Workflow Tasks */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" /> Delegate Workflow Tasks
                    </h5>
                    <p className="text-[11px] text-slate-500">Select tasks for {selectedStaffForAssign.name} to complete</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedTaskIdsForAssign(tasks.map(t => t.id))}
                      className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTaskIdsForAssign([])}
                      className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {tasks.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">No tasks added to this project yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {tasks.map(task => {
                      const isSelected = selectedTaskIdsForAssign.includes(task.id);
                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            setSelectedTaskIdsForAssign(prev =>
                              prev.includes(task.id) ? prev.filter(id => id !== task.id) : [...prev, task.id]
                            );
                          }}
                          className={cn(
                            "p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors",
                            isSelected ? "bg-emerald-50 border-emerald-400 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span>{task.name}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                            {task.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  disabled={isSubmittingStaffAssign || tasks.length === 0}
                  onClick={() => handleSaveTaskAssignments(selectedStaffForAssign)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingStaffAssign ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListTodo className="w-4 h-4 text-emerald-400" />}
                  <span>Save Task Delegation ({selectedTaskIdsForAssign.length} selected)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW TEAM MEMBER MODAL */}
      {isAddStaffModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[100] overflow-y-auto p-4 sm:p-6 flex items-start justify-center pt-24 sm:pt-28 pb-16"
          onClick={() => setIsAddStaffModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[calc(100vh-8.5rem)] flex flex-col min-h-0 overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 font-sans"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900">Add New Team Member</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Register engineer or installer into company crew roster</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all shadow-xs border border-red-200 hover:border-red-500 cursor-pointer shrink-0"
                title="Close Form (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={handleAddStaffMember} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  value={newStaffData.name}
                  onChange={e => setNewStaffData({ ...newStaffData, name: e.target.value })}
                  placeholder="e.g. Arvind Sharma"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role / Specialization *</label>
                <select
                  value={newStaffData.role}
                  onChange={e => setNewStaffData({ ...newStaffData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                >
                  <option value="Lead Installer">Lead Installer</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Survey Engineer">Survey Engineer</option>
                  <option value="Design Engineer">Design Engineer</option>
                  <option value="Procurement Officer">Procurement Officer</option>
                  <option value="Compliance Officer">Compliance Officer</option>
                  <option value="Subsidy Specialist">Subsidy Specialist</option>
                  <option value="Project Manager">Project Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department / Team</label>
                <input
                  type="text"
                  value={newStaffData.team}
                  onChange={e => setNewStaffData({ ...newStaffData, team: e.target.value })}
                  placeholder="e.g. Installation Team Alpha"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={newStaffData.contact}
                  onChange={e => setNewStaffData({ ...newStaffData, contact: e.target.value })}
                  placeholder="e.g. +91 98765 00000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-3 flex gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add to Roster</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {isTaskModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[100] overflow-y-auto p-4 sm:p-6 flex items-start justify-center pt-24 sm:pt-28 pb-16"
          onClick={() => setIsTaskModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[calc(100vh-8.5rem)] flex flex-col min-h-0 overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 font-sans"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-emerald-600" /> Add Project Task
              </h3>
              <button 
                type="button"
                onClick={() => setIsTaskModalOpen(false)} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all shadow-xs border border-red-200 hover:border-red-500 cursor-pointer shrink-0"
                title="Close Form (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Task Description *</label>
                <input required type="text" value={newTask.name} onChange={e => setNewTask({ ...newTask, name: e.target.value })} placeholder="e.g. Earthing & AC DB Connection" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Required Role</label>
                <select value={newTask.requiredRole} onChange={e => setNewTask({ ...newTask, requiredRole: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                  <option value="Lead Installer">Lead Installer</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Survey Engineer">Survey Engineer</option>
                  <option value="Design Engineer">Design Engineer</option>
                  <option value="Compliance Officer">Compliance Officer</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-1">
                <span className="text-[10px] uppercase font-black text-emerald-900 tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" /> Auto-Assigned Officer / Solar Installer
                </span>
                <p className="text-xs font-bold text-slate-800">
                  {currentProject.assignedTo || 'Assigned via Employee Card in HR Module'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Employees are assigned directly from Employee Cards to keep project responsibilities in sync.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl text-xs hover:bg-emerald-700 shadow-md shadow-emerald-200 cursor-pointer">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

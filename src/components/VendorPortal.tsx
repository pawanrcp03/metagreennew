import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  FileText, 
  IndianRupee, 
  Package, 
  CheckCircle2, 
  Upload, 
  Clock, 
  FileCheck,
  Download,
  FileSpreadsheet,
  Building2,
  Filter,
  Users,
  UserPlus,
  CheckSquare,
  Plus,
  Trash2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Check,
  ListTodo,
  Sparkles
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { exportToPDF, exportToExcel } from '@/src/lib/exportUtils';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';

type TabType = 'po' | 'invoices' | 'employees' | 'tasks' | 'payments' | 'dispatch';

export interface VendorEmployee {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  vendorName: string;
  status: 'Active' | 'Inactive';
  tempPassword?: string;
  permissions?: {
    canAcceptPOs?: boolean;
    canManageTasks?: boolean;
    canUploadPhotos?: boolean;
    canViewInvoices?: boolean;
    canManageTeam?: boolean;
  };
  createdAt?: any;
}

export interface VendorTask {
  id: string;
  title: string;
  description: string;
  assignedToName: string;
  assignedToEmail: string;
  poRef: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  vendorName: string;
  createdAt?: any;
}

export default function VendorPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('po');
  const [pos, setPOs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<VendorEmployee[]>([]);
  const [tasks, setTasks] = useState<VendorTask[]>([]);

  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('ALL');
  const [availableVendors, setAvailableVendors] = useState<string[]>([]);

  // User Limit for Subscription Plan (Defaults to 3 for Starter, 5 for Growth)
  const userLimit = user?.vendorAccount?.userLimit || 3;

  // Modals state
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [newEmp, setNewEmp] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    designation: '',
    password: 'VendorEmp123!',
    permissions: {
      canAcceptPOs: true,
      canManageTasks: true,
      canUploadPhotos: true,
      canViewInvoices: false,
      canManageTeam: false
    }
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedToEmail: '',
    poRef: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  });

  const currentVendorName = user?.role === 'Vendor' 
    ? (user.companyName || user.name || 'Vikram Solar') 
    : (selectedVendorFilter === 'ALL' ? 'Vikram Solar' : selectedVendorFilter);

  useEffect(() => {
    const unsubPOs = onSnapshot(query(collection(db, 'purchaseOrders'), orderBy('date', 'desc')), (snapshot) => {
      const fetchedPOs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setPOs(fetchedPOs);
      const uniqueVendors = Array.from(new Set(fetchedPOs.map(p => p.vendor).filter(Boolean)));
      setAvailableVendors(uniqueVendors);
    });

    const unsubPayments = onSnapshot(query(collection(db, 'vendorPayments'), orderBy('dueDate', 'desc')), (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubEmp = onSnapshot(query(collection(db, 'vendorEmployees'), orderBy('createdAt', 'desc')), (snapshot) => {
      setEmployees(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VendorEmployee)));
    });

    const unsubTasks = onSnapshot(query(collection(db, 'vendorTasks'), orderBy('createdAt', 'desc')), (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VendorTask)));
    });

    return () => { unsubPOs(); unsubPayments(); unsubEmp(); unsubTasks(); };
  }, []);

  // Filtered POs
  const filteredPOs = pos.filter(po => {
    if (user?.role === 'Vendor') {
      return po.vendor?.toLowerCase().includes(user.name?.toLowerCase() || '') ||
             po.vendor?.toLowerCase().includes((user.email || '').split('@')[0].toLowerCase()) ||
             po.vendor?.toLowerCase().includes((user.companyName || '').toLowerCase());
    }
    if (selectedVendorFilter !== 'ALL') return po.vendor === selectedVendorFilter;
    return true;
  });

  // Filtered Employees
  const filteredEmployees = employees.filter(emp => {
    if (user?.role === 'Vendor') {
      return emp.vendorName?.toLowerCase().includes((user.companyName || user.name || '').toLowerCase());
    }
    if (selectedVendorFilter !== 'ALL') return emp.vendorName === selectedVendorFilter;
    return true;
  });

  // Filtered Tasks
  const filteredTasks = tasks.filter(t => {
    if (user?.role === 'Vendor') {
      return t.vendorName?.toLowerCase().includes((user.companyName || user.name || '').toLowerCase());
    }
    if (selectedVendorFilter !== 'ALL') return t.vendorName === selectedVendorFilter;
    return true;
  });

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredEmployees.length >= userLimit) {
      toast.warning(`Subscription User Limit Reached (${filteredEmployees.length}/${userLimit} Users). Please upgrade your Subscription Plan to add more vendor employees.`, 'User Limit Reached');
      return;
    }

    try {
      const tempPass = newEmp.password || 'VendorEmp123!';
      const empRef = await addDoc(collection(db, 'vendorEmployees'), {
        name: newEmp.name,
        email: newEmp.email,
        phone: newEmp.phone,
        designation: newEmp.designation,
        tempPassword: tempPass,
        permissions: newEmp.permissions,
        vendorName: currentVendorName,
        status: 'Active',
        createdAt: serverTimestamp()
      });

      // Pre-create user profile document for login auth
      await addDoc(collection(db, 'users'), {
        uid: empRef.id,
        email: newEmp.email,
        name: newEmp.name,
        role: 'Vendor Employee',
        companyName: currentVendorName,
        status: 'Active',
        mustChangePassword: true,
        isFirstLogin: true,
        tempPassword: tempPass,
        permissions: newEmp.permissions,
        createdAt: serverTimestamp()
      });

      setIsEmpModalOpen(false);
      const createdName = newEmp.name;
      const createdEmail = newEmp.email;

      setNewEmp({ 
        name: '', 
        email: '', 
        phone: '', 
        designation: 'Vendor Field Engineer / Installer',
        password: 'VendorEmp123!',
        permissions: {
          canAcceptPOs: true,
          canManageTasks: true,
          canUploadPhotos: true,
          canViewInvoices: false,
          canManageTeam: false
        }
      });

      toast.success(`Vendor Employee ${createdName} created! Email: ${createdEmail}, Password: ${tempPass}`, 'Employee Created');
    } catch (err) {
      console.error('Error adding employee:', err);
      toast.error('Failed to create vendor employee.', 'Error');
    }
  };

  const handleDeleteEmployee = async (empId: string) => {
    if (window.confirm("Are you sure you want to remove this vendor employee?")) {
      try {
        await deleteDoc(doc(db, 'vendorEmployees', empId));
        toast.info("Vendor employee account removed.", "Employee Removed");
      } catch (err) {
        console.error('Error deleting employee:', err);
        toast.error("Failed to remove employee.", "Error");
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.assignedToEmail) {
      toast.warning("Please select an employee to assign this task.", "Assignee Required");
      return;
    }

    const assignedEmp = filteredEmployees.find(e => e.email === newTask.assignedToEmail);

    try {
      await addDoc(collection(db, 'vendorTasks'), {
        title: newTask.title,
        description: newTask.description,
        assignedToName: assignedEmp?.name || newTask.assignedToEmail,
        assignedToEmail: newTask.assignedToEmail,
        poRef: newTask.poRef || 'N/A',
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        status: 'Pending',
        vendorName: currentVendorName,
        createdAt: serverTimestamp()
      });
      setIsTaskModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        assignedToEmail: '',
        poRef: '',
        priority: 'Medium',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
      });
      toast.success(`Task "${newTask.title}" assigned to ${assignedEmp?.name || newTask.assignedToEmail}!`, 'Task Assigned');
    } catch (err) {
      console.error('Error creating task:', err);
      toast.error("Failed to create vendor task.", "Task Error");
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    try {
      await updateDoc(doc(db, 'vendorTasks', taskId), { status: newStatus });
      toast.info(`Task status updated to ${newStatus}.`, "Status Updated");
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteDoc(doc(db, 'vendorTasks', taskId));
        toast.info("Vendor task deleted.", "Task Deleted");
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }
  };

  const handleExportPO_PDF = () => {
    const headers = ['PO Number', 'Date', 'Items', 'Amount', 'Status'];
    const data = filteredPOs.map(po => [po.displayId || po.id, po.date, po.items, po.amount, po.status]);
    exportToPDF('Purchase Orders', headers, data);
  };

  const handleExportPO_Excel = () => {
    exportToExcel('Purchase Orders', filteredPOs);
  };

  const handleAcceptPO = async (id: string) => {
    try {
      await updateDoc(doc(db, 'purchaseOrders', id), { 
        status: 'Accepted',
        stage: 2
      });
      toast.success("Purchase Order accepted successfully! Global Admin has been notified.", "PO Accepted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept Purchase Order.", "Error");
    }
  };

  const handleVendorLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.uid) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const logoDataUrl = evt.target?.result as string;
        try {
          await updateDoc(doc(db, 'users', user.uid), { companyLogo: logoDataUrl });
          await updateDoc(doc(db, 'vendorAccounts', user.uid), { companyLogo: logoDataUrl });
          toast.success("Vendor Company Logo updated successfully!", "Branding Updated");
        } catch (err) {
          console.error('Error uploading logo:', err);
          toast.error("Failed to update company logo.", "Error");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 lg:p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <div className="w-14 h-14 rounded-2xl border-2 border-emerald-100 bg-slate-50 p-1 flex items-center justify-center overflow-hidden shadow-sm">
              {user?.companyLogo || user?.vendorAccount?.companyLogo ? (
                <img src={user.companyLogo || user.vendorAccount?.companyLogo} alt="Vendor Logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <Building2 className="w-7 h-7 text-emerald-600" />
              )}
            </div>
            {user?.role === 'Vendor' && (
              <label className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-full cursor-pointer hover:bg-emerald-700 shadow-md transition-transform hover:scale-105" title="Upload / Change Vendor Logo">
                <Upload className="w-3 h-3" />
                <input type="file" accept="image/*" onChange={handleVendorLogoUpload} className="hidden" />
              </label>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Vendor: {currentVendorName}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Vendor Operations & Employee Task Portal
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage purchase orders, vendor employees (User Limit: {filteredEmployees.length}/{userLimit}), and internal employee task assignments.
            </p>
          </div>
        </div>

        {/* Vendor Filter Dropdown for Admin */}
        {user?.role !== 'Vendor' && (
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase">Vendor Filter:</span>
            <select 
              value={selectedVendorFilter}
              onChange={e => setSelectedVendorFilter(e.target.value)}
              className="text-xs font-bold bg-white p-1.5 border border-slate-200 rounded-lg outline-none"
            >
              <option value="ALL">All Vendor Orders</option>
              {availableVendors.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        )}
      </header>

      {/* Active Subscription Plan & Quota Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-5 rounded-2xl text-white border border-slate-700 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded-full uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Plan: {user?.vendorAccount?.planName || 'Starter Solar Vendor (3 Users)'}
            </span>
            <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-black rounded-full uppercase tracking-wider border border-cyan-500/30">
              7-Day Trial Active
            </span>
          </div>
          <p className="text-sm font-extrabold text-slate-100">
            Company: {currentVendorName} • User Seat Quota: {filteredEmployees.length} / {userLimit} Seats
          </p>
          <p className="text-xs text-slate-400 font-medium">
            Cloud Storage Vault: {user?.vendorAccount?.storageGBLimit || 10} GB Scope • Unlimited PO & Auto-Inventory Processing
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-700">
          <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-center flex-1 md:flex-initial">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Team Members</p>
            <p className="text-sm font-black text-emerald-400">{filteredEmployees.length} / {userLimit} Seats</p>
          </div>
          <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-center flex-1 md:flex-initial">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Tasks</p>
            <p className="text-sm font-black text-teal-400">{filteredTasks.length} Tasks</p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar border-b border-slate-100">
        {[
          { id: 'po', label: '1. Vendor Purchase Orders', icon: FileText },
          { id: 'employees', label: `2. Vendor Team (${filteredEmployees.length}/${userLimit} Users)`, icon: Users },
          { id: 'tasks', label: `3. Employee Task Assignment (${filteredTasks.length})`, icon: CheckSquare },
          { id: 'invoices', label: '4. Upload Tax Invoices', icon: Upload },
          { id: 'payments', label: '5. Payment Ledger', icon: IndianRupee },
          { id: 'dispatch', label: '6. Material Dispatch', icon: Truck },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.id 
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'po' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 gap-2">
            <span className="text-xs font-black uppercase text-slate-700">
              Showing {filteredPOs.length} PO{filteredPOs.length !== 1 ? 's' : ''} for {currentVendorName}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={handleExportPO_PDF} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs shadow-xs">
                <Download className="w-3.5 h-3.5 text-red-500" /> Export PDF
              </button>
              <button onClick={handleExportPO_Excel} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5 text-xs shadow-xs">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
              </button>
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                <th className="p-4">PO Number</th>
                <th className="p-4">Vendor</th>
                <th className="p-4">Date</th>
                <th className="p-4">Items Description</th>
                <th className="p-4 text-right">Amount (₹)</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Vendor Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredPOs.map(po => (
                <tr key={po.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">{po.displayId || po.id}</td>
                  <td className="p-4 font-extrabold text-blue-900">{po.vendor}</td>
                  <td className="p-4 text-slate-600">{po.date}</td>
                  <td className="p-4 text-slate-600 max-w-xs">{po.items}</td>
                  <td className="p-4 text-right font-black text-slate-900">₹{po.amount?.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      po.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      po.status === 'Received & Invoiced' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      'bg-amber-50 text-amber-800 border-amber-200'
                    )}>{po.status}</span>
                  </td>
                  <td className="p-4 text-center">
                    {po.status === 'Accepted' || po.status === 'Received & Invoiced' ? (
                      <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Accepted
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleAcceptPO(po.id)} 
                        className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold transition-all shadow-xs"
                      >
                        Accept PO
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: VENDOR TEAM & EMPLOYEES (USER LIMIT ENFORCED) */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" /> Vendor Staff Directory
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Subscription Plan User Capacity: <span className="font-bold text-slate-900">{filteredEmployees.length} / {userLimit} Users Used</span>
              </p>
            </div>

            <button
              onClick={() => setIsEmpModalOpen(true)}
              disabled={filteredEmployees.length >= userLimit}
              className={cn(
                "px-4 py-2 text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer",
                filteredEmployees.length >= userLimit
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
              )}
            >
              <UserPlus className="w-4 h-4" /> + Add Vendor Employee
            </button>
          </div>

          {filteredEmployees.length >= userLimit && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>User Limit Reached ({filteredEmployees.length}/{userLimit} Users). Upgrade your Subscription Plan to invite more employees.</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">Employee Name</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Assigned Permissions</th>
                  <th className="p-4">Contact Details</th>
                  <th className="p-4">Vendor Company</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                      No vendor employees added yet. Click "+ Add Vendor Employee" to invite team members!
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-black text-xs">
                          {emp.name.charAt(0)}
                        </div>
                        {emp.name}
                      </td>
                      <td className="p-4 font-bold text-emerald-700">{emp.designation}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {emp.permissions?.canAcceptPOs !== false && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold border border-blue-100">POs</span>}
                          {emp.permissions?.canManageTasks !== false && <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded text-[9px] font-bold border border-teal-100">Tasks</span>}
                          {emp.permissions?.canUploadPhotos !== false && <span className="px-1.5 py-0.5 bg-cyan-50 text-cyan-700 rounded text-[9px] font-bold border border-cyan-100">Photos</span>}
                          {emp.permissions?.canViewInvoices && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold border border-emerald-100">Invoices</span>}
                          {emp.permissions?.canManageTeam && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[9px] font-bold border border-purple-100">Team</span>}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">
                        <p className="font-semibold text-slate-800">{emp.email}</p>
                        <p className="text-[11px] text-slate-400">{emp.phone}</p>
                        {emp.tempPassword && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded font-mono text-[9px] font-extrabold border border-amber-200">
                            🔑 Pass: {emp.tempPassword}
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-700">{emp.vendorName}</td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase border border-emerald-200">
                          {emp.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg transition-colors">
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

      {/* TAB 3: EMPLOYEE TASK ASSIGNMENT */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" /> Internal Employee Task Assignment
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Assign PO dispatch, material assembly, or site delivery jobs to vendor employees
              </p>
            </div>

            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> + Create & Assign Task
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-bold">
                <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                No tasks assigned yet. Click "+ Create & Assign Task" to assign jobs to vendor staff!
              </div>
            ) : (
              filteredTasks.map(task => (
                <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                      task.priority === 'Urgent' ? "bg-red-100 text-red-800" :
                      task.priority === 'High' ? "bg-amber-100 text-amber-800" :
                      "bg-blue-100 text-blue-800"
                    )}>
                      {task.priority} Priority
                    </span>

                    <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900">{task.title}</h4>
                    {task.description && <p className="text-xs text-slate-500 font-medium mt-1">{task.description}</p>}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-700 font-semibold border border-slate-100">
                    <p><span className="text-slate-400">Assigned To:</span> {task.assignedToName}</p>
                    <p><span className="text-slate-400">PO Ref:</span> {task.poRef}</p>
                    <p><span className="text-slate-400">Due Date:</span> {task.dueDate}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <select
                      value={task.status}
                      onChange={e => handleUpdateTaskStatus(task.id, e.target.value as any)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>

                    <span className={cn(
                      "text-xs font-black uppercase flex items-center gap-1",
                      task.status === 'Completed' ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {task.status === 'Completed' && <Check className="w-3.5 h-3.5" />}
                      {task.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: UPLOAD TAX INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-500 space-y-4">
          <FileText className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Upload Vendor Tax Invoice</h3>
          <p className="max-w-md mx-auto text-xs text-slate-500">Vendors can upload tax invoices against accepted POs for payment processing.</p>
          <div>
            <input type="file" id="vendor-invoice-upload" className="hidden" onChange={() => alert('Invoice uploaded successfully.')} />
            <label htmlFor="vendor-invoice-upload" className="cursor-pointer px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2 text-xs shadow-sm mx-auto">
              <Upload className="w-4 h-4" /> Select & Upload Invoice
            </label>
          </div>
        </div>
      )}

      {/* TAB 5: PAYMENTS LEDGER */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white text-slate-500 font-bold uppercase tracking-widest border-b border-slate-100">
                <th className="p-4">Invoice No</th>
                <th className="p-4">PO Ref</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Due Date</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">{p.invoice}</td>
                  <td className="p-4 text-slate-600">{p.po}</td>
                  <td className="p-4 font-bold">{p.amount}</td>
                  <td className="p-4 text-slate-600">{p.dueDate}</td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-100">{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: DISPATCH TRACKING */}
      {activeTab === 'dispatch' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-500 space-y-3">
          <Truck className="w-12 h-12 text-blue-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Dispatch & Delivery Tracking</h3>
          <p className="max-w-md mx-auto text-xs">Vendors can update dispatch details (LR number, Transporter, expected ETA) for materials sent to the site.</p>
        </div>
      )}

      {/* ADD VENDOR EMPLOYEE MODAL */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" /> Add Vendor Employee
              </h3>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-4 overflow-y-auto flex-1 font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Employee Full Name *</label>
                <input required type="text" value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })} placeholder="e.g. Amit Kumar" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                <input required type="email" value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })} placeholder="employee@vendor.com" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                <input required type="tel" value={newEmp.phone} onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })} placeholder="+91 98765 43210" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Initial Login Password *</label>
                  <button 
                    type="button" 
                    onClick={() => setNewEmp({ ...newEmp, password: `Emp${Math.floor(1000 + Math.random() * 9000)}!` })}
                    className="text-[10px] font-black text-emerald-600 hover:underline cursor-pointer"
                  >
                    ⚡ Auto-Generate
                  </button>
                </div>
                <input 
                  required 
                  type="text" 
                  value={newEmp.password} 
                  onChange={e => setNewEmp({ ...newEmp, password: e.target.value })} 
                  placeholder="Min 6 chars (e.g. VendorEmp123!)" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Employee will use this email & temporary password to sign in for the first time.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Employee Designation / Job Role *</label>
                <input 
                  required 
                  type="text" 
                  value={newEmp.designation} 
                  onChange={e => setNewEmp({ ...newEmp, designation: e.target.value })} 
                  placeholder="e.g. Lead Rooftop Installer, Field Dispatch Tech, Warehouse Manager" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>

              {/* Granular Role Permissions Section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider">
                  🔐 Employee Role Permissions & Access Control
                </label>
                <div className="space-y-1.5 text-xs font-semibold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newEmp.permissions.canAcceptPOs}
                      onChange={e => setNewEmp({ ...newEmp, permissions: { ...newEmp.permissions, canAcceptPOs: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Can Accept / Reject Purchase Orders</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newEmp.permissions.canManageTasks}
                      onChange={e => setNewEmp({ ...newEmp, permissions: { ...newEmp.permissions, canManageTasks: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Can View & Update Employee Tasks</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newEmp.permissions.canUploadPhotos}
                      onChange={e => setNewEmp({ ...newEmp, permissions: { ...newEmp.permissions, canUploadPhotos: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Can Upload Site Survey & Installation Photos</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newEmp.permissions.canViewInvoices}
                      onChange={e => setNewEmp({ ...newEmp, permissions: { ...newEmp.permissions, canViewInvoices: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Can View & Download Tax Invoices</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newEmp.permissions.canManageTeam}
                      onChange={e => setNewEmp({ ...newEmp, permissions: { ...newEmp.permissions, canManageTeam: e.target.checked } })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Can Manage Team Directory & Staff</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsEmpModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl text-xs hover:bg-emerald-700 shadow-md shadow-emerald-200">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE & ASSIGN TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" /> Create & Assign Employee Task
              </h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 overflow-y-auto flex-1 font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Task Title *</label>
                <input required type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="e.g. Inspect Panel Shipment Batch for PO-2026-001" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign to Vendor Employee *</label>
                <select required value={newTask.assignedToEmail} onChange={e => setNewTask({ ...newTask, assignedToEmail: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20">
                  <option value="">-- Select Vendor Employee --</option>
                  {filteredEmployees.map(emp => (
                    <option key={emp.id} value={emp.email}>{emp.name} ({emp.designation})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PO Reference</label>
                  <select value={newTask.poRef} onChange={e => setNewTask({ ...newTask, poRef: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20">
                    <option value="N/A">General Task</option>
                    {filteredPOs.map(po => (
                      <option key={po.id} value={po.displayId || po.id}>{po.displayId || po.id} - ₹{po.amount?.toLocaleString()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date *</label>
                <input required type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Task Instructions / Description</label>
                <textarea rows={2} value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Enter detailed job instructions for the assigned technician..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl text-xs hover:bg-emerald-700 shadow-md shadow-emerald-200">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  IndianRupee, 
  MapPin, 
  TrendingUp, 
  UserCheck, 
  UserPlus, 
  Search, 
  Filter,
  Download,
  FileSpreadsheet, Edit2, Trash2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { exportToPDF, exportToExcel } from '@/src/lib/exportUtils';

type TabType = 'employees' | 'attendance' | 'payroll' | 'teams' | 'performance' | 'gps';
type EmployeeStatus = 'Active' | 'Inactive' | 'On Leave';

interface Employee {
  id: string;
  name: string;
  email?: string;
  role: string;
  team: string;
  contact: string;
  status: EmployeeStatus;
  salaryType?: 'Fixed Salary' | 'Commission Only' | 'Fixed + Commission';
  baseSalary?: number;
  commissionRate?: number;
  joinedAt?: any;
}

export default function HRModule() {
  const [activeTab, setActiveTab] = useState<TabType>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'Survey Engineer',
    team: 'Team Alpha',
    contact: '',
    status: 'Active' as EmployeeStatus,
    salaryType: 'Fixed Salary' as 'Fixed Salary' | 'Commission Only' | 'Fixed + Commission',
    baseSalary: 35000,
    commissionRate: 5
  });

  useEffect(() => {
    const q = query(collection(db, 'employees'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
      } else {
        setEmployees([
          { id: 'E1', name: 'Rajesh Kumar', role: 'Lead Installer', team: 'Team Alpha', contact: '+91 98765 43210', status: 'Active' },
          { id: 'E2', name: 'Suresh Patel', role: 'Site Surveyor', team: 'Team Bravo', contact: '+91 98765 43211', status: 'Active' },
        ]);
      }
    });
    return () => unsub();
  }, []);

  const handleSubmitEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployeeId) {
        await updateDoc(doc(db, 'employees', editingEmployeeId), newEmployee);
      } else {
        await addDoc(collection(db, 'employees'), {
          ...newEmployee,
          joinedAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingEmployeeId(null);
      setNewEmployee({
        name: '',
        role: 'Survey Engineer',
        team: 'Team Alpha',
        contact: '',
        status: 'Active'
      });
    } catch (err) {
      console.error('Error saving employee', err);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await deleteDoc(doc(db, 'employees', id));
      } catch (err) {
        console.error('Error deleting employee', err);
      }
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportPDF = () => {
    const headers = ['Employee Name', 'Role', 'Team', 'Contact', 'Status'];
    const data = filteredEmployees.map(e => [e.name, e.role, e.team, e.contact, e.status]);
    exportToPDF('Employees Report', headers, data);
  };

  const handleExportExcel = () => {
    const data = filteredEmployees.map(e => ({
      'Employee Name': e.name,
      'Role': e.role,
      'Team': e.team,
      'Contact': e.contact,
      'Status': e.status
    }));
    exportToExcel('Employees Report', data);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'employees':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
              <div className="relative w-full md:w-96 flex items-center">
                <Search className="w-5 h-5 absolute left-3 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search employees..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button onClick={handleExportPDF} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm shadow-sm" title="Export PDF">
                  <Download className="w-4 h-4 text-red-500" />
                </button>
                <button onClick={handleExportExcel} className="px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 text-sm shadow-sm" title="Export Excel">
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm shadow-sm">
                  <UserPlus className="w-4 h-4" /> Add Employee
                </button>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">Employee Name</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Team</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{emp.name}</td>
                    <td className="p-4 text-slate-600">{emp.role}</td>
                    <td className="p-4 text-slate-600">{emp.team}</td>
                    <td className="p-4 text-sm text-slate-500">{emp.contact}</td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                        emp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        emp.status === 'On Leave' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      )}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingEmployeeId(emp.id);
                            setNewEmployee({
                              name: emp.name,
                              role: emp.role,
                              team: emp.team,
                              contact: emp.contact || '',
                              status: emp.status
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors"
                          title="Edit Employee"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case 'attendance':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-500">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Attendance Management</h3>
            <p className="max-w-md mx-auto">Track check-ins, check-outs, and leaves. Integrates with GPS tracking for field staff.</p>
          </div>
        );
      case 'payroll':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-500">
            <IndianRupee className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Payroll Processing</h3>
            <p className="max-w-md mx-auto">Manage salaries, commissions, bonuses, and deductions based on attendance and performance.</p>
          </div>
        );
      case 'teams':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Team Management</h3>
            <p className="max-w-md mx-auto">Organize employees into teams (e.g., Installation Team Alpha, Survey Team Bravo) for easier dispatching.</p>
          </div>
        );
      case 'performance':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-500">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Installer Performance</h3>
            <p className="max-w-md mx-auto">Track installation times, quality scores, and customer feedback to measure installer performance.</p>
          </div>
        );
      case 'gps':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-500">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">GPS Tracking</h3>
            <p className="max-w-md mx-auto">Live tracking of field staff vehicles and real-time location check-ins at project sites.</p>
          </div>
        );
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-emerald-600" /> HR & Workforce Management
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage employees, attendance, payroll, and field staff performance.</p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'employees', label: 'Employees', icon: Users },
          { id: 'attendance', label: 'Attendance', icon: Clock },
          { id: 'payroll', label: 'Payroll', icon: IndianRupee },
          { id: 'teams', label: 'Teams', icon: Users },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'gps', label: 'GPS Tracking', icon: MapPin },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-colors",
              activeTab === tab.id 
                ? "bg-slate-900 text-white shadow-sm" 
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-emerald-400" : "text-slate-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      {renderContent()}

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" /> {editingEmployeeId ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <button onClick={() => {setIsModalOpen(false); setEditingEmployeeId(null); setNewEmployee({ name: '', role: 'Survey Engineer', team: 'Team Alpha', contact: '', status: 'Active' });}} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmitEmployee} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee Name *</label>
                  <input required type="text" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                  <input required type="email" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} placeholder="employee@solar.com" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                  <select value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                    <option value="Solar Company Admin">Solar Company Admin</option>
                    <option value="Regional Manager">Regional Manager</option>
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Survey Engineer">Survey Engineer</option>
                    <option value="Design Engineer">Design Engineer</option>
                    <option value="Procurement Officer">Procurement Officer</option>
                    <option value="Warehouse Manager">Warehouse Manager</option>
                    <option value="Installer">Installer</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Customer Support">Customer Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Team *</label>
                  <select value={newEmployee.team} onChange={e => setNewEmployee({...newEmployee, team: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                    <option value="Team Alpha">Team Alpha</option>
                    <option value="Team Bravo">Team Bravo</option>
                    <option value="Team Charlie">Team Charlie</option>
                    <option value="Unassigned">Unassigned</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number *</label>
                  <input required type="text" value={newEmployee.contact} onChange={e => setNewEmployee({...newEmployee, contact: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
                  <select value={newEmployee.status} onChange={e => setNewEmployee({...newEmployee, status: e.target.value as EmployeeStatus})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">Payroll Compensation Structure</label>
                <select value={newEmployee.salaryType} onChange={e => setNewEmployee({...newEmployee, salaryType: e.target.value as any})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none">
                  <option value="Fixed Salary">Fixed Salary (Monthly)</option>
                  <option value="Commission Only">Payroll - Commission (% per sale)</option>
                  <option value="Fixed + Commission">Fixed Salary + Sales Commission</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsModalOpen(false); setEditingEmployeeId(null); setNewEmployee({ name: '', role: 'Survey Engineer', team: 'Team Alpha', contact: '', status: 'Active' });}} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  FileCheck, 
  Building, 
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Upload,
  Download,
  Filter,
  Edit2,
  Trash2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

type ApprovalType = 'Electrical Safety Inspection' | 'Government Approval' | 'Net Meter Approval' | 'Inspection Certificate';
type ApprovalStatus = 'Pending' | 'In Progress' | 'Approved' | 'Rejected';

interface ComplianceRecord {
  id: string;
  projectId: string;
  customerName: string;
  type: ApprovalType;
  status: ApprovalStatus;
  applicationDate: string;
  approvalDate?: string;
  documentUrl?: string;
  remarks?: string;
}

export default function Compliance() {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ApprovalType | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [updateModal, setUpdateModal] = useState<{isOpen: boolean, recordId: string | null}>({isOpen: false, recordId: null});

  const [newRecord, setNewRecord] = useState({
    projectId: '',
    customerName: '',
    type: 'Electrical Safety Inspection' as ApprovalType,
    applicationDate: format(new Date(), 'yyyy-MM-dd'),
    remarks: ''
  });

  const [updateData, setUpdateData] = useState({
    status: 'Approved' as ApprovalStatus,
    approvalDate: format(new Date(), 'yyyy-MM-dd'),
    remarks: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'complianceRecords'), orderBy('applicationDate', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ComplianceRecord)));
    });
    return () => unsub();
  }, []);

  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecordId) {
        await updateDoc(doc(db, 'complianceRecords', editingRecordId), newRecord);
      } else {
        await addDoc(collection(db, 'complianceRecords'), {
          ...newRecord,
          status: 'Pending',
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingRecordId(null);
      setNewRecord({
        projectId: '',
        customerName: '',
        type: 'Electrical Safety Inspection',
        applicationDate: format(new Date(), 'yyyy-MM-dd'),
        remarks: ''
      });
    } catch (err) {
      console.error('Error saving compliance record:', err);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this compliance record?")) {
      try {
        await deleteDoc(doc(db, 'complianceRecords', id));
      } catch (err) {
        console.error('Error deleting compliance record:', err);
      }
    }
  };

  const handleDownloadCertificate = (record: ComplianceRecord) => {
    const pdf = new jsPDF();
    pdf.setFontSize(24);
    pdf.text('Approval Certificate', 105, 30, { align: 'center' });
    pdf.setFontSize(14);
    pdf.text(`Project ID: ${record.projectId}`, 20, 60);
    pdf.text(`Customer Name: ${record.customerName}`, 20, 75);
    pdf.text(`Approval Type: ${record.type}`, 20, 90);
    pdf.text(`Status: ${record.status}`, 20, 105);
    pdf.text(`Date: ${record.approvalDate || new Date().toISOString().split('T')[0]}`, 20, 120);
    pdf.text('This is an official system-generated certificate.', 20, 160);
    pdf.save(`Certificate_${record.projectId}_${record.type.replace(/\s+/g, '_')}.pdf`);
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updateModal.recordId) {

      try {
        await updateDoc(doc(db, 'complianceRecords', updateModal.recordId), {
          ...updateData,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error(err);
      }
      setUpdateModal({ isOpen: false, recordId: null });
      setUpdateData({ status: 'Approved', approvalDate: '', remarks: '' });
    }
  };

  const filteredRecords = records.filter(record => 
    (filterType === 'All' || record.type === filterType) &&
    (record.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || record.projectId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-emerald-600" /> Compliance & Approvals
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage electrical safety, net metering, and government approvals.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Application
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Customer or Project ID..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <select 
                value={filterType}
                onChange={e => setFilterType(e.target.value as ApprovalType | 'All')}
                className="pl-3 pr-8 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-medium bg-white"
              >
                <option value="All">All Types</option>
                <option value="Electrical Safety Inspection">Electrical Safety</option>
                <option value="Government Approval">Government Approval</option>
                <option value="Net Meter Approval">Net Meter Approval</option>
                <option value="Inspection Certificate">Inspection Certificate</option>
              </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                <th className="p-4">Project</th>
                <th className="p-4">Approval Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Dates</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{record.projectId}</p>
                    <p className="text-sm text-slate-500">{record.customerName}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-700">{record.type}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                      record.status === 'Approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      record.status === 'Pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                      record.status === 'Rejected' ? "bg-red-50 text-red-700 border-red-100" :
                      "bg-blue-50 text-blue-700 border-blue-100"
                    )}>{record.status}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    <p>App: {record.applicationDate}</p>
                    {record.approvalDate && <p className="text-emerald-600 font-medium">Apr: {record.approvalDate}</p>}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {record.status === 'Approved' ? (
                      <button onClick={() => handleDownloadCertificate(record)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title="Download Certificate">
                        <Download className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => setUpdateModal({ isOpen: true, recordId: record.id })} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Update Status">
                        <ClipboardCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => { setEditingRecordId(record.id); setNewRecord({ projectId: record.projectId, customerName: record.customerName, type: record.type, applicationDate: record.applicationDate, remarks: record.remarks || '' }); setIsModalOpen(true); }} className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteRecord(record.id)} className="p-2 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" /> {editingRecordId ? 'Edit Application' : 'New Approval Application'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmitRecord} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project ID</label>
                  <input required type="text" value={newRecord.projectId} onChange={e => setNewRecord({...newRecord, projectId: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                  <input required type="text" value={newRecord.customerName} onChange={e => setNewRecord({...newRecord, customerName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Approval Type</label>
                <select value={newRecord.type} onChange={e => setNewRecord({...newRecord, type: e.target.value as ApprovalType})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  <option value="Electrical Safety Inspection">Electrical Safety Inspection</option>
                  <option value="Government Approval">Government Approval</option>
                  <option value="Net Meter Approval">Net Meter Approval</option>
                  <option value="Inspection Certificate">Inspection Certificate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Application Date</label>
                <input required type="date" value={newRecord.applicationDate} onChange={e => setNewRecord({...newRecord, applicationDate: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                <textarea rows={2} value={newRecord.remarks} onChange={e => setNewRecord({...newRecord, remarks: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsModalOpen(false); setNewRecord({projectId: '', customerName: '', type: 'Electrical Safety Inspection', applicationDate: new Date().toISOString().split('T')[0], remarks: ''}); setEditingRecordId(null);}} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">Save Application</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {updateModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Update Status</h3>
              <button onClick={() => setUpdateModal({ isOpen: false, recordId: null })} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleUpdateRecord} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={updateData.status} onChange={e => setUpdateData({...updateData, status: e.target.value as ApprovalStatus})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              {updateData.status === 'Approved' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Approval Date</label>
                  <input required type="date" value={updateData.approvalDate} onChange={e => setUpdateData({...updateData, approvalDate: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks / Notes</label>
                <textarea rows={2} value={updateData.remarks} onChange={e => setUpdateData({...updateData, remarks: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => { setUpdateModal({ isOpen: false, recordId: null }); setUpdateData({ status: 'Approved', approvalDate: new Date().toISOString().split('T')[0], remarks: '' }); }} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

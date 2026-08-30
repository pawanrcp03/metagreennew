import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  MessageSquare, 
  Plus, 
  Search, 
  Settings, 
  User, 
  Wrench,
  Activity,
  BatteryWarning,
  CloudLightning,
  AlertTriangle,
  ZapOff,
  Mail,
  Phone,
  Headphones
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

type ComplaintType = string;
type TicketStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
type SLAStatus = 'Within SLA' | 'Breached SLA' | 'Approaching SLA';

const DEFAULT_CATEGORIES = [
  'Low Generation',
  'Inverter Error',
  'Battery Issue',
  'Leakage',
  'Structure Damage',
  'Net Meter Delay',
  'PM Surya Ghar Subsidy Delay',
  'Wiring & Cable Fault'
];

interface Ticket {
  id: string;
  displayId: string;
  customerName: string;
  projectId: string;
  issueType: string;
  description: string;
  status: TicketStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo?: string;
  createdAt: any;
  slaStatus: SLAStatus;
  resolution?: string;
}

export default function Support() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'All'>('All');

  const [newTicket, setNewTicket] = useState({
    customerName: '',
    projectId: '',
    issueType: 'Low Generation',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical'
  });

  const [assignEngineerModal, setAssignEngineerModal] = useState<{ isOpen: boolean; ticketId: string | null }>({ isOpen: false, ticketId: null });
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [resolutionModal, setResolutionModal] = useState<{ isOpen: boolean; ticketId: string | null }>({ isOpen: false, ticketId: null });
  const [resolutionText, setResolutionText] = useState('');

  const engineers = ['Rajesh Kumar', 'Suresh Patel', 'Amit Singh', 'Vikram Desai'];

  useEffect(() => {
    const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket)));
    });

    const qCat = query(collection(db, 'supportTicketCategories'));
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map(d => d.data().name as string).filter(Boolean);
        const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...fetched]));
        setCategories(combined);
      }
    });

    return () => {
      unsub();
      unsubCat();
    };
  }, []);

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    const cat = newCategoryName.trim();
    if (!categories.includes(cat)) {
      setCategories(prev => [...prev, cat]);
      setNewTicket(prev => ({ ...prev, issueType: cat }));
      try {
        await addDoc(collection(db, 'supportTicketCategories'), {
          name: cat,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.error('Error adding category:', e);
      }
    }
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newId = `SUP-26${String(tickets.length + 1).padStart(3, '0')}`;
      await addDoc(collection(db, 'supportTickets'), {
        displayId: newId,
        customerName: newTicket.customerName,
        projectId: newTicket.projectId,
        issueType: newTicket.issueType,
        description: newTicket.description,
        priority: newTicket.priority,
        status: 'Open',
        slaStatus: 'Within SLA',
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewTicket({
        customerName: '',
        projectId: '',
        issueType: 'Low Generation',
        description: '',
        priority: 'Medium'
      });
    } catch (err) {
      console.error('Error creating ticket:', err);
    }
  };

  const handleAssignEngineer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assignEngineerModal.ticketId && selectedEngineer) {
      try {
        await updateDoc(doc(db, 'supportTickets', assignEngineerModal.ticketId), {
          assignedTo: selectedEngineer,
          status: 'Assigned',
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Error assigning engineer:', err);
      }
      setAssignEngineerModal({ isOpen: false, ticketId: null });
      setSelectedEngineer('');
    }
  };

  const handleResolveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resolutionModal.ticketId && resolutionText) {
      try {
        await updateDoc(doc(db, 'supportTickets', resolutionModal.ticketId), {
          resolution: resolutionText,
          status: 'Resolved',
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Error resolving ticket:', err);
      }
      setResolutionModal({ isOpen: false, ticketId: null });
      setResolutionText('');
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.displayId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getIssueIcon = (type: ComplaintType) => {
    switch (type) {
      case 'Low Generation': return <Activity className="w-4 h-4 text-amber-500" />;
      case 'Inverter Error': return <ZapOff className="w-4 h-4 text-red-500" />;
      case 'Battery Issue': return <BatteryWarning className="w-4 h-4 text-purple-500" />;
      case 'Leakage': return <CloudLightning className="w-4 h-4 text-blue-500" />;
      case 'Structure Damage': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5 text-emerald-600" />
              Unified Customer Care & Helpdesk
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Support & Tickets
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage multi-channel customer inquiries, track SLA resolution, and assign field engineers to complaints.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a 
            href="mailto:support@metadev.in" 
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-600" /> support@metadev.in
          </a>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white font-extrabold text-xs rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 font-bold text-sm uppercase tracking-widest mb-4">
            <AlertCircle className="w-5 h-5 text-amber-500" /> Open Tickets
          </div>
          <div className="text-3xl font-black text-slate-900">{tickets.filter(t => t.status === 'Open').length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 font-bold text-sm uppercase tracking-widest mb-4">
            <Clock className="w-5 h-5 text-red-500" /> SLA Breached
          </div>
          <div className="text-3xl font-black text-slate-900">{tickets.filter(t => t.slaStatus === 'Breached SLA').length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 font-bold text-sm uppercase tracking-widest mb-4">
            <User className="w-5 h-5 text-blue-500" /> In Progress
          </div>
          <div className="text-3xl font-black text-slate-900">{tickets.filter(t => t.status === 'Assigned' || t.status === 'In Progress').length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 font-bold text-sm uppercase tracking-widest mb-4">
            <CheckCircle2 className="w-5 h-5" /> Resolved
          </div>
          <div className="text-3xl font-black text-emerald-600">{tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-96 flex items-center">
            <Search className="w-5 h-5 absolute left-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tickets by customer or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
              <th className="p-4">Ticket</th>
              <th className="p-4">Issue Details</th>
              <th className="p-4">Status & SLA</th>
              <th className="p-4">Assignment</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTickets.map(ticket => (
              <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-4 align-top">
                  <div className="font-bold text-slate-900">{ticket.displayId}</div>
                  <div className="text-xs text-slate-500 mt-1">{ticket.customerName}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{ticket.projectId}</div>
                </td>
                <td className="p-4 align-top max-w-xs">
                  <div className="flex items-center gap-2">
                    {getIssueIcon(ticket.issueType)}
                    <span className="font-bold text-slate-800 text-sm">{ticket.issueType}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                      ticket.priority === 'Critical' ? "bg-red-100 text-red-700" :
                      ticket.priority === 'High' ? "bg-orange-100 text-orange-700" :
                      "bg-blue-100 text-blue-700"
                    )}>{ticket.priority}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{ticket.description}</p>
                </td>
                <td className="p-4 align-top">
                  <span className={cn(
                    "inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm mb-2",
                    ticket.status === 'Resolved' || ticket.status === 'Closed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                    ticket.status === 'Assigned' ? "bg-blue-50 text-blue-700 border-blue-100" :
                    "bg-amber-50 text-amber-700 border-amber-100"
                  )}>
                    {ticket.status}
                  </span>
                  <div>
                    <span className={cn(
                      "text-xs font-bold flex items-center gap-1",
                      ticket.slaStatus === 'Breached SLA' ? "text-red-600" : "text-emerald-600"
                    )}>
                      <Clock className="w-3.5 h-3.5" /> {ticket.slaStatus}
                    </span>
                  </div>
                </td>
                <td className="p-4 align-top">
                  {ticket.assignedTo ? (
                    <div>
                      <div className="text-sm font-bold text-slate-800">{ticket.assignedTo}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Field Engineer</div>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="p-4 text-center align-top">
                  <div className="flex flex-col gap-2">
                    {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                      <>
                        <button 
                          onClick={() => setAssignEngineerModal({ isOpen: true, ticketId: ticket.id })}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          Assign
                        </button>
                        <button 
                          onClick={() => setResolutionModal({ isOpen: true, ticketId: ticket.id })}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                        >
                          Resolve
                        </button>
                      </>
                    )}
                    {(ticket.status === 'Resolved' || ticket.status === 'Closed') && (
                      <button className="text-slate-400 hover:text-slate-600 transition-colors">
                        <MessageSquare className="w-5 h-5 mx-auto" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">No tickets found matching your criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Create Support Ticket</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                  <input required type="text" value={newTicket.customerName} onChange={e => setNewTicket({...newTicket, customerName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project ID</label>
                  <input required type="text" placeholder="PRJ-101" value={newTicket.projectId} onChange={e => setNewTicket({...newTicket, projectId: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Complaint Category *</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(!isAddingCategory)}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-extrabold cursor-pointer"
                    >
                      {isAddingCategory ? '← Choose Category' : '+ Add Type'}
                    </button>
                  </div>

                  {isAddingCategory ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        placeholder="e.g. Earthing Fault"
                        className="flex-1 px-3 py-1.5 text-xs border border-emerald-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewCategory}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select 
                      value={newTicket.issueType} 
                      onChange={e => setNewTicket({...newTicket, issueType: e.target.value})} 
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none font-semibold bg-white"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value as any})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea required rows={3} value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsModalOpen(false); setNewTicket({ customerName: "", projectId: "", issueType: "Low Generation", description: "", priority: "Medium" });}} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Engineer Modal */}
      {assignEngineerModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Assign Engineer</h3>
            </div>
            <form onSubmit={handleAssignEngineer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Field Engineer</label>
                <select required value={selectedEngineer} onChange={e => setSelectedEngineer(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none">
                  <option value="">Select an engineer...</option>
                  {engineers.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setAssignEngineerModal({ isOpen: false, ticketId: null })} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {resolutionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Mark as Resolved
              </h3>
            </div>
            <form onSubmit={handleResolveTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Resolution Details</label>
                <textarea required rows={4} placeholder="Describe how the issue was resolved..." value={resolutionText} onChange={e => setResolutionText(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setResolutionModal({ isOpen: false, ticketId: null })} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg">Resolve Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

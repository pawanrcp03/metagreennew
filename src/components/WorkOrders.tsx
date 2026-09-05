import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  User,
  MapPin,
  ClipboardList, Edit2, Trash2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export default function WorkOrders() {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const [workOrders, setWorkOrders] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'workOrders'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setWorkOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });
    return () => unsubscribe();
  }, []);

  const [newOrder, setNewOrder] = useState({
    title: '',
    customer: '',
    address: '',
    type: 'Installation',
    priority: 'Medium',
    assignee: '',
    date: '',
    time: ''
  });

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrderId) {
        await updateDoc(doc(db, 'workOrders', editingOrderId), {
          title: newOrder.title,
          customer: newOrder.customer,
          address: newOrder.address,
          type: newOrder.type,
          priority: newOrder.priority,
          assignee: newOrder.assignee,
          date: newOrder.date,
          time: newOrder.time
        });
      } else {
        const newId = `WO-2026-${String(workOrders.length + 1).padStart(3, '0')}`;
        await addDoc(collection(db, 'workOrders'), {
          displayId: newId,
          title: newOrder.title,
          customer: newOrder.customer,
          address: newOrder.address,
          type: newOrder.type,
          priority: newOrder.priority,
          assignee: newOrder.assignee,
          status: 'Scheduled',
          date: newOrder.date,
          time: newOrder.time
        });
      }
      setIsModalOpen(false);
      setEditingOrderId(null);
      setNewOrder({ title: '', customer: '', address: '', type: 'Installation', priority: 'Medium', assignee: '', date: '', time: '' });
    } catch (err) {
      console.error('Error saving work order', err);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this work order?")) {
      try {
        await deleteDoc(doc(db, 'workOrders', id));
      } catch (err) {
        console.error('Error deleting work order:', err);
      }
    }
  };

  const filteredOrders = workOrders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'active') {
      return matchesSearch && order.status !== 'Completed';
    } else {
      return matchesSearch && order.status === 'Completed';
    }
  });

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'High': return 'text-red-700 bg-red-100 border-red-200';
      case 'Medium': return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'Low': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      default: return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Installation': return <Wrench className="w-4 h-4" />;
      case 'Repair': return <AlertCircle className="w-4 h-4" />;
      case 'Inspection': return <Search className="w-4 h-4" />;
      case 'Maintenance': return <ClipboardList className="w-4 h-4" />;
      default: return <ClipboardList className="w-4 h-4" />;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Wrench className="w-8 h-8 text-indigo-600" /> Work Orders
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage field services, assignments, and scheduling</p>
        </div>
      </header>

      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar border-b border-slate-100">
        {[
          { id: 'active', label: 'Active Orders', icon: Clock },
          { id: 'completed', label: 'Completed', icon: CheckCircle2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-indigo-100/80 text-indigo-800" 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-96 flex items-center">
          <Search className="w-5 h-5 absolute left-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search work orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm">
             <Filter className="w-4 h-4" /> Filter
           </button>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm shadow-sm shadow-indigo-200"
           >
             <Plus className="w-4 h-4" /> {editingOrderId ? 'Edit Work Order' : 'Generate Work Order'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full relative group">
            <div className="absolute top-4 right-14 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingOrderId(order.id); setNewOrder({ title: order.title, customer: order.customer, address: order.address, type: order.type, priority: order.priority, assignee: order.assignee, date: order.date, time: order.time }); setIsModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100" title="Edit">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDeleteOrder(order.id)} className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between items-start mb-4 pr-16">
              <div className="flex items-center gap-2">
                <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border", getPriorityColor(order.priority))}>
                  {order.priority}
                </span>
                <span className="text-xs font-bold text-slate-500">{order.displayId || order.id}</span>
              </div>
              <div className="text-slate-400">
                 {getTypeIcon(order.type)}
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-2">{order.title}</h3>
            
            <div className="space-y-3 flex-1 mb-6">
              <div className="flex items-start gap-2 text-sm text-slate-600">
                 <User className="w-4 h-4 mt-0.5 text-slate-400" />
                 <span className="font-medium text-slate-900">{order.customer}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-600">
                 <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
                 <span className="line-clamp-2">{order.address}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-600">
                 <Calendar className="w-4 h-4 mt-0.5 text-slate-400" />
                 <span>{order.date} • {order.time}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                  {order.assignee.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-sm font-medium text-slate-700">{order.assignee}</div>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold border",
                order.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                order.status === 'In Progress' ? "bg-blue-50 text-blue-700 border-blue-200" :
                "bg-slate-50 text-slate-700 border-slate-200"
              )}>
                {order.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{editingOrderId ? 'Edit Work Order' : 'Generate Work Order'}</h3>
              <button onClick={() => {setIsModalOpen(false); setEditingOrderId(null); setNewOrder({ title: '', customer: '', address: '', type: 'Installation', priority: 'Medium', assignee: '', date: '', time: '' });}} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmitOrder} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input required type="text" value={newOrder.title} onChange={e => setNewOrder({...newOrder, title: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="e.g. 5kW System Installation" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select value={newOrder.type} onChange={e => setNewOrder({...newOrder, type: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none">
                    <option value="Installation">Installation</option>
                    <option value="Repair">Repair</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select value={newOrder.priority} onChange={e => setNewOrder({...newOrder, priority: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                <input required type="text" value={newOrder.customer} onChange={e => setNewOrder({...newOrder, customer: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea required value={newOrder.address} onChange={e => setNewOrder({...newOrder, address: e.target.value})} rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
                <input required type="text" value={newOrder.assignee} onChange={e => setNewOrder({...newOrder, assignee: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="Engineer/Technician Name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input required type="date" value={newOrder.date} onChange={e => setNewOrder({...newOrder, date: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                  <input required type="time" value={newOrder.time} onChange={e => setNewOrder({...newOrder, time: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsModalOpen(false); setEditingOrderId(null); setNewOrder({ title: '', customer: '', address: '', type: 'Installation', priority: 'Medium', assignee: '', date: '', time: '' });}} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">Create Work Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

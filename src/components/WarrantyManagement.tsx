import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Plus, 
  Calendar,
  Settings,
  Battery,
  Zap,
  Box,
  FileText,
  Clock
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { addMonths, format, isBefore, addDays, parseISO } from 'date-fns';

type ComponentType = 'Panel' | 'Inverter' | 'Battery' | 'Accessory';

interface Warranty {
  id: string;
  customerName: string;
  projectId: string;
  componentType: ComponentType;
  brand: string;
  serialNumber: string;
  installDate: string; // YYYY-MM-DD
  warrantyMonths: number;
}

export default function WarrantyManagement() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [newWarranty, setNewWarranty] = useState({
    customerName: '',
    projectId: '',
    componentType: 'Panel' as ComponentType,
    brand: '',
    serialNumber: '',
    installDate: format(new Date(), 'yyyy-MM-dd'),
    warrantyMonths: 120
  });

  useEffect(() => {
    const q = query(collection(db, 'warranties'), orderBy('installDate', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setWarranties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warranty)));
    });
    return () => unsub();
  }, []);

  const handleAddWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'warranties'), {
        customerName: newWarranty.customerName,
        projectId: newWarranty.projectId,
        componentType: newWarranty.componentType,
        brand: newWarranty.brand,
        serialNumber: newWarranty.serialNumber,
        installDate: newWarranty.installDate,
        warrantyMonths: newWarranty.warrantyMonths,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewWarranty({
        customerName: '',
        projectId: '',
        componentType: 'Panel',
        brand: '',
        serialNumber: '',
        installDate: format(new Date(), 'yyyy-MM-dd'),
        warrantyMonths: 120
      });
    } catch (err) {
      console.error('Error adding warranty:', err);
    }
  };

  const getWarrantyStatus = (warranty: Warranty) => {
    const installDate = parseISO(warranty.installDate);
    const expiryDate = addMonths(installDate, warranty.warrantyMonths);
    const today = new Date();
    const warningDate = addDays(expiryDate, -30); // 30 days before expiry

    if (isBefore(expiryDate, today)) {
      return { status: 'Expired', color: 'bg-red-50 text-red-700 border-red-200', expiryStr: format(expiryDate, 'dd MMM yyyy') };
    } else if (isBefore(warningDate, today)) {
      return { status: 'Expiring Soon', color: 'bg-amber-50 text-amber-700 border-amber-200', expiryStr: format(expiryDate, 'dd MMM yyyy') };
    }
    return { status: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', expiryStr: format(expiryDate, 'dd MMM yyyy') };
  };

  const getIcon = (type: ComponentType) => {
    switch (type) {
      case 'Panel': return <Box className="w-5 h-5 text-blue-500" />;
      case 'Inverter': return <Zap className="w-5 h-5 text-emerald-500" />;
      case 'Battery': return <Battery className="w-5 h-5 text-purple-500" />;
      case 'Accessory': return <Settings className="w-5 h-5 text-slate-500" />;
    }
  };

  const filteredWarranties = warranties.filter(w => 
    w.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.projectId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const expiringSoonCount = warranties.filter(w => getWarrantyStatus(w).status === 'Expiring Soon').length;
  const expiredCount = warranties.filter(w => getWarrantyStatus(w).status === 'Expired').length;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600" /> Warranty Management
          </h1>
          <p className="text-slate-500 font-medium mt-1">Track warranties, serial numbers, and auto-alerts</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm shadow-sm shadow-emerald-200"
        >
          <Plus className="w-4 h-4" /> Add Warranty Record
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-widest mb-2">
              <ShieldCheck className="w-4 h-4" /> Active Warranties
            </div>
            <div className="text-3xl font-black text-slate-900">{warranties.filter(w => getWarrantyStatus(w).status === 'Active').length}</div>
          </div>
        </div>
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm uppercase tracking-widest mb-2">
              <AlertTriangle className="w-4 h-4" /> Expiring Soon (30 Days)
            </div>
            <div className="text-3xl font-black text-amber-700">{expiringSoonCount}</div>
          </div>
          {expiringSoonCount > 0 && (
            <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            </div>
          )}
        </div>
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm uppercase tracking-widest mb-2">
              <Clock className="w-4 h-4" /> Expired
            </div>
            <div className="text-3xl font-black text-red-700">{expiredCount}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-96 flex items-center">
            <Search className="w-5 h-5 absolute left-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by customer, SN, or Project ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
              <th className="p-4">Component & SN</th>
              <th className="p-4">Customer Details</th>
              <th className="p-4">Install Date</th>
              <th className="p-4">Expiry Date</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredWarranties.map(warranty => {
              const status = getWarrantyStatus(warranty);
              return (
                <tr key={warranty.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        {getIcon(warranty.componentType)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {warranty.brand} {warranty.componentType}
                        </div>
                        <div className="text-xs font-medium text-slate-500 font-mono mt-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {warranty.serialNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-700">{warranty.customerName}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">{warranty.projectId}</div>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {format(parseISO(warranty.installDate), 'dd MMM yyyy')}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-800">
                    {status.expiryStr}
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-medium">{warranty.warrantyMonths} Months</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={cn(
                      "inline-flex px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border",
                      status.color
                    )}>
                      {status.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filteredWarranties.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">No warranty records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Add Warranty Record</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleAddWarranty} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                  <input required type="text" value={newWarranty.customerName} onChange={e => setNewWarranty({...newWarranty, customerName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project ID</label>
                  <input required type="text" placeholder="PRJ-..." value={newWarranty.projectId} onChange={e => setNewWarranty({...newWarranty, projectId: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Component Type</label>
                  <select value={newWarranty.componentType} onChange={e => setNewWarranty({...newWarranty, componentType: e.target.value as ComponentType})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none">
                    <option value="Panel">Solar Panel</option>
                    <option value="Inverter">Inverter</option>
                    <option value="Battery">Battery</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brand/Make</label>
                  <input required type="text" value={newWarranty.brand} onChange={e => setNewWarranty({...newWarranty, brand: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number (SN)</label>
                <input required type="text" value={newWarranty.serialNumber} onChange={e => setNewWarranty({...newWarranty, serialNumber: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Install Date</label>
                  <input required type="date" value={newWarranty.installDate} onChange={e => setNewWarranty({...newWarranty, installDate: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Warranty (Months)</label>
                  <input required type="number" min="1" value={newWarranty.warrantyMonths} onChange={e => setNewWarranty({...newWarranty, warrantyMonths: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => {setIsModalOpen(false); setNewWarranty({customerName: '', projectId: '', componentType: 'Panel', brand: '', serialNumber: '', installDate: format(new Date(), 'yyyy-MM-dd'), warrantyMonths: 120});}} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">Save Warranty</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

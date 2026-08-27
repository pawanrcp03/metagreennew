import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Lead, LeadStatus } from '@/src/types';
import { Plus, Search, Filter, MoreVertical, Mail, Phone, MapPin, Users, FileText, Edit2, Trash2, ShieldCheck, Sparkles, Building2, Loader2, Compass, LocateFixed, Box } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import Solar3DViewer from './Solar3DViewer';

export default function CRM({ initialFilter }: { initialFilter?: string }) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialFilter || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const [showTrash, setShowTrash] = useState(false);
  const [selected3DLead, setSelected3DLead] = useState<Lead | null>(null);

  // Role Scoped Lead Filtering
  const roleScopedLeads = leads.filter(lead => {
    if (!user) return true;

    // Super Admin / Solar Company Admin see ALL leads across India
    if (user.role === 'Super Admin' || user.role === 'Solar Company Admin') {
      return true;
    }

    // Vendor sees leads created by or assigned to their vendor company profile
    if (user.role === 'Vendor') {
      const vendorName = user.companyName || user.name || '';
      return (
        (lead as any).vendor?.toLowerCase().includes(vendorName.toLowerCase()) ||
        (lead as any).assignedTo?.toLowerCase().includes(user.name.toLowerCase()) ||
        (lead as any).createdBy === user.email
      );
    }

    // Sales Rep / Regional Manager / Survey Engineer see leads assigned to or created by them
    const uName = user.name.toLowerCase();
    const uEmail = user.email.toLowerCase();

    return (
      (lead as any).assignedTo?.toLowerCase().includes(uName) ||
      (lead as any).salesRep?.toLowerCase().includes(uName) ||
      (lead as any).createdBy === uEmail ||
      (lead as any).region === (user as any).region
    );
  });

  const filteredLeads = roleScopedLeads.filter(lead =>
    (showTrash ? lead.isDeleted : !lead.isDeleted) &&
    (lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.status.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const [newLead, setNewLead] = useState<Partial<Lead>>({ name: '', email: '', phone: '', source: 'Website', address: '', city: '', district: '', state: '', pincode: '', gpsLocation: '', roofType: '', monthlyUnits: '', expectedLoad: '', electricityBillUrl: '', propertyImagesUrls: [], roofImagesUrls: [] });
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [selectedLeadForQuotation, setSelectedLeadForQuotation] = useState<Lead | null>(null);
  const [quotationDetails, setQuotationDetails] = useState({
    systemSize: '',
    panelType: 'Monocrystalline',
    inverterType: 'String Inverter',
    totalCost: '',
    estimatedGeneration: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    });
    return () => unsubscribe();
  }, []);

  // Reverse Geocoding for CRM Lead Address: GPS Coords -> Address, City, District, State, Pincode
  const handleDropPinGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const gpsStr = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const door = addr.house_number || addr.building || addr.unit || addr.house || '';
            const street = [addr.road, addr.suburb, addr.neighbourhood, addr.industrial].filter(Boolean).join(', ') || data.display_name?.split(',')[0] || '';
            const fullAddress = door ? `${door}, ${street}` : street;
            const city = addr.city || addr.town || addr.village || '';
            const district = addr.county || addr.district || city || '';
            const state = addr.state || 'Telangana';
            const pincode = addr.postcode || '';

            setNewLead(prev => ({
              ...prev,
              gpsLocation: gpsStr,
              address: fullAddress || prev.address,
              city: city || prev.city,
              district: district || prev.district,
              state: state || prev.state,
              pincode: pincode || prev.pincode
            }));
          } else {
            setNewLead(prev => ({ ...prev, gpsLocation: gpsStr }));
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setNewLead(prev => ({ ...prev, gpsLocation: gpsStr }));
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        setIsDetectingLocation(false);
        alert("Unable to retrieve location. Please enter manually.");
      },
      { timeout: 10000 }
    );
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLeadId) {
        await updateDoc(doc(db, 'leads', editingLeadId), newLead);
      } else {
        await addDoc(collection(db, 'leads'), {
          ...newLead,
          createdBy: user?.email || 'admin@metagreen.com',
          creatorName: user?.name || 'Admin',
          vendor: user?.companyName || user?.name || 'Default Vendor',
          assignedTo: newLead.assignedTo || user?.name || 'Sales Rep',
          status: 'New Lead',
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingLeadId(null);
      setNewLead({ name: '', email: '', phone: '', source: 'Website', address: '', city: '', district: '', state: '', pincode: '', gpsLocation: '', roofType: '', monthlyUnits: '', expectedLoad: '', electricityBillUrl: '', propertyImagesUrls: [], roofImagesUrls: [] });
    } catch (err) {
      console.error('Error saving lead:', err);
    }
  };

  const handleDeleteLead = async (id: string, permanently: boolean = false) => {
    if (permanently) {
      if (window.confirm("Are you sure you want to permanently delete this lead?")) {
        try {
          await deleteDoc(doc(db, 'leads', id));
        } catch (err) {
          console.error('Error deleting lead:', err);
        }
      }
    } else {
      if (window.confirm("Are you sure you want to move this lead to trash?")) {
        try {
          await updateDoc(doc(db, 'leads', id), { isDeleted: true });
        } catch (err) {
          console.error('Error moving lead to trash:', err);
        }
      }
    }
  };

  // Dynamic Regional Officers dataset structure
  interface DynamicOfficer {
    id: string;
    name: string;
    role: string;
    region: string;
    states: string[];
    cities: string[];
    contact: string;
  }

  const DEFAULT_OFFICERS: DynamicOfficer[] = [
    { id: 'E101', name: 'Rajesh Sharma', role: 'Regional Project Manager', region: 'West Zone (Maharashtra / Gujarat)', states: ['Maharashtra', 'Gujarat', 'Goa', 'MH', 'GJ'], cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Ahmedabad', 'Surat'], contact: '+91 98765 11001' },
    { id: 'E102', name: 'Sunita Patil', role: 'Site Engineer', region: 'Maharashtra Region', states: ['Maharashtra', 'MH'], cities: ['Pune', 'Satara', 'Kolhapur', 'Mumbai', 'Thane'], contact: '+91 98765 11002' },
    { id: 'E103', name: 'Amit Solanki', role: 'Installation Lead', region: 'Gujarat Region', states: ['Gujarat', 'GJ'], cities: ['Ahmedabad', 'Vadodara', 'Surat', 'Rajkot'], contact: '+91 98765 11003' },
    { id: 'E201', name: 'Karthik Ramanathan', role: 'Regional Project Manager', region: 'South Zone (Karnataka / TN / KL)', states: ['Karnataka', 'Tamil Nadu', 'Kerala', 'KA', 'TN', 'KL'], cities: ['Bengaluru', 'Bangalore', 'Chennai', 'Coimbatore', 'Kochi', 'Mysuru'], contact: '+91 98765 22001' },
    { id: 'E202', name: 'Sanjay Reddy', role: 'Senior Project Lead', region: 'Telangana & AP', states: ['Telangana', 'Andhra Pradesh', 'TS', 'AP'], cities: ['Hyderabad', 'Secunderabad', 'Vijayawada', 'Visakhapatnam'], contact: '+91 98765 22002' },
    { id: 'E301', name: 'Vikram Singh Chawla', role: 'Regional Project Manager', region: 'North Zone (Delhi NCR / Punjab / UP / Rajasthan)', states: ['Delhi', 'Punjab', 'Haryana', 'Uttar Pradesh', 'Rajasthan', 'DL', 'PB', 'HR', 'UP', 'RJ'], cities: ['Delhi', 'New Delhi', 'Noida', 'Gurugram', 'Gurgaon', 'Jaipur', 'Chandigarh', 'Lucknow'], contact: '+91 98765 33001' },
    { id: 'E302', name: 'Pooja Agarwal', role: 'Lead Survey Engineer', region: 'Delhi NCR & UP Region', states: ['Delhi', 'Uttar Pradesh', 'DL', 'UP'], cities: ['Noida', 'Ghaziabad', 'Lucknow', 'Kanpur'], contact: '+91 98765 33002' },
    { id: 'E401', name: 'Subhashish Roy', role: 'Regional Project Manager', region: 'East Zone (West Bengal / Odisha)', states: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand', 'WB', 'OD', 'BR', 'JH'], cities: ['Kolkata', 'Bhubaneswar', 'Patna', 'Ranchi'], contact: '+91 98765 44001' },
  ];

  const [officers, setOfficers] = useState<DynamicOfficer[]>(DEFAULT_OFFICERS);

  // Approval & Assignment Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLeadForApproval, setSelectedLeadForApproval] = useState<Lead | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');
  const [showAllOfficers, setShowAllOfficers] = useState(false);

  useEffect(() => {
    // 1. Dynamic Leads Subscription
    const qLeads = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    });

    // 2. Dynamic Employees Subscription for Location-Based Regional Officer Assignment
    const qEmployees = query(collection(db, 'employees'));
    const unsubEmployees = onSnapshot(qEmployees, (snapshot) => {
      if (!snapshot.empty) {
        const dynamicList: DynamicOfficer[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unnamed Employee',
            role: data.role || 'Project Officer',
            region: data.region || data.team || 'General Region',
            states: data.states || (data.state ? [data.state] : ['Maharashtra', 'Gujarat', 'Karnataka', 'Delhi', 'Telangana']),
            cities: data.cities || (data.city ? [data.city] : ['Mumbai', 'Pune', 'Bengaluru', 'Delhi', 'Hyderabad']),
            contact: data.contact || data.phone || '+91 98765 00000'
          };
        });
        setOfficers(dynamicList);
      } else {
        setOfficers(DEFAULT_OFFICERS);
      }
    });

    return () => {
      unsubLeads();
      unsubEmployees();
    };
  }, []);

  // Filter regional officers based on lead's state/city/address location dynamically
  const getMatchedRegionalOfficers = (lead: Lead | null) => {
    if (!lead) return officers;
    const locText = `${lead.state || ''} ${lead.district || ''} ${lead.city || ''} ${lead.address || ''}`.toLowerCase();

    const matched = officers.filter(officer => {
      const matchState = officer.states.some(st => locText.includes(st.toLowerCase()));
      const matchCity = officer.cities.some(ct => locText.includes(ct.toLowerCase()));
      const matchRegion = locText.includes(officer.region.toLowerCase());
      return matchState || matchCity || matchRegion;
    });

    return matched.length > 0 ? matched : officers;
  };

  const handleOpenApprovalModal = (lead: Lead) => {
    setSelectedLeadForApproval(lead);
    const matched = getMatchedRegionalOfficers(lead);
    setSelectedAssigneeId(matched[0]?.id || officers[0]?.id || '');
    setAssignmentNotes('');
    setShowAllOfficers(false);
    setIsAssignModalOpen(true);
  };

  const confirmApprovalAndAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForApproval) return;

    const assignedOfficer = officers.find(o => o.id === selectedAssigneeId) || officers[0];

    try {
      // 1. Dynamically update lead status to Approved with assigned regional officer details
      await updateDoc(doc(db, 'leads', selectedLeadForApproval.id), {
        status: 'Approved',
        assignedTo: assignedOfficer.name,
        assignedToId: assignedOfficer.id,
        assignedRole: assignedOfficer.role,
        assignedRegion: assignedOfficer.region,
        assignmentNotes: assignmentNotes,
        updatedAt: serverTimestamp()
      });

      // 2. Dynamically auto-create project assigned to regional officer with 10-stage initial pipeline
      const capacityKw = parseFloat(selectedLeadForApproval.expectedLoad || '5') || 5;
      const totalCost = capacityKw * 50000;

      const projectRef = await addDoc(collection(db, 'projects'), {
        leadId: selectedLeadForApproval.id,
        name: `${selectedLeadForApproval.name} Solar Installation`,
        customerName: selectedLeadForApproval.name,
        phone: selectedLeadForApproval.phone,
        address: selectedLeadForApproval.address,
        city: selectedLeadForApproval.city || '',
        state: selectedLeadForApproval.state || '',
        capacityKw: capacityKw,
        totalCost: totalCost,
        amountPaid: 0,
        assignedTo: assignedOfficer.name,
        assignedToId: assignedOfficer.id,
        assignedRole: assignedOfficer.role,
        region: assignedOfficer.region,
        status: 'Initial',
        priority: 'High',
        history: [
          { stage: 'Initial', timestamp: new Date().toISOString(), note: `Project created from CRM Lead: ${selectedLeadForApproval.name}` }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Auto-generate 10-stage workflow tasks
      const DEFAULT_TASKS = [
        { name: '1. Site Survey & Roof Inspection', requiredRole: 'Survey Engineer', start: 0, duration: 2, status: 'Pending' },
        { name: '2. Solar PV System Design', requiredRole: 'Design Engineer', start: 2, duration: 3, status: 'Pending' },
        { name: '3. Material Requisition & PO Creation', requiredRole: 'Procurement Officer', start: 5, duration: 2, status: 'Pending' },
        { name: '4. Structure Fabrication & Panel Mounting', requiredRole: 'Lead Installer', start: 7, duration: 4, status: 'Pending' },
        { name: '5. AC/DC Wiring & Net Meter Application', requiredRole: 'Electrician', start: 11, duration: 3, status: 'Pending' },
        { name: '6. PM Surya Ghar Subsidy Claim Submission', requiredRole: 'Subsidy Specialist', start: 14, duration: 2, status: 'Pending' }
      ];

      for (const t of DEFAULT_TASKS) {
        await addDoc(collection(db, 'projectTasks'), {
          ...t,
          projectId: projectRef.id,
          createdAt: serverTimestamp()
        });
      }

      alert(`✅ Lead approved successfully! Project created and assigned to regional officer: ${assignedOfficer.name} (${assignedOfficer.region}).`);
      setIsAssignModalOpen(false);
      setSelectedLeadForApproval(null);
    } catch (err) {
      console.error('Error approving and assigning lead:', err);
      alert('Failed to approve lead. Please try again.');
    }
  };

  const updateLeadStatus = async (id: string, status: LeadStatus, lead?: Lead) => {
    if (status === 'Approved' && lead) {
      handleOpenApprovalModal(lead);
      return;
    }

    try {
      await updateDoc(doc(db, 'leads', id), { status });
    } catch (err) {
      console.error('Error updating lead status:', err);
    }
  };

  const statusColors: Record<LeadStatus, string> = {
    'New Lead': 'bg-blue-50 text-blue-700 border-blue-100',
    'Qualified': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Site Survey': 'bg-amber-50 text-amber-700 border-amber-100',
    'Proposal': 'bg-purple-50 text-purple-700 border-purple-100',
    'Negotiation': 'bg-orange-50 text-orange-700 border-orange-100',
    'Approved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Installation': 'bg-cyan-50 text-cyan-700 border-cyan-100',
    'Completed': 'bg-slate-100 text-slate-700 border-slate-200',
    'AMC': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {user?.role === 'Vendor' ? (
              <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-800 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 border border-cyan-200">
                <Building2 className="w-3.5 h-3.5 text-cyan-600" /> Vendor Scoped Leads: {user.companyName || user.name} ({filteredLeads.length})
              </span>
            ) : user?.role === 'Super Admin' || user?.role === 'Solar Company Admin' ? (
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Global Enterprise View: All India ({filteredLeads.length} Leads)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 border border-blue-200">
                <Users className="w-3.5 h-3.5 text-blue-600" /> Scoped Leads for {user?.name} ({filteredLeads.length})
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sales Pipeline</h1>
          <p className="text-slate-500 mt-1 font-medium">Capture and convert leads into active installations.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200"
        >
          <Plus className="w-5 h-5" />
          Capture Lead
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads by name, email or ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-medium"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowTrash(!showTrash)}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl font-bold text-sm transition-colors shadow-sm",
                showTrash
                  ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Trash2 className="w-4 h-4" />
              {showTrash ? 'Hide Trash' : 'View Trash'}
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm">
              <Filter className="w-4 h-4" />
              Pipeline Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">
                <th className="px-6 py-4">Lead Information</th>
                <th className="px-6 py-4">Engagement</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{lead.name}</span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 font-medium uppercase tracking-tight">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {lead.address}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Mail className="w-3.5 h-3.5 text-emerald-500" />
                        {lead.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        {lead.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 uppercase tracking-widest">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <select
                      value={lead.status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus, lead)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border outline-none cursor-pointer appearance-none",
                        statusColors[lead.status] || "bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      <option value="New Lead">New Lead</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Site Survey">Site Survey</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Approved">Approved</option>
                      <option value="Installation">Installation</option>
                      <option value="Completed">Completed</option>
                      <option value="AMC">AMC</option>
                    </select>
                  </td>
                  <td className="px-6 py-5 text-right space-x-2">
                    <button
                      onClick={() => setSelected3DLead(lead)}
                      className="p-2 hover:bg-teal-50 hover:shadow-sm rounded-lg text-teal-600 transition-all border border-transparent hover:border-teal-100 group"
                      title="View 3D Rooftop Solar Model (GPS Lat/Long)"
                    >
                      <Box className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedLeadForQuotation(lead);
                        setIsQuotationModalOpen(true);
                      }}
                      className="p-2 hover:bg-emerald-50 hover:shadow-sm rounded-lg text-emerald-600 transition-all border border-transparent hover:border-emerald-100 group"
                      title="Generate Quotation"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingLeadId(lead.id);
                        setNewLead(lead);
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:bg-blue-50 hover:shadow-sm rounded-lg text-blue-600 transition-all border border-transparent hover:border-blue-100"
                      title="Edit Lead"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {showTrash ? (
                      <>
                        <button
                          onClick={async () => {
                            if (window.confirm("Restore this lead?")) {
                              await updateDoc(doc(db, 'leads', lead.id), { isDeleted: false });
                            }
                          }}
                          className="p-2 hover:bg-emerald-50 hover:shadow-sm rounded-lg text-emerald-600 transition-all border border-transparent hover:border-emerald-100"
                          title="Restore Lead"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id, true)}
                          className="p-2 hover:bg-red-50 hover:shadow-sm rounded-lg text-red-600 transition-all border border-transparent hover:border-red-100"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-2 hover:bg-red-50 hover:shadow-sm rounded-lg text-red-600 transition-all border border-transparent hover:border-red-100"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium text-sm">No leads in the pipeline.</p>
                      <button onClick={() => setIsModalOpen(true)} className="text-emerald-600 font-bold text-xs hover:underline">Add first lead &rarr;</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{editingLeadId ? 'Edit Prospect' : 'Add New Prospect'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingLeadId(null); setNewLead({ name: '', email: '', phone: '', source: 'Website', address: '', city: '', district: '', state: '', pincode: '', gpsLocation: '', roofType: '', monthlyUnits: '', expectedLoad: '', electricityBillUrl: '', propertyImagesUrls: [], roofImagesUrls: [] }); }} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmitLead} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Customer Information</h4>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    required
                    value={newLead.name}
                    onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                  <select
                    value={newLead.source}
                    onChange={e => setNewLead({ ...newLead, source: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="Website">Website Leads</option>
                    <option value="Facebook">Facebook Leads</option>
                    <option value="Google Ads">Google Ads Leads</option>
                    <option value="Referral">Referral Leads</option>
                    <option value="Walk-in">Walk-in Leads</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newLead.email}
                    onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    required
                    value={newLead.phone}
                    onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2 mb-2 border-b border-slate-100 pb-1">Location Details</h4>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input
                    required
                    value={newLead.address}
                    onChange={e => setNewLead({ ...newLead, address: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    value={newLead.city || ''}
                    onChange={e => setNewLead({ ...newLead, city: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                  <input
                    value={newLead.district || ''}
                    onChange={e => setNewLead({ ...newLead, district: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input
                    value={newLead.state || ''}
                    onChange={e => setNewLead({ ...newLead, state: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                  <input
                    value={newLead.pincode || ''}
                    onChange={e => setNewLead({ ...newLead, pincode: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">GPS Location (Lat, Long)</label>
                  <div className="flex gap-2">
                    <input
                      value={newLead.gpsLocation}
                      onChange={e => setNewLead({ ...newLead, gpsLocation: e.target.value })}
                      placeholder="e.g. 34.0522, -118.2437"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleDropPinGPS}
                      disabled={isDetectingLocation}
                      className="whitespace-nowrap px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-lg transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                      title="Auto-detect current GPS location and reverse-geocode full street address, city, district, state & pincode"
                    >
                      {isDetectingLocation ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Auto-Geocoding...
                        </>
                      ) : (
                        <>
                          <LocateFixed className="w-4 h-4" /> 📍 Drop Pin & Auto-Geocode
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="col-span-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2 mb-2 border-b border-slate-100 pb-1">Energy Requirements</h4>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Roof Type</label>
                  <select
                    value={newLead.roofType}
                    onChange={e => setNewLead({ ...newLead, roofType: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none"
                  >
                    <option value="">Select Roof Type...</option>
                    <option value="RCC">RCC (Flat)</option>
                    <option value="Tin Shed">Tin Shed</option>
                    <option value="Tiled">Tiled</option>
                    <option value="Asbestos">Asbestos</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expected Load (kW/Mg)</label>
                  <input
                    type="number"
                    value={newLead.expectedLoad}
                    onChange={e => setNewLead({ ...newLead, expectedLoad: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                {/* Monthly Electricity Units Range (e.g. 300-400 Units) */}
                <div className="col-span-2 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Monthly Electricity Units Range (kWh)
                    </label>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg border border-emerald-200">
                      {newLead.monthlyUnits || '300-400'} Units / mo
                    </span>
                  </div>

                  {/* Range Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '100-300',
                      '300-400',
                      '400-600',
                      '600-800',
                      '800-1200',
                      '1200-2000',
                      '2000+'
                    ].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewLead({ ...newLead, monthlyUnits: preset })}
                        className={cn(
                          "px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer",
                          newLead.monthlyUnits === preset
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {preset} Units
                      </button>
                    ))}
                  </div>

                  {/* Range From & Range To Input Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-xs font-bold text-slate-400 uppercase">From:</span>
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        step="10"
                        value={
                          newLead.monthlyUnits && newLead.monthlyUnits.includes('-')
                            ? newLead.monthlyUnits.split('-')[0]
                            : newLead.monthlyUnits || ''
                        }
                        onChange={e => {
                          const fromVal = e.target.value;
                          const currentTo = newLead.monthlyUnits && newLead.monthlyUnits.includes('-')
                            ? newLead.monthlyUnits.split('-')[1]
                            : '400';
                          setNewLead({ ...newLead, monthlyUnits: `${fromVal}-${currentTo}` });
                        }}
                        placeholder="300"
                        className="w-full text-xs font-bold text-slate-800 outline-none"
                      />
                      <span className="text-[10px] font-bold text-slate-400">kWh</span>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-xs font-bold text-slate-400 uppercase">To:</span>
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        step="10"
                        value={
                          newLead.monthlyUnits && newLead.monthlyUnits.includes('-')
                            ? newLead.monthlyUnits.split('-')[1]
                            : ''
                        }
                        onChange={e => {
                          const toVal = e.target.value;
                          const currentFrom = newLead.monthlyUnits && newLead.monthlyUnits.includes('-')
                            ? newLead.monthlyUnits.split('-')[0]
                            : '300';
                          setNewLead({ ...newLead, monthlyUnits: `${currentFrom}-${toVal}` });
                        }}
                        placeholder="400"
                        className="w-full text-xs font-bold text-slate-800 outline-none"
                      />
                      <span className="text-[10px] font-bold text-slate-400">kWh</span>
                    </div>
                  </div>

                  {/* Interactive Visual Range Bar Slider */}
                  <div className="space-y-1 pt-1">
                    <input
                      type="range"
                      min="0"
                      max="3000"
                      step="25"
                      value={
                        newLead.monthlyUnits && newLead.monthlyUnits.includes('-')
                          ? parseInt(newLead.monthlyUnits.split('-')[1]) || 400
                          : parseInt(newLead.monthlyUnits || '0') || 0
                      }
                      onChange={e => {
                        const toVal = parseInt(e.target.value);
                        const fromVal = Math.max(0, toVal - 100);
                        setNewLead({ ...newLead, monthlyUnits: `${fromVal}-${toVal}` });
                      }}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>0 Units</span>
                      <span>750 Units</span>
                      <span>1500 Units</span>
                      <span>2250 Units</span>
                      <span>3000+ Units</span>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2 mb-2 border-b border-slate-100 pb-1">Documents & Media</h4>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Electricity Bill Upload</label>
                  <input
                    type="file"
                    onChange={e => setNewLead({ ...newLead, electricityBillUrl: e.target.files?.[0]?.name || '' })}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Property Images</label>
                  <input
                    type="file"
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files || []) as File[];
                      setNewLead({ ...newLead, propertyImagesUrls: files.map(f => f.name) });
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Roof Images</label>
                  <input
                    type="file"
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files || []) as File[];
                      setNewLead({ ...newLead, roofImagesUrls: files.map(f => f.name) });
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isQuotationModalOpen && selectedLeadForQuotation && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Generate Quotation</h3>
              <button onClick={() => setIsQuotationModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await addDoc(collection(db, 'quotations'), {
                  leadId: selectedLeadForQuotation.id,
                  leadName: selectedLeadForQuotation.name,
                  systemSize: quotationDetails.systemSize,
                  panelType: quotationDetails.panelType,
                  inverterType: quotationDetails.inverterType,
                  totalCost: quotationDetails.totalCost,
                  estimatedGeneration: quotationDetails.estimatedGeneration,
                  createdAt: serverTimestamp()
                });
                updateLeadStatus(selectedLeadForQuotation.id, 'Proposal', selectedLeadForQuotation);
                alert(`Quotation for ${selectedLeadForQuotation.name} generated and saved successfully!`);
                setIsQuotationModalOpen(false);
                setQuotationDetails({
                  systemSize: '',
                  panelType: 'Monocrystalline',
                  inverterType: 'String Inverter',
                  totalCost: '',
                  estimatedGeneration: ''
                });
              } catch (err) {
                console.error('Error saving quotation:', err);
                alert('Failed to save quotation');
              }
            }} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="mb-4">
                <p className="text-sm text-slate-500 font-medium">Creating quotation for:</p>
                <p className="text-lg font-bold text-slate-900">{selectedLeadForQuotation.name}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700">System Size (kW)</label>
                    <div className="flex gap-2">
                      {[3, 5, 10].map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            const estimatedGen = `${Math.round(size * 120)}`;
                            const estCost = `${Math.round(size * 60000)}`;
                            setQuotationDetails({
                              ...quotationDetails,
                              systemSize: size.toString(),
                              estimatedGeneration: estimatedGen,
                              totalCost: estCost
                            });
                          }}
                          className="px-2 py-0.5 text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded border border-slate-200 transition-colors"
                        >
                          {size}kW
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    required
                    type="number"
                    value={quotationDetails.systemSize}
                    onChange={e => {
                      const size = parseFloat(e.target.value);
                      const estimatedGen = !isNaN(size) ? `${Math.round(size * 120)}` : '';
                      const estCost = !isNaN(size) ? `${Math.round(size * 60000)}` : '';
                      setQuotationDetails({
                        ...quotationDetails,
                        systemSize: e.target.value,
                        estimatedGeneration: estimatedGen,
                        totalCost: estCost
                      });
                    }}
                    placeholder="e.g. 5"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Panel Type</label>
                  <select
                    value={quotationDetails.panelType}
                    onChange={e => setQuotationDetails({ ...quotationDetails, panelType: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option>Monocrystalline</option>
                    <option>Polycrystalline</option>
                    <option>Thin Film</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Inverter Type</label>
                  <select
                    value={quotationDetails.inverterType}
                    onChange={e => setQuotationDetails({ ...quotationDetails, inverterType: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option>String Inverter</option>
                    <option>Microinverter</option>
                    <option>Hybrid Inverter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Cost (₹)</label>
                  <input
                    required
                    type="number"
                    value={quotationDetails.totalCost}
                    onChange={e => setQuotationDetails({ ...quotationDetails, totalCost: e.target.value })}
                    placeholder="e.g. 450000"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Monthly Generation (Units)</label>
                  <input
                    required
                    type="number"
                    value={quotationDetails.estimatedGeneration}
                    onChange={e => setQuotationDetails({ ...quotationDetails, estimatedGeneration: e.target.value })}
                    placeholder="e.g. 600"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsQuotationModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval & Location-Based Regional Officer Assignment Modal */}
      {isAssignModalOpen && selectedLeadForApproval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Assign Regional Officer & Approve
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select project officer based on prospect location
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={confirmApprovalAndAssignment} className="p-6 space-y-4">
              {/* Customer & Location Card */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                    {selectedLeadForApproval.name}
                  </span>
                  <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md">
                    {selectedLeadForApproval.expectedLoad || '5'} kW Solar
                  </span>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-slate-600 font-medium">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {selectedLeadForApproval.address || 'Address N/A'}
                    {selectedLeadForApproval.city ? `, ${selectedLeadForApproval.city}` : ''}
                    {selectedLeadForApproval.state ? `, ${selectedLeadForApproval.state}` : ''}
                  </span>
                </div>
              </div>

              {/* Matched Region Badge */}
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Assign To (Location Matched)
                </label>
                <button
                  type="button"
                  onClick={() => setShowAllOfficers(!showAllOfficers)}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  {showAllOfficers ? 'Filter By Region' : 'Show All Officers'}
                </button>
              </div>

              {/* Officer Selection Dropdown */}
              <div>
                <select
                  required
                  value={selectedAssigneeId}
                  onChange={(e) => setSelectedAssigneeId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white text-slate-800"
                >
                  {(showAllOfficers ? officers : getMatchedRegionalOfficers(selectedLeadForApproval)).map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      👤 {officer.name} — {officer.role} ({officer.region})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  📍 Filtered automatically by prospect state ({selectedLeadForApproval.state || 'local region'})
                </p>
              </div>

              {/* Assignment Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Assignment Instructions / Priority Notes
                </label>
                <textarea
                  rows={2}
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="e.g. Schedule immediate site survey and structural check..."
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                >
                  <span>Confirm Approval & Assign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3D ROOFTOP SOLAR VIEW MODAL */}
      {selected3DLead && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-white">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">GPS 3D CAD Rooftop Simulation</span>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Box className="w-5 h-5 text-emerald-400" /> 3D Rooftop Solar View — {selected3DLead.name}
                </h3>
              </div>
              <button onClick={() => setSelected3DLead(null)} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors text-xl font-bold">&times;</button>
            </div>
            <div className="p-4">
              <Solar3DViewer 
                lat={selected3DLead.gpsLocation && selected3DLead.gpsLocation.includes(',') ? parseFloat(selected3DLead.gpsLocation.split(',')[0]) : 17.3850}
                lng={selected3DLead.gpsLocation && selected3DLead.gpsLocation.includes(',') ? parseFloat(selected3DLead.gpsLocation.split(',')[1]) : 78.4867}
                address={selected3DLead.address ? `${selected3DLead.address}, ${selected3DLead.city || ''}` : selected3DLead.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

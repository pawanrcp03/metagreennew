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
  deleteDoc,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Lead, LeadStatus } from '@/src/types';
import { Plus, Search, Filter, MoreVertical, Mail, Phone, MapPin, Users, FileText, Edit2, Trash2, ShieldCheck, Sparkles, Building2, Loader2, Compass, LocateFixed, Box, Sun, Zap, Wrench } from 'lucide-react';
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
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isSubmittingQuotation, setIsSubmittingQuotation] = useState(false);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  const [showTrash, setShowTrash] = useState(false);
  const [selected3DLead, setSelected3DLead] = useState<Lead | null>(null);

  // Role Scoped Lead Filtering
  const roleScopedLeads = leads.filter(lead => {
    if (!user) return true;

    // Super Admin / Solar Company Admin see ALL leads across India
    if (user.role === 'Super Admin' || user.role === 'Solar Company Admin') {
      return true;
    }

    // Vendor and Vendor Employee have full CRM lead pipeline access
    if (user.role === 'Vendor' || user.role === 'Vendor Employee') {
      const vendorName = (user.companyName || user.name || '').toLowerCase();
      const uName = (user.name || '').toLowerCase();
      const uEmail = (user.email || '').toLowerCase();
      return (
        (lead as any).vendor?.toLowerCase().includes(vendorName) ||
        (lead as any).assignedTo?.toLowerCase().includes(uName) ||
        (lead as any).assignedTo?.toLowerCase().includes(vendorName) ||
        (lead as any).createdBy === uEmail ||
        true
      );
    }

    // Installer and Solar Installer have full CRM lead pipeline access
    if (user.role === 'Installer' || user.role === 'Solar Installer' || user.role === 'Survey Engineer') {
      const uName = (user.name || '').toLowerCase();
      const uEmail = (user.email || '').toLowerCase();
      return (
        (lead as any).assignedTo?.toLowerCase().includes(uName) ||
        (lead as any).assignedTo?.toLowerCase().includes('installer') ||
        (lead as any).installerId === user.uid ||
        (lead as any).createdBy === uEmail ||
        true
      );
    }

    // Sales Rep / Regional Manager see leads assigned to or created by them
    const uName = (user.name || '').toLowerCase();
    const uEmail = (user.email || '').toLowerCase();

    return (
      (lead as any).assignedTo?.toLowerCase().includes(uName) ||
      (lead as any).salesRep?.toLowerCase().includes(uName) ||
      (lead as any).createdBy === uEmail ||
      (lead as any).region === (user as any).region ||
      true
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
    setIsSubmittingLead(true);
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
      alert('Failed to save lead. Please check network connection.');
    } finally {
      setIsSubmittingLead(false);
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

  // Location Matching Engine for Regional Officers
  const getMatchedRegionalOfficers = (lead: Lead | null): DynamicOfficer[] => {
    if (!lead) return officers;
    const leadState = (lead.state || '').toLowerCase().trim();
    const leadCity = (lead.city || '').toLowerCase().trim();
    const leadAddress = (lead.address || '').toLowerCase().trim();

    const matched = officers.filter(off => {
      const matchState = off.states.some(s => leadState.includes(s.toLowerCase()) || s.toLowerCase().includes(leadState));
      const matchCity = off.cities.some(c => leadCity.includes(c.toLowerCase()) || leadAddress.includes(c.toLowerCase()));
      const matchRegion = off.region.toLowerCase().includes(leadState) || (leadCity && off.region.toLowerCase().includes(leadCity));
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

    setIsSubmittingAssign(true);
    const assignedOfficer = officers.find(o => o.id === selectedAssigneeId) || officers[0];
    const targetLead = selectedLeadForApproval;

    try {
      // 1. Dynamically update lead status to Approved with assigned regional officer details
      await updateDoc(doc(db, 'leads', targetLead.id), {
        status: 'Approved',
        assignedTo: assignedOfficer.name,
        assignedToId: assignedOfficer.id,
        assignedRole: assignedOfficer.role,
        assignedRegion: assignedOfficer.region,
        assignmentNotes: assignmentNotes,
        updatedAt: serverTimestamp()
      });

      // 2. Check if a project already exists for this lead or customer to prevent duplicates
      const rawCapacity = parseFloat(targetLead.expectedLoad || '5') || 5;
      const capacityKw = targetLead.expectedLoadUnit === 'MW' ? rawCapacity * 1000 : rawCapacity;
      const totalCost = capacityKw * 55000;

      const existingProjectsSnap = await getDocs(query(collection(db, 'projects'), where('leadId', '==', targetLead.id)));
      let projectId = '';

      if (!existingProjectsSnap.empty) {
        const existingDoc = existingProjectsSnap.docs[0];
        projectId = existingDoc.id;
        await updateDoc(doc(db, 'projects', projectId), {
          assignedTo: assignedOfficer.name,
          assignedToId: assignedOfficer.id,
          assignedRole: assignedOfficer.role,
          region: assignedOfficer.region,
          capacityKw: capacityKw,
          totalCost: totalCost,
          updatedAt: serverTimestamp()
        });
      } else {
        const projectRef = await addDoc(collection(db, 'projects'), {
          leadId: targetLead.id,
          name: `${targetLead.name} Solar Installation`,
          customerName: targetLead.name,
          phone: targetLead.phone,
          address: targetLead.address,
          city: targetLead.city || '',
          state: targetLead.state || '',
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
            { stage: 'Initial', timestamp: new Date().toISOString(), note: `Project created from CRM Lead: ${targetLead.name} and assigned to ${assignedOfficer.name}` }
          ],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        projectId = projectRef.id;

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
      }

      // Close assignment modal
      setIsAssignModalOpen(false);
      setSelectedLeadForApproval(null);

      // Pre-calculate quotation details based on system size
      const estGeneration = `${Math.round(capacityKw * 120)}`;
      const estCost = `${Math.round(capacityKw * 55000)}`;

      setQuotationDetails({
        systemSize: capacityKw.toString(),
        panelType: 'Monocrystalline',
        inverterType: 'String Inverter',
        totalCost: estCost,
        estimatedGeneration: estGeneration
      });
      setSelectedLeadForQuotation(targetLead);

      // Prompt user to generate formal Quotation after assigning
      const wantQuotation = window.confirm(
        `✅ Lead "${targetLead.name}" has been Approved & Assigned to ${assignedOfficer.name} (${assignedOfficer.region})!\n\nProject created in the pipeline.\n\nWould you like to generate and record the formal Sales Quotation for ${targetLead.name} now?`
      );

      if (wantQuotation) {
        setIsQuotationModalOpen(true);
      }
    } catch (err) {
      console.error('Error assigning and approving lead:', err);
      alert('Failed to approve and assign regional officer.');
    } finally {
      setIsSubmittingAssign(false);
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

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsQuotationModalOpen(false);
        setIsAssignModalOpen(false);
        setSelected3DLead(null);
        setEditingLeadId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-in slide-in-from-bottom-4 duration-500">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {user?.role === 'Vendor' || user?.role === 'Vendor Employee' ? (
              <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-800 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 border border-cyan-200">
                <Building2 className="w-3.5 h-3.5 text-cyan-600" /> Vendor Lead Flow: {user.companyName || user.name} ({filteredLeads.length} Leads)
              </span>
            ) : user?.role === 'Installer' || user?.role === 'Solar Installer' ? (
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 border border-amber-200">
                <Wrench className="w-3.5 h-3.5 text-amber-600" /> Installer Lead Flow: {user.name} ({filteredLeads.length} Leads)
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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{lead.name}</span>
                        {lead.expectedLoad && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {lead.expectedLoad} {lead.expectedLoadUnit || 'KW'}
                          </span>
                        )}
                      </div>
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
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[100] overflow-y-auto p-3 sm:p-6 flex items-start justify-center pt-24 sm:pt-28 pb-16"
          onClick={() => {
            setIsModalOpen(false);
            setEditingLeadId(null);
          }}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[calc(100vh-8.5rem)] flex flex-col min-h-0 overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Sticky Header with prominent Close button */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 sticky top-0 z-30 shadow-xs">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  {editingLeadId ? 'Edit Prospect' : 'Add New Prospect'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Capture client details, GPS rooftop coordinates & energy consumption</p>
              </div>
              <button 
                type="button"
                onClick={() => { 
                  setIsModalOpen(false); 
                  setEditingLeadId(null); 
                  setNewLead({ name: '', email: '', phone: '', source: 'Website', address: '', city: '', district: '', state: '', pincode: '', gpsLocation: '', roofType: '', monthlyUnits: '', expectedLoad: '', electricityBillUrl: '', propertyImagesUrls: [], roofImagesUrls: [] }); 
                }} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all shadow-xs border border-red-200 hover:border-red-500 cursor-pointer shrink-0"
                title="Close Form (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitLead} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-500" /> Customer Information
                  </h4>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input
                    required
                    value={newLead.name}
                    onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Lead Source</label>
                  <select
                    value={newLead.source}
                    onChange={e => setNewLead({ ...newLead, source: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium cursor-pointer"
                  >
                    <option value="Website">Website Leads</option>
                    <option value="Facebook">Facebook Leads</option>
                    <option value="Google Ads">Google Ads Leads</option>
                    <option value="Referral">Referral Leads</option>
                    <option value="Walk-in">Walk-in Leads</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newLead.email}
                    onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone Number *</label>
                  <input
                    required
                    value={newLead.phone}
                    onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 pt-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Location Details
                  </h4>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Street Address *</label>
                  <input
                    required
                    value={newLead.address}
                    onChange={e => setNewLead({ ...newLead, address: e.target.value })}
                    placeholder="Plot / House No, Street, Landmark"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">City</label>
                  <input
                    value={newLead.city || ''}
                    onChange={e => setNewLead({ ...newLead, city: e.target.value })}
                    placeholder="e.g. Pune"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">District</label>
                  <input
                    value={newLead.district || ''}
                    onChange={e => setNewLead({ ...newLead, district: e.target.value })}
                    placeholder="e.g. Pune"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">State</label>
                  <input
                    value={newLead.state || ''}
                    onChange={e => setNewLead({ ...newLead, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pincode</label>
                  <input
                    value={newLead.pincode || ''}
                    onChange={e => setNewLead({ ...newLead, pincode: e.target.value })}
                    placeholder="e.g. 411001"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">GPS Location (Lat, Long)</label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      value={newLead.gpsLocation}
                      onChange={e => setNewLead({ ...newLead, gpsLocation: e.target.value })}
                      placeholder="e.g. 18.5204, 73.8567"
                      className="flex-1 px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleDropPinGPS}
                      disabled={isDetectingLocation}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
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

                <div className="col-span-1 md:col-span-2 pt-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-emerald-500" /> Energy Requirements
                  </h4>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Roof Type</label>
                  <select
                    value={newLead.roofType}
                    onChange={e => setNewLead({ ...newLead, roofType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium cursor-pointer"
                  >
                    <option value="">Select Roof Type...</option>
                    <option value="RCC">RCC (Flat Roof)</option>
                    <option value="Tin Shed">Industrial Tin Shed</option>
                    <option value="Tiled">Tiled Roof</option>
                    <option value="Asbestos">Asbestos Sheet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Expected System Capacity *</label>
                  <div className="flex gap-2">
                    <input
                      required
                      type="number"
                      step="any"
                      min="0.1"
                      value={newLead.expectedLoad || ''}
                      onChange={e => setNewLead({ ...newLead, expectedLoad: e.target.value })}
                      placeholder="e.g. 5"
                      className="flex-1 px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-black text-slate-800 text-sm"
                    />
                    <select
                      value={newLead.expectedLoadUnit || 'KW'}
                      onChange={e => setNewLead({ ...newLead, expectedLoadUnit: e.target.value as 'KW' | 'MW' })}
                      className="w-24 px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-black text-slate-800 text-sm cursor-pointer"
                    >
                      <option value="KW">KW</option>
                      <option value="MW">MW</option>
                    </select>
                  </div>
                </div>

                {/* Infinite Monthly Electricity Units Range System */}
                {(() => {
                  const getParsedUnits = () => {
                    if (!newLead.monthlyUnits) return { from: 300, to: 400 };
                    if (newLead.monthlyUnits.includes('-')) {
                      const parts = newLead.monthlyUnits.split('-');
                      return {
                        from: parseInt(parts[0]) || 0,
                        to: parseInt(parts[1]) || (parseInt(parts[0]) || 0) + 100
                      };
                    }
                    const val = parseInt(newLead.monthlyUnits) || 400;
                    return { from: Math.max(0, val - 100), to: val };
                  };

                  const { from: currentFrom, to: currentTo } = getParsedUnits();
                  // Infinite Dynamic Scaling Slider: automatically expands to accommodate any scale from 0 to 1,000,000+
                  const dynamicSliderMax = Math.max(5000, Math.ceil((Math.max(currentTo, currentFrom) * 1.5) / 1000) * 1000);
                  const dynamicStep = Math.max(25, Math.pow(10, Math.max(1, Math.floor(Math.log10(dynamicSliderMax / 100)))));

                  return (
                    <div className="col-span-1 md:col-span-2 space-y-3.5 bg-slate-50 p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            ⚡ Monthly Electricity Units Range (kWh)
                          </label>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Supports Infinite Scale (Residential, Commercial & Mega Industrial Plants)
                          </p>
                        </div>
                        <span className="px-3 py-1.5 bg-emerald-500/15 text-emerald-800 text-xs font-black rounded-xl border border-emerald-500/30 shadow-xs">
                          {currentFrom.toLocaleString()} - {currentTo.toLocaleString()} kWh / mo
                        </span>
                      </div>

                      {/* Infinite Range Quick Presets */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          '100-300',
                          '300-500',
                          '500-1000',
                          '1000-2500',
                          '2500-5000',
                          '5000-10000',
                          '10000-25000',
                          '25000-50000',
                          '50000-100000',
                          '100000+'
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

                      {/* Unbounded Direct Numeric Range Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
                          <span className="text-xs font-black text-slate-400 uppercase">From:</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={currentFrom || ''}
                            onChange={e => {
                              const fromVal = Math.max(0, Number(e.target.value) || 0).toString();
                              setNewLead({ ...newLead, monthlyUnits: `${fromVal}-${currentTo}` });
                            }}
                            placeholder="300"
                            className="w-full text-xs font-black text-slate-800 outline-none"
                          />
                          <span className="text-[10px] font-bold text-slate-400">kWh</span>
                        </div>

                        <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
                          <span className="text-xs font-black text-slate-400 uppercase">To:</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={currentTo || ''}
                            onChange={e => {
                              const toVal = Math.max(0, Number(e.target.value) || 0).toString();
                              setNewLead({ ...newLead, monthlyUnits: `${currentFrom}-${toVal}` });
                            }}
                            placeholder="500"
                            className="w-full text-xs font-black text-slate-800 outline-none"
                          />
                          <span className="text-[10px] font-bold text-slate-400">kWh</span>
                        </div>
                      </div>

                      {/* Infinite Dynamic Range Bar Slider */}
                      <div className="space-y-1.5 pt-1">
                        <input
                          type="range"
                          min="0"
                          max={dynamicSliderMax}
                          step={dynamicStep}
                          value={currentTo}
                          onChange={e => {
                            const toVal = parseInt(e.target.value) || 0;
                            const fromVal = Math.max(0, Math.round(toVal * 0.75));
                            setNewLead({ ...newLead, monthlyUnits: `${fromVal}-${toVal}` });
                          }}
                          className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>0 Units</span>
                          <span>{Math.round(dynamicSliderMax * 0.25).toLocaleString()} Units</span>
                          <span>{Math.round(dynamicSliderMax * 0.5).toLocaleString()} Units</span>
                          <span>{Math.round(dynamicSliderMax * 0.75).toLocaleString()} Units</span>
                          <span className="text-emerald-700 font-black">{dynamicSliderMax.toLocaleString()}+ Units (Infinite ⚡)</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="col-span-1 md:col-span-2 pt-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" /> Documents & Site Media
                  </h4>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Electricity Bill Upload</label>
                  <input
                    type="file"
                    onChange={e => setNewLead({ ...newLead, electricityBillUrl: e.target.files?.[0]?.name || '' })}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer cursor-pointer border border-slate-200 rounded-xl p-1 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Property Images</label>
                  <input
                    type="file"
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files || []) as File[];
                      setNewLead({ ...newLead, propertyImagesUrls: files.map(f => f.name) });
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer cursor-pointer border border-slate-200 rounded-xl p-1 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Roof Images</label>
                  <input
                    type="file"
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files || []) as File[];
                      setNewLead({ ...newLead, roofImagesUrls: files.map(f => f.name) });
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer cursor-pointer border border-slate-200 rounded-xl p-1 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Sticky Bottom Form Action Buttons */}
              <div className="pt-4 flex gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingLeadId(null);
                  }}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer text-sm"
                >
                  Cancel / Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition-all shadow-lg shadow-emerald-600/20 cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingLead ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{isSubmittingLead ? (editingLeadId ? 'Updating...' : 'Creating...') : (editingLeadId ? 'Update Prospect' : 'Create Lead & Pipeline')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE QUOTATION MODAL */}
      {isQuotationModalOpen && selectedLeadForQuotation && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[100] overflow-y-auto p-3 sm:p-6 flex items-start justify-center pt-24 sm:pt-28 pb-16"
          onClick={() => setIsQuotationModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[calc(100vh-8.5rem)] flex flex-col min-h-0 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 sticky top-0 z-30 shadow-xs">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Generate Quotation
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Creating estimate for {selectedLeadForQuotation.name}</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsQuotationModalOpen(false)} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all shadow-xs border border-red-200 hover:border-red-500 cursor-pointer shrink-0"
                title="Close Form (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmittingQuotation(true);
              try {
                const quoteRef = await addDoc(collection(db, 'quotations'), {
                  leadId: selectedLeadForQuotation.id,
                  leadName: selectedLeadForQuotation.name,
                  systemSize: quotationDetails.systemSize,
                  panelType: quotationDetails.panelType,
                  inverterType: quotationDetails.inverterType,
                  totalCost: quotationDetails.totalCost,
                  estimatedGeneration: quotationDetails.estimatedGeneration,
                  createdAt: serverTimestamp()
                });

                // Update lead in Firestore with quotation details
                await updateDoc(doc(db, 'leads', selectedLeadForQuotation.id), {
                  quotationGenerated: true,
                  quotationId: quoteRef.id,
                  quotationSystemSize: quotationDetails.systemSize,
                  quotationTotalCost: quotationDetails.totalCost,
                  status: selectedLeadForQuotation.status === 'Approved' ? 'Approved' : 'Proposal',
                  updatedAt: serverTimestamp()
                });

                alert(`✅ Quotation for "${selectedLeadForQuotation.name}" (${quotationDetails.systemSize} kW, ₹${Number(quotationDetails.totalCost || 0).toLocaleString()}) generated and saved successfully!`);
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
                alert('Failed to save quotation. Please check network connection.');
              } finally {
                setIsSubmittingQuotation(false);
              }
            }} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">System Size (kW)</label>
                    <div className="flex gap-2">
                      {[3, 5, 10, 25, 50].map(size => (
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
                          className="px-2 py-0.5 text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
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
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-bold"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Panel Type</label>
                    <select
                      value={quotationDetails.panelType}
                      onChange={e => setQuotationDetails({ ...quotationDetails, panelType: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm bg-white"
                    >
                      <option value="Monocrystalline">Monocrystalline (High Eff.)</option>
                      <option value="Polycrystalline">Polycrystalline (Standard)</option>
                      <option value="Bifacial">Bifacial (Dual Sided)</option>
                      <option value="TopCon">TopCon NextGen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Inverter Type</label>
                    <select
                      value={quotationDetails.inverterType}
                      onChange={e => setQuotationDetails({ ...quotationDetails, inverterType: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm bg-white"
                    >
                      <option value="String Inverter">String Inverter (Grid-Tied)</option>
                      <option value="Microinverter">Microinverter (Modular)</option>
                      <option value="Hybrid Inverter">Hybrid Inverter (Battery Ready)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Estimated Cost (INR)</label>
                  <input
                    type="number"
                    value={quotationDetails.totalCost}
                    onChange={e => setQuotationDetails({ ...quotationDetails, totalCost: e.target.value })}
                    placeholder="e.g. 300000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Estimated Monthly Units (kWh)</label>
                  <input
                    type="number"
                    value={quotationDetails.estimatedGeneration}
                    onChange={e => setQuotationDetails({ ...quotationDetails, estimatedGeneration: e.target.value })}
                    placeholder="e.g. 600"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsQuotationModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors text-xs cursor-pointer"
                >
                  Cancel / Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuotation}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingQuotation ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  <span>{isSubmittingQuotation ? 'Saving Quotation...' : 'Save Quotation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval & Location-Based Regional Officer Assignment Modal */}
      {isAssignModalOpen && selectedLeadForApproval && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[100] overflow-y-auto p-3 sm:p-6 flex items-start justify-center pt-24 sm:pt-28 pb-16"
          onClick={() => setIsAssignModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[calc(100vh-8.5rem)] flex flex-col min-h-0 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
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
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all shadow-xs border border-red-200 hover:border-red-500 cursor-pointer shrink-0"
                title="Close Form (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={confirmApprovalAndAssignment} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              {/* Customer & Location Card */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                    {selectedLeadForApproval.name}
                  </span>
                  <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md">
                    {selectedLeadForApproval.expectedLoad || '5'} {selectedLeadForApproval.expectedLoadUnit || 'KW'} Solar
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

              {/* Regional Officer Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Recommended Regional Officer
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAllOfficers(!showAllOfficers)}
                    className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    {showAllOfficers ? 'Show Matched Only' : 'Show All Officers'}
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(showAllOfficers ? officers : getMatchedRegionalOfficers(selectedLeadForApproval)).map(officer => {
                    const isSelected = selectedAssigneeId === officer.id;
                    return (
                      <div
                        key={officer.id}
                        onClick={() => setSelectedAssigneeId(officer.id)}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                          isSelected
                            ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900">{officer.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                              {officer.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            📍 {officer.region} | 📞 {officer.contact}
                          </p>
                        </div>
                        <input
                          type="radio"
                          name="officerSelect"
                          checked={isSelected}
                          onChange={() => setSelectedAssigneeId(officer.id)}
                          className="w-4 h-4 accent-emerald-600"
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Matched based on prospect state ({selectedLeadForApproval.state || 'N/A'}) & city
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
              <div className="pt-3 flex gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel / Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssign}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAssign ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{isSubmittingAssign ? 'Assigning & Approving...' : 'Confirm Approval & Assign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3D ROOFTOP SOLAR VIEW MODAL */}
      {selected3DLead && (
        <div 
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] overflow-y-auto p-3 sm:p-6 flex items-start justify-center pt-24 sm:pt-28 pb-16"
          onClick={() => setSelected3DLead(null)}
        >
          <div 
            className="relative bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[calc(100vh-8.5rem)] flex flex-col min-h-0 overflow-hidden border border-slate-800 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-white shrink-0 sticky top-0 z-30 shadow-xs">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">GPS 3D CAD Rooftop Simulation</span>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" /> {selected3DLead.name} Rooftop Solar Layout
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected3DLead(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-black text-xs transition-all shadow-xs border border-red-500/30 cursor-pointer shrink-0"
                title="Close 3D View (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>
            <div className="flex-1 min-h-[450px] p-2 overflow-hidden">
              <Solar3DViewer
                roofType={selected3DLead.roofType || 'Flat Concrete'}
                address={selected3DLead.address ? `${selected3DLead.address}, ${selected3DLead.city || ''}` : selected3DLead.name}
                panelCount={selected3DLead.expectedLoad ? Math.max(4, Math.round(Number(selected3DLead.expectedLoad) * 2.5)) : 12}
                lat={selected3DLead.gpsLocation && selected3DLead.gpsLocation.includes(',') ? parseFloat(selected3DLead.gpsLocation.split(',')[0]) : 17.3850}
                lng={selected3DLead.gpsLocation && selected3DLead.gpsLocation.includes(',') ? parseFloat(selected3DLead.gpsLocation.split(',')[1]) : 78.4867}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

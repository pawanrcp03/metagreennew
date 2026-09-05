import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Mail, 
  Building2, 
  User, 
  Sun, 
  IndianRupee, 
  Percent, 
  Clock, 
  ShieldCheck, 
  CalendarClock,
  CheckCircle2,
  Settings,
  Zap,
  Sparkles,
  Printer,
  UserPlus,
  Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useLogos } from '@/src/context/LogoContext';
import { useAuth } from '@/src/context/AuthContext';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

export default function ProposalGenerator() {
  const { logos } = useLogos();
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vendorCompanyName = user?.companyName || user?.vendorAccount?.companyName || logos.companyName || 'META GREEN';
  const vendorLogo = user?.companyLogo || user?.vendorAccount?.companyLogo || logos.companyLogo;
  const vendorDoorNo = user?.doorNo || user?.vendorAccount?.doorNo;
  const vendorAddressText = user?.companyAddress 
    ? `${vendorDoorNo ? `${vendorDoorNo}, ` : ''}${user.companyAddress}, ${user.city || ''}, ${user.state || ''} ${user.pincode || ''}`
    : (user?.vendorAccount?.companyAddress ? `${vendorDoorNo ? `${vendorDoorNo}, ` : ''}${user.vendorAccount.companyAddress}, ${user.vendorAccount.city || ''}, ${user.vendorAccount.state || ''} ${user.vendorAccount.pincode || ''}` : 'Official Vendor Registered Office');
  const vendorGstin = user?.gstin || user?.vendorAccount?.gstin;
  const [isEmailing, setIsEmailing] = useState(false);

  // Walk-in modal state
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);
  const [walkinData, setWalkinData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: 'Andhra Pradesh',
    systemCapacity: 5
  });

  const [proposalData, setProposalData] = useState({
    customerName: 'John Doe',
    customerAddress: '123 Solar Street, Green City',
    systemCapacity: 5, // kW
    estimatedGeneration: 7500, // kWh/year
    totalCost: 350000, // INR
    subsidy: 78000, // INR
    emiMonths: 60,
    interestRate: 8.5,
    paybackPeriod: 3.5, // years
    roi: 22, // %
    timelineDays: 14,
    panelWarranty: 25,
    inverterWarranty: 10,
    customMatter: 'We are pleased to submit this comprehensive solar engineering proposal for your premises. All components supplied conform to MNRE / ALMM certified specifications with 25-year performance warranty on solar PV modules and 10-year warranty on grid-tied inverters. Net metering and subsidy liaisoning are included.'
  });

  const netCost = proposalData.totalCost - proposalData.subsidy;
  const emiAmount = Math.round((netCost * Math.pow(1 + proposalData.interestRate / 100 / 12, proposalData.emiMonths)) / proposalData.emiMonths);

  // Add Walk-in Lead directly to Firestore
  const handleAddWalkinCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newLeadDoc = {
        name: walkinData.name,
        phone: walkinData.phone,
        email: `${walkinData.phone}@walkin.solar`,
        address: walkinData.address,
        city: walkinData.city,
        state: walkinData.state,
        expectedLoad: walkinData.systemCapacity.toString(),
        source: 'Walk-in' as const,
        status: 'New Lead' as const,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'leads'), newLeadDoc);

      setProposalData(prev => ({
        ...prev,
        customerName: walkinData.name,
        customerAddress: `${walkinData.address}, ${walkinData.city}`,
        systemCapacity: walkinData.systemCapacity,
        estimatedGeneration: Math.round(walkinData.systemCapacity * 1500),
        totalCost: Math.round(walkinData.systemCapacity * 70000)
      }));

      alert(`✅ Walk-in Customer "${walkinData.name}" added to CRM leads & selected for Proposal!`);
      setIsWalkinModalOpen(false);
      setWalkinData({ name: '', phone: '', address: '', city: '', state: 'Andhra Pradesh', systemCapacity: 5 });
    } catch (err) {
      console.error('Error adding walk-in customer:', err);
      alert('Failed to add walk-in customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('proposal-preview-container');
    if (!element) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Proposal_${proposalData.customerName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
      alert('Error generating PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailProposal = async () => {
    const email = prompt("Enter customer email address to send proposal to:");
    if (!email) return;

    setIsEmailing(true);
    try {
      await addDoc(collection(db, 'mail'), {
        to: email,
        message: {
          subject: `Solar Proposal for ${proposalData.customerName}`,
          html: `<p>Dear ${proposalData.customerName},</p><p>Please find your customized solar proposal attached.</p><p>Total Cost: ₹${proposalData.totalCost}</p><p>System Capacity: ${proposalData.systemCapacity}kW</p>`,
        }
      });
      alert(`Proposal sent successfully to ${email}`);
    } catch (err) {
      console.error(err);
      alert("Failed to email proposal.");
    }
    setIsEmailing(false);
  };

  const handleSaveProposal = async () => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'proposals'), {
        ...proposalData,
        netCost,
        emiAmount,
        createdAt: serverTimestamp()
      });
      alert('✅ Proposal saved successfully to the database.');
    } catch (err) {
      console.error('Error saving proposal:', err);
      alert('Failed to save proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Top Action Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 lg:p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            Proposal Generator
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Customized proposals with dynamic company branding logo and Walk-in customer creation
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            type="button"
            onClick={() => setIsWalkinModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 text-white font-extrabold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 text-xs shadow-md shadow-emerald-200 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> + Direct Add Walk-in Lead
          </button>
          <button 
            type="button"
            onClick={handleSaveProposal}
            disabled={isSubmitting}
            className="px-3.5 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-xs border border-blue-200 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{isSubmitting ? 'Saving...' : 'Save DB'}</span>
          </button>
          <button 
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-3.5 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />} 
            <span>{isExporting ? 'Exporting...' : 'Download PDF'}</span>
          </button>
          <button 
            type="button"
            onClick={handleEmailProposal}
            disabled={isEmailing}
            className="px-3.5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 text-xs shadow-md shadow-emerald-200 disabled:opacity-50 cursor-pointer"
          >
            {isEmailing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Mail className="w-4 h-4" />}
            <span>{isEmailing ? 'Sending...' : 'Email Proposal'}</span>
          </button>
        </div>
      </header>

      {/* SIDE-BY-SIDE CONTAINER: EDITOR (LEFT) & LIVE PREVIEW (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Proposal Editor Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" /> Proposal Form Editor
            </span>
            <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              Live Input
            </span>
          </div>

          {/* Customer Details */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" /> Customer Information
              </h3>
              <button
                type="button"
                onClick={() => setIsWalkinModalOpen(true)}
                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> + Walk-in Lead
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Customer Name</label>
                <input 
                  type="text" 
                  value={proposalData.customerName} 
                  onChange={e => setProposalData({...proposalData, customerName: e.target.value})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Site Address</label>
                <input 
                  type="text" 
                  value={proposalData.customerAddress} 
                  onChange={e => setProposalData({...proposalData, customerAddress: e.target.value})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
            </div>
          </div>

          {/* System Specs */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sun className="w-4 h-4 text-amber-500" /> Solar System Specifications
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Capacity (kW)</label>
                <input 
                  type="number" 
                  value={proposalData.systemCapacity} 
                  onChange={e => setProposalData({...proposalData, systemCapacity: Number(e.target.value)})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Est. Generation (kWh/yr)</label>
                <input 
                  type="number" 
                  value={proposalData.estimatedGeneration} 
                  onChange={e => setProposalData({...proposalData, estimatedGeneration: Number(e.target.value)})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
            </div>
          </div>

          {/* Financials & Costs */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" /> Cost & Financial Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Total System Cost (₹)</label>
                <input 
                  type="number" 
                  value={proposalData.totalCost} 
                  onChange={e => setProposalData({...proposalData, totalCost: Number(e.target.value)})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Govt Subsidy (₹)</label>
                <input 
                  type="number" 
                  value={proposalData.subsidy} 
                  onChange={e => setProposalData({...proposalData, subsidy: Number(e.target.value)})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">EMI Tenure (Months)</label>
                <input 
                  type="number" 
                  value={proposalData.emiMonths} 
                  onChange={e => setProposalData({...proposalData, emiMonths: Number(e.target.value)})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Interest Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={proposalData.interestRate} 
                  onChange={e => setProposalData({...proposalData, interestRate: Number(e.target.value)})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
            </div>
          </div>

          {/* ROI & Warranties */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-purple-500" /> ROI & Warranty Terms
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">ROI (%)</label>
                <input 
                  type="number" 
                  value={proposalData.roi} 
                  onChange={e => setProposalData({...proposalData, roi: Number(e.target.value)})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Payback (Years)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={proposalData.paybackPeriod} 
                  onChange={e => setProposalData({...proposalData, paybackPeriod: Number(e.target.value)})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Panel Warranty (Yrs)</label>
                <input 
                  type="number" 
                  value={proposalData.panelWarranty} 
                  onChange={e => setProposalData({...proposalData, panelWarranty: Number(e.target.value)})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Inverter Warranty (Yrs)</label>
                <input 
                  type="number" 
                  value={proposalData.inverterWarranty} 
                  onChange={e => setProposalData({...proposalData, inverterWarranty: Number(e.target.value)})} 
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" 
                />
              </div>
            </div>

            {/* Editable Proposal Matter & Scope */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                Proposal Matter & Scope of Work
              </label>
              <textarea
                rows={3}
                value={proposalData.customMatter}
                onChange={e => setProposalData({ ...proposalData, customMatter: e.target.value })}
                placeholder="Enter custom proposal introduction or scope of work..."
                className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Proposal Document Preview */}
        <div className="lg:col-span-7 sticky top-4 space-y-3">
          <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Live Rendered Proposal View
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Updates in Real-Time
            </span>
          </div>

          <div className="bg-slate-200/70 p-3 rounded-2xl border border-slate-300/80 overflow-x-auto shadow-inner">
            {/* Proposal Document Preview Canvas */}
            <div 
              id="proposal-preview-container" 
              className="bg-white text-slate-900 p-8 rounded-xl shadow-lg border border-slate-200 max-w-[800px] mx-auto space-y-6 font-sans"
            >
              {/* Proposal Document Header with Dynamic Company Logo */}
              <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    {vendorLogo ? (
                      <img src={vendorLogo} alt="Company Logo" className="h-10 max-w-[180px] object-contain" />
                    ) : (
                      <>
                        <Sun className="w-7 h-7 text-emerald-600" />
                        <span className="text-2xl font-black tracking-tight text-slate-900">
                          {vendorCompanyName}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-semibold mt-1">
                    📍 {vendorAddressText} {vendorGstin ? `| GSTIN: ${vendorGstin}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full uppercase">
                    Solar Proposal
                  </span>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Customer Greeting */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Prepared For</p>
                  <h2 className="text-base font-bold text-slate-900">{proposalData.customerName}</h2>
                  <p className="text-xs text-slate-600 mt-0.5">{proposalData.customerAddress}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-slate-400">System Size</p>
                  <p className="text-lg font-black text-emerald-600">{proposalData.systemCapacity} kW System</p>
                </div>
              </div>

              {/* Executive Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">Est. Annual Generation</p>
                  <p className="text-base font-black text-emerald-700 mt-1">{proposalData.estimatedGeneration.toLocaleString()} kWh</p>
                </div>
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-center">
                  <p className="text-[10px] font-bold text-blue-800 uppercase">Projected ROI</p>
                  <p className="text-base font-black text-blue-700 mt-1">{proposalData.roi}% / year</p>
                </div>
                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 text-center">
                  <p className="text-[10px] font-bold text-purple-800 uppercase">Payback Period</p>
                  <p className="text-base font-black text-purple-700 mt-1">{proposalData.paybackPeriod} Years</p>
                </div>
              </div>

              {/* Financial Calculation Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">Financial Breakdown</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="flex justify-between bg-slate-50 p-2.5 font-bold border-b border-slate-200">
                    <span>Item Description</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div className="flex justify-between p-2.5 border-b border-slate-100">
                    <span>Total Solar System Cost ({proposalData.systemCapacity} kW)</span>
                    <span className="font-semibold">₹{proposalData.totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 border-b border-slate-100 text-emerald-700 font-semibold bg-emerald-50/30">
                    <span>Govt. PM Surya Ghar Subsidy Deduction</span>
                    <span>- ₹{proposalData.subsidy.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-900 text-white font-black">
                    <span>Net Effective Outlay</span>
                    <span className="text-emerald-400 text-sm">₹{netCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Easy Financing Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Estimated Solar Loan EMI</h5>
                  <p className="text-[11px] text-slate-500 font-medium">{proposalData.emiMonths} Months @ {proposalData.interestRate}% Interest p.a.</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-emerald-600">₹{emiAmount.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ mo</span></p>
                </div>
              </div>

              {/* Proposal Custom Matter */}
              {proposalData.customMatter && (
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/70 text-slate-700 text-[11px] leading-relaxed">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 block mb-0.5">
                    Proposal Matter & Scope of Work
                  </span>
                  <p className="whitespace-pre-line font-medium">{proposalData.customMatter}</p>
                </div>
              )}

              {/* Guarantees & Terms */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <p className="font-bold text-slate-800">🔒 Panel Performance Warranty</p>
                  <p className="text-slate-500">{proposalData.panelWarranty} Years Linear Output Warranty</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <p className="font-bold text-slate-800">⚡ Inverter Product Warranty</p>
                  <p className="text-slate-500">{proposalData.inverterWarranty} Years Replacement Guarantee</p>
                </div>
              </div>

              {/* Proposal Footer */}
              <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-[10px] text-slate-400">
                <p>Generated via {logos.companyName || 'MetaGreen'} Solar ERP Platform</p>
                <p>Authorized Signature: __________________</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* QUICK ADD WALK-IN CUSTOMER MODAL */}
      {isWalkinModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[200] overflow-y-auto p-4 sm:p-6 flex items-start justify-center pt-24 sm:pt-28 pb-16"
          onClick={() => setIsWalkinModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[calc(100vh-8.5rem)] flex flex-col min-h-0 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" /> Quick Add Walk-in Customer
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Saves lead directly to CRM with 'Walk-in' tag</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsWalkinModalOpen(false)} 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all shadow-xs border border-red-200 hover:border-red-500 cursor-pointer shrink-0"
                title="Close Form (ESC)"
              >
                <span className="text-sm font-black">✕</span>
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={handleAddWalkinCustomer} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Full Name *</label>
                <input
                  required
                  type="text"
                  value={walkinData.name}
                  onChange={(e) => setWalkinData({ ...walkinData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Contact *</label>
                  <input
                    required
                    type="text"
                    value={walkinData.phone}
                    onChange={(e) => setWalkinData({ ...walkinData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">System Capacity (kW)</label>
                  <input
                    type="number"
                    value={walkinData.systemCapacity}
                    onChange={(e) => setWalkinData({ ...walkinData, systemCapacity: Number(e.target.value) })}
                    className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Street Address *</label>
                <input
                  required
                  type="text"
                  value={walkinData.address}
                  onChange={(e) => setWalkinData({ ...walkinData, address: e.target.value })}
                  placeholder="Door No, Street Name"
                  className="w-full text-xs font-medium p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={walkinData.city}
                    onChange={(e) => setWalkinData({ ...walkinData, city: e.target.value })}
                    placeholder="City"
                    className="w-full text-xs p-1.5 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">State</label>
                  <input
                    type="text"
                    value={walkinData.state}
                    onChange={(e) => setWalkinData({ ...walkinData, state: e.target.value })}
                    placeholder="State"
                    className="w-full text-xs p-1.5 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsWalkinModalOpen(false)}
                  className="flex-1 px-3 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-emerald-200 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{isSubmitting ? 'Saving Lead...' : 'Save Walk-in Lead & Select'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

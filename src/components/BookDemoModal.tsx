import React, { useState } from 'react';
import { X, Calendar, Clock, Sparkles, Building2, Phone, Mail, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { useToast } from '@/src/context/ToastContext';

interface BookDemoModalProps {
  onClose: () => void;
  onOpenSignUp?: () => void;
}

export default function BookDemoModal({ onClose, onOpenSignUp }: BookDemoModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    companySize: '5-20 Employees',
    primaryInterest: 'All-in-One Solar Business Suite (CRM + ERP + Subsidy)',
    preferredDate: '',
    preferredTime: '11:00 AM IST'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
      toast.success(
        `Demo confirmed for ${formData.companyName}! Our solar specialist will connect with ${formData.email} on ${formData.preferredDate || 'tomorrow'} at ${formData.preferredTime}.`,
        'Demo Scheduled'
      );
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-slate-100">
        
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="px-3 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-black rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5" /> 1-on-1 Guided Product Walkthrough
            </span>
            <h2 className="text-xl font-black text-white mt-1.5">Book a MetaGreen Live Demo</h2>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-white">Demo Scheduled Successfully!</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Thank you, <span className="text-emerald-400 font-bold">{formData.name}</span>. Our enterprise solar solution consultant will conduct a live 30-minute tailored walkthrough for <span className="text-white font-bold">{formData.companyName}</span>.
            </p>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <p>📅 <strong className="text-slate-200">{formData.preferredDate || 'Upcoming business day'}</strong> at <strong className="text-slate-200">{formData.preferredTime}</strong></p>
              <p>✉️ Calendar invitation & Google Meet link sent to <strong className="text-emerald-400">{formData.email}</strong></p>
            </div>
            <div className="pt-2 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                Close
              </button>
              {onOpenSignUp && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSignUp();
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md"
                >
                  Start 7-Day Free Trial Now
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <p className="text-xs text-slate-400 leading-relaxed">
              See how MetaGreen accelerates lead conversion, automates 70:30 GST solar quotes, and speeds up PM Surya Ghar subsidy disbursement.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Your Full Name *</label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Work Email *</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rahul@solarcompany.in"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Phone / WhatsApp *</label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Company / Firm Name *</label>
                <div className="relative flex items-center">
                  <Building2 className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="text"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Apex Solar Solutions"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Company Size</label>
                <select
                  value={formData.companySize}
                  onChange={e => setFormData({ ...formData, companySize: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-emerald-500 outline-none"
                >
                  <option value="1-5 Employees">1-5 Employees (Installer / EPC)</option>
                  <option value="5-20 Employees">5-20 Employees (Growing Solar Business)</option>
                  <option value="20-100 Employees">20-100 Employees (Commercial & Industrial)</option>
                  <option value="100+ Employees">100+ Employees (Enterprise / Utility)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Preferred Time Slot</label>
                <div className="relative flex items-center">
                  <Clock className="w-4 h-4 absolute left-3 text-slate-500" />
                  <select
                    value={formData.preferredTime}
                    onChange={e => setFormData({ ...formData, preferredTime: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="10:00 AM IST">10:00 AM IST</option>
                    <option value="11:30 AM IST">11:30 AM IST</option>
                    <option value="02:30 PM IST">02:30 PM IST</option>
                    <option value="04:00 PM IST">04:00 PM IST</option>
                    <option value="06:00 PM IST">06:00 PM IST</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Primary Modules of Interest</label>
              <select
                value={formData.primaryInterest}
                onChange={e => setFormData({ ...formData, primaryInterest: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:border-emerald-500 outline-none"
              >
                <option value="All-in-One Solar Business Suite (CRM + ERP + Subsidy)">Full Platform (CRM + ERP + Subsidy + Procurement)</option>
                <option value="70:30 GST Quotation & Proposal Generator">70:30 GST Quotation & Proposal Generator</option>
                <option value="PM Surya Ghar Subsidy Tracking & Approvals">PM Surya Ghar Subsidy Tracking & Approvals</option>
                <option value="Vendor PO, Stock & Multi-Warehouse Inventory">Vendor PO, Stock & Multi-Warehouse Inventory</option>
                <option value="Field Site Survey & Installation Mobile App">Field Site Survey & Installation Mobile App</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Confirming Demo Slot...' : 'Schedule My Live Demo'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

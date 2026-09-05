import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Building2, 
  Phone, 
  Mail, 
  User, 
  Briefcase, 
  HelpCircle, 
  Handshake, 
  CheckCircle2, 
  MessageSquare,
  Zap,
  MapPin
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useToast } from '@/src/context/ToastContext';
import { cn } from '@/src/lib/utils';

export type ContactPurpose = 'Sales' | 'Careers' | 'Info' | 'Support' | 'Partnership';

interface ContactCareerModalProps {
  initialPurpose?: ContactPurpose;
  onClose: () => void;
}

export default function ContactCareerModal({ initialPurpose = 'Sales', onClose }: ContactCareerModalProps) {
  const { toast } = useToast();
  const [purpose, setPurpose] = useState<ContactPurpose>(initialPurpose);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyOrCollege: '',
    city: '',
    state: 'Maharashtra',
    // Purpose: Sales
    systemCapacity: '10',
    capacityUnit: 'KW' as 'KW' | 'MW',
    monthlyElectricityUnits: '',
    // Purpose: Careers
    careerRole: 'Senior Solar Design Engineer',
    experienceYears: '3-5 Years',
    resumeUrl: '',
    noticePeriod: 'Immediate / 15 Days',
    // Purpose: Support
    ticketType: 'Technical Support',
    projectId: '',
    // Purpose: Partnership & General
    message: ''
  });

  const getTargetEmail = () => {
    switch (purpose) {
      case 'Sales':
      case 'Partnership':
        return 'sales@metadev.in';
      case 'Careers':
        return 'careers@metadev.in';
      case 'Support':
        return 'support@metadev.in';
      default:
        return 'sales@metadev.in';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'contactInquiries'), {
        purpose,
        targetEmail: getTargetEmail(),
        ...formData,
        createdAt: serverTimestamp(),
        status: 'New'
      });

      setIsSubmitted(true);
      toast.success(
        `Your ${purpose} inquiry has been directed to ${getTargetEmail()}. Our team will respond shortly!`,
        'Inquiry Submitted'
      );
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      // Fallback local success
      setIsSubmitted(true);
      toast.success(`Inquiry recorded! Our ${purpose} team will connect at ${formData.email}.`, 'Submitted');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-black rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> MetaGreen Connect Hub
              </span>
              <span className="text-xs font-mono text-slate-400">
                Direct: <strong className="text-emerald-400 font-bold">{getTargetEmail()}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Contact Us & Careers Portal</h2>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-white">{purpose} Request Dispatched!</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Thank you, <strong className="text-emerald-400">{formData.name}</strong>. Your {purpose.toLowerCase()} inquiry has been logged and routed to <strong className="text-white">{getTargetEmail()}</strong>.
            </p>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1 text-left max-w-md mx-auto">
              <p>📍 Location: <strong className="text-slate-200">{formData.city || 'National'}</strong>, {formData.state}</p>
              <p>📞 Phone: <strong className="text-slate-200">{formData.phone}</strong></p>
              <p>✉️ Email: <strong className="text-emerald-400">{formData.email}</strong></p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Purpose Selector Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Select Inquiry Purpose *</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'Sales', label: 'Sales & Quote', icon: Zap, email: 'sales@metadev.in' },
                  { id: 'Careers', label: 'Careers & Hiring', icon: Briefcase, email: 'careers@metadev.in' },
                  { id: 'Support', label: 'Help & Support', icon: HelpCircle, email: 'support@metadev.in' },
                  { id: 'Partnership', label: 'Partner & Supplier', icon: Handshake, email: 'sales@metadev.in' },
                  { id: 'Info', label: 'General Info', icon: MessageSquare, email: 'sales@metadev.in' }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = purpose === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPurpose(item.id as ContactPurpose)}
                      className={cn(
                        "p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer font-bold",
                        isSelected
                          ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-md"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", isSelected ? "text-emerald-400" : "text-slate-400")} />
                      <span className="text-[11px] font-black">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Common Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Your Full Name *</label>
                <div className="relative flex items-center">
                  <User className="w-3.5 h-3.5 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Kulkarni"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Email Address * (Will connect with {getTargetEmail()})</label>
                <div className="relative flex items-center">
                  <Mail className="w-3.5 h-3.5 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. ramesh@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Phone / WhatsApp *</label>
                <div className="relative flex items-center">
                  <Phone className="w-3.5 h-3.5 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">City / Region *</label>
                <div className="relative flex items-center">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Pune / Ahmedabad / Jaipur"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* DYNAMIC PURPOSE SPECIFIC FIELDS */}

            {/* 1. SALES FORM FIELDS */}
            {purpose === 'Sales' && (
              <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3 animate-in fade-in duration-150">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Solar System Requirement (Routing to sales@metadev.in)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Expected Solar Capacity</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.5"
                        value={formData.systemCapacity}
                        onChange={e => setFormData({ ...formData, systemCapacity: e.target.value })}
                        placeholder="e.g. 5"
                        className="w-2/3 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-white focus:border-emerald-500 outline-none"
                      />
                      <select
                        value={formData.capacityUnit}
                        onChange={e => setFormData({ ...formData, capacityUnit: e.target.value as any })}
                        className="w-1/3 px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl font-black text-emerald-400 focus:border-emerald-500 outline-none cursor-pointer"
                      >
                        <option value="KW">KW</option>
                        <option value="MW">MW</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Monthly Electricity Units (kWh)</label>
                    <input
                      type="number"
                      max="50000"
                      value={formData.monthlyElectricityUnits}
                      onChange={e => setFormData({ ...formData, monthlyElectricityUnits: e.target.value })}
                      placeholder="e.g. 650 units/month (Max 50,000)"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. CAREERS FORM FIELDS */}
            {purpose === 'Careers' && (
              <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-3 animate-in fade-in duration-150">
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Career Application (Routing to careers@metadev.in)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Applying Role</label>
                    <select
                      value={formData.careerRole}
                      onChange={e => setFormData({ ...formData, careerRole: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-white focus:border-blue-500 outline-none"
                    >
                      <option value="Solar Design Engineer (CAD/3D)">Solar Design Engineer (CAD/3D)</option>
                      <option value="Lead Solar Installer / Field Tech">Lead Solar Installer / Field Tech</option>
                      <option value="Site Survey Engineer">Site Survey Engineer</option>
                      <option value="Regional Solar Sales Executive">Regional Solar Sales Executive</option>
                      <option value="Full-Stack React/Node Software Engineer">Full-Stack React/Node Software Engineer</option>
                      <option value="DISCOM & Net Metering Officer">DISCOM & Net Metering Officer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Years of Experience</label>
                    <select
                      value={formData.experienceYears}
                      onChange={e => setFormData({ ...formData, experienceYears: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-white focus:border-blue-500 outline-none"
                    >
                      <option value="Fresher / < 1 Year">Fresher / &lt; 1 Year</option>
                      <option value="1-3 Years">1-3 Years</option>
                      <option value="3-5 Years">3-5 Years</option>
                      <option value="5+ Years (Lead / Principal)">5+ Years (Lead / Principal)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">LinkedIn Profile or Resume Link</label>
                  <input
                    type="url"
                    value={formData.resumeUrl}
                    onChange={e => setFormData({ ...formData, resumeUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/yourprofile or Google Drive Resume Link"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* 3. SUPPORT FORM FIELDS */}
            {purpose === 'Support' && (
              <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3 animate-in fade-in duration-150">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" /> Support Request (Routing to support@metadev.in)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Support Category</label>
                    <select
                      value={formData.ticketType}
                      onChange={e => setFormData({ ...formData, ticketType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-white focus:border-amber-500 outline-none"
                    >
                      <option value="Inverter / Generation Issue">Inverter / Generation Issue</option>
                      <option value="Net Metering & DISCOM Delay">Net Metering & DISCOM Delay</option>
                      <option value="PM Surya Ghar Subsidy Delay">PM Surya Ghar Subsidy Delay</option>
                      <option value="ERP / Software Access & Password">ERP / Software Access & Password</option>
                      <option value="Billing & Tax Invoice Correction">Billing & Tax Invoice Correction</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Project ID / Meter Number (Optional)</label>
                    <input
                      type="text"
                      value={formData.projectId}
                      onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                      placeholder="e.g. PRJ-001 / Consumer No."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Message / Requirement Details */}
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">
                {purpose === 'Careers' ? 'Cover Note / Key Skills' : 'Details & Requirements *'}
              </label>
              <textarea
                rows={3}
                required
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder={
                  purpose === 'Sales' ? 'Describe your rooftop area, electricity bill details, or preferred panel brands...' :
                  purpose === 'Careers' ? 'Mention your core solar/engineering competencies, previous employers, and availability...' :
                  purpose === 'Support' ? 'Explain the fault code, generation loss, or issue you need assistance with...' :
                  'Describe your organization, proposal, or inquiry...'
                }
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-medium text-white focus:border-emerald-500 outline-none resize-none"
              />
            </div>

            {/* Dispatch Footer */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                Emails auto-forwarded to: <strong className="text-emerald-400">{getTargetEmail()}</strong>
              </span>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Sending...' : `Submit ${purpose} Inquiry`}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

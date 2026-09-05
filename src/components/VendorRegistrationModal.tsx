import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  X,
  Users,
  HardDrive,
  AlertCircle,
  MapPin,
  Compass,
  LocateFixed,
  Loader2,
  Wrench
} from 'lucide-react';
import { subscriptionService, SubscriptionPlan } from '@/src/services/subscription.service';
import { authService } from '@/src/services/auth.service';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/context/ToastContext';

interface VendorRegistrationModalProps {
  selectedPlan: SubscriptionPlan;
  allPlans: SubscriptionPlan[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function VendorRegistrationModal({
  selectedPlan,
  allPlans,
  onClose,
  onSuccess
}: VendorRegistrationModalProps) {
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [chosenPlan, setChosenPlan] = useState<SubscriptionPlan>(selectedPlan);

  const [formData, setFormData] = useState({
    accountType: 'Vendor' as 'Vendor' | 'Installer',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyLogo: '',
    doorNo: '',
    companyAddress: '',
    city: '',
    state: 'Telangana',
    pincode: '',
    gstin: '',
    latitude: '',
    longitude: ''
  });

  const [loading, setLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFormData(prev => ({ ...prev, companyLogo: evt.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Reverse Geocoding: Coordinates (Lat/Lon) -> Detailed Address
  const fetchAddressFromCoords = async (lat: number, lon: number) => {
    setIsDetectingLocation(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const door = addr.house_number || addr.building || addr.unit || addr.house || '';
        const street = [addr.road, addr.suburb, addr.neighbourhood, addr.industrial].filter(Boolean).join(', ') || data.display_name?.split(',')[0] || '';
        const city = addr.city || addr.town || addr.village || addr.county || addr.district || '';
        const state = addr.state || 'Telangana';
        const postcode = addr.postcode || '';

        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lon.toFixed(6),
          doorNo: door || prev.doorNo,
          companyAddress: street || prev.companyAddress,
          city: city || prev.city,
          state: state || prev.state,
          pincode: postcode || prev.pincode
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lon.toFixed(6)
        }));
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      setFormData(prev => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lon.toFixed(6)
      }));
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleAutoDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchAddressFromCoords(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('GPS Geolocation Error:', error);
        setIsDetectingLocation(false);
        // Fallback default coordinates (Hyderabad, Telangana)
        fetchAddressFromCoords(17.385044, 78.486671);
      },
      { timeout: 10000 }
    );
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formData.companyName || !formData.contactPerson || !formData.email || !formData.phone || !formData.password) {
      setErrorMessage('Please fill in all required company details.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    setActiveStep(2);
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // 1. Create Auth User & User Document
      const assignedRole = formData.accountType === 'Installer' ? 'Installer' : 'Vendor';
      const userProfile = await authService.register(
        formData.email,
        formData.password,
        formData.contactPerson,
        assignedRole,
        formData.companyName
      );

      // 2. Initialize Subscription & 7-Day Free Trial
      await subscriptionService.registerVendorSubscription({
        uid: userProfile.uid,
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        companyLogo: formData.companyLogo,
        doorNo: formData.doorNo,
        companyAddress: formData.companyAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        gstin: formData.gstin,
        latitude: formData.latitude,
        longitude: formData.longitude,
        plan: chosenPlan
      });

      toast.success(
        `🎉 ${formData.accountType === 'Installer' ? 'Solar Installer Contractor' : 'Equipment Vendor'} Account registered successfully! 7-Day Free Trial for ${chosenPlan.name} is now active.`,
        'Account Registered'
      );
      onSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.message || 'Failed to complete registration.';
      setErrorMessage(msg);
      toast.error(msg, 'Registration Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <span className="px-3 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-black rounded-full border border-emerald-500/20 uppercase tracking-widest">
              Step {activeStep} of 2 • Vendor Registration
            </span>
            <h2 className="text-xl font-black text-white mt-1">
              {activeStep === 1 ? 'Enter Company & Contact Details' : 'Select Subscription Plan & 7-Day Free Trial'}
            </h2>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: VENDOR & INSTALLER DETAILS FORM */}
        {activeStep === 1 && (
          <form onSubmit={handleNext} className="p-6 space-y-4 overflow-y-auto flex-1 font-sans">
            {/* Account Role Selector */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Registration Category</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, accountType: 'Vendor' }))}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer text-xs font-bold",
                    formData.accountType === 'Vendor' 
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md" 
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                  )}
                >
                  <Building2 className="w-5 h-5" />
                  <span>🏢 Solar Supplier</span>
                  <span className="text-[10px] font-normal text-slate-400">POs, Stock & Hardware Supply</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, accountType: 'Installer' }))}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer text-xs font-bold",
                    formData.accountType === 'Installer' 
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-md" 
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                  )}
                >
                  <Wrench className="w-5 h-5" />
                  <span>🔧 Solar Installer</span>
                  <span className="text-[10px] font-normal text-slate-400">Projects, Site Survey & Installation</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{formData.accountType === 'Installer' ? 'Solar Installer Agency Name *' : 'Solar Supplier Company Name *'}</label>
                <div className="relative flex items-center">
                  <Building2 className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder={formData.accountType === 'Installer' ? 'e.g. Apex Solar Field Installers' : 'e.g. Vikram Solar Services'}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Company Logo (Optional)</label>
                  {formData.companyLogo && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, companyLogo: '' }))}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                    >
                      ✕ Remove Logo
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
                  />
                  {formData.companyLogo ? (
                    <div className="w-10 h-10 rounded-xl border border-emerald-500/40 bg-slate-900 p-1 shrink-0 flex items-center justify-center relative group">
                      <img src={formData.companyLogo} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-semibold shrink-0">No logo uploaded</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Contact Person Name *</label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Business Email Address *</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="vendor@company.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Phone Number *</label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Vendor Official Address Section */}
              <div className="sm:col-span-2 p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Official Vendor Registered Address & Tax Details
                  </span>

                  <button
                    type="button"
                    onClick={handleAutoDetectGPS}
                    disabled={isDetectingLocation}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[11px] font-black rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50 shrink-0"
                    title="Auto-detect current GPS location and fetch full street address details"
                  >
                    {isDetectingLocation ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching Address...
                      </>
                    ) : (
                      <>
                        <LocateFixed className="w-3.5 h-3.5" /> 📍 Drop Pin / Auto-Detect Location
                      </>
                    )}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Door / Plot / Flat No. *</label>
                    <input
                      required
                      type="text"
                      name="doorNo"
                      value={formData.doorNo}
                      onChange={handleChange}
                      placeholder="e.g. H.No: 4-12/A, Plot 45"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400 placeholder-slate-500 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Street Address & Area Landmark *</label>
                    <input
                      required
                      type="text"
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleChange}
                      placeholder="e.g. Phase 3, Industrial Development Park"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">City / District *</label>
                    <input
                      required
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Hyderabad"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">State *</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                    >
                      <option value="Telangana">Telangana</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Delhi">Delhi NCR</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">PIN Code *</label>
                    <input
                      required
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="e.g. 500032"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">GSTIN Number (For 70:30 Tax Invoices)</label>
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="e.g. 36AAACV1234F1Z9"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400 placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Password *</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Confirm Password *</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    required
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-800 text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                Continue to Subscription Plan
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: SELECT SUBSCRIPTION PLAN */}
        {activeStep === 2 && (
          <form onSubmit={handleCompleteRegistration} className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
            <div className="space-y-3">
              <label className="block text-xs font-extrabold text-slate-300 uppercase">Select Subscription Plan (Configured by Global Admin)</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {allPlans.map(plan => {
                  const isSelected = chosenPlan.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setChosenPlan(plan)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white">{plan.name}</h4>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      </div>

                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-xl font-black text-white">₹{plan.priceMonthly.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 font-bold">/ month</span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-300 pt-2 border-t border-slate-800">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-emerald-400" /> {plan.userLimit} Users</span>
                        <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5 text-teal-400" /> {plan.storageGBLimit} GB Storage</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trial Banner Confirmation */}
            <div className="p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-emerald-400 uppercase flex items-center gap-1">
                  <Sparkles className="w-4 h-4" /> 7-Day Free Trial Included
                </span>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                  You will not be charged today. Full access for {chosenPlan.trialDays || 7} days under {chosenPlan.name}.
                </p>
              </div>
              <span className="text-xs font-black bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-xl uppercase shrink-0">
                ₹0 Today
              </span>
            </div>

            <div className="pt-2 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-5 py-2.5 bg-slate-800 text-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-700 transition-colors"
              >
                Back to Details
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Activate 7-Day Free Trial & Sign Up'}
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

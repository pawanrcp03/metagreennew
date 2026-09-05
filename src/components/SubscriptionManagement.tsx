import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  HardDrive, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  DollarSign, 
  Building2,
  RefreshCw,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { subscriptionService, SubscriptionPlan, VendorAccount, SubscriptionConfig } from '@/src/services/subscription.service';
import { cn } from '@/src/lib/utils';

export default function SubscriptionManagement() {
  const [activeTab, setActiveTab] = useState<'plans' | 'vendors' | 'settings'>('plans');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [vendors, setVendors] = useState<VendorAccount[]>([]);
  const [config, setConfig] = useState<SubscriptionConfig>({
    defaultTrialDays: 7,
    trialEnabled: true,
    extraStoragePricePerGB: 100,
    currency: 'INR'
  });

  const [loading, setLoading] = useState(true);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const [planForm, setPlanForm] = useState<SubscriptionPlan>({
    name: '',
    userLimit: 3,
    storageGBLimit: 10,
    priceMonthly: 4999,
    trialEnabled: true,
    trialDays: 7,
    status: 'active',
    features: ['PO & Auto-Inventory Sync', '70:30 GST Quotes', 'PM Surya Ghar Subsidy']
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedPlans = await subscriptionService.getSubscriptionPlans();
      const fetchedVendors = await subscriptionService.getAllVendorSubscriptions();
      const fetchedConfig = await subscriptionService.getSubscriptionConfig();

      setPlans(fetchedPlans);
      setVendors(fetchedVendors);
      setConfig(fetchedConfig);
    } catch (err) {
      console.error('Error loading subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenPlanModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm(plan);
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: '',
        userLimit: 3,
        storageGBLimit: 10,
        priceMonthly: 4999,
        trialEnabled: true,
        trialDays: 7,
        status: 'active',
        features: ['PO & Auto-Inventory Sync', '70:30 GST Quotes', 'PM Surya Ghar Subsidy']
      });
    }
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name) {
      alert('Please enter a plan name.');
      return;
    }
    try {
      await subscriptionService.savePlan(planForm);
      setIsPlanModalOpen(false);
      await loadData();
      alert('✅ Subscription Plan saved successfully in Database!');
    } catch (err) {
      console.error('Error saving plan:', err);
      alert('Failed to save plan.');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this subscription plan?')) {
      try {
        await subscriptionService.deletePlan(planId);
        await loadData();
      } catch (err) {
        console.error('Error deleting plan:', err);
      }
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await subscriptionService.updateSubscriptionConfig(config);
      alert('✅ Global Trial & Storage Configuration updated!');
    } catch (err) {
      console.error('Error updating config:', err);
    }
  };

  const handleUpdateVendorStatus = async (uid: string, newStatus: 'trial' | 'active' | 'expired') => {
    try {
      await subscriptionService.updateVendorSubscription(uid, { subscriptionStatus: newStatus });
      await loadData();
      alert(`✅ Vendor Subscription status updated to: ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Error updating vendor subscription:', err);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Global Admin Panel
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-blue-600" /> Dynamic Subscription Plan Manager
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Configure User Limits (3, 5+), Storage GB, Pricing, & 7-Day Free Trial parameters dynamically.
          </p>
        </div>

        <button
          onClick={() => handleOpenPlanModal()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-blue-200 flex items-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4" /> + Create Subscription Plan
        </button>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar border-b border-slate-100">
        {[
          { id: 'plans', label: '1. Subscription Plans Catalog', icon: CreditCard },
          { id: 'vendors', label: '2. Subscribed Vendor Accounts', icon: Building2 },
          { id: 'settings', label: '3. Trial & Storage Pricing Config', icon: Sliders },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SUBSCRIPTION PLANS CATALOG */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-shadow">
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenPlanModal(plan)}
                  className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors bg-white shadow-sm border border-slate-100"
                  title="Edit Plan"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id!)}
                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors bg-white shadow-sm border border-slate-100"
                  title="Delete Plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between pr-14">
                  <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                  <span className={cn(
                    "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                    plan.status === 'active' ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                  )}>
                    {plan.status}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">₹{plan.priceMonthly.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-400">/ month</span>
                </div>

                {/* Specs */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2 text-xs font-bold text-slate-700 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-600" /> User Limit:</span>
                    <span className="text-slate-900 font-black">{plan.userLimit} Users</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-emerald-600" /> Storage Limit:</span>
                    <span className="text-slate-900 font-black">{plan.storageGBLimit} GB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> Free Trial:</span>
                    <span className="text-emerald-700 font-black">{plan.trialEnabled ? `${plan.trialDays} Days` : 'Disabled'}</span>
                  </div>
                </div>

                <ul className="mt-4 space-y-2">
                  {(plan.features || []).map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <span className="text-[11px] font-extrabold text-blue-600 uppercase">
                  Fully Configurable by Global Admin
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SUBSCRIBED VENDOR ACCOUNTS */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-black uppercase text-slate-700">
              Total Subscribed Vendors: {vendors.length}
            </span>
            <button onClick={loadData} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh List
            </button>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="p-4">Vendor Company</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Assigned Plan</th>
                <th className="p-4 text-center">User Limit</th>
                <th className="p-4 text-center">Storage GB</th>
                <th className="p-4 text-center">Subscription Status</th>
                <th className="p-4 text-center">Admin Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    No vendor subscriptions recorded yet. Vendors can sign up via the Public Landing Page!
                  </td>
                </tr>
              ) : (
                vendors.map(v => {
                  const remainingDays = subscriptionService.getRemainingTrialDays(v.trialEndDate);

                  return (
                    <tr key={v.uid} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">{v.companyName}</td>
                      <td className="p-4 text-slate-600">
                        <p className="font-bold text-slate-800">{v.contactPerson}</p>
                        <p className="text-[11px] text-slate-400">{v.email}</p>
                      </td>
                      <td className="p-4 font-extrabold text-blue-600">{v.planName || 'Starter Vendor'}</td>
                      <td className="p-4 text-center font-black text-slate-900">{v.userLimit || 3} Users</td>
                      <td className="p-4 text-center font-bold text-slate-700">
                        {((v.usedStorageMB || 0) / 1024).toFixed(1)} / {v.storageGBLimit || 10} GB
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          v.subscriptionStatus === 'active' ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                          v.subscriptionStatus === 'trial' ? "bg-blue-100 text-blue-800 border-blue-200" :
                          "bg-red-100 text-red-800 border-red-200"
                        )}>
                          {v.subscriptionStatus === 'trial' ? `Trial (${remainingDays} days left)` : v.subscriptionStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleUpdateVendorStatus(v.uid, 'active')}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md text-[10px] font-black uppercase"
                          >
                            Activate
                          </button>
                          <button
                            onClick={() => handleUpdateVendorStatus(v.uid, 'trial')}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-[10px] font-black uppercase"
                          >
                            Set Trial
                          </button>
                          <button
                            onClick={() => handleUpdateVendorStatus(v.uid, 'expired')}
                            className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-md text-[10px] font-black uppercase"
                          >
                            Expire
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: TRIAL & STORAGE PRICING CONFIG */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-2xl">
          <h3 className="text-lg font-black text-slate-900 mb-4">Global Trial & Storage Configuration</h3>
          
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Default Free Trial Duration (Days)</label>
              <input
                type="number"
                min="1"
                max="90"
                value={config.defaultTrialDays}
                onChange={e => setConfig({ ...config, defaultTrialDays: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Additional Storage Price per GB (₹)</label>
              <input
                type="number"
                min="0"
                value={config.extraStoragePricePerGB}
                onChange={e => setConfig({ ...config, extraStoragePricePerGB: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="enable-trial"
                checked={config.trialEnabled}
                onChange={e => setConfig({ ...config, trialEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="enable-trial" className="text-xs font-bold text-slate-800">
                Enable Free Trial for New Vendor Registrations
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white font-extrabold text-xs rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
              >
                Save Global Subscription Configurations
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE / EDIT PLAN MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Plan Name *</label>
                <input
                  required
                  type="text"
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Starter Solar Vendor (3 Users)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">User Limit (Max Users) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={planForm.userLimit}
                    onChange={e => setPlanForm({ ...planForm, userLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Storage Limit (GB) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={planForm.storageGBLimit}
                    onChange={e => setPlanForm({ ...planForm, storageGBLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monthly Price (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={planForm.priceMonthly}
                    onChange={e => setPlanForm({ ...planForm, priceMonthly: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trial Duration (Days) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={planForm.trialDays}
                    onChange={e => setPlanForm({ ...planForm, trialDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={planForm.trialEnabled}
                    onChange={e => setPlanForm({ ...planForm, trialEnabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  Enable 7-Day Free Trial
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={planForm.status === 'active'}
                    onChange={e => setPlanForm({ ...planForm, status: e.target.checked ? 'active' : 'inactive' })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  Active Plan
                </label>
              </div>

              <div className="pt-3 flex gap-3">
                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-extrabold rounded-xl text-xs hover:bg-blue-700 shadow-md shadow-blue-200">
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

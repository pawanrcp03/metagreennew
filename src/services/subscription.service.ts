import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

export interface SubscriptionPlan {
  id?: string;
  name: string;
  userLimit: number;
  storageGBLimit: number;
  priceMonthly: number;
  trialEnabled: boolean;
  trialDays: number;
  status: 'active' | 'inactive';
  features: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface VendorAccount {
  id?: string;
  uid: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  companyLogo?: string;
  doorNo?: string;
  companyAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  latitude?: string;
  longitude?: string;
  planId: string;
  planName: string;
  userLimit: number;
  storageGBLimit: number;
  usedStorageMB: number;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'cancelled';
  trialStartDate: string;
  trialEndDate: string;
  createdAt?: any;
}

export interface SubscriptionConfig {
  defaultTrialDays: number;
  trialEnabled: boolean;
  extraStoragePricePerGB: number;
  currency: string;
}

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-3-user',
    name: 'Starter Solar Vendor (3 Users)',
    userLimit: 3,
    storageGBLimit: 10,
    priceMonthly: 4999,
    trialEnabled: true,
    trialDays: 7,
    status: 'active',
    features: [
      'Up to 3 Vendor Users',
      '10 GB Encrypted Storage Vault',
      '7-Day Free Trial Included',
      'PO & Auto-Inventory Sync',
      'Quotes & Tax Invoice Generator',
      'Standard Support'
    ]
  },
  {
    id: 'plan-5-user',
    name: 'Growth Solar Enterprise (5 Users)',
    userLimit: 5,
    storageGBLimit: 25,
    priceMonthly: 9999,
    trialEnabled: true,
    trialDays: 7,
    status: 'active',
    features: [
      'Up to 5 Vendor Users',
      '25 GB Encrypted Storage Vault',
      '7-Day Free Trial Included',
      'Vendor Auto-Stock Receipt',
      'Full CRM & Proposal Engine',
      '24/7 Priority Support'
    ]
  },
  {
    id: 'plan-pro-fleet',
    name: 'Pro Fleet (15 Users)',
    userLimit: 15,
    storageGBLimit: 100,
    priceMonthly: 24999,
    trialEnabled: true,
    trialDays: 7,
    status: 'active',
    features: [
      'Up to 15 Vendor Users',
      '100 GB Encrypted Storage Vault',
      '7-Day Free Trial Included',
      'Unlimited PO & Inventory Ingestion',
      'Custom Brand Logo Integration',
      'Dedicated Account Manager'
    ]
  }
];

export const subscriptionService = {
  // 1. Fetch or Seed Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const plansRef = collection(db, 'subscriptionPlans');
      const snapshot = await getDocs(plansRef);
      
      if (snapshot.empty) {
        // Seed default plans dynamically into Firestore
        for (const plan of DEFAULT_PLANS) {
          const planDocRef = doc(db, 'subscriptionPlans', plan.id!);
          await setDoc(planDocRef, {
            ...plan,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        return DEFAULT_PLANS;
      }

      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as SubscriptionPlan));
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      return DEFAULT_PLANS;
    }
  },

  // 2. Global Admin: Save or Update Subscription Plan
  async savePlan(plan: SubscriptionPlan): Promise<void> {
    if (plan.id) {
      await setDoc(doc(db, 'subscriptionPlans', plan.id), {
        ...plan,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } else {
      await addDoc(collection(db, 'subscriptionPlans'), {
        ...plan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  },

  async deleteSubscriptionPlan(planId: string): Promise<void> {
    await deleteDoc(doc(db, 'subscriptionPlans', planId));
  },

  async deletePlan(planId: string): Promise<void> {
    await deleteDoc(doc(db, 'subscriptionPlans', planId));
  },

  // 2. Fetch System Subscription Config
  async getSubscriptionConfig(): Promise<SubscriptionConfig> {
    try {
      const docRef = doc(db, 'systemSettings', 'subscriptionConfig');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as SubscriptionConfig;
      }
      return { defaultTrialDays: 7, trialEnabled: true, extraStoragePricePerGB: 100, currency: 'INR' };
    } catch (e) {
      return { defaultTrialDays: 7, trialEnabled: true, extraStoragePricePerGB: 100, currency: 'INR' };
    }
  },

  async updateSubscriptionConfig(config: Partial<SubscriptionConfig>): Promise<void> {
    const configRef = doc(db, 'systemSettings', 'subscriptionConfig');
    await setDoc(configRef, config, { merge: true });
  },

  // 5. Vendor Registration & Trial Initialization
  calculateTrialEndDate(trialDays: number): string {
    const now = new Date();
    now.setDate(now.getDate() + trialDays);
    return now.toISOString();
  },

  async registerVendorSubscription(vendorData: {
    uid: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    companyLogo?: string;
    doorNo?: string;
    companyAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
    latitude?: string;
    longitude?: string;
    plan: SubscriptionPlan;
  }): Promise<VendorAccount> {
    const trialStartDate = new Date().toISOString();
    const trialDays = vendorData.plan.trialEnabled ? vendorData.plan.trialDays : 7;
    const trialEndDate = this.calculateTrialEndDate(trialDays);

    const vendorAccount: VendorAccount = {
      uid: vendorData.uid,
      companyName: vendorData.companyName,
      contactPerson: vendorData.contactPerson,
      email: vendorData.email,
      phone: vendorData.phone,
      companyLogo: vendorData.companyLogo,
      doorNo: vendorData.doorNo,
      companyAddress: vendorData.companyAddress,
      city: vendorData.city,
      state: vendorData.state,
      pincode: vendorData.pincode,
      gstin: vendorData.gstin,
      latitude: vendorData.latitude,
      longitude: vendorData.longitude,
      planId: vendorData.plan.id || 'plan-3-user',
      planName: vendorData.plan.name,
      userLimit: vendorData.plan.userLimit,
      storageGBLimit: vendorData.plan.storageGBLimit,
      usedStorageMB: 0,
      subscriptionStatus: 'trial',
      trialStartDate,
      trialEndDate,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'vendorAccounts', vendorData.uid), vendorAccount);

    // Also update User profile document with vendor sub details
    const userPayload: Record<string, any> = {
      uid: vendorData.uid,
      email: vendorData.email,
      name: vendorData.contactPerson || '',
      companyName: vendorData.companyName || '',
      role: 'Vendor',
      vendorAccount
    };

    if (vendorData.companyLogo) userPayload.companyLogo = vendorData.companyLogo;
    if (vendorData.doorNo) userPayload.doorNo = vendorData.doorNo;
    if (vendorData.companyAddress) userPayload.companyAddress = vendorData.companyAddress;
    if (vendorData.city) userPayload.city = vendorData.city;
    if (vendorData.state) userPayload.state = vendorData.state;
    if (vendorData.pincode) userPayload.pincode = vendorData.pincode;
    if (vendorData.gstin) userPayload.gstin = vendorData.gstin;
    if (vendorData.latitude) userPayload.latitude = vendorData.latitude;
    if (vendorData.longitude) userPayload.longitude = vendorData.longitude;

    await setDoc(doc(db, 'users', vendorData.uid), userPayload, { merge: true });

    return vendorAccount;
  },

  // 6. Fetch Subscribed Vendor Account
  async getVendorAccount(uid: string): Promise<VendorAccount | null> {
    const docRef = doc(db, 'vendorAccounts', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as VendorAccount;
    }
    return null;
  },

  // 7. Global Admin: Fetch All Subscribed Vendors
  async getAllVendorSubscriptions(): Promise<VendorAccount[]> {
    try {
      const snapshot = await getDocs(collection(db, 'vendorAccounts'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VendorAccount));
    } catch (err) {
      console.error('Error getting vendor subscriptions:', err);
      return [];
    }
  },

  // 8. Global Admin: Override Vendor Subscription Status / Limits
  async updateVendorSubscription(uid: string, updates: Partial<VendorAccount>): Promise<void> {
    await updateDoc(doc(db, 'vendorAccounts', uid), updates);
    await updateDoc(doc(db, 'users', uid), {
      'vendorAccount.subscriptionStatus': updates.subscriptionStatus,
      'vendorAccount.userLimit': updates.userLimit,
      'vendorAccount.storageGBLimit': updates.storageGBLimit
    });
  },

  // 9. Calculate Remaining Trial Days
  getRemainingTrialDays(trialEndDateStr: string): number {
    if (!trialEndDateStr) return 0;
    const endDate = new Date(trialEndDateStr);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }
};

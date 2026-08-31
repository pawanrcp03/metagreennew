import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../types';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  companyName?: string;
  companyLogo?: string;
  doorNo?: string;
  companyAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  latitude?: string;
  longitude?: string;
  status?: 'Pending' | 'Active' | 'Rejected';
  mustChangePassword?: boolean;
  isFirstLogin?: boolean;
  tempPassword?: string;
  vendorAccount?: any;
  createdAt?: any;
}

function cleanFirestorePayload<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned as T;
}

export const authService = {
  async login(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      let profile = await this.getUserProfile(userCredential.user.uid);
      const lowerEmail = email.toLowerCase();
      const isVendor = lowerEmail.includes('vendor') || lowerEmail.includes('vikram');
      const isInstaller = lowerEmail.includes('installer') || lowerEmail.includes('technician');
      const isSales = lowerEmail.includes('sales');
      const isFinance = lowerEmail.includes('finance');
      const isCustomer = lowerEmail.includes('customer');
      const isEmp = lowerEmail.includes('emp') || lowerEmail.includes('staff');

      let expectedRole: UserRole | null = null;
      if (isEmp) expectedRole = 'Vendor Employee';
      else if (isVendor) expectedRole = 'Vendor';
      else if (isInstaller) expectedRole = 'Installer';
      else if (isSales) expectedRole = 'Sales Executive';
      else if (isFinance) expectedRole = 'Finance Manager';
      else if (isCustomer) expectedRole = 'Customer';

      if (profile) {
        // Enforce role consistency if email specifies persona (e.g. installer@solar.com)
        if (expectedRole && profile.role !== expectedRole) {
          profile.role = expectedRole;
          if (expectedRole === 'Installer') {
            profile.name = profile.name || 'Rohan Sharma (Lead Field Installer)';
          }
          await updateDoc(doc(db, 'users', profile.uid), { role: expectedRole, name: profile.name });
        }
        return profile;
      }

      let assignedRole: UserRole = expectedRole || 'Super Admin';
      let assignedName = userCredential.user.displayName || email.split('@')[0];

      if (isEmp) {
        assignedName = 'Amit Kumar (Vendor Staff)';
      } else if (isVendor) {
        assignedName = 'Vikram Solar Admin';
      } else if (isInstaller) {
        assignedName = 'Rohan Sharma (Lead Field Installer)';
      } else if (isSales) {
        assignedName = 'Priya Sharma (Sales Lead)';
      } else if (isFinance) {
        assignedName = 'Suresh Menon (Finance Lead)';
      } else if (isCustomer) {
        assignedName = 'Satya Kumar (Homeowner)';
      }

      profile = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || email,
        name: assignedName,
        companyName: isVendor || isEmp ? 'Vikram Solar' : 'Meta Green Global HQ',
        role: assignedRole,
        status: 'Active',
        mustChangePassword: isEmp,
        isFirstLogin: isEmp,
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', profile.uid), cleanFirestorePayload(profile));
      return profile;
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        const lowerEmail = email.toLowerCase();
        const isVendor = lowerEmail.includes('vendor') || lowerEmail.includes('vikram');
        const isInstaller = lowerEmail.includes('installer') || lowerEmail.includes('technician');
        const isSales = lowerEmail.includes('sales');
        const isFinance = lowerEmail.includes('finance');
        const isCustomer = lowerEmail.includes('customer');
        const isEmp = lowerEmail.includes('emp') || lowerEmail.includes('staff');

        let assignedRole: UserRole = 'Super Admin';
        let assignedName = 'Global Super Admin';

        if (isEmp) {
          assignedRole = 'Vendor Employee';
          assignedName = 'Amit Kumar (Vendor Staff)';
        } else if (isVendor) {
          assignedRole = 'Vendor';
          assignedName = 'Vikram Solar Admin';
        } else if (isInstaller) {
          assignedRole = 'Installer';
          assignedName = 'Rohan Sharma (Lead Field Installer)';
        } else if (isSales) {
          assignedRole = 'Sales Executive';
          assignedName = 'Priya Sharma (Sales Lead)';
        } else if (isFinance) {
          assignedRole = 'Finance Manager';
          assignedName = 'Suresh Menon (Finance Lead)';
        } else if (isCustomer) {
          assignedRole = 'Customer';
          assignedName = 'Satya Kumar (Homeowner)';
        }

        try {
          return await this.register(email, password, assignedName, assignedRole);
        } catch (registerError: any) {
          if (registerError.code === 'auth/email-already-in-use') {
            throw new Error('Invalid password for existing account.');
          }
          throw registerError;
        }
      }
      throw error;
    }
  },

  // Bulletproof Quick Demo Logins with multi-password fallback
  async loginDemoUser(targetRole: 'admin' | 'vendor' | 'installer' | 'vendor-employee'): Promise<UserProfile> {
    let demoEmail = 'admin@solar.com';
    let demoPasses = ['admin123', 'demo1234', 'Admin123!', 'Password123!'];
    let expectedRole: UserRole = 'Super Admin';
    let demoName = 'Global Super Admin';
    let demoCompany = 'Meta Green Global HQ';
    let mustChange = false;

    if (targetRole === 'installer') {
      demoEmail = 'installer@solar.com';
      demoPasses = ['installer123', 'demo1234', 'Installer123!', 'Password123!'];
      expectedRole = 'Installer';
      demoName = 'Rohan Sharma (Lead Field Installer)';
      demoCompany = 'Meta Green Solar Operations';
    } else if (targetRole === 'vendor') {
      demoEmail = 'vendor@vikramsolar.com';
      demoPasses = ['vendor123', 'demo1234', 'Vendor123!', 'Password123!'];
      expectedRole = 'Vendor';
      demoName = 'Vikram Solar Admin';
      demoCompany = 'Vikram Solar';
    } else if (targetRole === 'vendor-employee') {
      demoEmail = 'emp@vikramsolar.com';
      demoPasses = ['VendorEmp123!', 'demo1234', 'Password123!'];
      expectedRole = 'Vendor Employee';
      demoName = 'Amit Kumar (Vendor Dispatch Tech)';
      demoCompany = 'Vikram Solar';
      mustChange = true;
    }

    // 1. Try signing in with known demo passwords
    for (const pass of demoPasses) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, demoEmail, pass);
        let profile = await this.getUserProfile(userCredential.user.uid);

        if (!profile || profile.role !== expectedRole) {
          profile = {
            uid: userCredential.user.uid,
            email: demoEmail,
            name: demoName,
            companyName: demoCompany,
            role: expectedRole,
            status: 'Active',
            mustChangePassword: mustChange,
            isFirstLogin: mustChange,
            createdAt: serverTimestamp()
          };
          await setDoc(doc(db, 'users', profile.uid), cleanFirestorePayload(profile));
        }
        return profile;
      } catch (err: any) {
        // Continue trying next candidate password
      }
    }

    // 2. If existing account password was changed, register a fresh dedicated demo email
    const freshEmail = targetRole === 'vendor-employee'
      ? `staff_${Date.now().toString().slice(-4)}@vikramsolar.com`
      : targetRole === 'vendor'
        ? `vendor_${Date.now().toString().slice(-4)}@vikramsolar.com`
        : `admin_${Date.now().toString().slice(-4)}@metagreen.com`;

    return await this.register(
      freshEmail,
      'VendorEmp123!',
      demoName,
      expectedRole,
      demoCompany,
      mustChange
    );
  },

  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole,
    companyName?: string,
    mustChangePassword: boolean = false,
    companyLogo?: string
  ): Promise<UserProfile> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const rawProfile: UserProfile = {
      uid: userCredential.user.uid,
      email,
      name,
      companyName: companyName || (role === 'Vendor' || role === 'Vendor Employee' ? 'Vikram Solar' : 'Meta Green Global HQ'),
      role,
      status: 'Active',
      mustChangePassword,
      isFirstLogin: mustChangePassword,
      createdAt: serverTimestamp()
    };

    if (companyLogo) {
      rawProfile.companyLogo = companyLogo;
    }
    if (mustChangePassword) {
      rawProfile.tempPassword = password;
    }

    const payload = cleanFirestorePayload(rawProfile);
    await setDoc(doc(db, 'users', payload.uid), payload);
    return rawProfile;
  },

  async updateUserPassword(newPassword: string): Promise<void> {
    if (!auth.currentUser) throw new Error("No user currently logged in.");

    // Update Firebase Auth password
    await updatePassword(auth.currentUser, newPassword);

    // Update Firestore User Profile
    const docRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(docRef, {
      mustChangePassword: false,
      isFirstLogin: false
    });
  },

  async logout(): Promise<void> {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.clear();
      sessionStorage.clear();
    }
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  }
};

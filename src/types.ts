/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LeadStatus = 'New Lead' | 'Qualified' | 'Site Survey' | 'Proposal' | 'Negotiation' | 'Approved' | 'Installation' | 'Completed' | 'AMC';

export type LeadSource = 'Website' | 'Facebook' | 'Google Ads' | 'Referral' | 'Walk-in';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  address: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  gpsLocation?: string;
  electricityBillUrl?: string;
  roofType?: string;
  monthlyUnits?: string;
  expectedLoad?: string;
  propertyImagesUrls?: string[];
  roofImagesUrls?: string[];
  createdAt: any;
  isDeleted?: boolean;
}

export type ProjectStatus = 
  | 'Initial'
  | 'In Process'
  | 'Assigned Installation'
  | 'Installation Complete'
  | 'Verification'
  | 'Net Meter Installed'
  | 'Subsidy Pending'
  | 'Subsidy Released'
  | 'Completed'
  | 'Customer Review';

export interface Project {
  id: string;
  leadId: string;
  customerName: string;
  status: ProjectStatus;
  capacityKw: number;
  totalCost: number;
  amountPaid: number;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  assignedTo?: string;
  assignedToId?: string;
  vendorId?: string;
  vendorName?: string;
  installerId?: string;
  installerName?: string;
  rating?: number;
  review?: string;
  siteSurveyImagesUrls?: string[];
  installationImagesUrls?: string[];
  siteSurveyCompletedAt?: any;
  installationCompletedAt?: any;
  history?: Array<{ stage: string; timestamp: any; note?: string }>;
  installDate?: any;
  createdAt: any;
  isDeleted?: boolean;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  name: string;
  requiredRole?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeRole?: string;
  start: number;
  duration: number;
  status: 'Pending' | 'In Progress' | 'Completed';
  type: 'task' | 'milestone';
  dependency?: string;
  delay?: boolean;
  createdAt?: any;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  serialNumber?: string;
  warranty?: string;
  vendor?: string;
  vendorId?: string;
}

export interface Transaction {
  id: string;
  projectId: string;
  type: 'Advance' | 'EMI' | 'Balance' | 'Refund';
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed';
  date: any;
}

export type UserRole = 
  | 'Super Admin'
  | 'Solar Company Admin'
  | 'Regional Manager'
  | 'Sales Executive'
  | 'Survey Engineer'
  | 'Design Engineer'
  | 'Procurement Officer'
  | 'Warehouse Manager'
  | 'Installer'
  | 'Project Manager'
  | 'Finance Manager'
  | 'Customer Support'
  | 'Customer'
  | 'Vendor'
  | 'Vendor Employee'
  | 'Auditor';

export interface RolePermissions {
  canAcceptPOs?: boolean;
  canManageTasks?: boolean;
  canUploadPhotos?: boolean;
  canViewInvoices?: boolean;
  canManageTeam?: boolean;
}

export interface AuthenticatedUser {
  name: string;
  email: string;
  role: UserRole;
  permissions?: RolePermissions;
}

export type ViewType = 'dashboard' | 'crm' | 'site-survey' | 'solar-design' | 'proposal' | 'quotation' | 'subsidy' | 'procurement' | 'projects' | 'inventory' | 'work-orders' | 'finance' | 'support' | 'warranty' | 'documents' | 'compliance' | 'hr' | 'vendors' | 'reports' | 'portal' | 'settings';

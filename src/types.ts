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
  expectedLoadUnit?: 'KW' | 'MW';
  maxConsumptionLimit?: number;
  quotationGenerated?: boolean;
  quotationId?: string;
  quotationAmount?: number;
  quotationDate?: string;
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
  | 'Department Verification'
  | 'Verification'
  | 'Net Meter Installed'
  | 'Subsidy Pending'
  | 'Subsidy Released'
  | 'Completed'
  | 'Customer Review';

export interface InstallerPhotoRecord {
  id: string;
  url: string;
  installerName: string;
  installerId?: string;
  timestamp: string;
  category?: 'Pre-Installation' | 'Mounting Structure' | 'Panel Wiring' | 'Inverter Setup' | 'Final Commissioning';
  caption?: string;
}

export interface SubsidyDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  uploadedAt: string;
  notes?: string;
}

export interface Project {
  id: string;
  leadId: string;
  customerName: string;
  status: ProjectStatus;
  capacityKw: number;
  capacityUnit?: 'KW' | 'MW';
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
  quotationGenerated?: boolean;
  quotationId?: string;
  quotationAmount?: number;
  quotationDate?: string;
  rating?: number;
  review?: string;
  siteSurveyImagesUrls?: string[];
  installationImagesUrls?: string[];
  materialPhotos?: string[];
  siteBeforePhotos?: string[];
  siteAfterPhotos?: string[];
  installerPhotos?: InstallerPhotoRecord[];
  subsidyDocuments?: SubsidyDocument[];
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
  type?: 'Panel' | 'Wire' | 'Inverter' | 'Battery' | 'Structure' | 'Accessories' | 'Other';
  manufacturer?: string;
  description?: string;
  weight?: number;
  weightUnit?: 'KG' | 'TON';
  quantity: number;
  availableQuantity?: number;
  reservedQuantity?: number;
  soldQuantity?: number;
  unit: 'KW' | 'MW' | 'MTR' | 'TON' | 'KG' | 'PCS' | 'UNIT' | string;
  size?: number;
  wattPrice?: number;
  price?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  availableForSelling?: boolean;
  gst?: number;
  pricingBasis?: 'Per Unit' | 'Per Weight' | 'Per Meter';
  minThreshold: number;
  serialNumber?: string;
  warranty?: string;
  vendor?: string;
  vendorId?: string;
  vendorType?: 'Registered' | 'Unregistered';
  stockOwner?: string;
  stockOwnerName?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Transaction {
  id: string;
  projectId: string;
  type: 'Advance' | 'EMI' | 'Balance' | 'Refund' | 'Expense';
  expenseType?: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed';
  date: any;
  employeeId?: string;
  employeeName?: string;
  receiptImageUrl?: string;
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
  | 'Solar Installer'
  | 'Installer'
  | 'Project Manager'
  | 'Finance Manager'
  | 'Customer Support'
  | 'Customer'
  | 'Solar Supplier'
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

export type ViewType = 'dashboard' | 'crm' | 'customers' | 'site-survey' | 'solar-design' | 'proposal' | 'quotation' | 'subsidy' | 'procurement' | 'projects' | 'inventory' | 'work-orders' | 'finance' | 'support' | 'warranty' | 'documents' | 'compliance' | 'hr' | 'vendors' | 'reports' | 'portal' | 'settings' | 'tax-invoice';

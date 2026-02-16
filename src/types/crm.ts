export type ContactType = 'lead' | 'customer' | 'supplier' | 'employee';
export type ContactStatus = 'active' | 'inactive' | 'prospect';
export type DealStage = 'prospecting' | 'negotiation' | 'closed-won' | 'closed-lost';
export type ActivityType = 'call' | 'meeting' | 'email' | 'task';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type POStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'received';
export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Poor' | 'Decommissioned';
export type AssetCategory = 'Equipment' | 'Vehicle' | 'IT' | 'Furniture' | 'Other';
export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Contact {
  id: string;
  type: ContactType;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: ContactStatus;
  assigned_to: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  contact_id: string;
  contact_name: string;
  title: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  expected_close: string;
  actual_close?: string;
}

export interface Activity {
  id: string;
  contact_id: string;
  contact_name: string;
  deal_id?: string;
  type: ActivityType;
  notes: string;
  due_date: string;
  completed_at?: string;
  created_by: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
  supplier_id?: string;
}

export interface Invoice {
  id: string;
  contact_id: string;
  contact_name: string;
  deal_id?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  status: InvoiceStatus;
  line_items: { description: string; quantity: number; unit_price: number; total: number }[];
}

export interface Employee {
  id: string;
  contact_id: string;
  name: string;
  role: string;
  department: string;
  start_date: string;
  leave_balance: number;
  manager_id?: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  type: string;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
  approved_by?: string;
}

export interface PurchaseOrder {
  id: string;
  user_id: string;
  supplier_id?: string;
  supplier_name?: string;
  po_number: string;
  status: POStatus;
  requested_by?: string;
  approved_by?: string;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  product_id?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  asset_tag?: string;
  category: AssetCategory;
  purchase_date?: string;
  purchase_price: number;
  current_value: number;
  condition: AssetCondition;
  location?: string;
  assigned_to?: string;
  assigned_employee_name?: string;
  po_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  deal_id?: string;
  deal_name?: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date?: string;
  end_date?: string;
  budget: number;
  actual_cost: number;
  progress: number;
  manager_id?: string;
  manager_name?: string;
  created_at: string;
  updated_at: string;
}

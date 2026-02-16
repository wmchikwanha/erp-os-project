import { Contact, Deal, Activity, Product, Invoice, Employee, LeaveRequest } from '@/types/crm';

export const mockContacts: Contact[] = [
  { id: '1', type: 'customer', name: 'Acme Corporation', email: 'info@acme.com', phone: '+1 555-0101', company: 'Acme Corp', status: 'active', assigned_to: 'John Doe', created_at: '2025-01-15', updated_at: '2025-02-01' },
  { id: '2', type: 'lead', name: 'Sarah Mitchell', email: 'sarah@techflow.io', phone: '+1 555-0102', company: 'TechFlow', status: 'prospect', assigned_to: 'Jane Smith', created_at: '2025-01-20', updated_at: '2025-02-05' },
  { id: '3', type: 'customer', name: 'GlobalTrade Ltd', email: 'ops@globaltrade.co', phone: '+44 20 7946 0958', company: 'GlobalTrade', status: 'active', assigned_to: 'John Doe', created_at: '2024-11-10', updated_at: '2025-01-28' },
  { id: '4', type: 'supplier', name: 'Parts & Co', email: 'supply@partsco.com', phone: '+1 555-0104', company: 'Parts & Co', status: 'active', assigned_to: 'Mike Brown', created_at: '2024-09-05', updated_at: '2025-01-15' },
  { id: '5', type: 'lead', name: 'David Chen', email: 'david.chen@innovex.com', phone: '+1 555-0105', company: 'Innovex', status: 'prospect', assigned_to: 'Jane Smith', created_at: '2025-02-01', updated_at: '2025-02-08' },
  { id: '6', type: 'customer', name: 'Metro Solutions', email: 'hello@metrosol.com', phone: '+1 555-0106', company: 'Metro Solutions', status: 'active', assigned_to: 'John Doe', created_at: '2024-08-20', updated_at: '2025-02-03' },
  { id: '7', type: 'employee', name: 'Lisa Wang', email: 'lisa@skeleton.io', phone: '+1 555-0107', company: 'SkeletonCRM', status: 'active', assigned_to: 'HR', created_at: '2024-06-01', updated_at: '2025-01-01' },
];

export const mockDeals: Deal[] = [
  { id: '1', contact_id: '1', contact_name: 'Acme Corporation', title: 'Enterprise License Renewal', value: 45000, currency: 'USD', stage: 'negotiation', probability: 75, expected_close: '2025-03-15' },
  { id: '2', contact_id: '2', contact_name: 'Sarah Mitchell', title: 'TechFlow Platform Setup', value: 28000, currency: 'USD', stage: 'prospecting', probability: 30, expected_close: '2025-04-01' },
  { id: '3', contact_id: '3', contact_name: 'GlobalTrade Ltd', title: 'Annual Support Contract', value: 62000, currency: 'USD', stage: 'closed-won', probability: 100, expected_close: '2025-02-01', actual_close: '2025-01-28' },
  { id: '4', contact_id: '5', contact_name: 'David Chen', title: 'Innovex Integration Package', value: 18500, currency: 'USD', stage: 'prospecting', probability: 20, expected_close: '2025-05-10' },
  { id: '5', contact_id: '6', contact_name: 'Metro Solutions', title: 'Metro Digital Transformation', value: 95000, currency: 'USD', stage: 'negotiation', probability: 60, expected_close: '2025-03-30' },
  { id: '6', contact_id: '1', contact_name: 'Acme Corporation', title: 'Acme Cloud Migration', value: 35000, currency: 'USD', stage: 'closed-lost', probability: 0, expected_close: '2025-01-15', actual_close: '2025-01-20' },
];

export const mockActivities: Activity[] = [
  { id: '1', contact_id: '1', contact_name: 'Acme Corporation', deal_id: '1', type: 'meeting', notes: 'Quarterly review meeting - discussed renewal terms and expansion', due_date: '2025-02-10', created_by: 'John Doe' },
  { id: '2', contact_id: '2', contact_name: 'Sarah Mitchell', type: 'call', notes: 'Initial discovery call - interested in platform features', due_date: '2025-02-12', created_by: 'Jane Smith' },
  { id: '3', contact_id: '3', contact_name: 'GlobalTrade Ltd', type: 'email', notes: 'Sent onboarding documentation and login credentials', due_date: '2025-02-08', completed_at: '2025-02-08', created_by: 'John Doe' },
  { id: '4', contact_id: '5', contact_name: 'David Chen', deal_id: '4', type: 'task', notes: 'Prepare custom demo for Innovex integration requirements', due_date: '2025-02-15', created_by: 'Jane Smith' },
  { id: '5', contact_id: '6', contact_name: 'Metro Solutions', deal_id: '5', type: 'meeting', notes: 'Technical architecture review with CTO', due_date: '2025-02-14', created_by: 'Mike Brown' },
  { id: '6', contact_id: '1', contact_name: 'Acme Corporation', type: 'call', notes: 'Follow up on contract amendments', due_date: '2025-02-11', completed_at: '2025-02-11', created_by: 'John Doe' },
];

export const mockProducts: Product[] = [
  { id: '1', name: 'CRM Professional License', sku: 'CRM-PRO-001', description: 'Full CRM suite with unlimited users', unit_price: 2500, stock_quantity: 999, reorder_level: 0 },
  { id: '2', name: 'Data Migration Service', sku: 'SVC-MIG-001', description: 'Complete data migration from legacy systems', unit_price: 5000, stock_quantity: 50, reorder_level: 5 },
  { id: '3', name: 'Custom Integration Module', sku: 'MOD-INT-001', description: 'Bespoke API integration development', unit_price: 8000, stock_quantity: 25, reorder_level: 3 },
  { id: '4', name: 'Training Package (10 hrs)', sku: 'TRN-PKG-010', description: '10-hour on-site training package', unit_price: 1500, stock_quantity: 100, reorder_level: 10 },
  { id: '5', name: 'Support Tier - Gold', sku: 'SUP-GLD-001', description: '24/7 priority support with SLA', unit_price: 750, stock_quantity: 200, reorder_level: 0, supplier_id: '4' },
];

export const mockInvoices: Invoice[] = [
  { id: '1', contact_id: '1', contact_name: 'Acme Corporation', deal_id: '1', invoice_number: 'INV-2025-001', issue_date: '2025-01-15', due_date: '2025-02-15', total_amount: 45000, status: 'sent', line_items: [{ description: 'CRM Professional License x3', quantity: 3, unit_price: 2500, total: 7500 }, { description: 'Custom Integration Module', quantity: 1, unit_price: 8000, total: 8000 }] },
  { id: '2', contact_id: '3', contact_name: 'GlobalTrade Ltd', invoice_number: 'INV-2025-002', issue_date: '2025-01-28', due_date: '2025-02-28', total_amount: 62000, status: 'paid', line_items: [{ description: 'Annual Support Contract', quantity: 1, unit_price: 62000, total: 62000 }] },
  { id: '3', contact_id: '6', contact_name: 'Metro Solutions', invoice_number: 'INV-2025-003', issue_date: '2025-02-01', due_date: '2025-03-01', total_amount: 15000, status: 'draft', line_items: [{ description: 'Data Migration Service', quantity: 2, unit_price: 5000, total: 10000 }, { description: 'Training Package', quantity: 2, unit_price: 1500, total: 3000 }] },
  { id: '4', contact_id: '2', contact_name: 'Sarah Mitchell', invoice_number: 'INV-2024-048', issue_date: '2024-12-01', due_date: '2025-01-01', total_amount: 3500, status: 'overdue', line_items: [{ description: 'CRM Professional License', quantity: 1, unit_price: 2500, total: 2500 }, { description: 'Training Package', quantity: 1, unit_price: 1000, total: 1000 }] },
];

export const mockEmployees: Employee[] = [
  { id: '1', contact_id: '7', name: 'Lisa Wang', role: 'Engineering Lead', department: 'Engineering', start_date: '2024-06-01', leave_balance: 18, manager_id: undefined },
  { id: '2', contact_id: '', name: 'John Doe', role: 'Sales Director', department: 'Sales', start_date: '2023-03-15', leave_balance: 12 },
  { id: '3', contact_id: '', name: 'Jane Smith', role: 'Account Executive', department: 'Sales', start_date: '2024-01-10', leave_balance: 20, manager_id: '2' },
  { id: '4', contact_id: '', name: 'Mike Brown', role: 'Solutions Architect', department: 'Engineering', start_date: '2024-04-01', leave_balance: 15, manager_id: '1' },
  { id: '5', contact_id: '', name: 'Emma Davis', role: 'HR Manager', department: 'Human Resources', start_date: '2023-08-20', leave_balance: 8 },
];

export const mockLeaveRequests: LeaveRequest[] = [
  { id: '1', employee_id: '3', employee_name: 'Jane Smith', type: 'Annual Leave', start_date: '2025-02-20', end_date: '2025-02-24', status: 'pending' },
  { id: '2', employee_id: '4', employee_name: 'Mike Brown', type: 'Sick Leave', start_date: '2025-02-10', end_date: '2025-02-11', status: 'approved', approved_by: 'Lisa Wang' },
  { id: '3', employee_id: '2', employee_name: 'John Doe', type: 'Annual Leave', start_date: '2025-03-01', end_date: '2025-03-07', status: 'pending' },
];

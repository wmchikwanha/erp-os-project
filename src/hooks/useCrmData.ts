import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// ─── Contacts ───

export function useContacts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpsertContact() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (contact: { id?: string; name: string; email?: string; phone?: string; company?: string; type?: string; status?: string; assigned_to?: string }) => {
      const payload = { ...contact, user_id: user!.id };
      if (contact.id) {
        const { error } = await supabase.from('contacts').update(payload).eq('id', contact.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('contacts').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contact saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contact deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Deals ───

export function useDeals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['deals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('deals').select('*, contacts(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(d => ({ ...d, contact_name: d.contacts?.name ?? 'Unknown' }));
    },
    enabled: !!user,
  });
}

export function useUpsertDeal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (deal: { id?: string; title: string; value?: number; stage?: string; probability?: number; expected_close?: string; contact_id?: string | null; currency?: string }) => {
      const payload = { ...deal, user_id: user!.id };
      if (deal.id) {
        const { error } = await supabase.from('deals').update(payload).eq('id', deal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('deals').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deals'] }); toast.success('Deal saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deals'] }); toast.success('Deal deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Activities ───

export function useActivities() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['activities', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('activities').select('*, contacts(name)').order('due_date', { ascending: true });
      if (error) throw error;
      return data.map(a => ({ ...a, contact_name: a.contacts?.name ?? 'Unknown' }));
    },
    enabled: !!user,
  });
}

export function useUpsertActivity() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (activity: { id?: string; type?: string; notes?: string; due_date?: string; contact_id?: string | null; created_by?: string }) => {
      const payload = { ...activity, user_id: user!.id };
      if (activity.id) {
        const { error } = await supabase.from('activities').update(payload).eq('id', activity.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('activities').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); toast.success('Activity saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from('activities').update({ completed_at: completed ? new Date().toISOString() : null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); toast.success('Activity deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Products ───

export function useProducts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpsertProduct() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (product: { id?: string; name: string; sku?: string; description?: string; unit_price?: number; stock_quantity?: number; reorder_level?: number }) => {
      const payload = { ...product, user_id: user!.id };
      if (product.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Invoices ───

export function useInvoices() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('invoices').select('*, contacts(name)').order('issue_date', { ascending: false });
      if (error) throw error;
      return data.map(i => ({ ...i, contact_name: i.contacts?.name ?? 'Unknown' }));
    },
    enabled: !!user,
  });
}

export function useUpsertInvoice() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (invoice: { id?: string; invoice_number: string; contact_id?: string | null; deal_id?: string | null; total_amount?: number; due_date: string; status?: string; line_items?: any }) => {
      const payload = { ...invoice, user_id: user!.id };
      if (invoice.id) {
        const { error } = await supabase.from('invoices').update(payload).eq('id', invoice.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('invoices').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Invoice saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Invoice deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Employees ───

export function useEmployees() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['employees', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpsertEmployee() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (emp: { id?: string; name: string; role?: string; department?: string; start_date?: string; leave_balance?: number; contact_id?: string | null; email?: string; job_title?: string; app_role?: string; password?: string; manager_id?: string | null }) => {
      if (emp.id) {
        // Edit existing employee – direct update
        const { app_role, password, ...updateFields } = emp;
        const payload = { ...updateFields, user_id: user!.id };
        const { error } = await supabase.from('employees').update(payload).eq('id', emp.id);
        if (error) throw error;
        return { isNew: false };
      } else {
        // New employee – call edge function to create auth account + employee record
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-employee-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(emp),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to create employee account');
        return { isNew: true, email: emp.email, password: emp.password };
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employee saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employee deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Leave Requests ───

export function useLeaveRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['leave_requests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('leave_requests').select('*, employees(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(lr => ({ ...lr, employee_name: lr.employees?.name ?? 'Unknown' }));
    },
    enabled: !!user,
  });
}

export function useUpsertLeaveRequest() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (lr: { id?: string; employee_id?: string | null; type?: string; start_date: string; end_date: string; status?: string }) => {
      const payload = { ...lr, user_id: user!.id };
      if (lr.id) {
        const { error } = await supabase.from('leave_requests').update(payload).eq('id', lr.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('leave_requests').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leave_requests'] }); toast.success('Leave request saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLeaveStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('leave_requests').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leave_requests'] }); toast.success('Leave request updated'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Performance Reviews ───

export function usePerformanceReviews() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['performance_reviews', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('performance_reviews').select('*, employees(name)').order('review_date', { ascending: false });
      if (error) throw error;
      return data.map((r: any) => ({ ...r, employee_name: r.employees?.name ?? 'Unknown' }));
    },
    enabled: !!user,
  });
}

export function useUpsertReview() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (review: { id?: string; employee_id: string; review_period: string; rating: number; strengths?: string; areas_for_improvement?: string; goals?: string; comments?: string; review_date?: string }) => {
      const payload = { ...review, user_id: user!.id, reviewer_id: user!.id };
      if (review.id) {
        const { error } = await supabase.from('performance_reviews').update(payload).eq('id', review.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('performance_reviews').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['performance_reviews'] }); toast.success('Review saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('performance_reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['performance_reviews'] }); toast.success('Review deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Employee Documents ───

export function useEmployeeDocuments(employeeId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['employee_documents', employeeId],
    queryFn: async () => {
      let q = supabase.from('employee_documents').select('*').order('created_at', { ascending: false });
      if (employeeId) q = q.eq('employee_id', employeeId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ employeeId, file, name, category, expiry_date, notes }: { employeeId: string; file: File; name: string; category: string; expiry_date?: string; notes?: string }) => {
      const filePath = `${employeeId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('employee-documents').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error } = await supabase.from('employee_documents').insert({
        employee_id: employeeId,
        name,
        category,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        expiry_date: expiry_date || null,
        notes: notes || null,
        uploaded_by: user!.id,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employee_documents'] }); toast.success('Document uploaded'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      await supabase.storage.from('employee-documents').remove([filePath]);
      const { error } = await supabase.from('employee_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employee_documents'] }); toast.success('Document deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Invitations ───

export function useInvitations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['invitations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('invitations').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ email, role = 'employee' }: { email: string; role?: string }) => {
      const { error } = await supabase.from('invitations').insert({ email, role: role as any, invited_by: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invitations'] }); toast.success('Invitation created'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Purchase Orders ───

export function usePurchaseOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['purchase_orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_orders').select('*, contacts(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((po: any) => ({ ...po, supplier_name: po.contacts?.name ?? 'Unknown' }));
    },
    enabled: !!user,
  });
}

export function usePurchaseOrderItems(poId?: string) {
  return useQuery({
    queryKey: ['purchase_order_items', poId],
    queryFn: async () => {
      const { data, error } = await supabase.from('purchase_order_items').select('*, products(name)').eq('po_id', poId!);
      if (error) throw error;
      return data;
    },
    enabled: !!poId,
  });
}

export function useUpsertPurchaseOrder() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ po, items }: { po: { id?: string; po_number: string; supplier_id?: string | null; status?: string; requested_by?: string; approved_by?: string; total_amount?: number; notes?: string }; items?: { product_id?: string | null; description?: string; quantity: number; unit_price: number; total: number }[] }) => {
      const payload = { ...po, user_id: user!.id };
      let poId = po.id;
      if (po.id) {
        const { error } = await supabase.from('purchase_orders').update(payload).eq('id', po.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('purchase_orders').insert(payload).select('id').single();
        if (error) throw error;
        poId = data.id;
      }
      if (items && poId) {
        await supabase.from('purchase_order_items').delete().eq('po_id', poId);
        if (items.length > 0) {
          const { error } = await supabase.from('purchase_order_items').insert(items.map(i => ({ ...i, po_id: poId })));
          if (error) throw error;
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase_orders'] }); qc.invalidateQueries({ queryKey: ['purchase_order_items'] }); toast.success('Purchase order saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePOStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, approved_by }: { id: string; status: string; approved_by?: string }) => {
      const update: any = { status };
      if (approved_by) update.approved_by = approved_by;
      const { error } = await supabase.from('purchase_orders').update(update).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase_orders'] }); toast.success('PO status updated'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase_orders'] }); toast.success('Purchase order deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Assets ───

export function useAssets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['assets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*, employees(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((a: any) => ({ ...a, assigned_employee_name: a.employees?.name ?? null }));
    },
    enabled: !!user,
  });
}

export function useUpsertAsset() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (asset: { id?: string; name: string; asset_tag?: string; category?: string; purchase_date?: string; purchase_price?: number; current_value?: number; condition?: string; location?: string; assigned_to?: string | null; po_id?: string | null; notes?: string }) => {
      const payload = { ...asset, user_id: user!.id };
      if (asset.id) {
        const { error } = await supabase.from('assets').update(payload).eq('id', asset.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('assets').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); toast.success('Asset saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); toast.success('Asset deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Projects ───

export function useProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*, deals(title), employees(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((p: any) => ({ ...p, deal_name: p.deals?.title ?? null, manager_name: p.employees?.name ?? null }));
    },
    enabled: !!user,
  });
}

export function useUpsertProject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (project: { id?: string; name: string; description?: string; deal_id?: string | null; status?: string; priority?: string; start_date?: string; end_date?: string; budget?: number; actual_cost?: number; progress?: number; manager_id?: string | null }) => {
      const payload = { ...project, user_id: user!.id };
      if (project.id) {
        const { error } = await supabase.from('projects').update(payload).eq('id', project.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('projects').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

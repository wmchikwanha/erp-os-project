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
        return contact.id;
      }
      const { data, error } = await supabase.from('contacts').insert(payload).select('id').single();
      if (error) throw error;
      return data.id as string;

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
    mutationFn: async (lr: { id?: string; employee_id?: string | null; type?: string; start_date: string; end_date: string; status?: string; reason?: string }) => {
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

// ─── Sites ───

export function useSites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['sites', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('sites').select('*, employees(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((s: any) => ({ ...s, manager_name: s.employees?.name ?? null }));
    },
    enabled: !!user,
  });
}

export function useUpsertSite() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (site: { id?: string; name: string; address?: string; city?: string; state?: string; country?: string; manager_id?: string | null; status?: string; start_date?: string; end_date?: string; notes?: string }) => {
      const payload = { ...site, user_id: user!.id };
      if (site.id) {
        const { error } = await supabase.from('sites').update(payload).eq('id', site.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sites').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sites'] }); toast.success('Site saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sites').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sites'] }); toast.success('Site deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Work Schedules ───

export function useWorkSchedules(date?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['work_schedules', user?.id, date],
    queryFn: async () => {
      let q = supabase.from('work_schedules').select('*, employees(name), sites(name), projects(name)').order('schedule_date', { ascending: true });
      if (date) q = q.eq('schedule_date', date);
      const { data, error } = await q;
      if (error) throw error;
      return data.map((ws: any) => ({ ...ws, employee_name: ws.employees?.name ?? 'Unknown', site_name: ws.sites?.name ?? null, project_name: ws.projects?.name ?? null }));
    },
    enabled: !!user,
  });
}

export function useUpsertWorkSchedule() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (ws: { id?: string; site_id?: string | null; employee_id: string; project_id?: string | null; schedule_date: string; shift_start?: string; shift_end?: string; status?: string; notes?: string }) => {
      const payload = { ...ws, user_id: user!.id };
      if (ws.id) {
        const { error } = await supabase.from('work_schedules').update(payload).eq('id', ws.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('work_schedules').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work_schedules'] }); toast.success('Schedule saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteWorkSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('work_schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work_schedules'] }); toast.success('Schedule deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Equipment Checkouts ───

export function useEquipmentCheckouts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['equipment_checkouts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('equipment_checkouts').select('*, assets(name, asset_tag), employees!equipment_checkouts_checked_out_to_fkey(name), sites(name), projects(name)').order('checkout_date', { ascending: false });
      if (error) throw error;
      return data.map((c: any) => ({
        ...c,
        asset_name: c.assets?.name ?? 'Unknown',
        asset_tag: c.assets?.asset_tag ?? null,
        worker_name: c.employees?.name ?? 'Unknown',
        site_name: c.sites?.name ?? null,
        project_name: c.projects?.name ?? null,
      }));
    },
    enabled: !!user,
  });
}

export function useCreateCheckout() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (checkout: { asset_id: string; checked_out_to: string; checked_out_by?: string; site_id?: string | null; project_id?: string | null; expected_return_date?: string; checkout_condition?: string; checkout_notes?: string }) => {
      const { error } = await supabase.from('equipment_checkouts').insert({ ...checkout, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment_checkouts'] }); toast.success('Equipment checked out'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReturnCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, return_condition, return_notes }: { id: string; return_condition: string; return_notes?: string }) => {
      const { error } = await supabase.from('equipment_checkouts').update({ status: 'returned', actual_return_date: new Date().toISOString(), return_condition, return_notes }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment_checkouts'] }); toast.success('Equipment returned'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAcknowledgeCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('equipment_checkouts').update({ acknowledged_by_worker: true, acknowledged_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment_checkouts'] }); toast.success('Checkout acknowledged'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Maintenance Logs ───

export function useMaintenanceLogs(assetId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['maintenance_logs', user?.id, assetId],
    queryFn: async () => {
      let q = supabase.from('maintenance_logs').select('*, assets(name, asset_tag)').order('performed_date', { ascending: false });
      if (assetId) q = q.eq('asset_id', assetId);
      const { data, error } = await q;
      if (error) throw error;
      return data.map((m: any) => ({ ...m, asset_name: m.assets?.name ?? 'Unknown', asset_tag: m.assets?.asset_tag ?? null }));
    },
    enabled: !!user,
  });
}

export function useUpsertMaintenanceLog() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (log: { id?: string; asset_id: string; maintenance_type?: string; description?: string; performed_by?: string; performed_date?: string; next_due_date?: string; cost?: number; downtime_hours?: number; status?: string; notes?: string }) => {
      const payload = { ...log, user_id: user!.id };
      if (log.id) {
        const { error } = await supabase.from('maintenance_logs').update(payload).eq('id', log.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('maintenance_logs').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance_logs'] }); toast.success('Maintenance log saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteMaintenanceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('maintenance_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance_logs'] }); toast.success('Maintenance log deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Inventory Consumption ───

export function useInventoryConsumption() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['inventory_consumption', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory_consumption').select('*, products(name, sku, stock_quantity, reorder_level), sites(name), projects(name), employees(name)').order('consumption_date', { ascending: false });
      if (error) throw error;
      return data.map((ic: any) => ({
        ...ic,
        product_name: ic.products?.name ?? 'Unknown',
        product_sku: ic.products?.sku ?? null,
        stock_quantity: ic.products?.stock_quantity ?? 0,
        reorder_level: ic.products?.reorder_level ?? 0,
        site_name: ic.sites?.name ?? null,
        project_name: ic.projects?.name ?? null,
        employee_name: ic.employees?.name ?? null,
      }));
    },
    enabled: !!user,
  });
}

export function useLogConsumption() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (entry: { product_id: string; site_id?: string | null; project_id?: string | null; consumed_by?: string | null; quantity: number; consumption_date?: string; notes?: string }) => {
      const { error } = await supabase.from('inventory_consumption').insert({ ...entry, user_id: user!.id });
      if (error) throw error;
      // Decrement stock
      const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', entry.product_id).single();
      if (product) {
        const newQty = Math.max(0, product.stock_quantity - entry.quantity);
        await supabase.from('products').update({ stock_quantity: newQty }).eq('id', entry.product_id);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory_consumption'] }); qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Consumption logged'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── CSV Bulk Imports ───

export function useBulkImportContacts() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (rows: Record<string, string>[]) => {
      const payload = rows.map(r => ({
        name: r.name || 'Unnamed',
        email: r.email || null,
        phone: r.phone || null,
        company: r.company || null,
        type: r.type || 'lead',
        status: r.status || 'active',
        user_id: user!.id,
      }));
      const { error } = await supabase.from('contacts').insert(payload);
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => { qc.invalidateQueries({ queryKey: ['contacts'] }); toast.success(`${count} contacts imported`); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkImportProducts() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (rows: Record<string, string>[]) => {
      const payload = rows.map(r => ({
        name: r.name || 'Unnamed',
        sku: r.sku || null,
        description: r.description || null,
        unit_price: parseFloat(r.unit_price || '0') || 0,
        stock_quantity: parseInt(r.stock_quantity || '0') || 0,
        reorder_level: parseInt(r.reorder_level || '0') || 0,
        user_id: user!.id,
      }));
      const { error } = await supabase.from('products').insert(payload);
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success(`${count} products imported`); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkImportInvitations() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (rows: Record<string, string>[]) => {
      const payload = rows.map(r => ({
        email: r.email,
        role: (r.role || 'employee') as any,
        invited_by: user!.id,
      }));
      const { error } = await supabase.from('invitations').insert(payload);
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => { qc.invalidateQueries({ queryKey: ['invitations'] }); toast.success(`${count} invitations created`); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Payments ───

export function usePayments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('payments').select('*').order('payment_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payment: { invoice_id?: string; amount: number | string; payment_date: string; method?: string; reference?: string }) => {
      const { error } = await supabase.from('payments').insert({
        ...payment,
        amount: Number(payment.amount),
        invoice_id: payment.invoice_id || null,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); qc.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Payment recorded'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Timesheets ───

export function useTimesheets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['timesheets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('timesheets').select('*').order('work_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpsertTimesheet() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (ts: any) => {
      const payload = {
        employee_id: ts.employee_id,
        project_id: ts.project_id || null,
        site_id: ts.site_id || null,
        work_date: ts.work_date,
        hours_worked: ts.hours_worked,
        description: ts.description || null,
        status: ts.status || 'draft',
        approved_by: ts.approved_by || null,
        user_id: user!.id,
      };
      if (ts.id) {
        const { error } = await supabase.from('timesheets').update(payload).eq('id', ts.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('timesheets').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timesheets'] }); toast.success('Timesheet saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Expenses ───

export function useExpenses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpsertExpense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (exp: any) => {
      const payload = {
        employee_id: exp.employee_id || null,
        project_id: exp.project_id || null,
        site_id: exp.site_id || null,
        category: exp.category || 'general',
        amount: Number(exp.amount),
        expense_date: exp.expense_date,
        description: exp.description || null,
        receipt_path: exp.receipt_path || null,
        status: exp.status || 'pending',
        approved_by: exp.approved_by || null,
        user_id: user!.id,
      };
      if (exp.id) {
        const { error } = await supabase.from('expenses').update(payload).eq('id', exp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('expenses').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toast.success('Expense saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Job Positions ───

export function useJobPositions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['job_positions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('job_positions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpsertPosition() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (pos: { id?: string; title: string; department: string; description?: string; requirements?: string; status?: string }) => {
      const payload = { ...pos, user_id: user!.id };
      if (pos.id) {
        const { error } = await supabase.from('job_positions').update(payload).eq('id', pos.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('job_positions').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job_positions'] }); toast.success('Position saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('job_positions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job_positions'] }); toast.success('Position deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Candidates ───

export function useCandidates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['candidates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('candidates').select('*, job_positions(title)').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((c: any) => ({ ...c, position_title: c.job_positions?.title ?? 'Unassigned' }));
    },
    enabled: !!user,
  });
}

export function useUpsertCandidate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (cand: { id?: string; name: string; email?: string; phone?: string; department?: string; position_id?: string | null; status?: string; notes?: string; applied_date?: string; cv_file_path?: string; cv_file_size?: number }) => {
      const payload = { ...cand, user_id: user!.id };
      if (cand.id) {
        const { error } = await supabase.from('candidates').update(payload).eq('id', cand.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('candidates').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); toast.success('Candidate saved'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; cvPath?: string }) => {
      if (data.cvPath) {
        await supabase.storage.from('candidate-cvs').remove([data.cvPath]);
      }
      const { error } = await supabase.from('candidates').delete().eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); toast.success('Candidate deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUploadCV() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: { file: File; candidateName: string; positionId?: string | null; email?: string; phone?: string; department?: string; notes?: string }) => {
      const filePath = `${user!.id}/${Date.now()}_${data.file.name}`;
      const { error: uploadError } = await supabase.storage.from('candidate-cvs').upload(filePath, data.file);
      if (uploadError) throw uploadError;
      const payload = {
        user_id: user!.id,
        name: data.candidateName,
        email: data.email || null,
        phone: data.phone || null,
        department: data.department || null,
        position_id: data.positionId || null,
        cv_file_path: filePath,
        cv_file_size: data.file.size,
        notes: data.notes || null,
      };
      const { error } = await supabase.from('candidates').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); toast.success('CV uploaded & candidate created'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

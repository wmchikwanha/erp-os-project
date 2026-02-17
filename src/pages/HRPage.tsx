import { useState } from 'react';
import {
  useEmployees, useUpsertEmployee, useDeleteEmployee,
  useLeaveRequests, useUpdateLeaveStatus,
  usePerformanceReviews, useUpsertReview, useDeleteReview,
  useEmployeeDocuments, useUploadDocument, useDeleteDocument,
} from '@/hooks/useCrmData';
import { cn } from '@/lib/utils';
import { Check, X, Clock, Plus, Pencil, Trash2, Star, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmployeeFormDialog } from '@/components/forms/EmployeeFormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';
import { ReviewFormDialog } from '@/components/forms/ReviewFormDialog';
import { DocumentUploadDialog } from '@/components/forms/DocumentUploadDialog';
import { CredentialsDialog } from '@/components/forms/CredentialsDialog';
import { supabase } from '@/integrations/supabase/client';

const leaveStatusIcon: Record<string, any> = { pending: Clock, approved: Check, rejected: X };
const leaveStatusStyle: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
};

const tabs = ['Directory', 'Leave Requests', 'Reviews', 'Documents'] as const;

export default function HRPage() {
  const { data: employees = [], isLoading: loadingEmp } = useEmployees();
  const { data: leaveRequests = [], isLoading: loadingLR } = useLeaveRequests();
  const { data: reviews = [], isLoading: loadingRev } = usePerformanceReviews();
  const { data: documents = [], isLoading: loadingDoc } = useEmployeeDocuments();

  const upsertEmp = useUpsertEmployee();
  const removeEmp = useDeleteEmployee();
  const updateLeave = useUpdateLeaveStatus();
  const upsertReview = useUpsertReview();
  const removeReview = useDeleteReview();
  const uploadDoc = useUploadDocument();
  const removeDoc = useDeleteDocument();

  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Directory');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [editReview, setEditReview] = useState<any>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [docUploadOpen, setDocUploadOpen] = useState(false);
  const [docEmployeeId, setDocEmployeeId] = useState<string | null>(null);
  const [deleteDocData, setDeleteDocData] = useState<{ id: string; filePath: string } | null>(null);
  const [credentialsData, setCredentialsData] = useState<{ email: string; password: string } | null>(null);

  const loading = loadingEmp || loadingLR || loadingRev || loadingDoc;
  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading HR data...</div>;

  const handleDownload = async (filePath: string) => {
    const { data } = await supabase.storage.from('employee-documents').createSignedUrl(filePath, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const handleEmployeeSubmit = (data: any) => {
    const password = data.password;
    upsertEmp.mutate(data, {
      onSuccess: (result: any) => {
        setFormOpen(false);
        if (result?.isNew && result.email && password) {
          setCredentialsData({ email: result.email, password });
        }
      },
    });
  };

  return (
    <div className="space-y-4 animate-slide-in">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Directory Tab */}
      {activeTab === 'Directory' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Employee Directory</h3>
            <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />Add Employee</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {employees.map((emp) => (
              <div key={emp.id} className="bg-card border border-border rounded-lg p-4 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{emp.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.job_title || emp.role || 'No role assigned'}</p>
                    {emp.email && <p className="text-xs text-muted-foreground/60">{emp.email}</p>}
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(emp); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(emp.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{emp.department}</span>
                  <span>{emp.leave_balance} days leave</span>
                </div>
              </div>
            ))}
            {employees.length === 0 && <div className="col-span-full py-8 text-center text-muted-foreground text-sm">No employees yet</div>}
          </div>
        </div>
      )}

      {/* Leave Requests Tab */}
      {activeTab === 'Leave Requests' && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Leave Requests</h3>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {leaveRequests.map((lr) => {
              const Icon = leaveStatusIcon[lr.status] ?? Clock;
              return (
                <div key={lr.id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', leaveStatusStyle[lr.status] ?? 'bg-muted')}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{lr.employee_name}</p>
                      <p className="text-xs text-muted-foreground">{lr.type} · {lr.start_date} → {lr.end_date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('status-badge capitalize', leaveStatusStyle[lr.status] ?? 'bg-muted text-muted-foreground')}>{lr.status}</span>
                    {lr.status === 'pending' && (
                      <div className="flex gap-1 ml-2">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => updateLeave.mutate({ id: lr.id, status: 'approved' })}>Approve</Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => updateLeave.mutate({ id: lr.id, status: 'rejected' })}>Reject</Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {leaveRequests.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">No leave requests yet</div>}
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'Reviews' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Performance Reviews</h3>
            <Button size="sm" onClick={() => { setEditReview(null); setReviewFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />New Review</Button>
          </div>
          <div className="space-y-3">
            {reviews.map((r: any) => (
              <div key={r.id} className="bg-card border border-border rounded-lg p-4 group">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{r.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{r.review_period} · {r.review_date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={cn('w-4 h-4', s <= r.rating ? 'fill-accent text-accent' : 'text-muted-foreground/20')} />
                      ))}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditReview(r); setReviewFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteReviewId(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </div>
                {r.strengths && <p className="text-xs text-muted-foreground"><strong>Strengths:</strong> {r.strengths}</p>}
                {r.areas_for_improvement && <p className="text-xs text-muted-foreground mt-1"><strong>Improve:</strong> {r.areas_for_improvement}</p>}
                {r.goals && <p className="text-xs text-muted-foreground mt-1"><strong>Goals:</strong> {r.goals}</p>}
              </div>
            ))}
            {reviews.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">No reviews yet</div>}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'Documents' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Employee Documents</h3>
          </div>
          {employees.map(emp => {
            const empDocs = documents.filter((d: any) => d.employee_id === emp.id);
            return (
              <div key={emp.id} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{emp.name}</p>
                  <Button size="sm" variant="outline" onClick={() => { setDocEmployeeId(emp.id); setDocUploadOpen(true); }}>
                    <Plus className="w-3.5 h-3.5 mr-1" />Upload
                  </Button>
                </div>
                {empDocs.length > 0 ? (
                  <div className="bg-card border border-border rounded-lg divide-y divide-border">
                    {empDocs.map((doc: any) => (
                      <div key={doc.id} className="px-4 py-3 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.category} · v{doc.version}
                              {doc.expiry_date && ` · Expires ${doc.expiry_date}`}
                              {doc.file_size && ` · ${(doc.file_size / 1024).toFixed(0)} KB`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc.file_path)}>
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteDocData({ id: doc.id, filePath: doc.file_path })}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">No documents uploaded</p>
                )}
              </div>
            );
          })}
          {employees.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">Add employees first to upload documents</div>}
        </div>
      )}

      {/* Dialogs */}
      <EmployeeFormDialog open={formOpen} onOpenChange={setFormOpen} initialData={editItem} loading={upsertEmp.isPending} onSubmit={handleEmployeeSubmit} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} loading={removeEmp.isPending} onConfirm={() => { if (deleteId) removeEmp.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }} title="Delete Employee" />
      <ReviewFormDialog open={reviewFormOpen} onOpenChange={setReviewFormOpen} initialData={editReview} employees={employees.map(e => ({ id: e.id, name: e.name }))} loading={upsertReview.isPending} onSubmit={(data) => { upsertReview.mutate(data, { onSuccess: () => setReviewFormOpen(false) }); }} />
      <DeleteConfirmDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)} loading={removeReview.isPending} onConfirm={() => { if (deleteReviewId) removeReview.mutate(deleteReviewId, { onSuccess: () => setDeleteReviewId(null) }); }} title="Delete Review" />
      <DocumentUploadDialog open={docUploadOpen} onOpenChange={setDocUploadOpen} loading={uploadDoc.isPending} onSubmit={(data) => { if (docEmployeeId) uploadDoc.mutate({ employeeId: docEmployeeId, ...data }, { onSuccess: () => setDocUploadOpen(false) }); }} />
      <DeleteConfirmDialog open={!!deleteDocData} onOpenChange={() => setDeleteDocData(null)} loading={removeDoc.isPending} onConfirm={() => { if (deleteDocData) removeDoc.mutate(deleteDocData, { onSuccess: () => setDeleteDocData(null) }); }} title="Delete Document" />
      <CredentialsDialog open={!!credentialsData} onOpenChange={() => setCredentialsData(null)} email={credentialsData?.email ?? ''} password={credentialsData?.password ?? ''} />
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePerformanceReviews, useEmployeeDocuments, useLeaveRequests, useUpsertLeaveRequest, useEmployees } from '@/hooks/useCrmData';
import { Star, FileText, Clock, Check, X, Download, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LeaveRequestFormDialog } from '@/components/forms/LeaveRequestFormDialog';

const leaveStatusIcon: Record<string, any> = { pending: Clock, approved: Check, rejected: X };
const leaveStatusStyle: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
};

export default function EmployeePortal() {
  const { user } = useAuth();
  const { data: employees = [] } = useEmployees();
  const { data: reviews = [], isLoading: lr } = usePerformanceReviews();
  const { data: documents = [], isLoading: ld } = useEmployeeDocuments();
  const { data: leaveRequests = [], isLoading: ll } = useLeaveRequests();
  const upsertLeave = useUpsertLeaveRequest();

  const [leaveFormOpen, setLeaveFormOpen] = useState(false);

  // Find the employee record linked to this user
  const myEmployee = employees.find((e: any) => e.user_id === user?.id || e.email === user?.email);

  const loading = lr || ld || ll;
  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading your portal...</div>;

  // Filter to only show current employee's data
  const myLeaveRequests = myEmployee ? leaveRequests.filter((lr: any) => lr.employee_id === myEmployee.id) : leaveRequests.filter((lr: any) => lr.user_id === user?.id);
  const myDocuments = myEmployee ? documents.filter((d: any) => d.employee_id === myEmployee.id) : documents;
  const myReviews = myEmployee ? reviews.filter((r: any) => r.employee_id === myEmployee.id) : [];

  const handleDownload = async (filePath: string) => {
    const { data } = await supabase.storage.from('employee-documents').createSignedUrl(filePath, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const handleLeaveSubmit = (data: { type: string; start_date: string; end_date: string; reason?: string }) => {
    upsertLeave.mutate(
      { ...data, employee_id: myEmployee?.id || null },
      { onSuccess: () => setLeaveFormOpen(false) }
    );
  };

  const handleDocUpload = (data: { file: File; name: string; category: string; expiry_date?: string; notes?: string }) => {
    if (!myEmployee) return;
    uploadDoc.mutate(
      { employeeId: myEmployee.id, ...data },
      { onSuccess: () => setDocUploadOpen(false) }
    );
  };

  return (
    <div className="space-y-6 animate-slide-in max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">Welcome, {user?.user_metadata?.full_name || user?.email}</h2>
        <p className="text-sm text-muted-foreground">Your employee self-service portal</p>
        {myEmployee && (
          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
            {myEmployee.job_title && <span className="status-badge bg-primary/10 text-primary">{myEmployee.job_title}</span>}
            {myEmployee.department && <span>{myEmployee.department}</span>}
            <span>{myEmployee.leave_balance} days leave remaining</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="leave" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="leave">Leave Requests</TabsTrigger>
          <TabsTrigger value="documents">My Documents</TabsTrigger>
          <TabsTrigger value="reviews">My Reviews</TabsTrigger>
        </TabsList>

        {/* Leave Requests */}
        <TabsContent value="leave">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Leave Requests</h3>
            <Button size="sm" onClick={() => setLeaveFormOpen(true)}><Plus className="w-4 h-4 mr-1" />Request Leave</Button>
          </div>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {myLeaveRequests.map((lr: any) => {
              const Icon = leaveStatusIcon[lr.status] ?? Clock;
              return (
                <div key={lr.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', leaveStatusStyle[lr.status] ?? 'bg-muted')}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{lr.type}</p>
                      <p className="text-xs text-muted-foreground">{lr.start_date} → {lr.end_date}</p>
                    </div>
                  </div>
                  <span className={cn('status-badge capitalize', leaveStatusStyle[lr.status] ?? 'bg-muted text-muted-foreground')}>{lr.status}</span>
                </div>
              );
            })}
            {myLeaveRequests.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No leave requests</p>}
          </div>
        </TabsContent>

        {/* Documents (read-only for employees) */}
        <TabsContent value="documents">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">My Documents</h3>
          </div>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {myDocuments.map((doc: any) => (
              <div key={doc.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.category}{doc.expiry_date ? ` · Expires ${doc.expiry_date}` : ''}</p>
                  </div>
                </div>
                <button onClick={() => handleDownload(doc.file_path)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
            {myDocuments.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No documents on file</p>}
          </div>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews">
          <h3 className="text-sm font-semibold mb-3">My Performance Reviews</h3>
          <div className="space-y-3">
          {myReviews.map((r: any) => (
              <div key={r.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{r.review_period}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn('w-4 h-4', s <= r.rating ? 'fill-accent text-accent' : 'text-muted-foreground/20')} />
                    ))}
                  </div>
                </div>
                {r.strengths && <p className="text-xs text-muted-foreground"><strong>Strengths:</strong> {r.strengths}</p>}
                {r.areas_for_improvement && <p className="text-xs text-muted-foreground mt-1"><strong>Improve:</strong> {r.areas_for_improvement}</p>}
                {r.goals && <p className="text-xs text-muted-foreground mt-1"><strong>Goals:</strong> {r.goals}</p>}
                <p className="text-[10px] text-muted-foreground/60 mt-2">{r.review_date}</p>
              </div>
            ))}
            {myReviews.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No reviews yet</p>}
          </div>
        </TabsContent>
      </Tabs>

      <LeaveRequestFormDialog open={leaveFormOpen} onOpenChange={setLeaveFormOpen} loading={upsertLeave.isPending} onSubmit={handleLeaveSubmit} />
      <DocumentUploadDialog open={docUploadOpen} onOpenChange={setDocUploadOpen} loading={uploadDoc.isPending} onSubmit={handleDocUpload} />
    </div>
  );
}

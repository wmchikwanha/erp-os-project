import { useState } from 'react';
import {
  useEmployees, useUpsertEmployee, useDeleteEmployee,
  useLeaveRequests, useUpdateLeaveStatus,
  usePerformanceReviews, useUpsertReview, useDeleteReview,
  useEmployeeDocuments, useUploadDocument, useDeleteDocument,
  useBulkImportInvitations,
  useJobPositions, useUpsertPosition, useDeletePosition,
  useCandidates, useUploadCV, useUpsertCandidate, useDeleteCandidate,
} from '@/hooks/useCrmData';
import { cn } from '@/lib/utils';
import { Check, X, Clock, Plus, Pencil, Trash2, Star, FileText, Download, Upload, Briefcase, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeFormDialog } from '@/components/forms/EmployeeFormDialog';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';
import { ReviewFormDialog } from '@/components/forms/ReviewFormDialog';
import { DocumentUploadDialog } from '@/components/forms/DocumentUploadDialog';
import { CredentialsDialog } from '@/components/forms/CredentialsDialog';
import { CsvImportDialog } from '@/components/forms/CsvImportDialog';
import { PositionFormDialog } from '@/components/forms/PositionFormDialog';
import { CandidateFormDialog } from '@/components/forms/CandidateFormDialog';
import { supabase } from '@/integrations/supabase/client';

const leaveStatusIcon: Record<string, any> = { pending: Clock, approved: Check, rejected: X };
const leaveStatusStyle: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
};

const candidateStatusStyle: Record<string, string> = {
  new: 'bg-muted text-muted-foreground',
  shortlisted: 'bg-primary/10 text-primary',
  interviewed: 'bg-accent/10 text-accent-foreground',
  rejected: 'bg-destructive/10 text-destructive',
  hired: 'bg-success/10 text-success',
};

const positionStatusStyle: Record<string, string> = {
  open: 'bg-success/10 text-success',
  'on-hold': 'bg-warning/10 text-warning',
  closed: 'bg-muted text-muted-foreground',
};

const tabs = ['Directory', 'Leave Requests', 'Reviews', 'Documents', 'Positions', 'Recruitment'] as const;

export default function HRPage() {
  const { data: employees = [], isLoading: loadingEmp } = useEmployees();
  const { data: leaveRequests = [], isLoading: loadingLR } = useLeaveRequests();
  const { data: reviews = [], isLoading: loadingRev } = usePerformanceReviews();
  const { data: documents = [], isLoading: loadingDoc } = useEmployeeDocuments();
  const { data: positions = [], isLoading: loadingPos } = useJobPositions();
  const { data: candidates = [], isLoading: loadingCand } = useCandidates();

  const upsertEmp = useUpsertEmployee();
  const removeEmp = useDeleteEmployee();
  const updateLeave = useUpdateLeaveStatus();
  const upsertReview = useUpsertReview();
  const removeReview = useDeleteReview();
  const uploadDoc = useUploadDocument();
  const removeDoc = useDeleteDocument();
  const bulkInvite = useBulkImportInvitations();
  const upsertPos = useUpsertPosition();
  const removePos = useDeletePosition();
  const uploadCV = useUploadCV();
  const upsertCand = useUpsertCandidate();
  const removeCand = useDeleteCandidate();

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
  const [csvInviteOpen, setCsvInviteOpen] = useState(false);

  // Position state
  const [posFormOpen, setPosFormOpen] = useState(false);
  const [editPosition, setEditPosition] = useState<any>(null);
  const [deletePosId, setDeletePosId] = useState<string | null>(null);

  // Candidate/Recruitment state
  const [candFormOpen, setCandFormOpen] = useState(false);
  const [deleteCandData, setDeleteCandData] = useState<{ id: string; cvPath?: string } | null>(null);
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loading = loadingEmp || loadingLR || loadingRev || loadingDoc || loadingPos || loadingCand;
  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading HR data...</div>;

  const handleDownload = async (filePath: string, bucket = 'employee-documents') => {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(filePath, 60);
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

  // Filtered candidates
  const filteredCandidates = candidates.filter((c: any) => {
    if (filterDept !== 'all' && c.department !== filterDept) return false;
    if (filterPosition !== 'all' && c.position_id !== filterPosition) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !(c.email ?? '').toLowerCase().includes(q) && !(c.notes ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const departments = [...new Set([...positions.map((p: any) => p.department), ...candidates.map((c: any) => c.department)].filter(Boolean))];

  return (
    <div className="space-y-4 animate-slide-in">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
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
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setCsvInviteOpen(true)}><Upload className="w-4 h-4 mr-1" />Import Invitations CSV</Button>
              <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />Add Employee</Button>
            </div>
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
                {emp.manager_id && (
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Manager: {employees.find(m => m.id === emp.manager_id)?.name ?? 'Unknown'}
                  </p>
                )}
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

      {/* Positions Tab */}
      {activeTab === 'Positions' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Open Positions</h3>
            <Button size="sm" onClick={() => { setEditPosition(null); setPosFormOpen(true); }}><Plus className="w-4 h-4 mr-1" />New Position</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {positions.map((pos: any) => {
              const positionCandidates = candidates.filter((c: any) => c.position_id === pos.id);
              return (
                <div key={pos.id} className="bg-card border border-border rounded-lg p-4 group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-sm font-medium truncate">{pos.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{pos.department}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={cn('text-xs capitalize', positionStatusStyle[pos.status])}>{pos.status}</Badge>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditPosition(pos); setPosFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletePosId(pos.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </div>
                  {pos.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{pos.description}</p>}
                  {pos.requirements && <p className="text-xs text-muted-foreground/70 line-clamp-1"><strong>Req:</strong> {pos.requirements}</p>}
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{positionCandidates.length} candidate{positionCandidates.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              );
            })}
            {positions.length === 0 && <div className="col-span-full py-8 text-center text-muted-foreground text-sm">No positions created yet</div>}
          </div>
        </div>
      )}

      {/* Recruitment Tab */}
      {activeTab === 'Recruitment' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Candidate Pipeline</h3>
            <Button size="sm" onClick={() => setCandFormOpen(true)}><Upload className="w-4 h-4 mr-1" />Upload CV</Button>
          </div>
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9 h-9" placeholder="Search candidates..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Depts</SelectItem>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Position" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {positions.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {['new', 'shortlisted', 'interviewed', 'rejected', 'hired'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Candidate list */}
          <div className="space-y-2">
            {filteredCandidates.map((c: any) => (
              <div key={c.id} className="bg-card border border-border rounded-lg p-4 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-primary">{c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.position_title} {c.department ? `· ${c.department}` : ''} · Applied {c.applied_date}
                      </p>
                      {c.email && <p className="text-xs text-muted-foreground/60">{c.email}{c.phone ? ` · ${c.phone}` : ''}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status select */}
                    <Select value={c.status} onValueChange={(val) => upsertCand.mutate({ id: c.id, name: c.name, status: val })}>
                      <SelectTrigger className={cn('h-7 w-[120px] text-xs capitalize', candidateStatusStyle[c.status])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['new', 'shortlisted', 'interviewed', 'rejected', 'hired'].map(s => (
                          <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {c.cv_file_path && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(c.cv_file_path, 'candidate-cvs')}>
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteCandData({ id: c.id, cvPath: c.cv_file_path })}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {c.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.notes}</p>}
                {c.cv_file_size && <p className="text-xs text-muted-foreground/50 mt-1">CV: {(c.cv_file_size / 1024).toFixed(0)} KB</p>}
              </div>
            ))}
            {filteredCandidates.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">No candidates match your filters</div>}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <EmployeeFormDialog open={formOpen} onOpenChange={setFormOpen} initialData={editItem} loading={upsertEmp.isPending} onSubmit={handleEmployeeSubmit} employees={employees.map(e => ({ id: e.id, name: e.name }))} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} loading={removeEmp.isPending} onConfirm={() => { if (deleteId) removeEmp.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }} title="Delete Employee" />
      <ReviewFormDialog open={reviewFormOpen} onOpenChange={setReviewFormOpen} initialData={editReview} employees={employees.map(e => ({ id: e.id, name: e.name }))} loading={upsertReview.isPending} onSubmit={(data) => { upsertReview.mutate(data, { onSuccess: () => setReviewFormOpen(false) }); }} />
      <DeleteConfirmDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)} loading={removeReview.isPending} onConfirm={() => { if (deleteReviewId) removeReview.mutate(deleteReviewId, { onSuccess: () => setDeleteReviewId(null) }); }} title="Delete Review" />
      <DocumentUploadDialog open={docUploadOpen} onOpenChange={setDocUploadOpen} loading={uploadDoc.isPending} onSubmit={(data) => { if (docEmployeeId) uploadDoc.mutate({ employeeId: docEmployeeId, ...data }, { onSuccess: () => setDocUploadOpen(false) }); }} />
      <DeleteConfirmDialog open={!!deleteDocData} onOpenChange={() => setDeleteDocData(null)} loading={removeDoc.isPending} onConfirm={() => { if (deleteDocData) removeDoc.mutate(deleteDocData, { onSuccess: () => setDeleteDocData(null) }); }} title="Delete Document" />
      <CredentialsDialog open={!!credentialsData} onOpenChange={() => setCredentialsData(null)} email={credentialsData?.email ?? ''} password={credentialsData?.password ?? ''} />
      <CsvImportDialog open={csvInviteOpen} onOpenChange={setCsvInviteOpen} title="Import Invitations CSV" expectedColumns={['email', 'role']} loading={bulkInvite.isPending} onImport={(rows) => { bulkInvite.mutate(rows, { onSuccess: () => setCsvInviteOpen(false) }); }} />
      <PositionFormDialog open={posFormOpen} onOpenChange={setPosFormOpen} initialData={editPosition} loading={upsertPos.isPending} onSubmit={(data) => { upsertPos.mutate(data, { onSuccess: () => setPosFormOpen(false) }); }} />
      <DeleteConfirmDialog open={!!deletePosId} onOpenChange={() => setDeletePosId(null)} loading={removePos.isPending} onConfirm={() => { if (deletePosId) removePos.mutate(deletePosId, { onSuccess: () => setDeletePosId(null) }); }} title="Delete Position" />
      <CandidateFormDialog open={candFormOpen} onOpenChange={setCandFormOpen} positions={positions.map((p: any) => ({ id: p.id, title: p.title, department: p.department, status: p.status }))} loading={uploadCV.isPending} onSubmit={(data) => { uploadCV.mutate(data, { onSuccess: () => setCandFormOpen(false) }); }} />
      <DeleteConfirmDialog open={!!deleteCandData} onOpenChange={() => setDeleteCandData(null)} loading={removeCand.isPending} onConfirm={() => { if (deleteCandData) removeCand.mutate(deleteCandData, { onSuccess: () => setDeleteCandData(null) }); }} title="Delete Candidate" />
    </div>
  );
}

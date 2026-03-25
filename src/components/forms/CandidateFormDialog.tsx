import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations', 'Admin', 'Other'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  positions: { id: string; title: string; department: string; status?: string }[];
  loading?: boolean;
  onSubmit: (data: { file: File; candidateName: string; email?: string; phone?: string; department?: string; positionId?: string | null; notes?: string }) => void;
}

export function CandidateFormDialog({ open, onOpenChange, positions, loading, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [positionId, setPositionId] = useState<string>('none');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(''); setEmail(''); setPhone(''); setDepartment(''); setPositionId('none'); setNotes(''); setFile(null);
    }
  }, [open]);

  // Auto-set department when position selected
  useEffect(() => {
    if (positionId && positionId !== 'none') {
      const pos = positions.find(p => p.id === positionId);
      if (pos) setDepartment(pos.department);
    }
  }, [positionId, positions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !file) return;
    onSubmit({
      file,
      candidateName: name.trim(),
      email: email || undefined,
      phone: phone || undefined,
      department: department || undefined,
      positionId: positionId === 'none' ? null : positionId,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Upload Candidate CV</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Candidate Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+61 ..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={positionId} onValueChange={setPositionId}>
                <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned (General Pool)</SelectItem>
                  {positions.filter(p => p.status === 'open').map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>CV File *</Label>
            <input type="file" ref={fileRef} accept=".pdf,.doc,.docx" className="hidden" onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{file ? file.name : 'Click to select CV (PDF, DOC, DOCX)'}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Initial assessment notes..." rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !file}>{loading ? 'Uploading...' : 'Upload CV'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

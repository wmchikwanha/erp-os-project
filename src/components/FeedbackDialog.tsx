import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDemoRole } from '@/hooks/useDemoRole';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState('general');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const location = useLocation();
  const { role } = useDemoRole();

  const submit = async () => {
    if (message.trim().length < 5) {
      toast({ title: 'Please add a little more detail', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('feedback').insert({
      type,
      message: message.trim(),
      name: name.trim() || null,
      email: email.trim() || null,
      page: location.pathname,
      role_context: role ?? null,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Could not send', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Thank you', description: 'Your message has been sent.' });
    setMessage(''); setName(''); setEmail(''); setType('general');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Send feedback">
          <MessageSquarePlus className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>
            Report a fault, request a change, or share an opinion. It goes straight to the team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Fault / bug</SelectItem>
                <SelectItem value="feature">Change or new feature</SelectItem>
                <SelectItem value="general">General opinion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Your message</Label>
            <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="What happened, or what would you like to see?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name (optional)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email (optional)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Sending…' : 'Send'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

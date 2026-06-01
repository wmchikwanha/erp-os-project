import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { useIndustryDNA, DNA_LABELS, type IndustryDNA } from '@/hooks/useIndustryDNA';

export default function Settings() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
      if (error) throw error;
      await supabase.from('profiles').update({ full_name: fullName }).eq('user_id', user!.id);
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-in max-w-lg">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your profile and security</p>
      </div>

      {/* Profile Section */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <User className="w-4 h-4" /> Profile
        </div>
        <div>
          <Label>Email</Label>
          <Input value={user?.email || ''} disabled className="bg-muted" />
        </div>
        <div>
          <Label>Full Name</Label>
          <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" />
        </div>
        <Button size="sm" onClick={handleProfileSave} disabled={savingProfile}>
          {savingProfile ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>

      {/* Password Section */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="w-4 h-4" /> Change Password
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div className="relative">
            <Label>New Password</Label>
            <Input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
            />
            <button type="button" className="absolute right-2 top-7 text-muted-foreground" onClick={() => setShowNew(!showNew)}>
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={changingPassword || !newPassword || !confirmPassword}>
            {changingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </form>
      </div>
      <IndustryDNASection />
    </div>
  );
}

function IndustryDNASection() {
  const { dna, setDNA, saving } = useIndustryDNA();
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Industry DNA</h2>
        <p className="text-xs text-muted-foreground">Reshapes the SAE's priorities and the dashboard widget order to match how your business actually runs.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {(Object.keys(DNA_LABELS) as IndustryDNA[]).map((k) => (
          <button
            key={k}
            onClick={() => setDNA(k)}
            disabled={saving}
            className={`text-left px-3 py-2 rounded-md border text-xs transition-colors ${dna === k ? 'border-primary bg-primary/10 text-foreground' : 'border-border hover:bg-muted/50 text-muted-foreground'}`}
          >
            {DNA_LABELS[k]}
          </button>
        ))}
      </div>
    </div>
  );
}

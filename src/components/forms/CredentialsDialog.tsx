import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  password: string;
}

export function CredentialsDialog({ open, onOpenChange, email, password }: CredentialsDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Employee Account Created</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Share these credentials with the employee so they can log in:</p>
          <div className="bg-muted rounded-lg p-4 space-y-2 font-mono text-sm">
            <div><span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground">{email}</span></div>
            <div><span className="text-muted-foreground">Password:</span> <span className="font-medium text-foreground">{password}</span></div>
          </div>
          <p className="text-xs text-muted-foreground">This is the only time the password will be shown. The employee can change it after logging in.</p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
            {copied ? 'Copied!' : 'Copy Credentials'}
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

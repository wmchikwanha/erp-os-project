import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { drainQueue, pendingCount } from '@/lib/offlineQueue';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function OfflineIndicator() {
  const online = useOnlineStatus();
  const [pending, setPending] = useState(0);
  const [draining, setDraining] = useState(false);

  useEffect(() => {
    pendingCount().then(setPending);
    const i = setInterval(() => pendingCount().then(setPending), 5000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (online && pending > 0 && !draining) {
      setDraining(true);
      drainQueue()
        .then((r) => {
          toast({ title: `Synced ${r.ok} pending change${r.ok === 1 ? '' : 's'}`, description: r.failed ? `${r.failed} failed — retry next sync` : undefined });
        })
        .finally(() => {
          setDraining(false);
          pendingCount().then(setPending);
        });
    }
  }, [online, pending, draining]);

  if (online && pending === 0) return null;

  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium',
      online ? 'bg-info/10 text-info' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    )}>
      {draining ? <Loader2 className="w-3 h-3 animate-spin" /> : online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      <span>{draining ? 'Syncing…' : online ? `${pending} pending` : `Offline · ${pending} queued`}</span>
    </div>
  );
}

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Undo2, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
  recommendationKey: string;
  originalAction: string;
}

export default function OverrideButton({ recommendationKey, originalAction }: Props) {
  const { user } = useAuth();
  const [logged, setLogged] = useState(false);
  const [busy, setBusy] = useState(false);

  const onOverride = async () => {
    if (!user) return;
    setBusy(true);
    const reason = window.prompt('Why are you overriding this recommendation? (optional)') || '';
    const { error } = await supabase.from('sae_overrides').insert({
      user_id: user.id,
      recommendation_key: recommendationKey,
      original_action: originalAction,
      override_action: 'do_the_opposite',
      reason,
    });
    setBusy(false);
    if (error) {
      toast({ title: 'Could not log override', description: error.message, variant: 'destructive' });
      return;
    }
    setLogged(true);
    toast({ title: 'Override logged', description: 'The SAE will weight this signal next time.' });
  };

  return (
    <Button size="sm" variant="outline" onClick={onOverride} disabled={busy || logged} className="text-xs h-7">
      {logged ? <Check className="w-3 h-3 mr-1" /> : <Undo2 className="w-3 h-3 mr-1" />}
      {logged ? 'Override logged' : 'Do the opposite'}
    </Button>
  );
}

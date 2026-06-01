import { Lightbulb } from 'lucide-react';
import OverrideButton from './OverrideButton';

interface Props {
  recommendationKey: string;
  inputs: string;
  logic: string;
  action: string;
}

export default function RationaleCard({ recommendationKey, inputs, logic, action }: Props) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-xs">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
        <Lightbulb className="w-3 h-3" /> Decision Rationale
      </div>
      <div className="space-y-1.5 text-foreground">
        <p><span className="font-semibold text-muted-foreground">Inputs:</span> {inputs}</p>
        <p><span className="font-semibold text-muted-foreground">Logic:</span> {logic}</p>
        <p><span className="font-semibold text-primary">Action:</span> {action}</p>
      </div>
      <div className="pt-1">
        <OverrideButton recommendationKey={recommendationKey} originalAction={action} />
      </div>
    </div>
  );
}

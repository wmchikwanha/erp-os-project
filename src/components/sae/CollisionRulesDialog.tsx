import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DEFAULT_RULES, useShiftCollisionRules, useUpsertShiftCollisionRules } from '@/hooks/useShiftCollisionRules';

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export default function CollisionRulesDialog({ open, onOpenChange }: Props) {
  const { data: rules } = useShiftCollisionRules();
  const save = useUpsertShiftCollisionRules();
  const [form, setForm] = useState({ ...DEFAULT_RULES, ignore_zones_text: '' });

  useEffect(() => {
    if (!open) return;
    const r = rules || DEFAULT_RULES;
    setForm({
      min_overlap_hours: r.min_overlap_hours,
      severity_threshold_hours: r.severity_threshold_hours,
      urgent_collision_count: r.urgent_collision_count,
      auto_shift_minutes: r.auto_shift_minutes,
      ignore_zones: r.ignore_zones,
      enabled: r.enabled,
      ignore_zones_text: (r.ignore_zones || []).join(', '),
    });
  }, [open, rules]);

  const submit = async () => {
    await save.mutateAsync({
      min_overlap_hours: Number(form.min_overlap_hours) || 0,
      severity_threshold_hours: Number(form.severity_threshold_hours) || 0,
      urgent_collision_count: Math.max(1, Math.floor(Number(form.urgent_collision_count) || 1)),
      auto_shift_minutes: Math.max(0, Math.floor(Number(form.auto_shift_minutes) || 0)),
      ignore_zones: form.ignore_zones_text.split(',').map((z) => z.trim()).filter(Boolean),
      enabled: form.enabled,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Shift collision rules</DialogTitle>
          <DialogDescription>Tune how the planner detects clashes and recommends fixes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md border border-border p-2">
            <Label className="text-xs">Collision detection enabled</Label>
            <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Min overlap to count (hours)</Label>
              <Input type="number" step="0.25" min="0" value={form.min_overlap_hours}
                onChange={(e) => setForm((f) => ({ ...f, min_overlap_hours: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs">Urgent threshold (hours)</Label>
              <Input type="number" step="0.25" min="0" value={form.severity_threshold_hours}
                onChange={(e) => setForm((f) => ({ ...f, severity_threshold_hours: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs">Urgent count (week)</Label>
              <Input type="number" min="1" value={form.urgent_collision_count}
                onChange={(e) => setForm((f) => ({ ...f, urgent_collision_count: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs">Suggested shift (minutes)</Label>
              <Input type="number" min="0" step="15" value={form.auto_shift_minutes}
                onChange={(e) => setForm((f) => ({ ...f, auto_shift_minutes: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Ignore zones (comma-separated)</Label>
            <Input placeholder="e.g. Zone 14, Industrial Park"
              value={form.ignore_zones_text}
              onChange={(e) => setForm((f) => ({ ...f, ignore_zones_text: e.target.value }))} />
            <p className="text-[10px] text-muted-foreground mt-1">Outages in these zones are excluded from collisions.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={save.isPending}>Save rules</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

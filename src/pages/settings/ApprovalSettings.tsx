import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShieldCheck, X } from 'lucide-react';
import {
  usePlanApprovalSettings,
  useUpdatePlanApprovalSetting,
  type PlanApprovalSetting,
} from '@/hooks/usePlanApprovalSettings';
import { useRole, type AppRole } from '@/hooks/useRole';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ALL_ROLES: { value: AppRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'finance_manager', label: 'Finance Manager' },
  { value: 'procurement_manager', label: 'Procurement Manager' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'employee', label: 'Employee' },
];

interface RoleUser {
  user_id: string;
  role: AppRole;
  full_name: string | null;
  email: string | null;
}

function useRoleUsers() {
  return useQuery<RoleUser[]>({
    queryKey: ['role-users-for-approvals'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (error) throw error;
      const ids = Array.from(new Set((roles || []).map((r) => r.user_id)));
      if (!ids.length) return [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', ids);
      const pm = new Map((profiles || []).map((p) => [p.user_id, p]));
      return (roles || []).map((r) => ({
        user_id: r.user_id,
        role: r.role as AppRole,
        full_name: pm.get(r.user_id)?.full_name ?? null,
        email: pm.get(r.user_id)?.email ?? null,
      }));
    },
  });
}

export default function ApprovalSettings() {
  const { data: role, isLoading: roleLoading } = useRole();
  const { data: settings = [], isLoading } = usePlanApprovalSettings();
  const { data: users = [] } = useRoleUsers();

  if (roleLoading) return null;
  if (role !== 'admin') {
    return (
      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Only administrators can configure plan approval settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slide-in max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" /> Plan Approval Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose which roles and specific users can approve or reject SAE action plans for each
          department. Admins can always approve.
        </p>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {settings.map((s) => (
            <DepartmentSettingCard key={s.department} setting={s} users={users} />
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentSettingCard({
  setting,
  users,
}: {
  setting: PlanApprovalSetting;
  users: RoleUser[];
}) {
  const update = useUpdatePlanApprovalSetting();
  const [allowedRoles, setAllowedRoles] = useState<AppRole[]>(setting.allowed_roles);
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>(setting.allowed_user_ids);
  const [pickUser, setPickUser] = useState<string>('');

  useEffect(() => {
    setAllowedRoles(setting.allowed_roles);
    setAllowedUserIds(setting.allowed_user_ids);
  }, [setting.allowed_roles, setting.allowed_user_ids]);

  const dirty = useMemo(() => {
    const a = new Set(setting.allowed_roles);
    const b = new Set(allowedRoles);
    if (a.size !== b.size || ![...a].every((x) => b.has(x))) return true;
    const c = new Set(setting.allowed_user_ids);
    const d = new Set(allowedUserIds);
    if (c.size !== d.size || ![...c].every((x) => d.has(x))) return true;
    return false;
  }, [setting, allowedRoles, allowedUserIds]);

  const userById = useMemo(() => new Map(users.map((u) => [u.user_id, u])), [users]);
  const candidates = users.filter((u) => !allowedUserIds.includes(u.user_id));

  const toggleRole = (r: AppRole) =>
    setAllowedRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );

  const addUser = () => {
    if (pickUser && !allowedUserIds.includes(pickUser)) {
      setAllowedUserIds([...allowedUserIds, pickUser]);
      setPickUser('');
    }
  };

  const removeUser = (id: string) =>
    setAllowedUserIds(allowedUserIds.filter((x) => x !== id));

  const save = () =>
    update.mutate({
      department: setting.department,
      allowed_roles: allowedRoles,
      allowed_user_ids: allowedUserIds,
    });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-sm">{setting.label}</CardTitle>
            <p className="text-[11px] text-muted-foreground font-mono">{setting.department}</p>
          </div>
          <Button size="sm" disabled={!dirty || update.isPending} onClick={save}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Allowed roles
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {ALL_ROLES.map((r) => (
              <label
                key={r.value}
                className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-md border border-border hover:bg-muted/40 cursor-pointer"
              >
                <Checkbox
                  checked={allowedRoles.includes(r.value)}
                  onCheckedChange={() => toggleRole(r.value)}
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Specific users
          </Label>
          <div className="flex items-center gap-2 mt-2">
            <Select value={pickUser} onValueChange={setPickUser}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Add a user…" />
              </SelectTrigger>
              <SelectContent>
                {candidates.length === 0 && (
                  <div className="px-2 py-1 text-xs text-muted-foreground">No more users</div>
                )}
                {candidates.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id} className="text-xs">
                    {u.full_name || u.email || u.user_id.slice(0, 8)}{' '}
                    <span className="text-muted-foreground">· {u.role}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={addUser} disabled={!pickUser}>
              Add
            </Button>
          </div>
          {allowedUserIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {allowedUserIds.map((id) => {
                const u = userById.get(id);
                return (
                  <Badge key={id} variant="secondary" className="gap-1">
                    {u?.full_name || u?.email || id.slice(0, 8)}
                    <button
                      type="button"
                      onClick={() => removeUser(id)}
                      className="ml-1 hover:text-destructive"
                      aria-label="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
          {allowedUserIds.length === 0 && (
            <p className="text-[11px] text-muted-foreground mt-1">
              No individual overrides. Approval is governed by the role checkboxes above.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

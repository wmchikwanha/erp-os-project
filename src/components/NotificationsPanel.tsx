import { useState } from 'react';
import { Bell, AlertTriangle, Clock, Package, Wrench, DollarSign, FolderKanban } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useInvoices, useLeaveRequests, useMaintenanceLogs, useProducts, useEquipmentCheckouts, useProjects } from '@/hooks/useCrmData';
import { cn } from '@/lib/utils';

interface Alert {
  icon: any;
  label: string;
  count: number;
  color: string;
}

export default function NotificationsPanel() {
  const { data: invoices = [] } = useInvoices();
  const { data: leaveRequests = [] } = useLeaveRequests();
  const { data: maintenance = [] } = useMaintenanceLogs();
  const { data: products = [] } = useProducts();
  const { data: checkouts = [] } = useEquipmentCheckouts();
  const { data: projects = [] } = useProjects();

  const today = new Date().toISOString().slice(0, 10);

  const alerts: Alert[] = [
    { icon: DollarSign, label: 'Overdue invoices', count: invoices.filter((i: any) => i.status === 'overdue').length, color: 'text-destructive' },
    { icon: Clock, label: 'Pending leave requests', count: leaveRequests.filter((l: any) => l.status === 'pending').length, color: 'text-warning' },
    { icon: Wrench, label: 'Overdue maintenance', count: maintenance.filter((m: any) => m.status === 'scheduled' && m.next_due_date && m.next_due_date < today).length, color: 'text-destructive' },
    { icon: Package, label: 'Low stock items', count: products.filter((p: any) => p.stock_quantity <= p.reorder_level).length, color: 'text-warning' },
    { icon: AlertTriangle, label: 'Overdue equipment returns', count: checkouts.filter((c: any) => c.status === 'checked-out' && c.expected_return_date && c.expected_return_date < today).length, color: 'text-destructive' },
    { icon: FolderKanban, label: 'Projects over budget', count: projects.filter((p: any) => Number(p.actual_cost) > Number(p.budget) && Number(p.budget) > 0).length, color: 'text-warning' },
  ].filter(a => a.count > 0);

  const totalAlerts = alerts.reduce((s, a) => s + a.count, 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-1.5 rounded-md hover:bg-muted text-muted-foreground">
          <Bell className="w-4 h-4" />
          {totalAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold">Alerts</p>
        </div>
        <div className="divide-y divide-border max-h-80 overflow-y-auto">
          {alerts.map((a) => (
            <div key={a.label} className="px-4 py-2.5 flex items-center gap-3">
              <a.icon className={cn('w-4 h-4 shrink-0', a.color)} />
              <span className="text-sm flex-1">{a.label}</span>
              <span className={cn('text-sm font-semibold', a.color)}>{a.count}</span>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="py-6 text-center text-muted-foreground text-sm">All clear — no alerts</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

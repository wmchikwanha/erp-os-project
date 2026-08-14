import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FAQS = [
  { q: 'How do I add a new employee?', a: 'Go to HR → Employees → Invite Employee. Enter their email and assign a role. They will receive credentials to sign in.' },
  { q: 'How do I record a customer payment?', a: 'Open Payments → New Payment. Select the related invoice; the invoice status updates automatically once fully paid.' },
  { q: 'How do I upload candidate CVs?', a: 'Go to HR → Recruitment → Upload CV. Optionally link to an open Position created under HR → Positions.' },
  { q: 'How do I check out equipment to a worker?', a: 'Go to Equipment → New Checkout. Pick the asset, assignee, project/site, and expected return date.' },
  { q: 'How do I import data in bulk?', a: 'Most list pages have a CSV Import button. Download the template, fill it in, and upload.' },
  { q: 'Where do I see overdue invoices?', a: 'Dashboard shows AR Aging buckets. Reports → Invoice Aging gives a full breakdown.' },
  { q: 'How do roles and permissions work?', a: 'Admins see everything. Managers (HR, Finance, Procurement, Project) see their module + their direct reports. Employees see only their own data.' },
  { q: 'Where is my data stored?', a: 'All data lives in your private Lovable Cloud backend with row-level security. Only authorized users in your organization can access it.' },
];

const MODULES = [
  { name: 'Dashboard', desc: 'KPIs, AR aging, cash flow forecast, workforce utilization, recruitment snapshot, quick actions.' },
  { name: 'Contacts & Deals', desc: 'CRM pipeline — track leads, customers, suppliers, and the deals attached to them.' },
  { name: 'Projects & Sites', desc: 'Manage active projects, link them to client deals, assign managers, track sites in the field.' },
  { name: 'Scheduling & Timesheets', desc: 'Schedule shifts per employee/site, then capture actual hours worked for approval.' },
  { name: 'Equipment, Maintenance, Consumption', desc: 'Asset register, checkouts to workers, scheduled maintenance, inventory drawdowns per project.' },
  { name: 'Procurement & Products', desc: 'Purchase orders to suppliers, product catalog with stock levels and reorder thresholds.' },
  { name: 'Invoices, Payments, Expenses', desc: 'Issue invoices, log payments, track operational expenses with approvals.' },
  { name: 'HR (Employees, Leave, Reviews, Positions, Recruitment)', desc: 'Full employee lifecycle — onboarding, leave, performance, hiring pipeline with CV repository.' },
  { name: 'Reports', desc: 'Aging analysis, P&L trends, deal funnel, depreciation, hours by project, expense breakdowns.' },
  { name: 'SAE — Liquidity Guardian', desc: 'Forward cash forecast using official and parallel currency rates, flags shortfalls and suggests action.' },
  { name: 'SAE — Procurement Scout', desc: 'Price benchmarking against supplier quotes, normalized to USD, with alerts when prices spike.' },
  { name: 'SAE — Compliance Monitor', desc: 'Regulatory and tax deadline tracker filtered by your industry, with urgency scoring.' },
  { name: 'SAE — Load-Shedding Planner', desc: 'Correlates ZESA outages with shifts and power-sensitive equipment, recommends schedule changes.' },
  { name: 'SAE — Audit Log', desc: 'Immutable record of every rule change, override, and plan approval decision.' },
];

export default function HelpDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
          title="Help & FAQ"
          aria-label="Help and FAQ"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Help & Information</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="getting-started" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="space-y-3 text-sm pt-4">
            <p className="text-muted-foreground">
              Welcome to <strong className="text-foreground">StratedgeOS</strong> — an integrated CRM/ERP suite built for SMEs.
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Set up your team:</strong> HR → Employees → Invite Employee. Assign roles to control access.</li>
              <li><strong className="text-foreground">Add contacts & deals:</strong> Build your sales pipeline under Contacts and Deals.</li>
              <li><strong className="text-foreground">Create projects & sites:</strong> Link deals to delivery, assign managers and resources.</li>
              <li><strong className="text-foreground">Operate daily:</strong> Schedule shifts, log timesheets, check out equipment, log expenses.</li>
              <li><strong className="text-foreground">Bill and collect:</strong> Issue invoices, record payments, monitor AR aging on the Dashboard.</li>
              <li><strong className="text-foreground">Review:</strong> Use Reports for P&L, deal funnel, depreciation and operational analytics.</li>
            </ol>
          </TabsContent>

          <TabsContent value="modules" className="space-y-3 text-sm pt-4">
            {MODULES.map((m) => (
              <div key={m.name} className="border-b border-border pb-2 last:border-0">
                <h4 className="font-semibold text-foreground">{m.name}</h4>
                <p className="text-muted-foreground text-xs mt-0.5">{m.desc}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="faq" className="pt-4">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-sm text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

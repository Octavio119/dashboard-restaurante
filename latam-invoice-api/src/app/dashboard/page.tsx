"use client";

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Key, 
  BarChart3, 
  Settings, 
  LogOut, 
  Plus, 
  Copy, 
  Check,
  Search,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';

const data = [
  { name: 'Lun', invoices: 12 },
  { name: 'Mar', invoices: 19 },
  { name: 'Mie', invoices: 15 },
  { name: 'Jue', invoices: 22 },
  { name: 'Vie', invoices: 30 },
  { name: 'Sab', invoices: 10 },
  { name: 'Dom', invoices: 8 },
];

export default function DashboardPage() {
  const [apiKey, setApiKey] = useState("sk_latam_7h2k9s1j5v8n3m2q");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-[#EDEDED]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#262626] p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Latam<span className="text-blue-500">Invoice</span></span>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarLink icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <SidebarLink icon={<FileText size={20} />} label="Invoices" active={activeTab === "invoices"} onClick={() => setActiveTab("invoices")} />
          <SidebarLink icon={<CreditCard size={20} />} label="Billing" active={activeTab === "billing"} onClick={() => setActiveTab("billing")} />
          <SidebarLink icon={<Key size={20} />} label="API Keys" active={activeTab === "api-keys"} onClick={() => setActiveTab("api-keys")} />
          <SidebarLink icon={<BarChart3 size={20} />} label="Analytics" active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} />
          <SidebarLink icon={<Settings size={20} />} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </nav>

        <div className="mt-auto pt-6 border-t border-[#262626]">
          <button className="flex items-center gap-3 text-muted hover:text-white transition-colors">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === "overview" ? (
          <>
            <header className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, Developer</h1>
                <p className="text-muted">Your API is running smoothly. 124 invoices generated this month.</p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20">
                <Plus size={18} />
                <span>New Test Invoice</span>
              </button>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard title="Total Volume" value={formatCurrency(12540)} change="+12.5%" />
              <StatCard title="Successful Stamps" value="1,240" change="+8.2%" />
              <StatCard title="API Key Usage" value="98.2%" change="Optimal" />
            </div>

            {/* API Key Section */}
            <section className="glass rounded-xl p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Key className="text-blue-500" size={18} />
                  Live API Key
                </h3>
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full border border-green-500/20">Active</span>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 bg-black/40 border border-[#262626] rounded-lg px-4 py-3 font-mono text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">{apiKey}</span>
                  <button onClick={copyToClipboard} className="text-muted hover:text-white transition-colors">
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>
                <button className="border border-[#262626] hover:bg-white/5 px-4 py-2 rounded-lg transition-colors">
                  Rotate Key
                </button>
              </div>
            </section>

            {/* Chart & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass rounded-xl p-6">
                <h3 className="font-semibold mb-6">Activity (Last 7 Days)</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorInvoices" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#161616', border: '1px solid #262626', borderRadius: '8px' }}
                        itemStyle={{ color: '#EDEDED' }}
                      />
                      <Area type="monotone" dataKey="invoices" stroke="#3B82F6" fillOpacity={1} fill="url(#colorInvoices)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold">Recent Transactions</h3>
                  <button className="text-sm text-blue-500 hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                  <TransactionItem folio="F-2024-8821" customer="CloudTech SA" amount={1200} status="Signed" />
                  <TransactionItem folio="F-2024-8820" customer="Eduardo Gomez" amount={450} status="Signed" />
                  <TransactionItem folio="F-2024-8819" customer="Restaurante La Paz" amount={890} status="Signed" />
                  <TransactionItem folio="F-2024-8818" customer="Freelance Dev" amount={150} status="Signed" />
                </div>
              </div>
            </div>
          </>
        ) : activeTab === "billing" ? (
          <BillingView />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted">
            <h2 className="text-2xl font-bold mb-2">Section Under Construction</h2>
            <p>We are working on the {activeTab} module.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function SidebarLink({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
        active ? "bg-blue-600/10 text-blue-500 font-medium border border-blue-500/20" : "text-muted hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, change }: { title: string, value: string, change: string }) {
  const isPositive = change.startsWith("+");
  return (
    <div className="glass p-6 rounded-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full -mr-12 -mt-12 transition-all group-hover:bg-blue-500/10"></div>
      <p className="text-muted text-sm mb-1">{title}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-2xl font-bold">{value}</h4>
        <span className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-full",
          isPositive ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
        )}>
          {change}
        </span>
      </div>
    </div>
  );
}

function TransactionItem({ folio, customer, amount, status }: { folio: string, customer: string, amount: number, status: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-[#262626]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#262626] flex items-center justify-center text-muted">
          <FileText size={18} />
        </div>
        <div>
          <p className="font-medium text-sm">{customer}</p>
          <p className="text-xs text-muted font-mono">{folio}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-sm">{formatCurrency(amount)}</p>
        <div className="flex items-center gap-1 justify-end text-[10px] text-green-500">
          <div className="w-1 h-1 rounded-full bg-green-500"></div>
          {status}
        </div>
      </div>
    </div>
  );
}

function BillingView() {
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-bold mb-2">Billing & Plans</h2>
        <p className="text-muted">Manage your subscription and usage limits.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="glass p-8 rounded-2xl border-blue-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Current Plan</span>
          </div>
          <h3 className="text-xl font-bold mb-4">Pro Plan</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-bold font-mono">$17</span>
            <span className="text-muted text-sm">/month</span>
          </div>
          <div className="space-y-3 mb-8">
            <PlanFeature text="1,000 invoices per month" />
            <PlanFeature text="Multi-country support" />
            <PlanFeature text="Priority Support" />
            <PlanFeature text="API Webhooks" />
          </div>
          <button className="w-full border border-[#262626] hover:bg-white/5 py-3 rounded-xl font-bold transition-all">
            Manage Subscription
          </button>
        </div>

        <div className="glass p-8 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-white/10">
          <h3 className="text-xl font-bold mb-4">Business Plan</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-bold font-mono">$29</span>
            <span className="text-muted text-sm">/month</span>
          </div>
          <div className="space-y-3 mb-8">
            <PlanFeature text="Unlimited invoices" />
            <PlanFeature text="White-label Portal" />
            <PlanFeature text="Dedicated Account Manager" />
            <PlanFeature text="Custom Integrations" />
          </div>
          <button className="w-full bg-white text-black hover:bg-gray-200 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
            <Zap size={18} fill="currentColor" />
            Upgrade to Business
          </button>
        </div>
      </div>

      <section className="glass rounded-xl p-8">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="text-blue-500" size={20} />
          Usage this month
        </h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Invoices used</span>
              <span className="font-mono">124 / 1,000</span>
            </div>
            <div className="w-full h-2 bg-[#262626] rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-[12.4%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            </div>
          </div>
          <p className="text-xs text-muted italic">
            * Your usage resets on June 1st, 2026.
          </p>
        </div>
      </section>
    </div>
  );
}

function PlanFeature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <CheckCircle2 size={16} className="text-blue-500" />
      <span>{text}</span>
    </div>
  );
}

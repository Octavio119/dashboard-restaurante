"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Zap, 
  Globe, 
  Code2, 
  ArrowRight,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Latam<span className="text-blue-500">Invoice</span></span>
        </div>
        <div className="hidden md:flex gap-8 text-sm text-muted">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#developers" className="hover:text-white transition-colors">Developers</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard" className="px-4 py-2 text-sm font-medium hover:text-white transition-colors">Log In</Link>
          <Link href="/dashboard" className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all shadow-lg shadow-white/5">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-20 pb-32 px-8 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-500 text-xs font-medium mb-6">
          <Zap size={14} />
          <span>New: Support for CFDI 4.0 (Mexico) & DIAN (Colombia)</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight">
          Electronic Invoicing for <span className="gradient-text">Latam Developers</span>.
        </h1>
        <p className="text-xl text-muted mb-10 max-w-2xl mx-auto">
          One API to rule them all. Skip the tax bureaucracy and integrate professional electronic invoicing in minutes.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20">
            Start Integrating Free
            <ArrowRight size={20} />
          </Link>
          <button className="bg-[#161616] border border-[#262626] hover:bg-[#1f1f1f] text-white px-8 py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2">
            View Docs
            <Code2 size={20} />
          </button>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-20 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Globe className="text-blue-500" />}
            title="Multi-Country Support"
            description="One unified JSON schema for Mexico, Colombia, Chile, and Brazil. We handle the local mappings."
          />
          <FeatureCard 
            icon={<Zap className="text-purple-500" />}
            title="Real-time Stamps"
            description="Our infra is optimized for speed. Get your signed XML and PDF in less than 800ms."
          />
          <FeatureCard 
            icon={<Lock className="text-pink-500" />}
            title="Enterprise Security"
            description="Bank-grade encryption for your digital certificates and customer data. 99.9% uptime guaranteed."
          />
        </div>
      </section>

      {/* Code Snippet Section */}
      <section id="developers" className="py-20 px-8 bg-black/40 border-y border-[#262626]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Built by developers, <br/><span className="text-blue-500">for developers.</span></h2>
            <div className="space-y-4">
              <CheckItem text="RESTful API with clear documentation" />
              <CheckItem text="Official SDKs for Node, Python, and Go" />
              <CheckItem text="Test mode to simulate real tax authority responses" />
              <CheckItem text="Webhooks for status updates and cancellations" />
            </div>
          </div>
          <div className="glass rounded-2xl p-1 overflow-hidden shadow-2xl">
            <div className="bg-[#161616] rounded-xl p-6 font-mono text-sm overflow-x-auto">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
              </div>
              <pre className="text-blue-400">
{`const response = await fetch('https://api.lataminvoice.com/v1/invoice', {
  method: 'POST',
  headers: {
    'x-api-key': 'sk_latam_your_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer: { name: "ACME Corp", tax_id: "ABC123456" },
    items: [{ desc: "API Services", price: 100 }],
    currency: "MXN"
  })
});

const { pdf_url } = await response.json();`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Simple, <span className="text-blue-500">Transparent</span> Pricing</h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Choose the plan that best fits your project's scale. No hidden fees, just simple API-based invoicing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <PricingCard 
            tier="Starter"
            price="0"
            description="Perfect for side projects and small experiments."
            features={[
              "10 invoices per month",
              "1 country support",
              "Standard API speed",
              "Community support"
            ]}
          />

          {/* Pro Plan */}
          <PricingCard 
            tier="Pro"
            price="17"
            description="The complete solution for growing Latam startups."
            popular
            features={[
              "1,000 invoices per month",
              "Full Multi-country support",
              "Priority Email & Chat Support",
              "Custom PDF Branding",
              "API Webhooks",
              "99.9% Uptime SLA"
            ]}
          />

          {/* Business Plan */}
          <PricingCard 
            tier="Business"
            price="29"
            description="For enterprises needing scale and dedicated power."
            features={[
              "Unlimited invoices",
              "Dedicated Account Manager",
              "White-label Invoice Portal",
              "Custom Integrations",
              "Direct Phone Support",
              "99.99% Uptime SLA"
            ]}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 text-center text-muted border-t border-[#262626]">
        <p>© 2026 LatamInvoice. Built with ❤️ for the Latin American tech ecosystem.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass p-8 rounded-2xl hover:border-white/20 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2 className="text-blue-500" size={20} />
      <span className="text-lg text-muted">{text}</span>
    </div>
  );
}

function PricingCard({ 
  tier, 
  price, 
  description, 
  features, 
  popular = false 
}: { 
  tier: string, 
  price: string, 
  description: string, 
  features: string[],
  popular?: boolean
}) {
  return (
    <div className={cn(
      "glass p-8 rounded-2xl relative transition-all duration-300 hover:-translate-y-2",
      popular ? "border-blue-500/50 shadow-2xl shadow-blue-500/10 scale-105 z-10" : "hover:border-white/20"
    )}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
          Most Popular
        </div>
      )}
      
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-2">{tier}</h3>
        <p className="text-muted text-sm leading-relaxed">{description}</p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold font-mono">$</span>
          <span className="text-6xl font-bold font-mono tracking-tighter">{price}</span>
          <span className="text-muted">/mo</span>
        </div>
      </div>

      <Link 
        href="/dashboard" 
        className={cn(
          "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mb-8",
          popular 
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-900/20" 
            : "bg-[#161616] border border-[#262626] hover:bg-[#1f1f1f] text-white"
        )}
      >
        Get Started
        <ArrowRight size={18} />
      </Link>

      <div className="space-y-4">
        {features.map((feature, i) => (
          <div key={i} className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-blue-500 shrink-0" />
            <span className="text-sm text-muted">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Briefcase,
  CheckSquare,
  Calendar as CalendarIcon,
  Receipt,
  Building2,
  Megaphone,
  Bot,
  Zap,
  Headphones,
  FileText,
  Settings,
  Link as LinkIcon,
  MoreHorizontal,
  X,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useRinpoMemory } from "@/hooks/useRinpoMemory";

export type GridAppId =
  | "dashboard"
  | "analytics"
  | "leads"
  | "projects"
  | "tasks"
  | "calendar"
  | "invoices"
  | "clients"
  | "marketing"
  | "ai-tools"
  | "automations"
  | "support-app"
  | "reports"
  | "settings-app"
  | "integrations"
  | "more";

export type AppDefinition = {
  id: GridAppId;
  name: string;
  icon: typeof TrendingUp;
  badge?: string;
  category: "analytics" | "business" | "growth" | "tools";
  description: string;
};

export const GRID_APPS: AppDefinition[] = [
  { id: "dashboard", name: "Dashboard", icon: TrendingUp, category: "analytics", description: "Real-time metrics, live revenue overview and quick KPIs." },
  { id: "analytics", name: "Analytics", icon: TrendingUp, category: "analytics", description: "Traffic funnels, conversion rates, and SEO performance." },
  { id: "leads", name: "Leads", icon: Users, badge: "+12", category: "growth", description: "AI-captured inbound prospects and qualified customer inquiries." },
  { id: "projects", name: "Projects", icon: Briefcase, category: "business", description: "Active software deliverables, sprint boards, and deployments." },
  { id: "tasks", name: "Tasks", icon: CheckSquare, badge: "3", category: "business", description: "Your daily action items, milestones, and automated workflows." },
  { id: "calendar", name: "Calendar", icon: CalendarIcon, category: "business", description: "Scheduled client demos, strategy reviews, and team standups." },
  { id: "invoices", name: "Invoices", icon: Receipt, category: "business", description: "Automated billing, GST compliant receipts, and payout status." },
  { id: "clients", name: "Clients", icon: Building2, category: "business", description: "Customer relationship directory with history and service tiers." },
  { id: "marketing", name: "Marketing", icon: Megaphone, category: "growth", description: "Active ad campaigns on Meta & Google with live ROI tracking." },
  { id: "ai-tools", name: "AI Tools", icon: Bot, badge: "AI", category: "tools", description: "RINADS smart assistants, text generators, and vision engines." },
  { id: "automations", name: "Automations", icon: Zap, category: "tools", description: "No-code event triggers, WhatsApp notifications, and lead sync." },
  { id: "support-app", name: "Support", icon: Headphones, category: "tools", description: "24/7 dedicated support desk with priority ticket handling." },
  { id: "reports", name: "Reports", icon: FileText, category: "analytics", description: "Exportable monthly executive reports and audit summaries." },
  { id: "settings-app", name: "Settings", icon: Settings, category: "tools", description: "Organization profile, API keys, brand colors, and security." },
  { id: "integrations", name: "Integrations", icon: LinkIcon, category: "tools", description: "Connect Slack, WhatsApp, Stripe, GitHub, and Shopify." },
  { id: "more", name: "More", icon: MoreHorizontal, category: "tools", description: "Developer tools, SDKs, and RINADS Business Cloud extensions." },
];

export function AppDetailModal({
  appId,
  onClose,
  onOpenChat,
}: {
  appId: GridAppId | null;
  onClose: () => void;
  onOpenChat: (initialMsg?: string) => void;
}) {
  const app = GRID_APPS.find((a) => a.id === appId);
  const { memory, addInterest, addNote, addFavoriteService } = useRinpoMemory();
  const [taskDone, setTaskDone] = useState<Record<string, boolean>>({});

  if (!app) return null;
  const Icon = app.icon;

  const handleAction = (actionText: string) => {
    addInterest(app.name);
    addNote(`Explored ${app.name} feature`);
    onOpenChat(`Tell me how RINADS can help me with ${app.name}: ${actionText}`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col bg-[#0e0717]/95 backdrop-blur-xl p-4 overflow-y-auto scrollbar-hide text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9f4bc7] to-[#4a1d6a] text-white shadow-lg shadow-purple-900/40">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {app.name}
              {app.badge && (
                <span className="rounded-full bg-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                  {app.badge}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-purple-300/70">{app.category.toUpperCase()}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="mt-4 flex-1 space-y-4">
        <p className="text-xs text-white/80 leading-relaxed">{app.description}</p>

        {/* Dynamic App-Specific Mini Preview */}
        {app.id === "dashboard" || app.id === "analytics" ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-purple-500/30 bg-purple-950/40 p-3.5 shadow-inner">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-semibold text-purple-300">Total Revenue</span>
                <span className="text-[11px] font-bold text-emerald-400">+18.4%</span>
              </div>
              <div className="text-xl font-black text-white">₹ 24,50,000</div>
              <div className="mt-2 h-1.5 w-full bg-purple-900/60 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400 w-[78%]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                <div className="text-[10px] text-white/60">Active Users</div>
                <div className="text-sm font-bold text-white mt-0.5">12,540</div>
                <div className="text-[9px] text-purple-300 mt-1">Growth: +8.2%</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                <div className="text-[10px] text-white/60">Conversion Rate</div>
                <div className="text-sm font-bold text-white mt-0.5">4.85%</div>
                <div className="text-[9px] text-emerald-400 mt-1">Target: 4.2%</div>
              </div>
            </div>
          </div>
        ) : app.id === "leads" ? (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-purple-300">Recent Qualified Leads</div>
            {[
              { name: "Rahul Sharma", company: "Apex Logistics", time: "10m ago", score: "96%" },
              { name: "Dr. Ananya Nair", company: "Metro Dental Clinic", time: "1h ago", score: "92%" },
              { name: "Faizal Mohammed", company: "Kerala Spices Export", time: "3h ago", score: "88%" },
            ].map((lead, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-purple-500/20 bg-white/5 text-xs">
                <div>
                  <div className="font-semibold text-white">{lead.name}</div>
                  <div className="text-[10px] text-white/60">{lead.company} • {lead.time}</div>
                </div>
                <span className="rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  {lead.score} match
                </span>
              </div>
            ))}
          </div>
        ) : app.id === "tasks" ? (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-purple-300">Personalized Checklist ({memory.username})</div>
            {[
              "Review SEO audit report for Q3",
              "Approve WhatsApp AI automation webhook",
              "Schedule consultation call with RINADS expert",
            ].map((task, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTaskDone((prev) => ({ ...prev, [task]: !prev[task] }))}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-purple-500/20 bg-white/5 text-left text-xs transition-colors hover:bg-white/10"
              >
                <CheckCircle2
                  size={16}
                  className={taskDone[task] ? "text-emerald-400 shrink-0" : "text-white/30 shrink-0"}
                />
                <span className={taskDone[task] ? "line-through text-white/40" : "text-white/90"}>
                  {task}
                </span>
              </button>
            ))}
          </div>
        ) : app.id === "invoices" ? (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-purple-300">Billing & Receipts</div>
            <div className="p-3 rounded-2xl border border-purple-500/30 bg-purple-950/30">
              <div className="flex justify-between text-xs">
                <span className="text-white/70">Invoice #RIN-2026-88</span>
                <span className="font-bold text-emerald-400">Paid</span>
              </div>
              <div className="mt-2 text-base font-extrabold text-white">₹ 45,000</div>
              <div className="text-[10px] text-white/50">Custom Web App & ERP Module Setup</div>
            </div>
          </div>
        ) : app.id === "ai-tools" || app.id === "automations" ? (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-purple-300">Active RINADS Automations</div>
            <div className="p-2.5 rounded-xl border border-purple-500/20 bg-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                <span>RINPO Smart Auto-Responder</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="p-2.5 rounded-xl border border-purple-500/20 bg-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-purple-400" />
                <span>Lead Sync to WhatsApp & CRM</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
              <Sparkles size={14} />
              <span>Personalized for {memory.username}</span>
            </div>
            <p className="mt-1.5 text-xs text-white/70">
              This module integrates directly with RINADS Business Cloud. Access full customization via your dedicated client manager.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={() => handleAction(`Get full details on ${app.name}`)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9f4bc7] to-[#7a35a0] py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-900/40 hover:opacity-95 active:scale-[0.99] transition-all"
          >
            <span>Ask RINPO About {app.name}</span>
            <ArrowRight size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              addFavoriteService(app.name);
            }}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-purple-500/30 bg-white/5 py-2 text-xs font-semibold text-purple-200 hover:bg-white/10 transition-colors"
          >
            <span>{memory.favoriteServices.includes(app.name) ? "★ In Favorites" : "☆ Add to Quick Apps"}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

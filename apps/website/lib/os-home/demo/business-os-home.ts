import type {
  AttentionItem,
  OsHomeData,
  PulseMetric,
  RecentEntity,
  RinpoDailyBriefData,
  RoomSummary,
  WorkspaceStatusData,
} from "@/lib/os-home/types";

export function getDemoWorkspaceStatus(): WorkspaceStatusData {
  return {
    mode: "demo",
    organizationName: "Demo organisation",
    organizationStatus: "active",
    roleLabel: "Demo session",
    headline: "DEMO WORKSPACE",
    detail: "Sample data · actions are limited",
  };
}

export function getDemoAttentionItems(): AttentionItem[] {
  return [
    {
      id: "demo-leads",
      type: "lead_followup",
      label: "Leads waiting for follow-up",
      count: 12,
      href: "/os/customers",
      severity: "attention",
      source: "demo",
    },
    {
      id: "demo-tasks",
      type: "task_due",
      label: "Tasks due today",
      count: 3,
      href: "/os/work/tasks",
      severity: "attention",
      source: "demo",
    },
    {
      id: "demo-invoices",
      type: "invoice_overdue",
      label: "Invoices overdue",
      count: 2,
      href: "/os/money",
      severity: "critical",
      source: "demo",
    },
    {
      id: "demo-approvals",
      type: "approval",
      label: "Approvals waiting",
      count: 1,
      href: "/os/automate",
      severity: "neutral",
      source: "demo",
    },
  ];
}

export function getDemoPulseMetrics(): PulseMetric[] {
  return [
    {
      id: "demo-revenue",
      label: "Revenue",
      value: "₹4.8L",
      timeframe: "Last 30 days",
      source: "demo",
      comparison: "+12% vs previous period",
      href: "/os/money",
    },
    {
      id: "demo-pipeline",
      label: "Pipeline",
      value: "₹12.4L",
      timeframe: "Open opportunities",
      source: "demo",
      href: "/os/customers",
    },
    {
      id: "demo-projects",
      label: "Projects",
      value: "8 of 10 on track",
      timeframe: "Active work",
      source: "demo",
      href: "/os/work",
    },
    {
      id: "demo-receivables",
      label: "Receivables",
      value: "₹1.1L overdue",
      timeframe: "As of today",
      source: "demo",
      href: "/os/money",
    },
  ];
}

export function getDemoContinueWorking(): RecentEntity[] {
  return [
    {
      id: "demo-bhima",
      name: "Bhima Online Store",
      entityType: "project",
      entityTypeLabel: "Project",
      subtitle: "Updated 12 min ago",
      href: "/os/work/projects",
      source: "demo",
    },
    {
      id: "demo-brd",
      name: "BRD Automotive OS",
      entityType: "project",
      entityTypeLabel: "Project",
      subtitle: "3 tasks due",
      href: "/os/work",
      source: "demo",
    },
    {
      id: "demo-ambady",
      name: "Ambady Commerce",
      entityType: "workspace",
      entityTypeLabel: "Workspace",
      subtitle: "2 approvals waiting",
      href: "/os/automate",
      source: "demo",
    },
  ];
}

export function getDemoRooms(): RoomSummary[] {
  return [
    {
      id: "demo-core",
      name: "Core Product Team",
      description: "Design · Engineering · Growth",
      participantCount: 6,
      unreadCount: 0,
      live: true,
      liveLabel: "Live now",
      href: "/os/rooms",
      source: "demo",
    },
    {
      id: "demo-growth",
      name: "Subscription Growth",
      description: "Sprint retrospective",
      participantCount: 4,
      unreadCount: 3,
      live: false,
      href: "/os/rooms",
      source: "demo",
    },
    {
      id: "demo-strategy",
      name: "Product Strategy 2026",
      description: "Next review Thu 10:30 AM",
      participantCount: 8,
      unreadCount: 0,
      live: false,
      href: "/os/rooms",
      source: "demo",
    },
  ];
}

export function buildDemoBrief(attention: AttentionItem[]): RinpoDailyBriefData {
  const attentionCount = attention.reduce((sum, item) => sum + item.count, 0);
  return {
    summary:
      attentionCount > 0
        ? `${attention.length} areas need your attention (${attentionCount} items).`
        : "No urgent items in this sample workspace.",
    attentionCount,
    recommendations: [
      {
        id: "demo-rec-leads",
        text: "Follow up with high-intent leads",
        kind: "recommendation",
        href: "/os/customers",
        source: "demo",
      },
      {
        id: "demo-rec-tasks",
        text: "Review overdue client tasks",
        kind: "recommendation",
        href: "/os/work",
        source: "demo",
      },
      {
        id: "demo-rec-invoice",
        text: "Approve invoice reminder workflow",
        kind: "approval_required",
        href: "/os/automate",
        source: "demo",
      },
    ],
    source: "demo",
  };
}

export function getDemoOsHomeData(): OsHomeData {
  const attention = getDemoAttentionItems();
  return {
    workspace: getDemoWorkspaceStatus(),
    attention,
    brief: buildDemoBrief(attention),
    pulse: getDemoPulseMetrics(),
    continueWorking: getDemoContinueWorking(),
    rooms: getDemoRooms(),
    liveAttempted: false,
    errors: {},
  };
}

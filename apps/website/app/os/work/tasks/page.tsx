import { OsModuleBridge } from "@/components/os/OsModuleBridge";

export default function OsWorkTasksPage() {
  return (
    <main id="main">
      <OsModuleBridge
        config={{
          id: "work-tasks",
          title: "Tasks",
          summary:
            "First-class Business OS tasks are not available yet. Use Work destinations for supported queues.",
          destinations: [
            {
              id: "tasks-unavailable",
              label: "Business OS tasks",
              description: "In-shell task management is not available yet.",
              status: "unavailable",
            },
            {
              id: "work-overview",
              label: "Back to Work",
              description: "See available Work destinations.",
              href: "/os/work",
              status: "available",
              minTier: "client",
            },
          ],
        }}
      />
    </main>
  );
}

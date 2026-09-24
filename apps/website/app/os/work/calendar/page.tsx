import { OsModuleBridge } from "@/components/os/OsModuleBridge";

export default function OsWorkCalendarPage() {
  return (
    <main id="main">
      <OsModuleBridge
        config={{
          id: "work-calendar",
          title: "Calendar",
          summary: "Business OS calendar is not available yet.",
          destinations: [
            {
              id: "calendar-unavailable",
              label: "Business OS calendar",
              description: "Scheduling inside Business OS is not available yet.",
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

import { OsHomeContent } from "@/components/os/OsHomeContent";

/**
 * Home landing. Auth + tenant destination resolution run in `layout.tsx` for all `/os/*`.
 */
export default function OsHomePage() {
  return (
    <main id="main">
      <OsHomeContent />
    </main>
  );
}

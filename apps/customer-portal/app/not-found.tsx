import Link from "next/link";
import { EmptyState } from "@rinads/ui";

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The resource you requested does not exist or you do not have access."
      action={
        <Link href="/" className="text-sm font-medium text-rinads-primary hover:underline">
          Return to dashboard
        </Link>
      }
    />
  );
}

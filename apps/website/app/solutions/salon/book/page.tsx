import type { Metadata } from "next";
import Link from "next/link";
import { getPageMetadata } from "@/lib/cms";
import { getPublicSalonRepository } from "@/lib/salon-booking";
import { SalonBookingWizard } from "./SalonBookingWizard";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/solutions/salon/book");
}

type Props = {
  searchParams: Promise<{ org?: string }>;
};

function BookingShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-rinads-primary-darkest px-6 pb-24 pt-32 text-white md:px-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rinads-primary">RINADS Salon OS</p>
        <h1 className="mt-2 text-3xl font-black">Book an appointment</h1>
        {children}
      </div>
    </main>
  );
}

export default async function SalonBookingPage({ searchParams }: Props) {
  const { org } = await searchParams;

  if (!org) {
    return (
      <BookingShell>
        <p className="mt-6 text-white/70">
          Use the booking link shared by your salon (it looks like{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">/solutions/salon/book?org=your-salon</code>).
        </p>
        <Link href="/solutions/salon" className="mt-8 inline-block text-sm text-rinads-primary underline">
          Learn about RINADS Salon OS
        </Link>
      </BookingShell>
    );
  }

  const repo = await getPublicSalonRepository();
  const orgResult = await repo.getPublicOrganizationBySlug(org);

  if (!orgResult.ok) {
    return (
      <BookingShell>
        <p className="mt-6 text-white/70">We couldn&rsquo;t find a salon at this link. Double-check the URL with them.</p>
        <Link href="/solutions/salon" className="mt-8 inline-block text-sm text-rinads-primary underline">
          Learn about RINADS Salon OS
        </Link>
      </BookingShell>
    );
  }

  const { organizationId, name } = orgResult.data;

  const [branchesResult, servicesResult, staffResult] = await Promise.all([
    repo.getPublicBranches(organizationId),
    repo.getPublicServices(organizationId),
    repo.getPublicStaff(organizationId),
  ]);

  const branches = branchesResult.ok ? branchesResult.data : [];
  const services = servicesResult.ok ? servicesResult.data : [];
  const staff = staffResult.ok ? staffResult.data : [];

  if (!branches.length || !staff.length) {
    return (
      <BookingShell>
        <p className="mt-4 text-lg text-white/80">{name}</p>
        <p className="mt-6 text-white/70">Online booking isn&rsquo;t set up yet for this salon. Please contact them directly.</p>
      </BookingShell>
    );
  }

  return (
    <BookingShell>
      <p className="mt-4 text-lg text-white/80">{name}</p>
      <div className="mt-8">
        <SalonBookingWizard
          organizationId={organizationId}
          organizationName={name}
          branches={branches}
          services={services}
          staff={staff}
        />
      </div>
    </BookingShell>
  );
}

import { CompanyCustomerDetail } from "@/components/os/company/CompanyCustomerDetail";

type PageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function OsCustomerDetailPage({ params }: PageProps) {
  const { clientId } = await params;
  return (
    <main id="main">
      <CompanyCustomerDetail clientId={clientId} />
    </main>
  );
}

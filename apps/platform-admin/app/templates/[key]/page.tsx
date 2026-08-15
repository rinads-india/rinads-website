import Link from "next/link";
import { notFound } from "next/navigation";
import { listTemplatesAction } from "@/app/actions/templates";

export default async function TemplateDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const result = await listTemplatesAction();
  if (!result.ok) notFound();
  const template = result.templates.find((t) => t.key === key);
  if (!template) notFound();

  return (
    <div className="space-y-4">
      <Link href="/templates" className="text-sm text-muted-foreground">← Templates</Link>
      <h2 className="text-2xl font-semibold">{template.name}</h2>
      <p className="text-muted-foreground">{template.description}</p>
      <div className="card space-y-2 text-sm">
        <p><span className="text-muted-foreground">Key:</span> {template.key}</p>
        <p><span className="text-muted-foreground">Category:</span> {template.category}</p>
        <p><span className="text-muted-foreground">Published:</span> {template.isPublished ? "Yes" : "No"}</p>
      </div>
    </div>
  );
}

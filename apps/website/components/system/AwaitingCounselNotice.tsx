/**
 * Shared notice for legal/trust pages awaiting counsel-approved publication.
 * Do not invent binding policy text — this component is the honest stance.
 */
export function AwaitingCounselNotice({
  documentLabel = "This page",
}: {
  documentLabel?: string;
}) {
  return (
    <aside
      className="mb-10 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-200"
      role="status"
      aria-label="Publication status"
    >
      <p className="font-semibold uppercase tracking-[0.12em] text-amber-100/90">
        Awaiting counsel-approved publication
      </p>
      <p className="mt-2 leading-6">
        {documentLabel} is a placeholder structure pending final, counsel-approved legal copy. It is
        not yet a complete or binding legal document. Contact us for questions in the meantime.
      </p>
    </aside>
  );
}

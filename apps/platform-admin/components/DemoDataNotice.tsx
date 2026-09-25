export function DemoDataNotice({ workspace }: { workspace: string }) {
  return (
    <p className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-100">
      {workspace} is running in explicit development demo mode. This is not production data.
    </p>
  );
}

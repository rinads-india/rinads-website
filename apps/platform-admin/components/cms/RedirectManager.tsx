"use client";

import { useState, useTransition } from "react";
import { deleteCmsRedirectAction, saveCmsRedirectAction } from "@/app/actions/cms";
import type { SiteRedirect } from "@rinads/cms";

type RedirectManagerProps = {
  initialRows: SiteRedirect[];
};

export function RedirectManager({ initialRows }: RedirectManagerProps) {
  const [rows, setRows] = useState(initialRows);
  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");
  const [permanent, setPermanent] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <form
        className="card grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage(null);
          startTransition(async () => {
            const result = await saveCmsRedirectAction({ fromPath, toPath, permanent });
            if (!result.ok) {
              setMessage(result.error);
              return;
            }
            setRows((current) => [
              {
                id: `redirect_${Date.now()}`,
                fromPath,
                toPath,
                permanent,
                createdAt: new Date().toISOString(),
              },
              ...current.filter((row) => row.fromPath !== fromPath),
            ]);
            setFromPath("");
            setToPath("");
            setMessage("Redirect saved.");
          });
        }}
      >
        <label className="block space-y-1">
          <span className="text-sm font-medium">From path</span>
          <input
            value={fromPath}
            onChange={(event) => setFromPath(event.target.value)}
            placeholder="/old-path"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">To path</span>
          <input
            value={toPath}
            onChange={(event) => setToPath(event.target.value)}
            placeholder="/grow"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={permanent} onChange={(event) => setPermanent(event.target.checked)} />
          Permanent (301)
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-rinads-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60 sm:col-span-2 sm:w-fit"
        >
          Add redirect
        </button>
      </form>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Type</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.fromPath}</td>
                <td>{row.toPath}</td>
                <td>{row.permanent ? "301" : "302"}</td>
                <td>
                  <button
                    type="button"
                    className="text-sm text-red-400"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteCmsRedirectAction(row.id);
                        setRows((current) => current.filter((item) => item.id !== row.id));
                      })
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

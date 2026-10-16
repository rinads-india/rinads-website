import Link from "next/link";
import { loadJewelleryDashboard } from "../../../lib/jewellery";
import {
  createJewelleryAppointment,
  createJewelleryJobOrder,
  createOldGoldExchange,
  saveJewelleryItemProfile,
  setMetalRate,
} from "./actions";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-100";
const buttonClass =
  "rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400";
const panelClass = "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm";

function money(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function dateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function JewelleryPage() {
  const dashboard = await loadJewelleryDashboard();
  const disabled = dashboard.demo;
  const metrics = [
    ["Catalog variants", dashboard.metrics.totalVariants],
    ["Jewellery profiles", dashboard.metrics.profiledSkus],
    ["Profiles missing", dashboard.metrics.missingProfiles],
    ["Upcoming appointments", dashboard.metrics.upcomingAppointments],
    ["Active job work", dashboard.metrics.activeJobWork],
    ["Open old-gold", dashboard.metrics.openOldGold],
  ] as const;

  return (
    <main className="space-y-6 pb-12">
      <header className="flex flex-col gap-4 rounded-2xl bg-zinc-950 p-6 text-white lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide">
              Jewellery OS
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${dashboard.demo ? "bg-amber-300 text-amber-950" : "bg-emerald-300 text-emerald-950"}`}>
              {dashboard.demo ? "Demo data — writes disabled" : "Tenant-bound production data"}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Jewellery operations control</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
            Rate book, tagged jewellery inventory attributes, showroom appointments, old-gold assessment and karigar job work on the shared RINADS commerce and operations core.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/products" className="rounded-lg border border-white/20 px-3 py-2 hover:bg-white/10">Products</Link>
          <Link href="/inventory" className="rounded-lg border border-white/20 px-3 py-2 hover:bg-white/10">Inventory</Link>
          <Link href="/orders" className="rounded-lg border border-white/20 px-3 py-2 hover:bg-white/10">Orders</Link>
          <Link href="/fulfilment" className="rounded-lg border border-white/20 px-3 py-2 hover:bg-white/10">Fulfilment</Link>
        </div>
      </header>

      {dashboard.demo ? (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          This environment is running the demo tenant path. Jewellery OS write actions are intentionally blocked until a live Supabase tenant and the Jewellery OS migration are available.
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map(([label, value]) => (
          <article key={label} className={panelClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className={panelClass}>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-950">Metal rate book</h2>
            <p className="text-sm text-zinc-500">Record the showroom selling and buying rate used for pricing and exchange assessment.</p>
          </div>
          <form action={setMetalRate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <select name="metal_type" className={fieldClass} defaultValue="gold" disabled={disabled}>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="platinum">Platinum</option>
              <option value="palladium">Palladium</option>
              <option value="other">Other</option>
            </select>
            <input name="purity" className={fieldClass} placeholder="22K / 916" required disabled={disabled} />
            <input name="buy_rate_per_gram" type="number" step="0.01" min="0" className={fieldClass} placeholder="Buy / g" required disabled={disabled} />
            <input name="sell_rate_per_gram" type="number" step="0.01" min="0" className={fieldClass} placeholder="Sell / g" required disabled={disabled} />
            <button className={buttonClass} disabled={disabled}>Save rate</button>
            <input name="source" className={`${fieldClass} sm:col-span-2 lg:col-span-5`} placeholder="Source / note (optional)" disabled={disabled} />
          </form>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                <tr><th className="py-2">Metal</th><th>Purity</th><th>Buy/g</th><th>Sell/g</th><th>Effective</th><th>Source</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {dashboard.rates.map((rate) => (
                  <tr key={rate.id}>
                    <td className="py-2 font-medium capitalize">{rate.metal_type}</td>
                    <td>{rate.purity}</td>
                    <td>{money(rate.buy_rate_per_gram)}</td>
                    <td>{money(rate.sell_rate_per_gram)}</td>
                    <td>{dateTime(rate.effective_at)}</td>
                    <td>{rate.source ?? "—"}</td>
                  </tr>
                ))}
                {dashboard.rates.length === 0 ? <tr><td colSpan={6} className="py-6 text-center text-zinc-500">No metal rates recorded.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className={panelClass}>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-950">Showroom appointments</h2>
            <p className="text-sm text-zinc-500">Capture high-intent visits and assisted-selling appointments.</p>
          </div>
          <form action={createJewelleryAppointment} className="grid gap-3 sm:grid-cols-2">
            <input name="guest_name" className={fieldClass} placeholder="Customer name" disabled={disabled} />
            <input name="guest_phone" className={fieldClass} placeholder="Phone" disabled={disabled} />
            <input name="guest_email" type="email" className={fieldClass} placeholder="Email" disabled={disabled} />
            <input name="scheduled_at" type="datetime-local" className={fieldClass} required disabled={disabled} />
            <select name="purpose" className={fieldClass} defaultValue="showroom_visit" disabled={disabled}>
              <option value="showroom_visit">Showroom visit</option>
              <option value="bridal_consultation">Bridal consultation</option>
              <option value="custom_design">Custom design</option>
              <option value="collection_preview">Collection preview</option>
              <option value="service">Service / repair</option>
            </select>
            <button className={buttonClass} disabled={disabled}>Create appointment</button>
          </form>
          <div className="mt-5 space-y-2">
            {dashboard.appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-100 p-3 text-sm">
                <div><p className="font-medium text-zinc-950">{appointment.guest_name ?? appointment.guest_phone ?? "Customer"}</p><p className="text-zinc-500">{appointment.purpose.replaceAll("_", " ")} · {dateTime(appointment.scheduled_at)}</p></div>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium capitalize text-zinc-700">{appointment.status.replaceAll("_", " ")}</span>
              </div>
            ))}
            {dashboard.appointments.length === 0 ? <p className="py-4 text-sm text-zinc-500">No upcoming appointments.</p> : null}
          </div>
        </article>
      </section>

      <section className={panelClass}>
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Jewellery SKU profiles</h2>
            <p className="text-sm text-zinc-500">Extend shared product variants with tag, purity, weight and HUID attributes. The shared catalog remains the source for product identity and sale price.</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-zinc-950 underline underline-offset-4">Manage base catalog</Link>
        </div>
        <div className="space-y-3">
          {dashboard.items.slice(0, 20).map((item) => (
            <form action={saveJewelleryItemProfile} key={item.variantId} className="grid gap-3 rounded-xl border border-zinc-200 p-4 lg:grid-cols-12 lg:items-end">
              <input type="hidden" name="product_id" value={item.productId} />
              <input type="hidden" name="variant_id" value={item.variantId} />
              <div className="lg:col-span-3"><p className="font-medium text-zinc-950">{item.productName}</p><p className="text-xs text-zinc-500">{item.variantName} · {item.sku}</p></div>
              <label className="text-xs font-medium text-zinc-600 lg:col-span-2">Tag<input name="tag_number" className={`${fieldClass} mt-1`} defaultValue={item.tagNumber ?? ""} required disabled={disabled} /></label>
              <label className="text-xs font-medium text-zinc-600">Metal<select name="metal_type" className={`${fieldClass} mt-1`} defaultValue={item.metalType ?? "gold"} disabled={disabled}><option value="gold">Gold</option><option value="silver">Silver</option><option value="platinum">Platinum</option><option value="palladium">Palladium</option><option value="other">Other</option></select></label>
              <label className="text-xs font-medium text-zinc-600">Purity<input name="purity" className={`${fieldClass} mt-1`} defaultValue={item.purity ?? "22K"} required disabled={disabled} /></label>
              <label className="text-xs font-medium text-zinc-600">Gross g<input name="gross_weight_grams" type="number" min="0" step="0.001" className={`${fieldClass} mt-1`} defaultValue={item.grossWeightGrams ?? 0} required disabled={disabled} /></label>
              <label className="text-xs font-medium text-zinc-600">Net g<input name="net_metal_weight_grams" type="number" min="0" step="0.001" className={`${fieldClass} mt-1`} defaultValue={item.netMetalWeightGrams ?? 0} required disabled={disabled} /></label>
              <label className="text-xs font-medium text-zinc-600 lg:col-span-2">HUID<input name="huid" className={`${fieldClass} mt-1`} defaultValue={item.huid ?? ""} disabled={disabled} /></label>
              <input type="hidden" name="stone_weight_carat" value="0" /><input type="hidden" name="stone_value" value="0" /><input type="hidden" name="making_charge_type" value="fixed" /><input type="hidden" name="making_charge_value" value="0" /><input type="hidden" name="wastage_percent" value="0" />
              <button className={`${buttonClass} lg:col-span-1`} disabled={disabled}>Save</button>
            </form>
          ))}
          {dashboard.items.length === 0 ? <p className="py-8 text-center text-sm text-zinc-500">No shared catalog variants are available for this tenant yet.</p> : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className={panelClass}>
          <div className="mb-4"><h2 className="text-lg font-semibold text-zinc-950">Old-gold assessment</h2><p className="text-sm text-zinc-500">Create a draft exchange credit. Approval and application to an order remain controlled steps.</p></div>
          <form action={createOldGoldExchange} className="grid gap-3 sm:grid-cols-2">
            <input name="reference_number" className={fieldClass} placeholder="Reference e.g. OG-1001" required disabled={disabled} />
            <input name="assessed_purity" className={fieldClass} placeholder="Assessed purity" required disabled={disabled} />
            <input name="gross_weight_grams" type="number" min="0.001" step="0.001" className={fieldClass} placeholder="Gross weight g" required disabled={disabled} />
            <input name="net_weight_grams" type="number" min="0" step="0.001" className={fieldClass} placeholder="Net weight g" required disabled={disabled} />
            <input name="rate_per_gram" type="number" min="0" step="0.01" className={fieldClass} placeholder="Assessment rate / g" required disabled={disabled} />
            <input name="deduction_value" type="number" min="0" step="0.01" className={fieldClass} placeholder="Deduction ₹" disabled={disabled} />
            <button className={`${buttonClass} sm:col-span-2`} disabled={disabled}>Create draft assessment</button>
          </form>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500"><tr><th className="py-2">Reference</th><th>Purity</th><th>Net g</th><th>Credit</th><th>Status</th></tr></thead><tbody className="divide-y divide-zinc-100">{dashboard.oldGold.map((exchange) => <tr key={exchange.id}><td className="py-2 font-medium">{exchange.reference_number}</td><td>{exchange.assessed_purity}</td><td>{exchange.net_weight_grams}</td><td>{money(exchange.net_credit_value)}</td><td className="capitalize">{exchange.status}</td></tr>)}</tbody></table></div>
        </article>

        <article className={panelClass}>
          <div className="mb-4"><h2 className="text-lg font-semibold text-zinc-950">Karigar / goldsmith job work</h2><p className="text-sm text-zinc-500">Track issued metal, due dates and labour at job level. Supplier linkage and stock movements stay on the shared procurement/inventory core.</p></div>
          <form action={createJewelleryJobOrder} className="grid gap-3 sm:grid-cols-2">
            <input name="job_number" className={fieldClass} placeholder="Job number" required disabled={disabled} />
            <input name="description" className={fieldClass} placeholder="Description" disabled={disabled} />
            <select name="metal_type" className={fieldClass} defaultValue="gold" disabled={disabled}><option value="gold">Gold</option><option value="silver">Silver</option><option value="platinum">Platinum</option><option value="palladium">Palladium</option><option value="other">Other</option></select>
            <input name="purity" className={fieldClass} defaultValue="22K" placeholder="Purity" required disabled={disabled} />
            <input name="issued_weight_grams" type="number" min="0" step="0.001" className={fieldClass} placeholder="Issued metal g" disabled={disabled} />
            <input name="labour_charge" type="number" min="0" step="0.01" className={fieldClass} placeholder="Labour ₹" disabled={disabled} />
            <input name="due_at" type="datetime-local" className={fieldClass} disabled={disabled} />
            <button className={buttonClass} disabled={disabled}>Create job</button>
          </form>
          <div className="mt-5 space-y-2">{dashboard.jobOrders.map((job) => <div key={job.id} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-100 p-3 text-sm"><div><p className="font-medium text-zinc-950">{job.job_number} · {job.purity}</p><p className="text-zinc-500">Issued {job.issued_weight_grams} g · Received {job.received_weight_grams} g · Due {dateTime(job.due_at)}</p></div><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium capitalize text-zinc-700">{job.status.replaceAll("_", " ")}</span></div>)}</div>
        </article>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-950">Production boundary</p>
        <p className="mt-1 leading-6">Jewellery OS extends the shared RINADS catalog, customer, order, payment, fulfilment, inventory, audit and permissions layers. GST/e-invoice, BIS/HUID external verification and live bullion feeds require validated integrations and are not simulated here.</p>
      </section>
    </main>
  );
}

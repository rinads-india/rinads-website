import {
  createJewelleryAppointment,
  createJewelleryJobOrder,
  createOldGoldExchange,
  saveJewellerySkuProfile,
  setJewelleryAppointmentStatus,
  setJewelleryMetalRate,
  setOldGoldStatus,
  updateJewelleryJobOrder,
} from "./actions";
import { loadJewelleryOsData } from "@/lib/jewellery-os";

const panel = "rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur";
const field =
  "min-h-11 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-gray-950 outline-none transition focus:border-rinads-primary focus:ring-2 focus:ring-rinads-primary/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400";
const button =
  "min-h-11 rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300";
const secondaryButton =
  "min-h-10 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400";

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

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

export default async function JewelleryOsPage() {
  const data = await loadJewelleryOsData();
  const disabled = !data.live;
  const metrics = [
    ["Catalog variants", data.metrics.catalogVariants],
    ["Jewellery profiles", data.metrics.profiledSkus],
    ["Profiles missing", data.metrics.missingProfiles],
    ["Upcoming appointments", data.metrics.upcomingAppointments],
    ["Open old-gold", data.metrics.openOldGold],
    ["Active job work", data.metrics.activeJobWork],
  ] as const;

  return (
    <main id="main" className="space-y-6 pb-12">
      <section className="overflow-hidden rounded-[2rem] bg-black p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                RINADS Jewellery OS
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                  data.live ? "bg-emerald-300 text-emerald-950" : "bg-amber-300 text-amber-950"
                }`}
              >
                {data.live ? "Tenant-bound live data" : "Demo shell — writes disabled"}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Jewellery operations, connected to Business OS
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300 md:text-base">
              Control metal rates, tagged SKU attributes, showroom appointments, old-gold assessments and karigar job work without creating a second customer, order or inventory stack.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 xl:w-auto">
            <a href="/os/customers" className="rounded-2xl border border-white/15 px-3 py-2.5 text-center font-medium hover:bg-white/10">
              Customers
            </a>
            <a href="/os/work" className="rounded-2xl border border-white/15 px-3 py-2.5 text-center font-medium hover:bg-white/10">
              Work
            </a>
            <a href="/os/money" className="rounded-2xl border border-white/15 px-3 py-2.5 text-center font-medium hover:bg-white/10">
              Money
            </a>
            <a href="/os/automate" className="rounded-2xl border border-white/15 px-3 py-2.5 text-center font-medium hover:bg-white/10">
              Automate
            </a>
          </div>
        </div>
      </section>

      {!data.live ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Jewellery OS is visible in this non-production shell, but all mutations are disabled. Live writes require Supabase mode, an authenticated organization membership and the Jewellery OS database migration.
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map(([label, value]) => (
          <article key={label} className={panel}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 2xl:grid-cols-2">
        <article className={panel}>
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rinads-primary">Pricing input</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-950">Metal rate book</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Record effective buy and sell rates by metal and purity. Historical rows are retained instead of overwritten.
            </p>
          </div>

          <form action={setJewelleryMetalRate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <select name="metal_type" className={field} defaultValue="gold" disabled={disabled}>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="platinum">Platinum</option>
              <option value="palladium">Palladium</option>
              <option value="other">Other</option>
            </select>
            <input name="purity" className={field} placeholder="22K / 916" required disabled={disabled} />
            <input name="buy_rate_per_gram" type="number" min="0" step="0.01" className={field} placeholder="Buy ₹ / g" required disabled={disabled} />
            <input name="sell_rate_per_gram" type="number" min="0" step="0.01" className={field} placeholder="Sell ₹ / g" required disabled={disabled} />
            <button type="submit" className={button} disabled={disabled}>Save rate</button>
            <input name="source" className={`${field} sm:col-span-2 lg:col-span-5`} placeholder="Source / rate-board note (optional)" disabled={disabled} />
          </form>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-black/10 text-[11px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th className="py-2">Metal</th><th>Purity</th><th>Buy / g</th><th>Sell / g</th><th>Effective</th><th>Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {data.rates.map((rate) => (
                  <tr key={rate.id}>
                    <td className="py-3 font-medium capitalize">{rate.metal_type}</td>
                    <td>{rate.purity}</td>
                    <td>{money(rate.buy_rate_per_gram)}</td>
                    <td>{money(rate.sell_rate_per_gram)}</td>
                    <td>{dateTime(rate.effective_at)}</td>
                    <td>{rate.source ?? "—"}</td>
                  </tr>
                ))}
                {data.rates.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-500">No metal rates recorded.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className={panel}>
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rinads-primary">Assisted selling</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-950">Showroom appointments</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Capture high-intent visits, bridal consultations, custom design sessions and collection previews.
            </p>
          </div>

          <form action={createJewelleryAppointment} className="grid gap-3 sm:grid-cols-2">
            <input name="guest_name" className={field} placeholder="Customer name" disabled={disabled} />
            <input name="guest_phone" className={field} placeholder="Phone" disabled={disabled} />
            <input name="guest_email" type="email" className={field} placeholder="Email" disabled={disabled} />
            <input name="scheduled_at" type="datetime-local" className={field} required disabled={disabled} />
            <select name="purpose" className={field} defaultValue="showroom_visit" disabled={disabled}>
              <option value="showroom_visit">Showroom visit</option>
              <option value="bridal_consultation">Bridal consultation</option>
              <option value="custom_design">Custom design</option>
              <option value="collection_preview">Collection preview</option>
              <option value="service">Service / repair</option>
            </select>
            <button type="submit" className={button} disabled={disabled}>Create appointment</button>
          </form>

          <div className="mt-5 space-y-2">
            {data.appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border border-black/5 bg-white/70 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-950">{appointment.guest_name ?? appointment.guest_phone ?? "Customer"}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {humanize(appointment.purpose)} · {dateTime(appointment.scheduled_at)}
                    </p>
                  </div>
                  <form action={setJewelleryAppointmentStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={appointment.id} />
                    <select name="status" defaultValue={appointment.status} className={`${field} min-w-36`} disabled={disabled}>
                      <option value="scheduled">Scheduled</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no_show">No show</option>
                    </select>
                    <button type="submit" className={secondaryButton} disabled={disabled}>Update</button>
                  </form>
                </div>
              </div>
            ))}
            {data.appointments.length === 0 ? <p className="py-6 text-sm text-gray-500">No upcoming appointments.</p> : null}
          </div>
        </article>
      </section>

      <section className={panel}>
        <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rinads-primary">Catalog extension</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-950">Jewellery SKU profiles</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
              The shared RINADS product variant remains the commercial SKU. Jewellery OS adds tag, metal, purity, weights, making, stones and HUID metadata without duplicating the catalog.
            </p>
          </div>
          <p className="text-xs text-gray-500">Showing up to {Math.min(data.skus.length, 30)} of {data.skus.length} variants</p>
        </div>

        <div className="space-y-3">
          {data.skus.slice(0, 30).map((item) => (
            <form action={saveJewellerySkuProfile} key={item.variantId} className="grid gap-3 rounded-2xl border border-black/5 bg-white/65 p-4 lg:grid-cols-12 lg:items-end">
              <input type="hidden" name="product_id" value={item.productId} />
              <input type="hidden" name="variant_id" value={item.variantId} />
              <div className="lg:col-span-3">
                <p className="font-medium text-gray-950">{item.productName}</p>
                <p className="mt-0.5 text-xs text-gray-500">{item.variantName} · {item.sku} · {money(item.price)}</p>
              </div>
              <label className="text-xs font-medium text-gray-600 lg:col-span-2">
                Tag number
                <input name="tag_number" className={`${field} mt-1`} defaultValue={item.tagNumber ?? ""} required disabled={disabled} />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Metal
                <select name="metal_type" className={`${field} mt-1`} defaultValue={item.metalType ?? "gold"} disabled={disabled}>
                  <option value="gold">Gold</option><option value="silver">Silver</option><option value="platinum">Platinum</option><option value="palladium">Palladium</option><option value="other">Other</option>
                </select>
              </label>
              <label className="text-xs font-medium text-gray-600">
                Purity
                <input name="purity" className={`${field} mt-1`} defaultValue={item.purity ?? "22K"} required disabled={disabled} />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Gross g
                <input name="gross_weight_grams" type="number" min="0" step="0.001" className={`${field} mt-1`} defaultValue={item.grossWeightGrams ?? 0} required disabled={disabled} />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Net g
                <input name="net_metal_weight_grams" type="number" min="0" step="0.001" className={`${field} mt-1`} defaultValue={item.netMetalWeightGrams ?? 0} required disabled={disabled} />
              </label>
              <label className="text-xs font-medium text-gray-600 lg:col-span-2">
                HUID
                <input name="huid" className={`${field} mt-1`} defaultValue={item.huid ?? ""} disabled={disabled} />
              </label>
              <input type="hidden" name="stone_weight_carat" value="0" />
              <input type="hidden" name="stone_value" value="0" />
              <input type="hidden" name="making_charge_type" value="fixed" />
              <input type="hidden" name="making_charge_value" value="0" />
              <input type="hidden" name="wastage_percent" value="0" />
              <button type="submit" className={`${button} lg:col-span-1`} disabled={disabled}>Save</button>
            </form>
          ))}
          {data.skus.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-gray-500">
              This organization has no shared catalog variants yet. Create/import the base catalog before attaching jewellery attributes.
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-2">
        <article className={panel}>
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rinads-primary">Exchange workflow</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-950">Old-gold assessment</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Calculate a draft credit server-side, then approve or cancel it. Applying the approved credit to an order remains a separate governed step.
            </p>
          </div>

          <form action={createOldGoldExchange} className="grid gap-3 sm:grid-cols-2">
            <input name="reference_number" className={field} placeholder="Reference e.g. OG-1001" required disabled={disabled} />
            <input name="assessed_purity" className={field} placeholder="Assessed purity" required disabled={disabled} />
            <input name="gross_weight_grams" type="number" min="0.001" step="0.001" className={field} placeholder="Gross weight g" required disabled={disabled} />
            <input name="net_weight_grams" type="number" min="0" step="0.001" className={field} placeholder="Net weight g" required disabled={disabled} />
            <input name="rate_per_gram" type="number" min="0" step="0.01" className={field} placeholder="Assessment rate ₹ / g" required disabled={disabled} />
            <input name="deduction_value" type="number" min="0" step="0.01" className={field} placeholder="Deduction ₹" disabled={disabled} />
            <button type="submit" className={`${button} sm:col-span-2`} disabled={disabled}>Create draft assessment</button>
          </form>

          <div className="mt-5 space-y-2">
            {data.oldGold.map((exchange) => (
              <div key={exchange.id} className="rounded-2xl border border-black/5 bg-white/65 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-950">{exchange.reference_number} · {exchange.assessed_purity}</p>
                    <p className="mt-0.5 text-xs text-gray-500">Net {exchange.net_weight_grams} g · Credit {money(exchange.net_credit_value)} · {humanize(exchange.status)}</p>
                  </div>
                  <form action={setOldGoldStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={exchange.id} />
                    <select name="status" className={`${field} min-w-32`} defaultValue={exchange.status} disabled={disabled}>
                      <option value="draft">Draft</option>
                      <option value="approved">Approved</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button type="submit" className={secondaryButton} disabled={disabled}>Update</button>
                  </form>
                </div>
              </div>
            ))}
            {data.oldGold.length === 0 ? <p className="py-6 text-sm text-gray-500">No open old-gold assessments.</p> : null}
          </div>
        </article>

        <article className={panel}>
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rinads-primary">Manufacturing / repair</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-950">Karigar / goldsmith job work</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Track issued metal, received weight, wastage and labour by job. Final inventory posting must go through the shared stock-movement ledger.
            </p>
          </div>

          <form action={createJewelleryJobOrder} className="grid gap-3 sm:grid-cols-2">
            <input name="job_number" className={field} placeholder="Job number" required disabled={disabled} />
            <input name="description" className={field} placeholder="Description" disabled={disabled} />
            <select name="metal_type" className={field} defaultValue="gold" disabled={disabled}>
              <option value="gold">Gold</option><option value="silver">Silver</option><option value="platinum">Platinum</option><option value="palladium">Palladium</option><option value="other">Other</option>
            </select>
            <input name="purity" className={field} defaultValue="22K" placeholder="Purity" required disabled={disabled} />
            <input name="issued_weight_grams" type="number" min="0" step="0.001" className={field} placeholder="Issued metal g" disabled={disabled} />
            <input name="labour_charge" type="number" min="0" step="0.01" className={field} placeholder="Labour ₹" disabled={disabled} />
            <input name="due_at" type="datetime-local" className={field} disabled={disabled} />
            <button type="submit" className={button} disabled={disabled}>Create job</button>
          </form>

          <div className="mt-5 space-y-2">
            {data.jobOrders.map((job) => (
              <div key={job.id} className="rounded-2xl border border-black/5 bg-white/65 p-3">
                <div className="mb-3">
                  <p className="font-medium text-gray-950">{job.job_number} · {job.purity}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Issued {job.issued_weight_grams} g · Received {job.received_weight_grams} g · Labour {money(job.labour_charge)} · Due {dateTime(job.due_at)}
                  </p>
                </div>
                <form action={updateJewelleryJobOrder} className="grid gap-2 sm:grid-cols-4">
                  <input type="hidden" name="id" value={job.id} />
                  <select name="status" className={field} defaultValue={job.status} disabled={disabled}>
                    <option value="draft">Draft</option><option value="issued">Issued</option><option value="in_progress">In progress</option><option value="received">Received</option><option value="closed">Closed</option><option value="cancelled">Cancelled</option>
                  </select>
                  <input name="received_weight_grams" type="number" min="0" step="0.001" className={field} defaultValue={job.received_weight_grams} placeholder="Received g" disabled={disabled} />
                  <input name="wastage_weight_grams" type="number" min="0" step="0.001" className={field} defaultValue="0" placeholder="Wastage g" disabled={disabled} />
                  <button type="submit" className={secondaryButton} disabled={disabled}>Update job</button>
                </form>
              </div>
            ))}
            {data.jobOrders.length === 0 ? <p className="py-6 text-sm text-gray-500">No active job work.</p> : null}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-black/10 bg-gray-50 p-5 text-sm leading-6 text-gray-700">
        <p className="font-semibold text-gray-950">Production boundary</p>
        <p className="mt-1">
          Jewellery OS extends the shared RINADS tenant, catalog, customer, order, payment, fulfilment, procurement and inventory architecture. HUID values are stored as business metadata and are not presented as externally BIS-verified. Live bullion feeds, GST/e-invoice validation, hardware integrations and autonomous RINPO actions remain gated integrations rather than simulated features.
        </p>
      </section>
    </main>
  );
}

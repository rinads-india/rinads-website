"use client";

import { generateDaySlots, type SalonBranch, type SalonService, type SalonStaff, type TimeRange } from "@rinads/salon";
import { useEffect, useMemo, useRef, useState } from "react";
import { localMidnightUtc } from "@/lib/salon-booking-tz";
import { createBookingAction, getBusySlotsAction, getEligibleStaffAction, type CreateBookingResult } from "./actions";

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `booking-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type Props = {
  organizationId: string;
  organizationName: string;
  branches: SalonBranch[];
  services: SalonService[];
  staff: SalonStaff[];
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "border-rinads-primary bg-rinads-primary text-white"
          : "border-white/15 bg-white/5 text-white/80 hover:border-white/30"
      }`}
    >
      {children}
    </button>
  );
}

export function SalonBookingWizard({ organizationId, organizationName, branches, services, staff }: Props) {
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [date, setDate] = useState(todayDateString());

  const [slots, setSlots] = useState<TimeRange[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeRange | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateBookingResult | null>(null);

  const [eligibleStaffIds, setEligibleStaffIds] = useState<string[] | null>(null);
  const idempotencyKeyRef = useRef(generateIdempotencyKey());

  const branch = branches.find((b) => b.id === branchId);
  const branchStaff = useMemo(() => {
    const atBranch = staff.filter((s) => !s.branchId || s.branchId === branchId);
    if (eligibleStaffIds === null) return atBranch;
    return atBranch.filter((s) => eligibleStaffIds.includes(s.id));
  }, [staff, branchId, eligibleStaffIds]);
  const staffId = useMemo(() => {
    if (selectedStaffId && branchStaff.some((s) => s.id === selectedStaffId)) return selectedStaffId;
    return branchStaff[0]?.id ?? "";
  }, [selectedStaffId, branchStaff]);
  const selectedStaff = branchStaff.find((s) => s.id === staffId);
  const totalDurationMin = useMemo(
    () => services.filter((s) => serviceIds.includes(s.id)).reduce((sum, s) => sum + s.durationMin, 0),
    [services, serviceIds]
  );
  const totalBufferMin = useMemo(
    () => services.filter((s) => serviceIds.includes(s.id)).reduce((sum, s) => sum + s.bufferMin, 0),
    [services, serviceIds]
  );
  const totalPrice = useMemo(
    () => services.filter((s) => serviceIds.includes(s.id)).reduce((sum, s) => sum + s.price, 0),
    [services, serviceIds]
  );
  const currency = services[0]?.currency ?? "INR";

  // Which staff can perform every selected service — re-checked whenever
  // the service selection changes so an ineligible stylist is never shown
  // (or silently swapped out from under the customer mid-selection).
  useEffect(() => {
    let cancelled = false;
    async function loadEligibility() {
      if (!serviceIds.length) {
        setEligibleStaffIds(null);
        return;
      }
      const res = await getEligibleStaffAction(serviceIds);
      if (!cancelled && res.ok) setEligibleStaffIds(res.staffIds);
    }
    void loadEligibility();
    return () => {
      cancelled = true;
    };
  }, [serviceIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadSlots() {
      setSelectedSlot(null);
      if (!staffId || !branch || totalDurationMin <= 0) {
        setSlots([]);
        return;
      }

      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const dayStartUtc = localMidnightUtc(date, branch.timezone);
        const dayEndUtc = new Date(dayStartUtc.getTime() + 24 * 60 * 60 * 1000);
        const res = await getBusySlotsAction(organizationId, staffId, dayStartUtc.toISOString(), dayEndUtc.toISOString());
        if (cancelled) return;
        if (!res.ok) {
          setSlotsError(res.error);
          setSlots([]);
          return;
        }
        const generated = generateDaySlots({
          dayStartUtc,
          workingHours: branch.workingHours,
          staffWorkingHours: selectedStaff?.workingHours,
          serviceDurationMin: totalDurationMin,
          bufferMin: totalBufferMin,
          stepMin: 15,
          busy: res.busy,
          now: new Date(),
        });
        setSlots(generated);
      } catch {
        if (!cancelled) setSlotsError("Could not load availability. Please try again.");
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    }

    void loadSlots();
    return () => {
      cancelled = true;
    };
  }, [organizationId, staffId, branch, date, totalDurationMin, totalBufferMin, selectedStaff]);

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleConfirm() {
    if (!branch || !staffId || !selectedSlot || !phone.trim()) return;
    setSubmitting(true);
    const res = await createBookingAction({
      organizationId,
      branchId: branch.id,
      staffId,
      serviceIds,
      startsAt: selectedSlot.start,
      customerPhone: phone,
      customerName: name,
      customerEmail: email,
      idempotencyKey: idempotencyKeyRef.current,
    });
    setSubmitting(false);
    setResult(res);
    // A fresh key is only needed if the customer goes on to submit a
    // different booking later in the same session — a failed/retried
    // submit of *this* booking should keep replaying safely.
    if (res.ok) idempotencyKeyRef.current = generateIdempotencyKey();
  }

  if (result?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-8 text-center">
        <h2 className="text-xl font-semibold text-white">Booking confirmed</h2>
        <p className="mt-2 text-sm text-white/70">
          {organizationName} will see you at {branch?.name} on{" "}
          <span className="font-medium text-white">
            {new Date(result.startsAt).toLocaleString("en-IN", {
              weekday: "long",
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          .
        </p>
        <p className="mt-4 text-xs text-white/50">Booking reference: {result.bookingNumber ?? result.appointmentId}</p>
      </div>
    );
  }

  let stepNumber = 0;
  const nextStep = () => ++stepNumber;

  return (
    <div className="space-y-8">
      {branches.length > 1 ? (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{nextStep()}. Choose a branch</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {branches.map((b) => (
              <Chip key={b.id} active={branchId === b.id} onClick={() => setBranchId(b.id)}>
                {b.name}
              </Chip>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{nextStep()}. Choose services</p>
        {services.length === 0 ? (
          <p className="mt-2 text-sm text-white/60">No services are published yet.</p>
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {services.map((s) => (
              <label
                key={s.id}
                className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 transition ${
                  serviceIds.includes(s.id)
                    ? "border-rinads-primary bg-rinads-primary/10"
                    : "border-white/10 bg-white/5 hover:border-white/25"
                }`}
              >
                <input
                  type="checkbox"
                  checked={serviceIds.includes(s.id)}
                  onChange={() => toggleService(s.id)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium text-white">{s.name}</span>
                  <span className="block text-xs text-white/50">
                    {s.durationMin} min · {s.currency} {s.price.toLocaleString("en-IN")}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{nextStep()}. Choose a stylist</p>
        {branchStaff.length === 0 ? (
          <p className="mt-2 text-sm text-white/60">No stylists are available at this branch yet.</p>
        ) : (
          <select
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
            value={staffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
          >
            {branchStaff.map((s) => (
              <option key={s.id} value={s.id} className="bg-black">
                {s.displayName}
                {s.specialties.length ? ` — ${s.specialties.join(", ")}` : ""}
              </option>
            ))}
          </select>
        )}
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{nextStep()}. Pick a date &amp; time</p>
        <input
          type="date"
          className="mt-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          value={date}
          min={todayDateString()}
          onChange={(e) => setDate(e.target.value)}
        />
        <div className="mt-3">
          {serviceIds.length === 0 ? (
            <p className="text-sm text-white/50">Choose at least one service to see available times.</p>
          ) : slotsLoading ? (
            <p className="text-sm text-white/50">Loading available times…</p>
          ) : slotsError ? (
            <p className="text-sm text-red-400">{slotsError}</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-white/50">No available times on this day. Try another date.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <Chip key={slot.start} active={selectedSlot?.start === slot.start} onClick={() => setSelectedSlot(slot)}>
                  {formatTime(slot.start)}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedSlot ? (
        <section className="rounded-xl border border-rinads-primary/30 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{nextStep()}. Your details</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
              placeholder="Phone number"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary sm:col-span-2"
              placeholder="Email (optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {totalDurationMin > 0 ? (
            <p className="mt-3 text-sm text-white/60">
              {formatTime(selectedSlot.start)} · {totalDurationMin} min · {currency} {totalPrice.toLocaleString("en-IN")}
            </p>
          ) : null}
          {result && !result.ok ? <p className="mt-2 text-sm text-red-400">{result.error}</p> : null}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !phone.trim()}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Confirming…" : "Confirm booking"}
          </button>
        </section>
      ) : null}
    </div>
  );
}

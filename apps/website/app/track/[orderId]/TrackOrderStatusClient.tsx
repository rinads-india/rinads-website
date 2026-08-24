"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPublicOrderStatusAction } from "@/app/services/actions";
import type { PublicOrderStatus } from "@/lib/services/types";

const POLL_STATUSES = new Set(["pending", "paid"]);

type Props = {
  initialOrder: PublicOrderStatus;
};

export function TrackOrderStatusClient({ initialOrder }: Props) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    if (!POLL_STATUSES.has(order.status)) return;

    const interval = window.setInterval(() => {
      void getPublicOrderStatusAction(order.orderId).then((result) => {
        if (!result.ok) return;
        setOrder(result.order);
        if (!POLL_STATUSES.has(result.order.status)) {
          router.refresh();
        }
      });
    }, 4000);

    return () => window.clearInterval(interval);
  }, [order.orderId, order.status, router]);

  return (
    <>
      <div>
        <p className="text-xs text-white/50">Status</p>
        <p className="capitalize">{order.status.replace(/_/g, " ")}</p>
      </div>
      <div>
        <p className="mb-2 text-xs text-white/50">Progress</p>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-rinads-primary transition-all"
            style={{ width: `${order.progressPct}%` }}
          />
        </div>
        <p className="mt-1 text-sm text-white/50">{order.progressPct}%</p>
      </div>
    </>
  );
}

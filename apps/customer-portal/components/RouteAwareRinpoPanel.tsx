"use client";

import { usePathname } from "next/navigation";
import { RinpoPanel } from "./RinpoPanel";

export function RouteAwareRinpoPanel() {
  const pathname = usePathname();
  const orderMatch = pathname.match(/^\/orders\/([^/]+)$/);
  const orderId = orderMatch?.[1];

  return <RinpoPanel route={pathname} orderId={orderId} />;
}

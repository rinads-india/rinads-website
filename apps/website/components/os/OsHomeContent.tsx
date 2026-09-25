"use client";

import type { OsHomeData } from "@/lib/os-home/types";
import { OsHomeCommandCentre } from "@/components/os/home/OsHomeCommandCentre";

export function OsHomeContent({ data }: { data: OsHomeData }) {
  return <OsHomeCommandCentre data={data} />;
}

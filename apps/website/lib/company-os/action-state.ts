export type OsActionState = {
  status: "idle" | "executed" | "approval_required" | "denied" | "failed" | "rejected";
  message: string;
  actionId?: string;
  replayed?: boolean;
};

export const IDLE: OsActionState = { status: "idle", message: "" };

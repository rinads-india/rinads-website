import {
  resolvePhoneApps,
  validateRinpoRuntimeContext,
  type RinpoPhoneAppDefinition,
  type RinpoPhoneHomeApp,
  type RinpoPhonePlatform,
  type RinpoRuntimeContext,
  type RinpoWorkspaceType,
} from "../../../../packages/runtime/src/rinpo-phone";

export const RINPO_PHONE_WEB_APPS: readonly RinpoPhoneAppDefinition[] = [
  {
    id: "phone.today",
    slug: "today",
    name: "Today",
    description: "Your operational briefing, priorities and next actions.",
    category: "core",
    status: "available",
    entry: { type: "web", route: "/phone?tab=today" },
    pinned: true,
    position: 10,
  },
  {
    id: "phone.ask-rinpo",
    slug: "ask-rinpo",
    name: "Ask RINPO",
    description: "Open the governed RINPO assistant experience.",
    category: "core",
    status: "available",
    entry: { type: "web", route: "/rinpo/live" },
    pinned: true,
    position: 20,
  },
  {
    id: "phone.work",
    slug: "work",
    name: "Work",
    description: "Open the current organisation or client workspace.",
    category: "business",
    status: "available",
    entry: { type: "web", route: "/os/work" },
    visibility: {
      workspaceTypes: ["organisation", "client"],
      roles: ["founder", "super_admin", "admin", "manager", "staff", "client", "viewer"],
    },
    pinned: true,
    position: 30,
  },
  {
    id: "phone.apps",
    slug: "apps",
    name: "Apps",
    description: "Role-aware RINADS apps available in the current workspace.",
    category: "core",
    status: "preview",
    entry: { type: "web", route: "/phone?tab=apps" },
    pinned: true,
    position: 40,
  },
  {
    id: "phone.world",
    slug: "world",
    name: "World",
    description: "Governed bridge into RINADS WORLD experiences.",
    category: "world",
    status: "preview",
    entry: { type: "world", route: "/phone?tab=world" },
    pinned: true,
    position: 50,
  },
  {
    id: "phone.settings",
    slug: "settings",
    name: "Settings",
    description: "Identity, workspace, privacy and device controls.",
    category: "core",
    status: "preview",
    entry: { type: "web", route: "/phone?tab=settings" },
    pinned: true,
    position: 60,
  },
] as const;

export type RinpoPhoneHomeInput = {
  userId: string;
  rinpoId: string;
  workspaceId: string;
  workspaceType: RinpoWorkspaceType;
  tenantId: string | null;
  roleIds: string[];
  permissionIds: string[];
  planId?: string | null;
  deviceId: string;
  platform?: RinpoPhonePlatform;
  requestId: string;
  sessionId: string;
};

export type RinpoPhoneHomePayload = {
  workspace: {
    id: string;
    type: RinpoWorkspaceType;
    tenantId: string | null;
    roles: string[];
  };
  apps: RinpoPhoneHomeApp[];
};

export function buildRinpoPhoneRuntimeContext(
  input: RinpoPhoneHomeInput,
): RinpoRuntimeContext {
  return {
    requestId: input.requestId,
    actor: {
      userId: input.userId,
      rinpoId: input.rinpoId,
    },
    workspace: {
      workspaceId: input.workspaceId,
      workspaceType: input.workspaceType,
      tenantId: input.tenantId,
      roleIds: input.roleIds,
      permissionIds: input.permissionIds,
      planId: input.planId ?? null,
    },
    device: {
      deviceId: input.deviceId,
      platform: input.platform ?? "web",
      appVersion: "m1-web-shell",
    },
    experience: {
      appId: "rinpo-phone",
      route: "/phone",
      sessionId: input.sessionId,
    },
    runtime: {
      allowedTools: [],
      memoryScopes: input.tenantId ? [`tenant:${input.tenantId}`] : ["personal"],
      confirmationPolicy: "default",
    },
  };
}

export function resolveRinpoPhoneHome(
  input: RinpoPhoneHomeInput,
): RinpoPhoneHomePayload {
  const context = buildRinpoPhoneRuntimeContext(input);
  const validation = validateRinpoRuntimeContext(context);
  if (!validation.ok) {
    throw new Error(`Invalid RINPO Phone runtime context: ${validation.errors.join("; ")}`);
  }

  return {
    workspace: {
      id: context.workspace.workspaceId,
      type: context.workspace.workspaceType,
      tenantId: context.workspace.tenantId,
      roles: context.workspace.roleIds,
    },
    apps: resolvePhoneApps({ context, apps: [...RINPO_PHONE_WEB_APPS] }),
  };
}

import type {
  RinpoPhoneAppDefinition,
  RinpoPhoneHomeApp,
  RinpoRuntimeContext,
} from "./types";

export interface ResolvePhoneAppsInput {
  context: RinpoRuntimeContext;
  apps: RinpoPhoneAppDefinition[];
}

function includesAny(required: string[] | undefined, actual: string[]): boolean {
  if (!required || required.length === 0) return true;
  return required.some((value) => actual.includes(value));
}

function includesAll(required: string[] | undefined, actual: string[]): boolean {
  if (!required || required.length === 0) return true;
  return required.every((value) => actual.includes(value));
}

export function canAccessRinpoPhoneApp(
  app: RinpoPhoneAppDefinition,
  context: RinpoRuntimeContext
): boolean {
  if (app.status === "disabled") return false;

  const visibility = app.visibility;
  if (visibility?.workspaceTypes && !visibility.workspaceTypes.includes(context.workspace.workspaceType)) {
    return false;
  }
  if (visibility?.platforms && !visibility.platforms.includes(context.device.platform)) {
    return false;
  }
  if (!includesAny(visibility?.roles, context.workspace.roleIds)) {
    return false;
  }
  if (visibility?.plans?.length) {
    const planId = context.workspace.planId;
    if (!planId || !visibility.plans.includes(planId)) return false;
  }
  if (!includesAll(app.requiredPermissions, context.workspace.permissionIds)) {
    return false;
  }

  return true;
}

export function resolvePhoneApps({ context, apps }: ResolvePhoneAppsInput): RinpoPhoneHomeApp[] {
  return apps
    .filter((app) => canAccessRinpoPhoneApp(app, context))
    .map((app) => ({
      id: app.id,
      slug: app.slug,
      name: app.name,
      route: app.entry.route,
      category: app.category,
      pinned: app.pinned ?? false,
      position: app.position ?? 999,
    }))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (a.position !== b.position) return a.position - b.position;
      return a.name.localeCompare(b.name);
    });
}

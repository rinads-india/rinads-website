export type RinpoPhonePlatform =
  | "web"
  | "ios"
  | "android"
  | "macos"
  | "windows"
  | "watchos"
  | "wearos"
  | "tvos"
  | "androidtv"
  | "world"
  | "playstation";

export type RinpoWorkspaceType =
  | "personal"
  | "organisation"
  | "client"
  | "world";

export type RinpoAppEntryType = "native" | "web" | "module" | "world";

export type RinpoRiskLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type RinpoConfirmationMode = "none" | "confirm" | "biometric" | "mfa";

export interface RinpoPhoneAppDefinition {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category:
    | "core"
    | "business"
    | "communication"
    | "commerce"
    | "world"
    | "learning";
  status: "available" | "pilot" | "preview" | "roadmap" | "disabled";
  entry: {
    type: RinpoAppEntryType;
    route: string;
  };
  visibility?: {
    workspaceTypes?: RinpoWorkspaceType[];
    roles?: string[];
    plans?: string[];
    platforms?: RinpoPhonePlatform[];
  };
  requiredPermissions?: string[];
  capabilities?: string[];
  memoryScopes?: string[];
  tools?: string[];
  pinned?: boolean;
  position?: number;
}

export interface RinpoRuntimeContext {
  requestId: string;
  actor: {
    userId: string;
    rinpoId: string;
  };
  workspace: {
    workspaceId: string;
    workspaceType: RinpoWorkspaceType;
    tenantId: string | null;
    roleIds: string[];
    permissionIds: string[];
    planId?: string | null;
  };
  device: {
    deviceId: string;
    platform: RinpoPhonePlatform;
    appVersion: string;
  };
  experience: {
    appId: string;
    route: string;
    sessionId: string;
  };
  runtime: {
    allowedTools: string[];
    memoryScopes: string[];
    confirmationPolicy: string;
  };
}

export interface RinpoApprovalPolicy {
  level: RinpoRiskLevel;
  title: string;
  summary: string;
  consequences?: string[];
  authenticationRequired: RinpoConfirmationMode;
}

export interface RinpoPhoneHomeApp {
  id: string;
  slug: string;
  name: string;
  route: string;
  category: RinpoPhoneAppDefinition["category"];
  pinned: boolean;
  position: number;
}

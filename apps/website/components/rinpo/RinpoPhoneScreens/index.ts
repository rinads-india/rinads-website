export { RinpoChat } from "./RinpoChat";
export { ClientPortal } from "./ClientPortal";
export { SearchServices } from "./SearchServices";
export { Support } from "./Support";
export { PlansReminders } from "./PlansReminders";
export { PhoneHomeScreen } from "./PhoneHomeScreen";
export { QuickActionsScreen, NotificationsScreen, ProfileMemoryScreen } from "./PhoneExtraScreens";
export { PhoneWorldScreen, PhoneSettingsScreen } from "./PhoneWorldSettingsScreens";

export type PhoneScreenId =
  | "chat"
  | "home"
  | "quick-actions"
  | "notifications"
  | "profile"
  | "portal"
  | "services"
  | "support"
  | "plans"
  | "today"
  | "ask"
  | "actions"
  | "approvals"
  | "work"
  | "customers"
  | "money"
  | "growth"
  | "world"
  | "settings"
  | "apps";

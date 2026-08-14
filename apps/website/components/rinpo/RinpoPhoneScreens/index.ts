export { RinpoChat } from "./RinpoChat";
export { ClientPortal } from "./ClientPortal";
export { SearchServices } from "./SearchServices";
export { Support } from "./Support";
export { PlansReminders } from "./PlansReminders";
export { PhoneHomeScreen } from "./PhoneHomeScreen";
export { QuickActionsScreen, NotificationsScreen, ProfileMemoryScreen } from "./PhoneExtraScreens";

export type PhoneScreenId =
  | "chat"
  | "home"
  | "quick-actions"
  | "notifications"
  | "profile"
  | "portal"
  | "services"
  | "support"
  | "plans";

export type {
  AuthProvider,
  AuthUser,
  AuthSession,
  AuthConfig,
  SignInWithPasswordInput,
  SignUpInput,
} from "./types";
export {
  resolveAuthConfig,
  isSupabaseAuthReady,
  ProductionEnvContractError,
  assertProductionEnvContract,
  checkProductionEnvContract,
  renderProductionEnvContractUnavailablePage,
  type ProductionEnvContractResult,
} from "./config";
export { mapSupabaseUser, mapSupabaseSession } from "./mappers";
export {
  signInWithPassword,
  signUpWithPassword,
  signOut,
  requestPasswordReset,
  exchangeCodeForSession,
  verifyOtpToken,
  updatePassword,
  PASSWORD_RESET_GENERIC_MESSAGE,
  type SupabaseAuthApi,
} from "./supabase-auth";
export {
  sanitizeRelativeNext,
  MAX_RELATIVE_NEXT_LENGTH,
} from "./next-path";
export {
  CANONICAL_AUTH_ORIGIN,
  CANONICAL_AUTH_CALLBACK_URL,
  CANONICAL_FORGOT_PASSWORD_URL,
  CANONICAL_RESET_PASSWORD_URL,
  PRODUCTION_PORTAL_ORIGINS,
  DEV_PORTAL_ORIGINS,
  TRUSTED_PORTAL_ORIGINS,
  parseTrustedPortalOrigin,
  parseTrustedPortalDestination,
  isTrustedPortalOrigin,
  type TrustedPortalOrigin,
} from "./origins";
export {
  isProductionCookieEnv,
  isDevelopmentRuntime,
  allowDevelopmentAuthBypass,
  readAuthRuntimeEnv,
  type AuthRuntimeEnv,
} from "./env";
export {
  AUTH_COOKIE_DOMAIN,
  getSharedAuthCookieOptions,
  mergeAuthCookieOptions,
  type SharedAuthCookieOptions,
} from "./cookies";
export {
  resolveAuthCallbackDestination,
  parseRecoveryOtpType,
  hasAuthCallbackGrant,
  DEFAULT_AUTH_CALLBACK_PATH,
  RECOVERY_OTP_TYPES,
  type AuthCallbackParams,
  type RecoveryOtpType,
} from "./callback";
export {
  PORTAL_LOGIN_PATH,
  PORTAL_FORBIDDEN_PATH,
  PORTAL_HEALTH_PATH,
  DEFAULT_PORTAL_PUBLIC_PATHS,
  isPortalPublicPath,
  buildLoginRedirectPath,
  resolvePortalMiddlewareDecision,
  type PortalMiddlewareDecision,
} from "./middleware-decision";
export {
  getPortalUrlMap,
  portalUrl,
  getVisiblePortalLinks,
  type PortalKey,
  type PortalUrlMap,
  type PortalLinkKey,
  type VisiblePortalLink,
} from "./portals";

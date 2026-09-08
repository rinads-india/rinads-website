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
  assertProductionEnvContract,
  checkProductionEnvContract,
  renderProductionEnvContractUnavailablePage,
  ProductionEnvContractError,
  type ProductionEnvContractResult,
} from "./config";
export { mapSupabaseUser, mapSupabaseSession } from "./mappers";
export {
  signInWithPassword,
  signUpWithPassword,
  signOut,
  type SupabaseAuthApi,
} from "./supabase-auth";

type WixTokenResponse = {
  access_token?: unknown;
  token_type?: unknown;
  expires_in?: unknown;
};

export type WixAppAccessToken = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

/**
 * Mint a short-lived Wix app-instance token on demand. Do not persist the app
 * secret or return it to callers. Wix app tokens are re-minted when needed;
 * the OAuth client_credentials flow does not require a refresh token.
 */
export async function createWixAppAccessToken(
  instanceId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<WixAppAccessToken> {
  const appId = process.env.WIX_APP_ID?.trim();
  const appSecret = process.env.WIX_APP_SECRET?.trim();
  const normalizedInstanceId = instanceId.trim();

  if (!appId || !appSecret) throw new Error("Wix OAuth is not configured");
  if (!normalizedInstanceId) throw new Error("Wix instance ID is required");

  const response = await fetchImpl("https://www.wixapis.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: appId,
      client_secret: appSecret,
      instance_id: normalizedInstanceId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Wix OAuth token request failed (${response.status})`);
  }

  const payload = await response.json() as WixTokenResponse;
  if (
    typeof payload.access_token !== "string" || !payload.access_token ||
    payload.token_type !== "Bearer" ||
    typeof payload.expires_in !== "number" || !Number.isFinite(payload.expires_in)
  ) {
    throw new Error("Wix OAuth returned an invalid token response");
  }

  return {
    accessToken: payload.access_token,
    tokenType: "Bearer",
    expiresIn: payload.expires_in,
  };
}

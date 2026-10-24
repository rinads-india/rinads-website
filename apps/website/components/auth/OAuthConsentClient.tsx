"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/rinads/Logo";
import { createWebsiteBrowserClient } from "@/lib/supabase/browser";

type ConsentDetails = {
  authorization_id: string;
  redirect_uri: string;
  client: {
    id: string;
    name: string;
    uri?: string | null;
    logo_uri?: string | null;
  };
  user: {
    id: string;
    email: string;
  };
  scope: string;
};

type ConsentState =
  | { status: "loading" }
  | { status: "ready"; details: ConsentDetails }
  | { status: "error"; message: string };

const AUTHORIZATION_ID_PATTERN = /^[A-Za-z0-9._~-]{1,512}$/;

function scopeDescription(scope: string): string {
  switch (scope) {
    case "email":
      return "Read the email address associated with your RINADS account.";
    case "profile":
      return "Read basic profile information used to identify you inside RINADS.";
    case "openid":
      return "Confirm your authenticated RINADS identity.";
    case "phone":
      return "Read the verified phone number associated with your RINADS account.";
    default:
      return `Request the ${scope} permission.`;
  }
}

export default function OAuthConsentClient() {
  const searchParams = useSearchParams();
  const authorizationId = searchParams.get("authorization_id")?.trim() ?? "";
  const client = useMemo(() => createWebsiteBrowserClient(), []);
  const [state, setState] = useState<ConsentState>({ status: "loading" });
  const [submitting, setSubmitting] = useState<"approve" | "deny" | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadConsent() {
      if (!AUTHORIZATION_ID_PATTERN.test(authorizationId)) {
        setState({ status: "error", message: "This authorization request is missing or invalid." });
        return;
      }

      const { data: userData, error: userError } = await client.auth.getUser();
      if (cancelled) return;

      if (userError || !userData.user) {
        const returnPath = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
        window.location.assign(`/signup?mode=login&next=${encodeURIComponent(returnPath)}`);
        return;
      }

      const { data, error } = await client.auth.oauth.getAuthorizationDetails(authorizationId);
      if (cancelled) return;

      if (error || !data) {
        setState({
          status: "error",
          message: error?.message ?? "RINADS could not load this authorization request.",
        });
        return;
      }

      if (!("authorization_id" in data)) {
        window.location.assign(data.redirect_url);
        return;
      }

      setState({ status: "ready", details: data as ConsentDetails });
    }

    void loadConsent();
    return () => {
      cancelled = true;
    };
  }, [authorizationId, client]);

  async function finish(decision: "approve" | "deny") {
    if (state.status !== "ready" || submitting) return;
    setSubmitting(decision);

    const result =
      decision === "approve"
        ? await client.auth.oauth.approveAuthorization(state.details.authorization_id, {
            skipBrowserRedirect: true,
          })
        : await client.auth.oauth.denyAuthorization(state.details.authorization_id, {
            skipBrowserRedirect: true,
          });

    if (result.error || !result.data?.redirect_url) {
      setState({
        status: "error",
        message: result.error?.message ?? "RINADS could not complete this authorization request.",
      });
      setSubmitting(null);
      return;
    }

    window.location.assign(result.data.redirect_url);
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="border-b border-white/10 px-6 py-5 sm:px-8">
            <Logo className="h-7" tone="onDark" priority={false} />
          </div>

          <div className="space-y-7 px-6 py-8 sm:px-8 sm:py-10">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rinads-primary">
                RINADS Intelligence · Secure connection
              </p>
              <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
                Authorize access to your RINADS account
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60">
                RINADS uses explicit consent before an AI client can act as your authenticated identity.
                Business permissions, organization scope, RLS and RINPO Runtime governance still apply after connection.
              </p>
            </div>

            {state.status === "loading" ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm text-white/65">
                Verifying authorization request…
              </div>
            ) : null}

            {state.status === "error" ? (
              <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-5">
                <p className="font-medium text-red-200">Authorization could not continue</p>
                <p className="mt-2 text-sm leading-6 text-red-100/70">{state.message}</p>
              </div>
            ) : null}

            {state.status === "ready" ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    {state.details.client.logo_uri ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={state.details.client.logo_uri}
                        alt=""
                        className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 object-contain"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-rinads-primary/35 bg-rinads-primary/15 text-lg font-semibold text-rinads-primary">
                        RI
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/40">Requesting client</p>
                      <h2 className="mt-1 truncate text-lg font-medium">{state.details.client.name}</h2>
                      {state.details.client.uri ? (
                        <p className="mt-1 truncate text-xs text-white/45">{state.details.client.uri}</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-sm font-medium text-white/85">Requested access</h2>
                  <div className="space-y-2">
                    {state.details.scope
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((scope) => (
                        <div
                          key={scope}
                          className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3"
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rinads-primary" />
                            <div>
                              <p className="text-sm font-medium">{scope}</p>
                              <p className="mt-1 text-xs leading-5 text-white/50">
                                {scopeDescription(scope)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-xs leading-5 text-white/50">
                  Signed in as <span className="text-white/80">{state.details.user.email}</span>. Approving this
                  request does not bypass your RINADS role, tenant isolation, capability entitlements or approval gates.
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => void finish("deny")}
                    disabled={submitting !== null}
                    className="rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-white/75 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting === "deny" ? "Denying…" : "Deny"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void finish("approve")}
                    disabled={submitting !== null}
                    className="rounded-xl bg-rinads-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting === "approve" ? "Authorizing…" : "Authorize RINADS Intelligence"}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

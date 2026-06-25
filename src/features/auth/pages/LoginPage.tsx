import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { supabase, SUPABASE_IS_CONFIGURED } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/hooks/useAuth";

type LocationState = { from?: string };
type AuthView = "sign-in" | "forgot-password" | "recovery";

function detectRecoveryMode(search: string) {
  const searchParams = new URLSearchParams(search);
  const queryType = searchParams.get("type") || searchParams.get("mode");
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  const hashParams = new URLSearchParams(hash);
  const hashType = hashParams.get("type");
  return queryType === "recovery" || hashType === "recovery";
}


type AuthErrorContext = "sign-in" | "forgot-password" | "recovery";

function getAuthErrorMessage(error: unknown, context: AuthErrorContext) {
  const message = error instanceof Error ? error.message : "";
  const code = typeof error === "object" && error !== null && "code" in error && typeof (error as { code?: unknown }).code === "string"
    ? (error as { code: string }).code
    : "";

  if (
    context === "forgot-password" &&
    (code === "over_email_send_rate_limit" || message.toLowerCase().includes("email rate limit exceeded"))
  ) {
    return "Too many reset emails were requested recently. Please wait a few minutes, then try again. If needed, ask an admin to generate a temporary password from Users & Access.";
  }

  if (message) {
    return message;
  }

  if (context === "forgot-password") return "Unable to send reset link.";
  if (context === "recovery") return "Unable to update password.";
  return "Unable to sign in.";
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated, profile } = useAuth();

  const redirectTo = (location.state as LocationState | null)?.from ?? "/dashboard";
  const recoveryMode = useMemo(() => detectRecoveryMode(location.search), [location.search]);

  const [view, setView] = useState<AuthView>(recoveryMode ? "recovery" : "sign-in");
  const [email, setEmail] = useState("admin@anrpc.local");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [infoText, setInfoText] = useState("");

  useEffect(() => {
    if (recoveryMode) {
      setView("recovery");
      setErrorText("");
      setInfoText("Open the form below and set your new password.");
    }
  }, [recoveryMode]);

  useEffect(() => {
    if (isAuthenticated && profile && view !== "recovery") navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, profile, redirectTo, view]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorText("");
    setInfoText("");
    try {
      setSubmitting(true);
      await signIn(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrorText(getAuthErrorMessage(error, "sign-in"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorText("");
    setInfoText("");

    try {
      setSubmitting(true);
      const redirectUrl = `${window.location.origin}/login?mode=recovery`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
      setInfoText("Password reset link sent. Check your email and open the link to set a new password.");
    } catch (error) {
      setErrorText(getAuthErrorMessage(error, "forgot-password"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecoveryPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorText("");
    setInfoText("");

    if (newPassword.length < 8) {
      setErrorText("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorText("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setInfoText("Password updated successfully. You can now continue to the workspace.");
      setNewPassword("");
      setConfirmPassword("");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrorText(getAuthErrorMessage(error, "recovery"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.24),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_28%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="text-white">
          <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold tracking-[0.22em] uppercase text-white/85">ANRPC • PSM • Internal System</p>
          <h1 className="max-w-2xl text-4xl font-black leading-tight md:text-5xl">{APP_NAME}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{APP_TAGLINE}</p>
        </section>
        <Card className="border-white/10 bg-white/95 shadow-2xl shadow-black/25">
          <CardHeader>
            <CardTitle>
              {view === "forgot-password"
                ? "Forgot password"
                : view === "recovery"
                  ? "Set new password"
                  : "Sign in"}
            </CardTitle>
            <CardDescription>
              {view === "forgot-password"
                ? "Enter your work email to receive a secure reset link."
                : view === "recovery"
                  ? "Choose a new password for your workspace account."
                  : "Use your approved workspace account."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!SUPABASE_IS_CONFIGURED ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">Supabase is not configured yet. Add your env values first, then restart the app.</div>
            ) : (
              <>
                {view === "sign-in" ? (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2"><label className="text-sm font-semibold text-slate-700" htmlFor="email">Work email</label><Input id="email" type="email" placeholder="name@anrpc.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div>
                    <div className="space-y-2"><div className="flex items-center justify-between gap-3"><label className="text-sm font-semibold text-slate-700" htmlFor="password">Password</label><button type="button" className="text-xs font-semibold text-blue-700 hover:text-blue-900" onClick={() => { setView("forgot-password"); setResetEmail(email); setErrorText(""); setInfoText(""); }}>Forgot password?</button></div><Input id="password" type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div>
                    {errorText ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorText}</div> : null}
                    {infoText ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{infoText}</div> : null}
                    <Button className="w-full" type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Enter workspace"}</Button>
                  </form>
                ) : null}

                {view === "forgot-password" ? (
                  <form className="space-y-4" onSubmit={handleForgotPassword}>
                    <div className="space-y-2"><label className="text-sm font-semibold text-slate-700" htmlFor="reset-email">Work email</label><Input id="reset-email" type="email" placeholder="name@anrpc.com" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} autoComplete="email" required /></div>
                    {errorText ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorText}</div> : null}
                    {infoText ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{infoText}</div> : null}
                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" disabled={submitting}>{submitting ? "Sending..." : "Send reset link"}</Button>
                      <Button type="button" variant="outline" onClick={() => { setView("sign-in"); setErrorText(""); setInfoText(""); }}>Back to sign in</Button>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                      If email reset is temporarily rate-limited, an admin can set a direct password or generate a temporary password from <span className="font-semibold text-slate-900">Users &amp; Access</span>.
                    </div>
                  </form>
                ) : null}

                {view === "recovery" ? (
                  <form className="space-y-4" onSubmit={handleRecoveryPassword}>
                    <div className="space-y-2"><label className="text-sm font-semibold text-slate-700" htmlFor="new-password">New password</label><Input id="new-password" type="password" placeholder="At least 8 characters" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required /></div>
                    <div className="space-y-2"><label className="text-sm font-semibold text-slate-700" htmlFor="confirm-password">Confirm password</label><Input id="confirm-password" type="password" placeholder="Repeat the same password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required /></div>
                    {errorText ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorText}</div> : null}
                    {infoText ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{infoText}</div> : null}
                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" disabled={submitting}>{submitting ? "Updating..." : "Update password"}</Button>
                      <Button type="button" variant="outline" onClick={() => { setView("sign-in"); setErrorText(""); setInfoText(""); }}>Back to sign in</Button>
                    </div>
                  </form>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

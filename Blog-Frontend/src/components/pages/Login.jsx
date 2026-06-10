import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Github, Chrome, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "../AuthContext";
import { Container } from "@/components/shared/Container";
import { Field, Input, PasswordInput } from "@/components/shared/Field";
import { Spinner } from "@/components/shared/Spinner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState({ google: false, github: false });
  const [oauthCallbackProcessed, setOauthCallbackProcessed] = useState(false);
  const [hasShownOAuthToast, setHasShownOAuthToast] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loginWithCredentials,
    loginWithOAuth,
    loading: authLoading,
    isLoggedIn,
    authMethod,
  } = useContext(AuthContext);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get("error");
    const success = params.get("success");
    if (error === "oauth_failed") {
      toast({
        title: "Login failed",
        description: "OAuth authentication failed. Please try again.",
        variant: "destructive",
      });
      navigate("/login", { replace: true });
      setOauthCallbackProcessed(true);
    } else if (success === "oauth") {
      window.history.replaceState({}, document.title, "/login");
      setOauthCallbackProcessed(true);
    } else {
      setOauthCallbackProcessed(true);
    }
  }, [location.search, navigate, toast]);

  useEffect(() => {
    if (!oauthCallbackProcessed || authLoading) return;
    if (isLoggedIn) {
      const redirectTo = localStorage.getItem("redirectAfterLogin") || "/profile";
      localStorage.removeItem("redirectAfterLogin");
      const wasOAuthCallback =
        location.search.includes("success=oauth") ||
        (authMethod === "oauth" && !hasShownOAuthToast);
      if (authMethod === "oauth" && wasOAuthCallback && !hasShownOAuthToast) {
        setHasShownOAuthToast(true);
        toast({
          title: "Welcome back",
          description: "You're signed in.",
        });
      }
      setTimeout(() => navigate(redirectTo, { replace: true }), 100);
    }
  }, [
    isLoggedIn,
    authLoading,
    authMethod,
    navigate,
    toast,
    oauthCallbackProcessed,
    location.search,
    hasShownOAuthToast,
  ]);

  const handleBasicAuthSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await loginWithCredentials(email, password, () => {
        const redirectTo =
          localStorage.getItem("redirectAfterLogin") || "/profile";
        localStorage.removeItem("redirectAfterLogin");
        navigate(redirectTo, { replace: true });
      });
      toast({ title: "Welcome back" });
    } catch (error) {
      let msg = "Invalid email or password.";
      if (error.message?.includes("not verified"))
        msg = "Please verify your email before signing in.";
      else if (error.message?.includes("not found"))
        msg = "No account found with this email.";
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      setOauthLoading((prev) => ({ ...prev, [provider]: true }));
      toast({
        title: "Redirecting…",
        description: `Taking you to ${provider === "google" ? "Google" : "GitHub"}.`,
      });
      setTimeout(() => loginWithOAuth(provider), 500);
    } catch (error) {
      toast({
        title: "Authentication error",
        description: `Failed to start ${provider} login. Please try again.`,
        variant: "destructive",
      });
      setOauthLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  if (authLoading || !oauthCallbackProcessed) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center bg-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  const anyLoading = loading || oauthLoading.google || oauthLoading.github;

  return (
    <div className="bg-bg min-h-screen pt-20 grid-bg-fine">
      <Container size="sm" className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-md">
          {/* Eyebrow */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 micro-text text-accent mb-5">
              <span className="inline-block w-6 h-px bg-accent" />
              Sign in
              <span className="inline-block w-6 h-px bg-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-ink mb-3">
              Welcome back<span className="text-accent">.</span>
            </h1>
            <p className="text-ink-muted">
              Continue your writing journey.
            </p>
          </div>

          {/* Card */}
          <div className="border border-ink-faint bg-surface p-7 md:p-9">
            {/* OAuth */}
            <div className="grid gap-3 mb-7">
              <OAuthButton
                provider="google"
                onClick={() => handleOAuthLogin("google")}
                loading={oauthLoading.google}
                disabled={anyLoading}
              />
              <OAuthButton
                provider="github"
                onClick={() => handleOAuthLogin("github")}
                loading={oauthLoading.github}
                disabled={anyLoading}
              />
            </div>

            <Divider label="or with email" />

            {/* Basic Auth */}
            <form onSubmit={handleBasicAuthSubmit} className="grid gap-5">
              <Field id="email" label="Email" required>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={anyLoading}
                  autoComplete="email"
                />
              </Field>

              <Field
                id="password"
                label="Password"
                required
                labelAction={
                  <Link
                    to="/forgot-password"
                    className="text-xs text-ink-subtle hover:text-accent transition-colors"
                  >
                    Forgot?
                  </Link>
                }
              >
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={anyLoading}
                  autoComplete="current-password"
                />
              </Field>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full mt-2"
                disabled={anyLoading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>

            {/* Hint */}
            <div className="mt-6 flex items-start gap-3 p-3 border border-ink-faint text-xs text-ink-subtle">
              <ShieldCheck
                size={14}
                className="shrink-0 mt-0.5 text-accent"
              />
              <p>
                OAuth doesn't require email verification. Email sign-in
                requires OTP.
              </p>
            </div>
          </div>

          {/* Sign up link */}
          <p className="mt-8 text-center text-sm text-ink-muted">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-accent hover:text-ink transition-colors underline underline-offset-4"
            >
              Create one
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
};

/* ---------- Sub-components ---------- */

const OAuthButton = ({ provider, onClick, loading, disabled }) => {
  const labels = { google: "Continue with Google", github: "Continue with GitHub" };
  const Icon = provider === "google" ? Chrome : Github;
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="subtle"
      size="lg"
      className="w-full"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
      {loading ? "Connecting…" : labels[provider]}
    </Button>
  );
};

const Divider = ({ label }) => (
  <div className="relative mb-7" aria-hidden>
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-ink-faint" />
    </div>
    <div className="relative flex justify-center text-xs">
      <span className="px-3 bg-surface micro-text text-ink-subtle">
        {label}
      </span>
    </div>
  </div>
);

export default Login;

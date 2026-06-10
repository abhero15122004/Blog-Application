import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "../AuthContext";
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 4;

const OTPVerification = () => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const email = location.state?.email || "";
  const { verifyOTP, resendOTP, isLoggedIn, authMethod } = useContext(AuthContext);

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/profile", { replace: true });
      return;
    }
    if (!email) {
      navigate("/register", { replace: true });
    }
  }, [isLoggedIn, authMethod, email, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (value && !/^\d+$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pasted)) return;
    e.preventDefault();
    const digits = pasted.slice(0, OTP_LENGTH).split("");
    const newOtp = Array(OTP_LENGTH).fill("");
    digits.forEach((d, i) => (newOtp[i] = d));
    setOtp(newOtp);
    const last = Math.min(digits.length, OTP_LENGTH - 1);
    inputRefs.current[last]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      toast({
        title: "Incomplete OTP",
        description: "Enter the 4-digit code from your email.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await verifyOTP(email, code);
      toast({
        title: "Email verified",
        description: "You can now sign in.",
      });
      navigate("/login", { replace: true });
    } catch (err) {
      let msg = "Please try again or request a new code.";
      if (err.message?.includes("expired"))
        msg = "OTP expired. Please request a new code.";
      else if (err.message?.includes("invalid"))
        msg = "Invalid code. Double-check and try again.";
      toast({
        title: "Verification failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setIsResending(true);
    try {
      await resendOTP(email);
      setTimer(30);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      toast({
        title: "Code resent",
        description: "Check your inbox for the new code.",
      });
    } catch (err) {
      toast({
        title: "Resend failed",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;
  const isComplete = otp.join("").length === OTP_LENGTH;

  return (
    <div className="bg-bg min-h-screen pt-20 grid-bg-fine">
      <Container size="sm" className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 w-14 h-14 border border-accent text-accent flex items-center justify-center bg-accent/5">
              <Mail size={22} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-ink mb-3">
              Verify your email<span className="text-accent">.</span>
            </h1>
            <p className="text-ink-muted text-sm">
              We sent a 4-digit code to
            </p>
            <p className="text-ink font-medium break-all mt-1">{email}</p>
          </div>

          <div className="border border-ink-faint bg-surface p-7 md:p-9">
            <form onSubmit={handleSubmit} className="grid gap-8">
              {/* OTP grid */}
              <div className="grid grid-cols-4 gap-3" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={cn(
                      "w-full aspect-square text-center text-2xl md:text-3xl font-heading font-bold",
                      "bg-bg border text-ink outline-none transition-all",
                      digit
                        ? "border-accent shadow-[0_0_0_3px_var(--accent-glow)]"
                        : "border-ink-faint",
                      "focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]",
                      "disabled:opacity-50"
                    )}
                    aria-label={`Digit ${idx + 1}`}
                    disabled={isSubmitting || isResending}
                  />
                ))}
              </div>

              {/* Resend */}
              <div className="text-center">
                {timer > 0 ? (
                  <p className="text-sm text-ink-muted">
                    Resend code in{" "}
                    <span className="text-accent font-medium">{timer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSubmitting || isResending}
                    className="inline-flex items-center gap-2 micro-text text-accent hover:text-ink transition-colors disabled:opacity-50"
                  >
                    {isResending ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <RefreshCw size={12} />
                        Resend code
                      </>
                    )}
                  </button>
                )}
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full"
                disabled={isSubmitting || isResending || !isComplete}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Verify email
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-start gap-3 p-3 border border-ink-faint text-xs text-ink-subtle">
              <Mail size={14} className="shrink-0 mt-0.5 text-accent" />
              <p>
                Can't find the email? Check your spam folder. The code expires
                in 5 minutes.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate("/register", { replace: true })}
              disabled={isSubmitting || isResending}
              className="inline-flex items-center gap-2 micro-text text-ink-subtle hover:text-ink transition-colors"
            >
              <ArrowLeft size={12} />
              Back to register
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default OTPVerification;

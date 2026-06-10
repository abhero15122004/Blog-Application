import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Container } from "./shared/Container";
import { Spinner } from "./shared/Spinner";
import apiFetch from "../components/utils/api";

const UnsubscribeGeneral = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const { toast } = useToast();
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!email) {
      setStatus("error");
      return;
    }
    let active = true;
    (async () => {
      setStatus("loading");
      try {
        const response = await apiFetch(
          `/api/general-subscribers/unsubscribe?email=${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to unsubscribe");
        }
        if (active) {
          setStatus("success");
          toast({
            title: "Unsubscribed",
            description: "You won't receive AIDEN updates anymore.",
          });
        }
      } catch (err) {
        if (active) {
          setStatus("error");
          toast({
            title: "Could not unsubscribe",
            description: err.message || "Try again later.",
            variant: "destructive",
          });
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [email, toast]);

  return (
    <div className="bg-bg min-h-screen pt-20 grid-bg-fine flex items-center">
      <Container size="sm" className="py-16">
        <div className="max-w-md mx-auto text-center">
          {status === "loading" && (
            <>
              <div className="inline-flex w-14 h-14 items-center justify-center border border-ink-faint mb-6">
                <Spinner size="md" />
              </div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-ink mb-3">
                Unsubscribing<span className="text-accent">.</span>
              </h1>
              <p className="text-ink-muted">Hold on a moment…</p>
            </>
          )}
          {status === "success" && (
            <>
              <div className="inline-flex w-14 h-14 items-center justify-center border border-accent text-accent mb-6 bg-accent/5">
                <CheckCircle2 size={24} />
              </div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-ink mb-3">
                You're unsubscribed<span className="text-accent">.</span>
              </h1>
              <p className="text-ink-muted mb-8">
                You've been removed from the AIDEN mailing list. We'll miss
                you.
              </p>
              <Button asChild variant="accent" size="lg">
                <Link to="/">
                  <Home size={16} />
                  Back home
                </Link>
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <div className="inline-flex w-14 h-14 items-center justify-center border border-danger text-danger mb-6 bg-danger/5">
                <AlertCircle size={24} />
              </div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-ink mb-3">
                Couldn't unsubscribe<span className="text-accent">.</span>
              </h1>
              <p className="text-ink-muted mb-8">
                {email
                  ? "Something went wrong. Try again later."
                  : "No email was provided in the unsubscribe link."}
              </p>
              <Button asChild variant="outline" size="lg">
                <Link to="/">
                  <Home size={16} />
                  Back home
                </Link>
              </Button>
            </>
          )}
        </div>
      </Container>
    </div>
  );
};

export default UnsubscribeGeneral;

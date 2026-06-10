import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { Container } from "@/components/shared/Container";

// lucide doesn't export LinkOff in older versions; fallback to inline icon
const LinkOffIcon = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={props.strokeWidth || 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 17H7A5 5 0 0 1 7 7m6-2h2a5 5 0 0 1 4.546 7.075" />
    <line x1="8" y1="12" x2="12" y2="12" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const LinkNotAvailable = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-bg min-h-screen pt-20 grid-bg-fine flex items-center">
      <Container size="sm" className="py-16">
        <div className="text-center max-w-lg mx-auto">
          <div className="mx-auto mb-8 w-20 h-20 border border-accent text-accent flex items-center justify-center bg-accent/5">
            <LinkOffIcon size={28} />
          </div>

          <div className="micro-text text-accent mb-4 flex items-center gap-2 justify-center">
            <span className="inline-block w-6 h-px bg-accent" />
            Link unavailable
            <span className="inline-block w-6 h-px bg-accent" />
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-ink mb-3">
            Nothing to link to<span className="text-accent">.</span>
          </h1>
          <p className="text-ink-muted mb-10">
            The author hasn't added this profile yet. You can head back and
            try another link.
          </p>

          <Button onClick={() => navigate(-1)} variant="accent" size="lg">
            <ArrowLeft size={16} />
            Go back
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default LinkNotAvailable;

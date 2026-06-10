import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="bg-bg min-h-screen pt-20 grid-bg-fine flex items-center">
      <Container size="sm" className="py-16">
        <div className="text-center">
          <div className="relative inline-block mb-8">
            <div className="text-[10rem] sm:text-[14rem] leading-none font-heading font-bold tracking-tighter text-ink select-none">
              404
            </div>
            <div className="absolute inset-0 text-[10rem] sm:text-[14rem] leading-none font-heading font-bold tracking-tighter text-accent opacity-30 translate-x-1 translate-y-1 select-none pointer-events-none">
              404
            </div>
          </div>

          <div className="micro-text text-accent mb-4 flex items-center gap-2 justify-center">
            <span className="inline-block w-6 h-px bg-accent" />
            Page not found
            <span className="inline-block w-6 h-px bg-accent" />
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-ink mb-3">
            This page is off the map<span className="text-accent">.</span>
          </h1>
          <p className="text-ink-muted max-w-md mx-auto mb-10">
            The page{" "}
            <code className="px-1.5 py-0.5 bg-surface-2 text-accent text-sm">
              {location.pathname}
            </code>{" "}
            doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="accent" size="lg">
              <Link to="/">
                <Home size={16} />
                Back home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/blogs">
                <Search size={16} />
                Browse blogs
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default NotFound;

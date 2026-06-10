import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Twitter, Linkedin, Github, ArrowRight, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiFetch from "../components/utils/api";
import { Container } from "./shared/Container";

const TWITTER_URL = import.meta.env.VITE_TWITTER_URL || "#";
const LINKEDIN_URL = import.meta.env.VITE_LINKEDIN_URL || "#";
const GITHUB_URL = import.meta.env.VITE_GITHUB_URL || "#";
const ABOUT_AUTHOR_URL = import.meta.env.VITE_ABOUT_AUTHOR_URL || "#";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiFetch("/api/general-subscribers", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to subscribe");
      }
      toast({
        title: "Subscribed",
        description: "You'll receive updates on every new post.",
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: error.message || "Something went wrong. Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="relative bg-bg border-t border-ink-faint mt-24">
      {/* Accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />

      <Container className="py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <Link
              to="/"
              className="inline-block text-3xl font-heading font-bold tracking-tight text-ink mb-5 no-underline"
            >
              AIDEN<span className="text-accent">.</span>
            </Link>
            <p className="text-ink-muted max-w-md leading-relaxed mb-6">
              A monochromatic space where brutalist design meets futuristic
              elegance. Built for developers, writers, and the curious.
            </p>
            <div className="flex gap-3">
              <SocialLink href={TWITTER_URL} label="Twitter">
                <Twitter size={16} />
              </SocialLink>
              <SocialLink href={LINKEDIN_URL} label="LinkedIn">
                <Linkedin size={16} />
              </SocialLink>
              <SocialLink href={GITHUB_URL} label="GitHub">
                <Github size={16} />
              </SocialLink>
            </div>
          </div>

          {/* Navigation */}
          <div className="md:col-span-2">
            <FooterHeading>Pages</FooterHeading>
            <ul className="grid gap-3">
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/blogs">All blogs</FooterLink>
              <FooterLink to="/write-blog">Write</FooterLink>
              <FooterLink to="/profile">Profile</FooterLink>
            </ul>
          </div>

          <div className="md:col-span-2">
            <FooterHeading>Account</FooterHeading>
            <ul className="grid gap-3">
              <FooterLink to="/login">Sign in</FooterLink>
              <FooterLink to="/register">Register</FooterLink>
              <li>
                <a
                  href={ABOUT_AUTHOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ink-muted no-underline transition-colors hover:text-ink"
                >
                  About author
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-3">
            <FooterHeading>Subscribe</FooterHeading>
            <p className="text-sm text-ink-muted mb-4">
              Get new posts delivered to your inbox. No spam.
            </p>
            <form onSubmit={handleSubscribe} className="flex">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 min-w-0 px-3 py-3 bg-surface border border-ink-faint border-r-0 text-sm text-ink outline-none placeholder:text-ink-subtle focus:border-accent transition-colors"
                disabled={isSubmitting}
                aria-label="Email address"
              />
              <button
                type="submit"
                className="px-4 bg-accent text-accent-ink border border-accent hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center"
                disabled={isSubmitting}
                aria-label="Subscribe"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-t-accent-ink border-r-accent-ink/30 border-b-accent-ink/10 border-l-accent-ink/60 rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-14 pt-6 border-t border-ink-faint flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-ink-subtle">
            © {currentYear} AIDEN<span className="text-accent">.</span> All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-ink-subtle">
            <span className="inline-block w-1.5 h-1.5 bg-accent animate-pulse-dot" />
            Built with care for makers
          </div>
        </div>
      </Container>
    </footer>
  );
};

const FooterHeading = ({ children }) => (
  <h3 className="micro-text text-ink-subtle mb-5">{children}</h3>
);

const SocialLink = ({ href, label, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="w-10 h-10 border border-ink-faint flex items-center justify-center text-ink-muted transition-colors hover:text-accent-ink hover:bg-accent hover:border-accent"
  >
    {children}
  </a>
);

const FooterLink = ({ to, children }) => (
  <li>
    <Link
      to={to}
      className="text-sm text-ink-muted no-underline transition-colors hover:text-ink"
    >
      {children}
    </Link>
  </li>
);

export default Footer;

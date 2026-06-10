import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Github,
  Chrome,
  Loader2,
  Info,
  Camera,
  ArrowRight,
  X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "../AuthContext";
import { Container } from "@/components/shared/Container";
import { Field, Input, Textarea, PasswordInput } from "@/components/shared/Field";

const Register = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { register, loginWithOAuth } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    photo: null,
    linkedin: "",
    github: "",
    twitter: "",
    about: "",
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState({ google: false, github: false });

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null }));
    setPreviewUrl(null);
  };

  const handleOAuthSignup = async (provider) => {
    try {
      setOauthLoading((prev) => ({ ...prev, [provider]: true }));
      toast({
        title: "Redirecting…",
        description: `Taking you to ${provider === "google" ? "Google" : "GitHub"}.`,
      });
      setTimeout(() => loginWithOAuth(provider), 500);
    } catch {
      toast({
        title: "Authentication error",
        description: `Failed to start ${provider} signup.`,
        variant: "destructive",
      });
      setOauthLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        linkedin: formData.linkedin,
        github: formData.github,
        twitter: formData.twitter,
        about: formData.about,
      };
      data.append("user", JSON.stringify(userData));
      if (formData.photo) data.append("photo", formData.photo);

      const response = await register(data);
      toast({
        title: "Account created",
        description: "Please verify your email with the OTP we just sent.",
      });
      navigate("/verify-otp", { state: { email: response.email } });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const anyLoading = loading || oauthLoading.google || oauthLoading.github;

  return (
    <div className="bg-bg min-h-screen pt-20 grid-bg-fine">
      <Container size="default" className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 micro-text text-accent mb-5">
              <span className="inline-block w-6 h-px bg-accent" />
              Create account
              <span className="inline-block w-6 h-px bg-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-ink mb-3">
              Start writing today<span className="text-accent">.</span>
            </h1>
            <p className="text-ink-muted max-w-xl mx-auto">
              Join a community of developers and writers shipping ideas worth
              reading.
            </p>
          </div>

          <div className="border border-ink-faint bg-surface p-7 md:p-10">
            {/* OAuth */}
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              <Button
                onClick={() => handleOAuthSignup("google")}
                disabled={anyLoading}
                variant="subtle"
                size="lg"
                className="w-full"
              >
                {oauthLoading.google ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Chrome size={16} />
                )}
                {oauthLoading.google ? "Connecting…" : "Google"}
              </Button>
              <Button
                onClick={() => handleOAuthSignup("github")}
                disabled={anyLoading}
                variant="subtle"
                size="lg"
                className="w-full"
              >
                {oauthLoading.github ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Github size={16} />
                )}
                {oauthLoading.github ? "Connecting…" : "GitHub"}
              </Button>
            </div>

            <div className="flex items-start gap-3 p-3 mb-7 border border-accent/30 bg-accent/5 text-xs text-ink-muted">
              <Info size={14} className="shrink-0 mt-0.5 text-accent" />
              <p>
                OAuth signup is instant — no email verification needed. Your
                account is ready immediately.
              </p>
            </div>

            <Divider label="or with email" />

            {/* Form */}
            <form onSubmit={handleSubmit} className="grid gap-6 mt-7">
              <div className="grid md:grid-cols-2 gap-5">
                <Field id="name" label="Full name" required>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    required
                    disabled={anyLoading}
                  />
                </Field>
                <Field id="email" label="Email" required>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    disabled={anyLoading}
                  />
                </Field>
                <Field id="password" label="Password" required>
                  <PasswordInput
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    disabled={anyLoading}
                    autoComplete="new-password"
                  />
                </Field>
                <Field id="phone" label="Phone" hint="Optional · No +91 prefix">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    disabled={anyLoading}
                  />
                </Field>
              </div>

              {/* Photo */}
              <Field id="photo" label="Profile photo" hint="Optional · PNG, JPG up to 10MB">
                <div className="flex items-stretch gap-4">
                  <label
                    htmlFor="photo"
                    className="flex-1 cursor-pointer border border-dashed border-ink-faint hover:border-accent p-5 flex flex-col items-center justify-center text-center transition-colors"
                  >
                    <Camera
                      size={24}
                      className="mb-2 text-ink-subtle"
                      strokeWidth={1.5}
                    />
                    <span className="text-sm text-ink-muted">
                      {formData.photo ? formData.photo.name : "Click to upload"}
                    </span>
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={anyLoading}
                    />
                  </label>
                  {previewUrl && (
                    <div className="relative w-24 h-24 border border-ink-faint">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-bg border border-danger text-danger flex items-center justify-center hover:bg-danger hover:text-ink transition-colors"
                        aria-label="Remove photo"
                      >
                        <XIcon size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </Field>

              <div className="grid md:grid-cols-2 gap-5">
                <Field id="linkedin" label="LinkedIn" hint="Optional">
                  <Input
                    id="linkedin"
                    name="linkedin"
                    type="url"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/…"
                    disabled={anyLoading}
                  />
                </Field>
                <Field id="github" label="GitHub" hint="Optional">
                  <Input
                    id="github"
                    name="github"
                    type="url"
                    value={formData.github}
                    onChange={handleChange}
                    placeholder="https://github.com/…"
                    disabled={anyLoading}
                  />
                </Field>
              </div>

              <Field id="twitter" label="X (Twitter)" hint="Optional">
                <Input
                  id="twitter"
                  name="twitter"
                  type="url"
                  value={formData.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/…"
                  disabled={anyLoading}
                />
              </Field>

              <Field id="about" label="About you" hint="Optional · A short bio">
                <Textarea
                  id="about"
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  placeholder="What do you write about?"
                  disabled={anyLoading}
                />
              </Field>

              <div className="flex items-start gap-3 p-3 border border-ink-faint text-xs text-ink-subtle">
                <Info size={14} className="shrink-0 mt-0.5 text-accent" />
                <p>
                  You'll receive a 4-digit OTP to verify your email after
                  registration.
                </p>
              </div>

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
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="mt-8 text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-accent hover:text-ink transition-colors underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
};

const Divider = ({ label }) => (
  <div className="relative" aria-hidden>
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

export default Register;

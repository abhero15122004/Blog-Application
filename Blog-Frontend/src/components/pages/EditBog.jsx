import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Eye,
  Pencil,
  Image as ImageIcon,
  X as XIcon,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Container } from "@/components/shared/Container";
import { Section } from "@/components/shared/Section";
import { Field, Textarea } from "@/components/shared/Field";
import { MarkdownView } from "@/components/shared/MarkdownView";
import { PageSpinner } from "@/components/shared/Spinner";
import apiFetch from "../utils/api";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
];

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      try {
        const response = await apiFetch(`/api/blogs/${id}`);
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.setItem("redirectAfterLogin", `/edit-blog/${id}`);
            navigate("/login");
            return;
          }
          throw new Error("Failed to fetch blog");
        }
        const data = await response.json();
        if (!active) return;
        setTitle(data.title || "");
        setBlogContent(data.content || "");
        setCodeContent(data.codeSnippet || "");
        setCodeLanguage(data.codeLanguage || "javascript");
        const img = data.image ? `data:image/jpeg;base64,${data.image}` : null;
        setPreviewUrl(img);
      } catch (err) {
        toast({
          title: "Could not load blog",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, navigate, toast]);

  const wordCount = useMemo(
    () => blogContent.trim().split(/\s+/).filter(Boolean).length,
    [blogContent]
  );
  const readMin = Math.max(1, Math.round(wordCount / 220));

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Title required",
        variant: "destructive",
      });
      return;
    }
    if (!blogContent.trim()) {
      toast({
        title: "Content required",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("id", id);
      formData.append("title", title);
      formData.append("content", blogContent);
      if (codeContent.trim()) {
        formData.append("code", codeContent);
        formData.append("language", codeLanguage);
      }
      if (selectedFile) formData.append("image", selectedFile);

      const response = await apiFetch("/api/blogs", {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error("Failed to update");
      }
      toast({ title: "Saved", description: "Your changes are live." });
      navigate("/profile");
    } catch {
      toast({
        title: "Could not save",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <PageSpinner label="Loading post" />;

  return (
    <div className="bg-bg min-h-screen pt-20">
      <Section>
        <Container>
          {/* Header */}
          <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={14} />
                Back
              </Button>
              <div>
                <div className="micro-text text-accent flex items-center gap-2 mb-2">
                  <span className="inline-block w-6 h-px bg-accent" />
                  Editing
                </div>
                <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-ink">
                  Edit post<span className="text-accent">.</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-subtle">
              <span>
                <strong className="text-ink">{wordCount}</strong> words
              </span>
              <span>·</span>
              <span>
                <strong className="text-ink">{readMin}</strong> min read
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-8 max-w-4xl">
            <Field id="title" label="Title" required>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A captivating, sharp title"
                disabled={saving}
                className="w-full p-4 text-2xl font-heading font-bold bg-surface border border-ink-faint text-ink outline-none transition-colors focus:border-accent focus:bg-bg placeholder:text-ink-subtle disabled:opacity-50"
              />
            </Field>

            <Field
              id="blogContent"
              label="Content"
              required
              labelAction={
                <button
                  type="button"
                  onClick={() => setIsPreview((v) => !v)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 micro-text text-accent hover:text-ink transition-colors"
                >
                  {isPreview ? (
                    <>
                      <Pencil size={12} />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye size={12} />
                      Preview
                    </>
                  )}
                </button>
              }
            >
              {isPreview ? (
                <div className="min-h-[400px] p-6 bg-surface border border-ink-faint">
                  {blogContent ? (
                    <MarkdownView content={blogContent} />
                  ) : (
                    <p className="text-ink-subtle italic">
                      Nothing to preview yet.
                    </p>
                  )}
                </div>
              ) : (
                <Textarea
                  id="blogContent"
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  placeholder="Edit your content…"
                  disabled={saving}
                  className="min-h-[400px] text-base leading-relaxed"
                />
              )}
            </Field>

            {/* Code */}
            <div className="grid gap-5">
              <h3 className="micro-text text-ink-subtle">Code (optional)</h3>
              <div className="grid sm:grid-cols-[1fr,2fr] gap-4">
                <Field id="codeLanguage" label="Language">
                  <Select
                    value={codeLanguage}
                    onValueChange={setCodeLanguage}
                    disabled={saving}
                  >
                    <SelectTrigger className="p-3 bg-surface border border-ink-faint text-ink h-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border border-ink-faint text-ink">
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="codeContent" label="Snippet">
                  <Textarea
                    id="codeContent"
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    placeholder="// Paste your code here…"
                    disabled={saving}
                    className="font-mono text-sm min-h-[180px]"
                  />
                </Field>
              </div>
            </div>

            {/* Image */}
            <Field
              id="featured-image"
              label="Featured image"
              hint={selectedFile ? "New image selected" : "Current image"}
            >
              <div className="flex flex-col md:flex-row gap-4 items-stretch">
                <label
                  htmlFor="featured-image"
                  className="flex-1 cursor-pointer border border-dashed border-ink-faint hover:border-accent p-8 flex flex-col items-center justify-center text-center transition-colors"
                >
                  <ImageIcon
                    size={28}
                    className="mb-3 text-ink-subtle"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm text-ink">
                    {selectedFile
                      ? selectedFile.name
                      : "Click to replace image"}
                  </span>
                  <input
                    type="file"
                    id="featured-image"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={saving}
                  />
                </label>
                {previewUrl && (
                  <div className="relative w-full md:w-1/3 border border-ink-faint">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full aspect-[4/3] object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-bg border border-danger text-danger flex items-center justify-center hover:bg-danger hover:text-ink transition-colors"
                      aria-label="Remove image"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                )}
              </div>
            </Field>

            <div className="flex items-center justify-between pt-6 border-t border-ink-faint">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                size="lg"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Container>
      </Section>
    </div>
  );
};

export default EditBlog;

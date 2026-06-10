import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  Edit,
  Check,
  X,
  ArrowRight,
  Trash,
  Pencil,
  ShieldCheck,
  PenSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "../AuthContext";
import authService from "../../services/authService";
import BlogCard from "../BlogCard";
import { Container } from "@/components/shared/Container";
import { Section } from "@/components/shared/Section";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageSpinner } from "@/components/shared/Spinner";
import { Field, Input, Textarea } from "@/components/shared/Field";
import { Tag } from "@/components/shared/Tag";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

const FALLBACK_IMG =
  import.meta.env.VITE_FALLBACK_IMAGE ||
  "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg";

const UserProfile = () => {
  const { user, isLoggedIn, authMethod, refreshUser } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [activeTab, setActiveTab] = useState("info");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoggedIn) {
        navigate("/login");
        return;
      }
      try {
        setLoading(true);
        const response = await authService.authenticatedFetch(
          "/api/users/profile",
          { method: "GET" }
        );
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.setItem("redirectAfterLogin", "/profile");
            navigate("/login");
            return;
          }
          throw new Error("Failed to fetch profile data");
        }
        const data = await response.json();
        const userInfo = data.user;
        const userBlogs = data.blogs || [];
        const joinedDate = new Date(userInfo.createdAt).toLocaleDateString(
          "en-US",
          { month: "long", year: "numeric" }
        );
        const formattedUser = {
          ...userInfo,
          joinedDate,
          location: userInfo.location || "Not specified",
          photo: userInfo.photo || null,
        };
        setUserData(formattedUser);
        setEditedData(formattedUser);
        setPreviewUrl(
          userInfo.photo ? `data:image/jpeg;base64,${userInfo.photo}` : ""
        );
        setBlogs(
          userBlogs.map((blog) => ({
            id: blog.id,
            title: blog.title,
            excerpt:
              (blog.content || "").split("\n")[0].substring(0, 140) + "…",
            imageUrl: blog.image
              ? `data:image/jpeg;base64,${blog.image}`
              : FALLBACK_IMG,
            authorName: userInfo.name,
            date: new Date(blog.createdAt)
              .toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
              .toUpperCase(),
          }))
        );
      } catch (err) {
        console.error("Failed to load profile:", err);
        toast({
          title: "Could not load profile",
          description: "Please refresh and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [isLoggedIn, navigate, toast, user, authMethod]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedData(userData);
      setPreviewUrl(
        userData?.photo ? `data:image/jpeg;base64,${userData.photo}` : ""
      );
      setSelectedFile(null);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    setEditedData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setEditedData((prev) => ({ ...prev, photo: null }));
    setPreviewUrl("");
    setSelectedFile(null);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const updatedUser = {
        name: editedData.name,
        phone: editedData.phone,
        linkedin: editedData.linkedin,
        github: editedData.github,
        twitter: editedData.twitter,
        about: editedData.about,
        location: editedData.location,
      };
      if (
        authMethod === "basic" &&
        editedData.password &&
        userData.password !== "OAUTH_PASSWORD"
      ) {
        updatedUser.password = editedData.password;
      }

      await authService.authenticatedFetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });

      if (selectedFile) {
        const formData = new FormData();
        formData.append("photo", selectedFile);
        await authService.authenticatedFetch("/api/users/profile/photo", {
          method: "PATCH",
          body: formData,
        });
      }

      const response = await authService.authenticatedFetch(
        "/api/users/profile",
        { method: "GET" }
      );
      const data = await response.json();
      const userInfo = data.user;
      const joinedDate = new Date(userInfo.createdAt).toLocaleDateString(
        "en-US",
        { month: "long", year: "numeric" }
      );
      const updated = {
        ...userInfo,
        joinedDate,
        location: userInfo.location || "Not specified",
        photo: userInfo.photo || null,
      };
      setUserData(updated);
      setEditedData(updated);
      setPreviewUrl(
        userInfo.photo ? `data:image/jpeg;base64,${userInfo.photo}` : ""
      );
      setIsEditing(false);
      setSelectedFile(null);
      await refreshUser();
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    } catch (err) {
      let msg = "Failed to update profile.";
      if (err.message?.includes("OAuth users cannot set passwords"))
        msg = "OAuth users cannot change passwords.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm("Delete this blog post? This cannot be undone."))
      return;
    try {
      const response = await authService.authenticatedFetch(
        `/api/blogs/${blogId}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.setItem("redirectAfterLogin", "/profile");
          navigate("/login");
          return;
        }
        throw new Error("Failed to delete blog");
      }
      setBlogs((prev) => prev.filter((b) => b.id !== blogId));
      toast({ title: "Blog deleted" });
    } catch {
      toast({
        title: "Delete failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) return <PageSpinner label="Loading profile" />;
  if (!userData && !isLoggedIn) return null;

  const isOAuthUser =
    authMethod === "oauth" || userData?.password === "OAUTH_PASSWORD";

  return (
    <div className="bg-bg min-h-screen pt-20">
      <Section>
        <Container>
          <PageHeader
            eyebrow="Profile"
            title={
              <>
                Your AIDEN
                <span className="text-accent">.</span>
              </>
            }
            description="Manage how you appear to readers and where your published work lives."
            action={
              <Button asChild variant="accent" size="md">
                <Link to="/write-blog">
                  <PenSquare size={14} />
                  Write a post
                </Link>
              </Button>
            }
          />

          {isOAuthUser && (
            <div className="mb-10 flex items-center gap-3 p-3 border border-accent/30 bg-accent/5 text-sm text-ink-muted">
              <ShieldCheck size={16} className="text-accent shrink-0" />
              Signed in via OAuth — no password management needed.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-4 grid gap-6">
              <div className="border border-ink-faint bg-surface p-6">
                <div className="relative w-full aspect-square mb-6 group bg-surface-2 border border-ink-faint overflow-hidden">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={editedData.name || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-subtle">
                      <Camera size={48} strokeWidth={1.5} />
                    </div>
                  )}
                  {isEditing && previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-3 right-3 w-9 h-9 bg-bg border border-danger text-danger flex items-center justify-center hover:bg-danger hover:text-ink transition-colors"
                      aria-label="Remove photo"
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>

                <h2 className="text-2xl font-heading font-bold text-ink leading-tight mb-1">
                  {editedData.name || "User"}
                </h2>
                <p className="text-sm text-ink-muted mb-4 break-all">
                  {editedData.email}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {isOAuthUser ? (
                    <Tag variant="accent">OAuth account</Tag>
                  ) : (
                    <Tag>Email account</Tag>
                  )}
                  {userData?.joinedDate && (
                    <Tag>Joined {userData.joinedDate}</Tag>
                  )}
                </div>

                {isEditing && (
                  <label
                    htmlFor="photo-upload"
                    className="block w-full cursor-pointer border border-dashed border-ink-faint hover:border-accent p-3 text-center transition-colors"
                  >
                    <span className="flex items-center justify-center gap-2 text-sm text-ink-muted">
                      <Camera size={16} />
                      {selectedFile ? selectedFile.name : "Change photo"}
                    </span>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Tabs */}
              <nav className="border border-ink-faint bg-surface" aria-label="Profile sections">
                <TabButton
                  active={activeTab === "info"}
                  onClick={() => setActiveTab("info")}
                  count={null}
                >
                  Profile info
                </TabButton>
                <TabButton
                  active={activeTab === "blogs"}
                  onClick={() => setActiveTab("blogs")}
                  count={blogs.length}
                >
                  My blogs
                </TabButton>
              </nav>
            </aside>

            {/* Main */}
            <div className="lg:col-span-8">
              {activeTab === "info" ? (
                <div className="border border-ink-faint bg-surface p-7 md:p-9">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-heading font-bold tracking-tight">
                      Profile information
                    </h3>
                    <Button
                      onClick={handleEditToggle}
                      variant={isEditing ? "ghost" : "subtle"}
                      size="sm"
                    >
                      {isEditing ? (
                        <>
                          <X size={14} />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit size={14} />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-5">
                      <ProfileField
                        label="Full name"
                        value={editedData.name || ""}
                        name="name"
                        isEditing={isEditing}
                        onChange={handleInputChange}
                      />
                      <ProfileField
                        label="Email"
                        value={editedData.email || ""}
                        isEditing={false}
                        readonly
                      />
                      {!isOAuthUser && isEditing && (
                        <ProfileField
                          label="Password"
                          value=""
                          name="password"
                          type="password"
                          isEditing={isEditing}
                          onChange={handleInputChange}
                          placeholder="Leave blank to keep current"
                        />
                      )}
                      <ProfileField
                        label="Phone"
                        value={editedData.phone || ""}
                        name="phone"
                        isEditing={isEditing}
                        onChange={handleInputChange}
                      />
                      <ProfileField
                        label="LinkedIn"
                        value={editedData.linkedin || ""}
                        name="linkedin"
                        isEditing={isEditing}
                        onChange={handleInputChange}
                        type="url"
                      />
                      <ProfileField
                        label="GitHub"
                        value={editedData.github || ""}
                        name="github"
                        isEditing={isEditing}
                        onChange={handleInputChange}
                        type="url"
                      />
                      <ProfileField
                        label="X (Twitter)"
                        value={editedData.twitter || ""}
                        name="twitter"
                        isEditing={isEditing}
                        onChange={handleInputChange}
                        type="url"
                      />
                    </div>

                    <Field id="about" label="About">
                      {isEditing ? (
                        <Textarea
                          id="about"
                          name="about"
                          value={editedData.about || ""}
                          onChange={handleInputChange}
                          placeholder="Tell readers about yourself…"
                        />
                      ) : (
                        <p className="text-ink-muted leading-relaxed py-2">
                          {editedData.about || "No bio yet."}
                        </p>
                      )}
                    </Field>

                    {isEditing && (
                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={handleSaveChanges}
                          variant="accent"
                          size="lg"
                          disabled={saving}
                        >
                          {saving ? "Saving…" : "Save changes"}
                          <Check size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-ink-faint bg-surface p-7 md:p-9">
                  <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
                    <h3 className="text-2xl font-heading font-bold tracking-tight">
                      My blogs
                      <span className="ml-3 micro-text text-ink-subtle">
                        ({blogs.length})
                      </span>
                    </h3>
                    <Button asChild variant="accent" size="sm">
                      <Link to="/write-blog">
                        <PenSquare size={14} />
                        New blog
                      </Link>
                    </Button>
                  </div>

                  {blogs.length > 0 ? (
                    <div className="grid gap-6">
                      {blogs.map((blog) => (
                        <div key={blog.id} className="relative group">
                          <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                            <Link
                              to={`/edit-blog/${blog.id}`}
                              className="w-9 h-9 bg-bg border border-ink-faint text-ink hover:border-accent hover:text-accent transition-colors flex items-center justify-center"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </Link>
                            <button
                              onClick={() => handleDeleteBlog(blog.id)}
                              className="w-9 h-9 bg-bg border border-ink-faint text-ink hover:border-danger hover:text-danger transition-colors flex items-center justify-center"
                              title="Delete"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                          <BlogCard {...blog} variant="compact" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={PenSquare}
                      title="No blogs yet"
                      description="Your first post is one click away."
                      action={
                        <Button asChild variant="accent" size="lg">
                          <Link to="/write-blog">
                            <Sparkles size={16} />
                            Write your first blog
                          </Link>
                        </Button>
                      }
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
};

const TabButton = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={cn(
      "w-full flex items-center justify-between gap-3 px-5 py-4 text-left text-sm font-heading font-bold uppercase tracking-[0.1em] transition-colors",
      "border-b border-ink-faint last:border-b-0",
      active
        ? "bg-accent text-accent-ink"
        : "text-ink-muted hover:text-ink hover:bg-surface-2"
    )}
  >
    <span>{children}</span>
    {count !== null && count !== undefined && (
      <span
        className={cn(
          "text-xs px-2 py-0.5",
          active ? "bg-accent-ink text-accent" : "bg-surface-2 text-ink-muted"
        )}
      >
        {count}
      </span>
    )}
  </button>
);

const ProfileField = ({
  label,
  value,
  name,
  type = "text",
  isEditing,
  onChange,
  readonly = false,
  placeholder,
}) => (
  <Field id={name} label={label}>
    {isEditing && !readonly ? (
      <Input
        id={name}
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
      />
    ) : (
      <p
        className={cn(
          "text-ink-muted py-2 truncate",
          readonly && "opacity-70"
        )}
      >
        {type === "password" ? "••••••••" : value || "Not specified"}
      </p>
    )}
  </Field>
);

export default UserProfile;

import React, { useState, useContext, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, Bell, PenSquare, User } from "lucide-react";
import { AuthContext } from "../components/AuthContext";
import apiFetch from "../components/utils/api";
import { cn } from "@/lib/utils";
import { relativeTime, isoDate } from "@/lib/time";
import { Button } from "./ui/button";
import UserAvatar from "./UserAvatar";

const NAV_LINKS = [
  { name: "Home", path: "/" },
  { name: "Blogs", path: "/blogs" },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const { isLoggedIn, user, loading, logout } = useContext(AuthContext) || {
    isLoggedIn: false,
    user: null,
    loading: false,
    logout: () => {},
  };

  // Fetch notifications when logged in
  useEffect(() => {
    if (!isLoggedIn || loading) return;
    let active = true;
    (async () => {
      try {
        const res = await apiFetch("/api/notifications");
        if (!res.ok || !active) return;
        const data = await res.json();
        setNotifications(data || []);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    })();
    return () => {
      active = false;
    };
  }, [isLoggedIn, loading]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (isMenuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsNotificationOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNotificationClick = async (notification) => {
    try {
      await apiFetch(`/api/notifications/${notification.id}/mark-read`, {
        method: "POST",
      });
      await apiFetch(`/api/notifications/${notification.id}`, {
        method: "DELETE",
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      navigate(`/blog/${notification.blogId}`);
      setIsNotificationOpen(false);
    } catch (err) {
      console.error("Notification click error", err);
    }
  };

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 w-full z-50 bg-bg border-b border-ink-faint">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo />
          <div className="w-6 h-6 border-2 border-t-accent border-r-ink/30 border-b-ink/10 border-l-ink/60 rounded-full animate-spin" />
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-bg/85 backdrop-blur-md border-b border-ink-faint">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            <DesktopLinks />
            {isLoggedIn ? (
              <DesktopUserMenu
                user={user}
                notifications={notifications}
                unreadCount={unreadCount}
                isNotificationOpen={isNotificationOpen}
                onNotificationToggle={() =>
                  setIsNotificationOpen((v) => !v)
                }
                onNotificationClick={handleNotificationClick}
                onLogout={handleLogout}
                dropdownRef={dropdownRef}
              />
            ) : (
              <AuthButtons />
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden p-2 text-ink hover:text-accent transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <MobileDrawer
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isLoggedIn={isLoggedIn}
        user={user}
        notifications={notifications}
        unreadCount={unreadCount}
        onNotificationClick={handleNotificationClick}
        onLogout={handleLogout}
      />
    </>
  );
};

/* ---------- Sub-components ---------- */

const Logo = () => (
  <Link
    to="/"
    className="text-2xl md:text-3xl font-heading font-bold tracking-tight text-ink no-underline flex items-center"
    aria-label="AIDEN home"
  >
    AIDEN<span className="text-accent">.</span>
  </Link>
);

const DesktopLinks = () => (
  <div className="flex items-center gap-8">
    {NAV_LINKS.map((link) => (
      <NavLink
        key={link.path}
        to={link.path}
        end={link.path === "/"}
        className={({ isActive }) =>
          cn(
            "relative micro-text no-underline transition-colors py-1.5",
            isActive
              ? "text-accent active"
              : "text-ink-muted hover:text-ink"
          )
        }
      >
        {({ isActive }) => (
          <>
            {link.name}
            <span
              aria-hidden
              className={cn(
                "absolute left-0 -bottom-0.5 h-px bg-accent transition-[width] duration-200 ease-brutal",
                isActive ? "w-full" : "w-0"
              )}
            />
          </>
        )}
      </NavLink>
    ))}
  </div>
);

const DesktopUserMenu = ({
  user,
  notifications,
  unreadCount,
  isNotificationOpen,
  onNotificationToggle,
  onNotificationClick,
  onLogout,
  dropdownRef,
}) => (
  <div className="flex items-center gap-4">
    <Button
      asChild
      variant="accent"
      size="sm"
      className="hidden lg:inline-flex"
    >
      <Link to="/write-blog">
        <PenSquare size={14} />
        Write
      </Link>
    </Button>

    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onNotificationToggle}
        className={cn(
          "relative w-10 h-10 border flex items-center justify-center transition-colors",
          isNotificationOpen
            ? "border-accent text-accent"
            : "border-ink-faint text-ink-muted hover:text-ink hover:border-ink"
        )}
        aria-label="Notifications"
        aria-expanded={isNotificationOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-accent text-accent-ink text-[10px] font-bold flex items-center justify-center animate-pulse-dot">
            {unreadCount}
          </span>
        )}
      </button>

      {isNotificationOpen && (
        <NotificationPanel
          notifications={notifications}
          onClick={onNotificationClick}
        />
      )}
    </div>

    <Link
      to="/profile"
      className="flex items-center gap-2 micro-text text-ink-muted hover:text-ink transition-colors"
      aria-label="Profile"
    >
      <UserAvatar
        userImage={user?.photo ? `data:image/jpeg;base64,${user.photo}` : null}
        size="sm"
      />
    </Link>

    <button
      onClick={onLogout}
      className="micro-text text-ink-muted hover:text-danger transition-colors flex items-center gap-2"
      aria-label="Log out"
    >
      <LogOut size={14} />
      <span className="hidden xl:inline">Logout</span>
    </button>
  </div>
);

const NotificationPanel = ({ notifications, onClick }) => (
  <div
    className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-surface border border-ink-faint shadow-brutal z-50 animate-fade-up"
    role="menu"
  >
    <div className="px-4 py-3 border-b border-ink-faint flex items-center justify-between">
      <div className="micro-text text-ink-subtle">Notifications</div>
      {notifications.length > 0 && (
        <div className="text-[10px] text-ink-subtle">
          {notifications.length} total
        </div>
      )}
    </div>
    <div className="max-h-96 overflow-y-auto">
      {notifications.length === 0 ? (
        <div className="p-8 text-center">
          <div className="mx-auto mb-3 w-10 h-10 border border-ink-faint flex items-center justify-center text-ink-subtle">
            <Bell size={16} />
          </div>
          <p className="text-sm text-ink-muted">You're all caught up.</p>
        </div>
      ) : (
        notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => onClick(n)}
            className={cn(
              "w-full text-left px-4 py-3 border-b border-ink-faint/60 last:border-b-0",
              "transition-colors hover:bg-surface-2",
              "flex items-start gap-3"
            )}
          >
            <span
              className={cn(
                "mt-1.5 inline-block w-1.5 h-1.5 shrink-0",
                n.isRead ? "bg-ink-faint" : "bg-accent"
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink font-medium truncate">
                {n.blogTitle}
              </p>
              <p className="text-xs text-ink-subtle truncate">
                by {n.authorEmail}
              </p>
              <time
                dateTime={isoDate(n.createdAt)}
                title={
                  n.createdAt ? new Date(n.createdAt).toLocaleString() : ""
                }
                className="text-[10px] text-ink-faint mt-1 block"
              >
                {relativeTime(n.createdAt)}
              </time>
            </div>
          </button>
        ))
      )}
    </div>
  </div>
);

const AuthButtons = () => (
  <div className="flex items-center gap-3">
    <Button asChild variant="ghost" size="sm">
      <Link to="/login">Sign in</Link>
    </Button>
    <Button asChild variant="accent" size="sm">
      <Link to="/register">Get started</Link>
    </Button>
  </div>
);

/* ---------- Mobile drawer ---------- */

const MobileDrawer = ({
  open,
  onClose,
  isLoggedIn,
  user,
  notifications,
  unreadCount,
  onNotificationClick,
  onLogout,
}) => {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-bg/70 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={cn(
          "fixed top-0 right-0 z-[70] h-full w-full max-w-sm bg-bg border-l border-ink-faint md:hidden",
          "transition-transform duration-300 ease-brutal",
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-ink-faint">
          <Logo />
          <button
            onClick={onClose}
            className="p-2 text-ink hover:text-accent transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-8 grid gap-2">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "block py-3 text-2xl font-heading font-bold tracking-tight no-underline",
                  isActive ? "text-accent" : "text-ink hover:text-accent"
                )
              }
            >
              {link.name}
            </NavLink>
          ))}
          {isLoggedIn && (
            <NavLink
              to="/write-blog"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "block py-3 text-2xl font-heading font-bold tracking-tight no-underline",
                  isActive ? "text-accent" : "text-ink hover:text-accent"
                )
              }
            >
              Write
            </NavLink>
          )}
        </div>

        <div className="mx-6 border-t border-ink-faint pt-6">
          {isLoggedIn ? (
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  userImage={
                    user?.photo ? `data:image/jpeg;base64,${user.photo}` : null
                  }
                  size="md"
                />
                <div>
                  <div className="text-sm text-ink font-medium">
                    {user?.name || "User"}
                  </div>
                  <div className="text-xs text-ink-subtle truncate max-w-[180px]">
                    {user?.email || ""}
                  </div>
                </div>
              </div>

              <Link
                to="/profile"
                onClick={onClose}
                className="flex items-center gap-3 py-3 micro-text text-ink-muted hover:text-ink"
              >
                <User size={14} /> My profile
              </Link>

              <details className="group">
                <summary className="flex items-center gap-3 py-3 micro-text text-ink-muted hover:text-ink cursor-pointer list-none">
                  <Bell size={14} /> Notifications
                  {unreadCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-accent text-accent-ink text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </summary>
                <div className="mt-2 max-h-72 overflow-y-auto border border-ink-faint">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-ink-subtle text-center">
                      You're all caught up.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          onNotificationClick(n);
                          onClose();
                        }}
                        className="w-full text-left px-4 py-3 border-b border-ink-faint/60 last:border-b-0 hover:bg-surface-2"
                      >
                        <p className="text-sm text-ink font-medium truncate">
                          {n.blogTitle}
                        </p>
                        <p className="text-xs text-ink-subtle truncate">
                          by {n.authorEmail}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </details>

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex items-center gap-3 py-3 micro-text text-ink-muted hover:text-danger transition-colors"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link to="/login" onClick={onClose}>
                  Sign in
                </Link>
              </Button>
              <Button asChild variant="accent" size="lg" className="w-full">
                <Link to="/register" onClick={onClose}>
                  Get started
                </Link>
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Navbar;

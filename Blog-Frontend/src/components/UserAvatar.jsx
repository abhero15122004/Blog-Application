import React from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

const dimensions = {
  xs: { box: "w-7 h-7", icon: 14 },
  sm: { box: "w-9 h-9", icon: 16 },
  md: { box: "w-11 h-11", icon: 20 },
  lg: { box: "w-14 h-14", icon: 24 },
  xl: { box: "w-24 h-24", icon: 36 },
  "2xl": { box: "w-32 h-32", icon: 48 },
  "3xl": { box: "w-48 h-48", icon: 64 },
};

const UserAvatar = ({
  userImage = null,
  size = "md",
  isLoggedIn = false,
  interactive = true,
  className,
  onClick,
}) => {
  const navigate = useNavigate();
  const dim = dimensions[size] || dimensions.md;

  const handleClick = (e) => {
    if (onClick) return onClick(e);
    if (interactive) navigate(isLoggedIn ? "/profile" : "/login");
  };

  const Tag = interactive ? "button" : "div";

  return (
    <Tag
      onClick={interactive ? handleClick : undefined}
      type={interactive ? "button" : undefined}
      className={cn(
        dim.box,
        "relative flex items-center justify-center overflow-hidden",
        "border border-ink-faint bg-surface-2 text-ink-muted",
        interactive &&
          "cursor-pointer transition-all hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent",
        className
      )}
      aria-label="User avatar"
    >
      {userImage ? (
        <img
          src={userImage}
          alt="User"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <User size={dim.icon} strokeWidth={1.5} />
      )}
    </Tag>
  );
};

export default UserAvatar;

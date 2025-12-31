interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function getStateVariant(
  state: string
): "default" | "success" | "warning" | "danger" | "info" {
  switch (state) {
    case "planning":
      return "default";
    case "research":
      return "info";
    case "decisions_locked":
      return "warning";
    case "building":
      return "info";
    case "testing":
      return "warning";
    case "ready_to_ship":
      return "success";
    case "live":
      return "success";
    default:
      return "default";
  }
}

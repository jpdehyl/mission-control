interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info";
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: "bg-gray-700 text-gray-300",
  success: "bg-green-900 text-green-300",
  warning: "bg-yellow-900 text-yellow-300",
  error: "bg-red-900 text-red-300",
  info: "bg-blue-900 text-blue-300",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high" | "urgent";
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = {
    low: { emoji: "🟢", label: "Low", variant: "default" as const },
    medium: { emoji: "🔵", label: "Medium", variant: "info" as const },
    high: { emoji: "🟠", label: "High", variant: "warning" as const },
    urgent: { emoji: "🔴", label: "Urgent", variant: "error" as const },
  };

  const { emoji, label, variant } = config[priority];

  return (
    <Badge variant={variant}>
      {emoji} {label}
    </Badge>
  );
}

interface StatusBadgeProps {
  status: "inbox" | "assigned" | "in_progress" | "review" | "done" | "blocked";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    inbox: { label: "Inbox", variant: "default" as const },
    assigned: { label: "Assigned", variant: "info" as const },
    in_progress: { label: "In Progress", variant: "warning" as const },
    review: { label: "Review", variant: "info" as const },
    done: { label: "Done", variant: "success" as const },
    blocked: { label: "Blocked", variant: "error" as const },
  };

  const { label, variant } = config[status];

  return <Badge variant={variant}>{label}</Badge>;
}

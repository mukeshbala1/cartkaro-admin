// src/components/StatusBadge.jsx
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';

const config = {
  approved: {
    label: 'Approved',
    classes: 'bg-success-50 text-success-600 ring-success-500/20',
    icon: CheckCircle2,
  },
  pending: {
    label: 'Pending',
    classes: 'bg-warning-50 text-warning-600 ring-warning-500/20',
    icon: Clock3,
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-danger-50 text-danger-600 ring-danger-500/20',
    icon: XCircle,
  },
};

export default function StatusBadge({ status, size = 'md' }) {
  const c = config[status] || config.pending;
  const Icon = c.icon;
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ring-1 ${c.classes} ${sizeClasses}`}
    >
      <Icon size={size === 'sm' ? 11 : 13} />
      {c.label}
    </span>
  );
}

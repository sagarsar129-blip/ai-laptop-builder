'use client';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning';
}

export default function StatsCard({
  label,
  value,
  icon,
  variant = 'default',
}: StatsCardProps) {
  const variantClasses = {
    default: 'bg-dark border-slate-700',
    success: 'bg-green-900 bg-opacity-20 border-green-700',
    error: 'bg-red-900 bg-opacity-20 border-red-700',
    warning: 'bg-yellow-900 bg-opacity-20 border-yellow-700',
  }[variant];

  return (
    <div className={`rounded-lg p-4 border ${variantClasses} space-y-2`}>
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

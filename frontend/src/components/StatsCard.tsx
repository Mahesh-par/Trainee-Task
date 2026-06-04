import type { LucideIcon } from "lucide-react";

type StatsCardProps = {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
};

export function StatsCard({ label, value, detail, icon: Icon }: StatsCardProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-gray-950">{value}</p>
          <p className="mt-2 text-xs font-medium text-gray-500">{detail}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-navy-800">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
}

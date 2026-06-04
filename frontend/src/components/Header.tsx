type HeaderProps = {
  name: string;
  role: "Admin" | "Trainee";
  title: string;
  subtitle: string;
};

export function Header({ name, role, title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95 px-5 py-4 backdrop-blur lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-950">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-950">{name}</p>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString(undefined, {
                day: "2-digit",
                month: "short",
                year: "numeric"
              })}
            </p>
          </div>
          <span className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy-800">
            {role}
          </span>
        </div>
      </div>
    </header>
  );
}

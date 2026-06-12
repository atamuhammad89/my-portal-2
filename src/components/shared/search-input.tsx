import { Search } from "lucide-react";

type SearchInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Search..."
}: SearchInputProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-200 focus-within:border-[var(--brand-500)] focus-within:shadow-[0_0_10px_rgba(0,240,255,0.1)]"
         style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <Search className="h-4 w-4 text-slate-400" />
      <input
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
      />
    </div>
  );
}

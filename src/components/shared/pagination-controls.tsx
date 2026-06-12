type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPrevious?: () => void;
  onNext?: () => void;
  className?: string;
};

export function PaginationControls({
  page, totalPages, onPrevious, onNext, className
}: PaginationControlsProps) {
  const isPreviousDisabled = page <= 1;
  const isNextDisabled = page >= totalPages;

  return (
    <div
      className={`flex items-center justify-between rounded-xl px-5 py-3 text-sm ${className ?? ""}`}
      style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}
    >
      <span style={{ color: "var(--muted-text)" }}>
        Page <span className="font-semibold text-[var(--brand-500)]">{page}</span> of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          className={`rounded-xl px-4 py-1.5 text-xs font-semibold border transition disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer 
            ${isPreviousDisabled 
              ? "border-[var(--border)] text-[var(--subtle-text)] bg-transparent" 
              : "border-[var(--border)] text-[var(--brand-500)] bg-[rgba(0,240,255,0.03)] hover:bg-white hover:text-black hover:border-white"
            }`}
          type="button"
          onClick={onPrevious}
          disabled={isPreviousDisabled}
        >
          ← Previous
        </button>
        <button
          className={`rounded-xl px-4 py-1.5 text-xs font-semibold border transition disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer
            ${isNextDisabled 
              ? "border-transparent text-[var(--subtle-text)] bg-white/5" 
              : "border-transparent text-black bg-[var(--brand-500)] hover:bg-white hover:text-black hover:border-white"
            }`}
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

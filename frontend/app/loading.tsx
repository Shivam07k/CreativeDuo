export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-lavender-light)] border-t-[var(--color-primary)]" />
        <p className="font-heading text-sm tracking-[3px] text-[var(--color-muted)]">
          Loading...
        </p>
      </div>
    </div>
  );
}

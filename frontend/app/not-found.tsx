import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-heading text-6xl text-[var(--color-secondary)] max-md:text-5xl">
        404
      </h1>
      <p className="text-lg text-[var(--color-muted)]">Page not found</p>
      <div className="h-px w-24 bg-[var(--color-accent)]" />
      <Link
        href="/"
        className="mt-2 inline-flex min-h-[46px] items-center rounded-md bg-[var(--color-primary)] px-6 text-[10px] font-semibold tracking-[1.5px] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-secondary)]"
      >
        BACK TO HOME
      </Link>
    </div>
  );
}

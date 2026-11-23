/**
 * Shown instantly while a page's data loads (Next.js loading.tsx), so a tap
 * gives immediate feedback. Matches the app's layout: top bar, title, cards.
 */
export default function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="min-h-screen bg-slate-950" aria-busy="true">
      <div className="fixed top-0 left-0 right-0 h-16 border-b border-slate-900 bg-slate-950/90" />
      <main className="mx-auto max-w-xl animate-pulse space-y-4 px-5 pt-24 pb-28">
        <div className="h-9 w-40 rounded-lg bg-slate-800/70" />
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="h-24 rounded-xl border border-slate-800 bg-slate-900/60" />
        ))}
      </main>
    </div>
  );
}

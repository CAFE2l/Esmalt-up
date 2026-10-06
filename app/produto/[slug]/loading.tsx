export default function ProductLoading() {
  return (
    <main
      className="min-h-screen bg-[#1c1519] px-4 py-8 sm:px-6"
      aria-label="Carregando produto"
      aria-busy="true"
    >
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-8 h-4 w-64 rounded bg-white/10" />
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square rounded-3xl bg-white/10" />
          <div className="space-y-5">
            <div className="h-8 w-3/4 rounded bg-white/10" />
            <div className="h-5 w-1/3 rounded bg-white/10" />
            <div className="h-40 rounded-3xl bg-white/10" />
            <div className="h-12 rounded-full bg-white/10" />
            <div className="h-12 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </main>
  );
}

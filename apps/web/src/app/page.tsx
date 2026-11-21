import { publicEnv } from '@/config/env';

/** Phase 0 placeholder. The real UI arrives with the design system in Phase 6. */
const HomePage = () => (
  <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
    <h1 className="text-3xl font-semibold tracking-tight">Paritas</h1>
    <p className="text-sm text-neutral-500">
      Reconciliation engine. Foundation is up; the interface lands in Phase 6.
    </p>
    <a
      className="text-sm underline underline-offset-4"
      href={`${publicEnv.NEXT_PUBLIC_API_URL}/api/docs`}
    >
      API documentation
    </a>
  </main>
);

export default HomePage;

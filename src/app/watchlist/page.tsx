export const dynamic = "force-dynamic";

import ClientWatchlist from "./ClientWatchlist";

export default function WatchlistPage() {
  const { user, profile } = require("@/hooks/use-auth").useAuth();
  if (!user || !user.emailVerified || profile?.status !== "ACTIVE") {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Email Verification Required</h2>
        <p className="mb-4">You must verify your email and have an active account to access your watchlist.</p>
        <a href="/verify-email" className="comic-button px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition">Verify Email</a>
      </div>
    );
  }
  return <ClientWatchlist />;
}

export const dynamic = "force-dynamic";

import ClientWatchlist from "./ClientWatchlist";

export default function WatchlistPage() {
  // Server component: just render the client component
  return <ClientWatchlist />;
}

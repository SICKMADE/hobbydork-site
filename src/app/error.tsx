"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  const [details, setDetails] = useState<string | null>(null);

  useEffect(() => {
    // capture stack/message for easier copy-paste
    if (error) {
      setDetails(`${error?.name}: ${error?.message}\n\n${error?.stack}`);
      // eslint-disable-next-line no-console
      console.error('GlobalError caught:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-3xl w-full bg-card border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-2">An application error occurred</h2>
        <p className="text-sm text-muted-foreground mb-4">The app encountered an error. You can copy the details and send them to the developer for debugging.</p>

        <label htmlFor="error-details" className="sr-only">Error details</label>
        <textarea
          id="error-details"
          readOnly
          value={details ?? "(no details)"}
          className="w-full h-56 p-2 bg-transparent border rounded text-sm font-mono"
          placeholder="Error details"
          title="Error details"
        />

        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(details ?? ""); }}>
            Copy
          </Button>
          <Button onClick={() => reset()}>Refresh</Button>
        </div>
      </div>
    </div>
  );
}

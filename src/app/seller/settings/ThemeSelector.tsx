import React, { useState } from "react";
import { storeThemes } from "@/lib/storeThemes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ListingCard from "@/components/ListingCard";
import type { Condition, ListingState, Listing } from "@/lib/types"; // Adjust if needed
import { Timestamp } from "firebase/firestore"; // <-- Import Timestamp

type ThemeSelectorProps = {
  userId: string;
};

const demoListing: Listing = {
  id: "demo",
  listingId: "demo",
  storeId: "demoStore",
  ownerUid: "demoUser",
  title: "Sample Listing",
  description: "This is a sample listing for theme preview.",
  price: 19.99,
  category: "COMICS",
  condition: "NEW" as Condition,
  quantityAvailable: 5,
  quantityTotal: 5,
  state: "ACTIVE" as ListingState,
  primaryImageUrl: "",
  imageUrls: [],
  tags: [],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ userId }) => {
  const [selected, setSelected] = useState<string>("default");
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(storeThemes).map(([key, theme]) => {
          const previewStyle = theme.previewStyle || {};
          return (
            <Card
              key={key}
              className={`transition-all border-2 ${selected === key ? "border-primary ring-2 ring-primary" : "border-zinc-300"}`}
              style={{
                fontFamily: theme.fontFamily,
                background: theme.colors.background,
                color: theme.colors.text,
                borderRadius: theme.borderRadius,
                ...previewStyle,
              }}
              onClick={() => setSelected(key)}
              tabIndex={0}
              role="button"
              aria-pressed={selected === key}
            >
              <CardHeader>
                <CardTitle className="text-lg font-bold" style={{ color: theme.colors.primary }}>{theme.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <ListingCard listing={demoListing} compact />
                </div>
                <div className="text-xs text-muted-foreground">{theme.colors.background} / {theme.colors.primary}</div>
                {theme.details && (
                  <div className="mt-2 text-xs italic text-gray-500">{theme.details}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between mt-2">
        <span className="text-sm">Selected theme: <span className="font-semibold">{storeThemes[selected]?.name}</span></span>
        <button className="comic-button px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition w-full sm:w-auto">Apply Theme</button>
      </div>
    </div>
  );
};

export default ThemeSelector;
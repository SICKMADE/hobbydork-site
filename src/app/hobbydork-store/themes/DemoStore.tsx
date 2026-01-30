
import React from "react";
import { storeThemes } from "@/lib/storeThemes";
import marqueeStyles from "../../store/[id]/marqueeBanner.module.css";
import themeBannerStyles from "../../store/[id]/themeBanners.module.css";
import storeThemePreviewStyles from "../../store/[id]/storeThemePreview.module.css";
import StoreHeader from "./StoreHeader";
import ListingsGrid from "./ListingsGrid";
import ReviewsList from "./ReviewsList";

// Static sample data for realistic preview
const demoStore = {
  storeName: "Sample Hobby Shop",
  about: "A place for all your hobby needs!",
  avatarUrl: "/hobbydork-head.png",
  storeImageUrl: "/store.png",
  listings: [
    { id: 1, title: "Dice Set", image: "/dice.png", price: 12, quantityAvailable: 5, category: "TOYS", createdText: "2 days ago" },
    { id: 2, title: "Model Kit", image: "/kit.png", price: 28, quantityAvailable: 2, category: "OTHER", createdText: "5 days ago" },
    { id: 3, title: "Trading Cards", image: "/cards.png", price: 5, quantityAvailable: 10, category: "POKEMON_CARDS", createdText: "1 week ago" },
    { id: 4, title: "Comic Book", image: "/comic.png", price: 8, quantityAvailable: 3, category: "COMIC_BOOKS", createdText: "3 days ago" },
  ],
  reviews: [
    { id: 1, rating: 5, comment: "Great selection and fast shipping!", orderId: "A1B2C3D4", createdText: "1 day ago" },
    { id: 2, rating: 4, comment: "Nice packaging, will buy again.", orderId: "E5F6G7H8", createdText: "4 days ago" },
  ],
  itemsSold: 42,
  sellerTier: "GOLD",
};




function RenderStars({ avg, size = 14 }: { avg: number | null; size?: number }) {
  const value = Math.max(0, Math.min(5, avg ?? 0));
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const max = 5;
  const sizeClass =
    size === 14
      ? storeThemePreviewStyles.starSize14
      : size === 18
      ? storeThemePreviewStyles.starSize18
      : storeThemePreviewStyles.starSizeCustom;
  return (
    <div
      className={[storeThemePreviewStyles.starsRow, sizeClass].join(' ')}
      aria-label={avg ? `${avg.toFixed(1)} out of 5 stars` : "No rating"}
    >
      {Array.from({ length: max }).map((_, i) => {
        const index = i + 1;
        const isFull = index <= full;
        const isHalf = !isFull && half && index === full + 1;
        return (
          <span
            key={i}
            className={isFull || isHalf ? storeThemePreviewStyles.starFull : storeThemePreviewStyles.starEmpty}
          >
            {isFull ? "★" : isHalf ? "☆" : "☆"}
          </span>
        );
      })}
    </div>
  );
}

// Tier badge for realism
function renderTierBadge(tier: string | undefined) {
  if (tier === "GOLD") return <span className={storeThemePreviewStyles.tierBadgeGold}>Gold Seller</span>;
  if (tier === "SILVER") return <span className={storeThemePreviewStyles.tierBadgeSilver}>Silver Seller</span>;
  return null;
}

// Add index signature to CATEGORY_LABELS for string
const CATEGORY_LABELS: Record<string, string> = {
  COMIC_BOOKS: "Comic books",
  SPORTS_CARDS: "Sports cards",
  POKEMON_CARDS: "Pokémon cards",
  VIDEO_GAMES: "Video games",
  TOYS: "Toys",
  OTHER: "Other",
};

interface DemoStoreProps {
  themeId: string;
}

export default function DemoStore({ themeId }: DemoStoreProps) {
  // Always use the actual themeId if it exists, otherwise use 'default'
  const theme = storeThemes[themeId] || storeThemes["default"];
  const themeKey = themeId in storeThemes ? themeId : "default";
  // Show all relevant placeholder items for preview
  const previewListings = [
    { id: 1, title: "Graded Pokémon Card", image: "/pokemoncards.png", price: 120, quantityAvailable: 1, category: "POKEMON_CARDS", createdText: "Just now" },
    { id: 2, title: "Sports Card", image: "/sportscards.png", price: 85, quantityAvailable: 2, category: "SPORTS_CARDS", createdText: "Today" },
    { id: 3, title: "Comic Book", image: "/comic.png", price: 15, quantityAvailable: 5, category: "COMIC_BOOKS", createdText: "1 day ago" },
    { id: 4, title: "Video Game", image: "/videogames.png", price: 40, quantityAvailable: 3, category: "VIDEO_GAMES", createdText: "2 days ago" },
    { id: 5, title: "Toy", image: "/toys.png", price: 10, quantityAvailable: 8, category: "TOYS", createdText: "3 days ago" },
  ];
  const previewReviews = demoStore.reviews;
  const ratingValues = previewReviews.map((r) => r.rating || 0).filter((n) => n > 0);
  const ratingCount = ratingValues.length;
  const ratingAverage = ratingCount > 0 ? ratingValues.reduce((a, b) => a + b, 0) / ratingCount : null;

  // Build style object for preview using theme.previewStyle and theme.colors
  const previewStyle: React.CSSProperties = theme.previewStyle
    ? {
        backgroundImage: theme.previewStyle.backgroundImage,
        backgroundColor: theme.previewStyle.backgroundColor,
        backgroundSize: theme.previewStyle.backgroundSize,
        backgroundPosition: theme.previewStyle.backgroundPosition,
        backgroundRepeat: theme.previewStyle.backgroundRepeat,
        color: theme.colors.text,
        fontFamily: theme.fontFamily,
        borderRadius: theme.borderRadius,
        boxShadow: theme.previewStyle.boxShadow,
        border: theme.previewStyle.border,
        maxWidth: theme.previewStyle.maxWidth,
        margin: theme.previewStyle.margin,
        padding: theme.previewStyle.padding,
      }
    : {};

  return (
    <div
      className={storeThemePreviewStyles.storeThemePreview}
      style={previewStyle}
    >
      {/* THEME-SPECIFIC BANNERS */}
      {themeId === "elegant" && (
        <div className={marqueeStyles.marqueeBannerWrapper}>
          <div className={marqueeStyles.marqueeBanner}>
            <div className={marqueeStyles.marqueeBulbsTop}>
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className={[
                    marqueeStyles.marqueeBulb,
                    i % 2 === 0 ? marqueeStyles.marqueeBulbYellow : marqueeStyles.marqueeBulbWhite,
                    marqueeStyles.marqueeBulbDelay,
                    marqueeStyles.marqueeBulbDelayDynamic,
                  ].join(" ")}
                  data-delay={i * 0.08}
                />
              ))}
            </div>
            <span role="img" aria-label="marquee">🎟️</span> Marquee: Show-stopping Vegas style!
            <div className={marqueeStyles.marqueeBulbsBottom}>
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className={[
                    marqueeStyles.marqueeBulb,
                    i % 2 === 0 ? marqueeStyles.marqueeBulbYellow : marqueeStyles.marqueeBulbWhite,
                    marqueeStyles.marqueeBulbDelay,
                    marqueeStyles.marqueeBulbDelayDynamic,
                  ].join(" ")}
                  data-delay={i * 0.08 + 0.6}
                />
              ))}
            </div>
            <div className={marqueeStyles.marqueeBillboardPosts}>
              <div className={marqueeStyles.marqueeBillboardPost} />
              <div className={marqueeStyles.marqueeBillboardPost} />
              <div className={marqueeStyles.marqueeBillboardPost} />
            </div>
          </div>
        </div>
      )}
      {themeId === "retro" && (
        <div className={themeBannerStyles.retroBannerWrapper}>
          <div className={themeBannerStyles.retroBanner}>
            <span role="img" aria-label="retro">🕹️</span> Retro Mode: Enjoy a playful, nostalgic look!
          </div>
        </div>
      )}
      {themeId === "hobbyshop" && (
        <div className={themeBannerStyles.hobbyshopBanner}>
          <span role="img" aria-label="hobbyshop">🏪</span> Hobby Shop: Cozy, fun, and full of personality!
        </div>
      )}
      {themeId === "dark" && (
        <div className={themeBannerStyles.darkBanner}>
          <span role="img" aria-label="dark">🌙</span> Dark Mode: Sleek and easy on the eyes.
        </div>
      )}

      {/* Store banner image with billboard for Urban theme */}
      {themeId === 'urban' ? (
        <div className={storeThemePreviewStyles.urbanBillboardWrapper}>
          <svg
            width="520"
            height="400"
            viewBox="0 0 520 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', margin: '0 auto', position: 'relative', zIndex: 2 }}
          >
            {/* Billboard frame (more vertical, pure white, thick black border) */}
            <rect x="90" y="40" width="340" height="260" rx="18" fill="#fff" stroke="#bbb" strokeWidth="12" />
            {/* Lights (attached to top of billboard, adjusted for new size) */}
            {Array.from({ length: 5 }).map((_, i) => (
              <g key={i}>
                {/* Light arm */}
                <rect x={140 + i * 60} y="20" width="4" height="28" rx="2" fill="#111" />
                {/* Light head */}
                <rect x={130 + i * 60} y="8" width="24" height="14" rx="4" fill="#222" stroke="#111" strokeWidth="2" />
              </g>
            ))}
            {/* Billboard screen image (fills billboard area, more vertical fit) */}
            <foreignObject x="105" y="60" width="310" height="220">
              <img
                src={demoStore.storeImageUrl}
                alt="Store banner"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
              />
            </foreignObject>
          </svg>
        </div>
      ) : (
        <div
          className={storeThemePreviewStyles.storeBannerWrapper}
          data-banner-border={`4px solid ${theme.colors.primary}`}
        >
          <img
            src={demoStore.storeImageUrl}
            alt="Store banner"
            className={storeThemePreviewStyles.storeBannerImage}
            data-banner-radius={theme.borderRadius || '12px'}
          />
          <div className={storeThemePreviewStyles.storeBannerGradient} />
        </div>
      )}

      {/* Store info header */}
      <StoreHeader
        storeName={demoStore.storeName}
        about={demoStore.about}
        avatarUrl={demoStore.avatarUrl}
        sellerTier={demoStore.sellerTier}
        ratingAverage={ratingAverage}
        ratingCount={ratingCount}
        itemsSold={demoStore.itemsSold}
        theme={theme}
        renderTierBadge={renderTierBadge}
        RenderStars={RenderStars}
      />

      {/* Listings grid */}

      <ListingsGrid
        listings={previewListings}
        theme={theme}
        CATEGORY_LABELS={CATEGORY_LABELS}
      />

      {/* Reviews */}
      <ReviewsList
        reviews={previewReviews}
        theme={theme}
        RenderStars={RenderStars}
      />
    </div>
  );
}

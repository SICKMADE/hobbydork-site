import React from "react";
import styles from "./StoreHeader.module.css";

interface StoreHeaderProps {
  storeName: string;
  about: string;
  avatarUrl: string;
  sellerTier?: string;
  ratingAverage: number | null;
  ratingCount: number;
  itemsSold: number;
  theme: any;
  themeKey?: string;
  renderTierBadge: (tier: string | undefined) => React.ReactNode;
  RenderStars: React.FC<{ avg: number | null; size?: number }>;
}



const StoreHeader: React.FC<StoreHeaderProps> = ({
  storeName,
  about,
  avatarUrl,
  sellerTier,
  ratingAverage,
  ratingCount,
  itemsSold,
  theme = { colors: { primary: '#2563eb', text: '#222' } },
  themeKey = 'default',
  renderTierBadge,
  RenderStars,
}) => (
  <div className={styles["store-header-root"]}
    data-primary={theme.colors.primary}
    data-text={theme.colors.text}
    data-border={`4px solid ${theme.colors.primary}`}
  >

    <div style={{
      position: 'relative',
      width: '72px',
      height: '72px',
      margin: '0 auto',
      background: themeKey === 'default' ? "#23272e url('/grid.svg') center/80px 80px repeat" : theme.colors.background,
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <img
        src={avatarUrl}
        alt="avatar"
        className={styles["store-header-avatar"]}
        style={{
          position: 'relative',
          zIndex: 2,
        }}
      />
      {/* Tape corners for default theme */}
      {themeKey === 'default' && (
        <>
          <div className={styles["tape-corner"] + " " + styles["tape-corner-tl"]} />
          <div className={styles["tape-corner"] + " " + styles["tape-corner-tr"]} />
          <div className={styles["tape-corner"] + " " + styles["tape-corner-bl"]} />
          <div className={styles["tape-corner"] + " " + styles["tape-corner-br"]} />
        </>
      )}
    </div>
    <div className={styles["store-header-content"]}>
      <div className={styles["store-header-title"]}>
        {storeName} {renderTierBadge(sellerTier)}
      </div>
      <div className={styles["store-header-meta"]}>
        {ratingCount > 0 ? (
          <>
            <RenderStars avg={ratingAverage ?? 0} size={16} />
            <span className={styles["store-header-rating"]}>
              {ratingAverage?.toFixed(1)} • {ratingCount} review{ratingCount === 1 ? "" : "s"}
            </span>
          </>
        ) : (
          <span className={styles["store-header-rating"]}>No reviews yet</span>
        )}
        <span className={styles["store-header-sold"]}>{itemsSold} items sold</span>
      </div>
      {about && (
        <p className={styles["store-header-about"]}>{about}</p>
      )}
    </div>
  </div>
);

export default StoreHeader;

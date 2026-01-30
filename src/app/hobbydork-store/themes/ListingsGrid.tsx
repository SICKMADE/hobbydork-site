
import React from "react";
import styles from "./ListingsGrid.module.css";

interface Listing {
  id: number;
  title: string;
  image: string;
  price: number;
  quantityAvailable: number;
  category: string;
  createdText: string;
}

interface ListingsGridProps {
  listings: Listing[];
  theme: any;
  CATEGORY_LABELS: Record<string, string>;
}

const ListingsGrid: React.FC<ListingsGridProps> = ({ listings, theme, CATEGORY_LABELS }) => (
  <div
    className={styles["listings-grid-root"]}
  >
    <div className={styles["listings-grid-header"]}>
      <span>Active listings</span>
      <span className={styles["listings-grid-count"]}>({listings.length})</span>
    </div>
    <div className={styles["listings-grid-items"]}>
      {listings.map((listing) => (
        <div key={listing.id} className={styles["listings-grid-item"]}>
          <img src={listing.image} alt={listing.title} className={styles["listings-grid-img"]} />
          <div className={styles["listings-grid-title"]}>{listing.title}</div>
          <div className={styles["listings-grid-category"]}>{CATEGORY_LABELS[listing.category]}</div>
          <div className={styles["listings-grid-price"]}>${listing.price}</div>
          <div className={styles["listings-grid-stock"]}>{listing.quantityAvailable} in stock</div>
          <div className={styles["listings-grid-date"]}>{listing.createdText}</div>
        </div>
      ))}
    </div>
  </div>
);

export default ListingsGrid;

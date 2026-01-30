
import React from "react";
import styles from "./ReviewsList.module.css";

interface Review {
  id: number;
  rating: number;
  comment: string;
  orderId: string;
  createdText: string;
}

interface ReviewsListProps {
  reviews: Review[];
  theme: any;
  RenderStars: React.FC<{ avg: number | null; size?: number }>;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ reviews, theme, RenderStars }) => (
  <div
    className={styles["reviews-list-root"]}
    data-primary={theme.colors.primary}
    data-text={theme.colors.text}
    data-background={theme.colors.background}
    data-border={`2px solid ${theme.colors.primary}`}
  >
    <div className={styles["reviews-list-header"]}>
      <span>Recent reviews</span>
      <span className={styles["reviews-list-count"]}>({reviews.length})</span>
    </div>
    <div className={styles["reviews-list-items"]}>
      {reviews.map((review) => (
        <div key={review.id} className={styles["reviews-list-item"]}>
          <div className={styles["review-stars-row"]}>
            <RenderStars avg={review.rating} size={14} />
            <span className={styles["review-rating"]}>{review.rating}.0</span>
            <span className={styles["review-date"]}>{review.createdText}</span>
          </div>
          <div className={styles["review-comment"]}>{review.comment}</div>
          <div className={styles["review-order"]}>From order #{review.orderId}</div>
        </div>
      ))}
    </div>
  </div>
);

export default ReviewsList;

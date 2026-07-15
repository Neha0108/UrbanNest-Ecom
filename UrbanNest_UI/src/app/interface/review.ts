export interface Review {
  reviewId: number;
  productId: number;
  productName: string;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  helpfulCount: number;
  markedHelpfulByMe: boolean;
  replyMessage: string | null;
  replyDate: string | null;
}

export interface RatingBreakdown {
  star: number;
  count: number;
  percent: number;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  recommendPercent: number;
  breakdown: RatingBreakdown[];
}
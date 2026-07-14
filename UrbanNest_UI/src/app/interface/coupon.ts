export type DiscountType = 'Flat' | 'Percentage';
export type CouponScope = 'Global' | 'Retailer';

export interface Coupon {
  couponId: number;
  couponCode: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscount?: number | null;
  startDate: string;
  expiryDate: string;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  couponScope: CouponScope;
  retailerId?: number | null;
  retailerShopName?: string | null;
  createdByName: string;
  createdAt: string;
  isExpired: boolean;
  isUpcoming: boolean;
}

export interface CouponCreate {
  couponCode: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscount?: number | null;
  startDate: string;
  expiryDate: string;
  usageLimit?: number | null;
  couponScope: CouponScope;
  retailerId?: number | null;
}

export interface CouponUpdate {
  description: string;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscount?: number | null;
  startDate: string;
  expiryDate: string;
  usageLimit?: number | null;
  isActive: boolean;
}
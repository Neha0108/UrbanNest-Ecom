import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Consumer } from '../../../service/consumer';
import { CartItem } from '../../../interface/cart-item';
import { Product } from '../../../interface/product';
import { Coupon } from '../../../interface/coupon';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // ← FormsModule added for [(ngModel)]
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  private consumerService = inject(Consumer);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private chng = inject(ChangeDetectorRef);

  cartItems: CartItem[] = [];
  recommendedProducts: Product[] = [];
  loading = true;
  updatingId: number | null = null;
  removingId: number | null = null;

  readonly shippingThreshold = 999;
  readonly shippingFee = 49;
  readonly taxRate = 0.05;

  // ---- Coupon state ----
  availableCoupons: Coupon[] = [];
  loadingCoupons = true;
  couponCode = '';
  appliedCoupon: Coupon | null = null;
  couponError = '';
  applyingCoupon = false;
  private pendingCouponFromUrl = '';

  ngOnInit(): void {
    this.loadCart();
    this.loadRecommendations();
    this.loadCoupons();

    // Pre-fill code if user arrived via "Apply Now" on the Offers page
    this.route.queryParams.subscribe((params) => {
      if (params['coupon']) {
        this.couponCode = params['coupon'];
        this.pendingCouponFromUrl = params['coupon'];
        this.tryAutoApply();
      }
    });
  }

  loadCart(): void {
    this.loading = true;
    this.consumerService.getCartItems().subscribe({
      next: (res: any[]) => {
        this.cartItems = res.map((item) => ({
          ProductId: item.productId,
          ProductName: item.productName,
          ProductPrice: item.productPrice,
          ImagePath: item.imagePath,
          Quantity: item.quantity,
        }));
        this.loading = false;
        this.tryAutoApply();
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load cart', err);
        this.loading = false;
        this.chng.detectChanges();
      },
    });
  }

  loadRecommendations(): void {
    this.consumerService.allProducts().subscribe({
      next: (data: Product[]) => {
        this.recommendedProducts = data.slice(0, 6);
        this.chng.detectChanges();
      },
      error: (err) => console.error('Failed to load recommendations', err),
    });
  }

  loadCoupons(): void {
    this.loadingCoupons = true;
    this.consumerService.getactiveCoupons().subscribe({
      next: (data: Coupon[]) => {
        this.availableCoupons = data;
        this.loadingCoupons = false;
        this.tryAutoApply();
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load coupons', err);
        this.loadingCoupons = false;
        this.chng.detectChanges();
      },
    });
  }

  // Only fires once cart + coupons + the ?coupon= param are all present
  private tryAutoApply(): void {
    if (
      this.pendingCouponFromUrl &&
      !this.loading &&
      !this.loadingCoupons &&
      this.availableCoupons.length &&
      !this.appliedCoupon
    ) {
      this.applyCoupon();
      this.pendingCouponFromUrl = '';
    }
  }

  applyCoupon(): void {
    const code = this.couponCode.trim().toUpperCase();
    this.couponError = '';

    if (!code) {
      this.couponError = 'Enter a coupon code';
      return;
    }

    this.applyingCoupon = true;

    const match = this.availableCoupons.find(
      (c) => c.couponCode.toUpperCase() === code
    );

    if (!match) {
      this.appliedCoupon = null;
      this.couponError = 'Invalid or expired coupon code';
      this.applyingCoupon = false;
      return;
    }

    if (match.minimumOrderAmount > 0 && this.subtotal < match.minimumOrderAmount) {
      this.appliedCoupon = null;
      this.couponError = `Add ₹${match.minimumOrderAmount - this.subtotal} more to use this coupon`;
      this.applyingCoupon = false;
      return;
    }

    this.appliedCoupon = match;
    this.couponCode = match.couponCode;
    this.applyingCoupon = false;
  }

  selectCoupon(c: Coupon): void {
    this.couponCode = c.couponCode;
    this.applyCoupon();
  }

  removeCoupon(): void {
    this.appliedCoupon = null;
    this.couponCode = '';
    this.couponError = '';
  }

  increaseQty(item: CartItem): void {
    this.updateQty(item, item.Quantity + 1);
  }

  decreaseQty(item: CartItem): void {
    if (item.Quantity <= 1) return;
    this.updateQty(item, item.Quantity - 1);
  }

  private updateQty(item: CartItem, newQty: number): void {
    this.updatingId = item.ProductId;
    this.consumerService.updateQuantity(item.ProductId, newQty).subscribe({
      next: () => {
        item.Quantity = newQty;
        this.updatingId = null;
        this.revalidateCoupon();
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to update quantity', err);
        this.updatingId = null;
        this.chng.detectChanges();
      },
    });
  }

  removeItem(item: CartItem): void {
    this.removingId = item.ProductId;
    this.consumerService.removeFromCart(item.ProductId).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter((i) => i.ProductId !== item.ProductId);
        this.removingId = null;
        this.revalidateCoupon();
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to remove item', err);
        this.removingId = null;
        this.chng.detectChanges();
      },
    });
  }

  // If qty/removal drops subtotal below the applied coupon's minimum, drop it
  private revalidateCoupon(): void {
    if (
      this.appliedCoupon &&
      this.appliedCoupon.minimumOrderAmount > 0 &&
      this.subtotal < this.appliedCoupon.minimumOrderAmount
    ) {
      this.couponError = `"${this.appliedCoupon.couponCode}" removed — order no longer meets the minimum`;
      this.appliedCoupon = null;
    }
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.ProductPrice * item.Quantity, 0);
  }

  get discount(): number {
    if (!this.appliedCoupon) return 0;
    const { discountType, discountValue } = this.appliedCoupon;
    const raw = discountType === 'Flat' ? discountValue : (this.subtotal * discountValue) / 100;
    return Math.min(Math.round(raw), this.subtotal);
  }

  get shipping(): number {
    if (this.cartItems.length === 0) return 0;
    return this.subtotal >= this.shippingThreshold ? 0 : this.shippingFee;
  }

  get tax(): number {
    return Math.round((this.subtotal - this.discount) * this.taxRate);
  }

  get total(): number {
    return this.subtotal - this.discount + this.shipping + this.tax;
  }

  get amountToFreeShipping(): number {
    return Math.max(0, this.shippingThreshold - this.subtotal);
  }

  goToProduct(product: Product): void {
    this.router.navigate(['/consumerNavbar/product-details', product.productId]);
  }

  proceedToCheckout(): void {
    this.router.navigate(['/consumerNavbar/checkout'], {
      queryParams: this.appliedCoupon ? { coupon: this.appliedCoupon.couponCode } : {},
    });
  }

  trackByProductId(index: number, item: CartItem): number {
    return item.ProductId;
  }
}
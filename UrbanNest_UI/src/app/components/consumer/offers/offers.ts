import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Coupon } from '../../../interface/coupon';
import { Consumer } from '../../../service/consumer';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offers.html',
  styleUrls: ['./offers.css'],
})
export class Offers implements OnInit {
  private couponService = inject(Consumer);
  private router = inject(Router);
  private chng = inject(ChangeDetectorRef);

  // When used as a compact widget (e.g. on the home page), pass [compact]="true"
  // and optionally [limit]="4" to show a smaller teaser grid.
  @Input() compact = false;
  @Input() limit: number | null = null;

  coupons: Coupon[] = [];
  loading = true;
  errorMessage = '';
  copiedCode: string | null = null;

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.loading = true;
    this.errorMessage = '';

    this.couponService.getactiveCoupons().subscribe({
      next: (data) => {
        this.coupons = this.limit ? data.slice(0, this.limit) : data;
        this.loading = false;
        this.chng.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load offers.';
        this.loading = false;
        this.chng.detectChanges();
      },
    });
  }

  discountLabel(c: Coupon): string {
    return c.discountType === 'Flat' ? `₹${c.discountValue} OFF` : `${c.discountValue}% OFF`;
  }

  scopeLabel(c: Coupon): string {
    return c.couponScope === 'Retailer' && c.retailerShopName
      ? `Only on ${c.retailerShopName}`
      : 'Site-wide offer';
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.copiedCode = code;
      setTimeout(() => {
        this.copiedCode = null;
        this.chng.detectChanges();
      }, 1500);
      this.chng.detectChanges();
    });
  }

  applyAtCheckout(c: Coupon): void {
    // Carries the coupon code to the cart so it can be pre-filled and applied there.
    this.router.navigate(['/consumerNavbar/cart'], {
      queryParams: { coupon: c.couponCode },
    });
  }

  viewAllOffers(): void {
    this.router.navigate(['/consumerNavbar/offers']);
  }

  trackByCouponId(index: number, c: Coupon): number {
    return c.couponId;
  }
}
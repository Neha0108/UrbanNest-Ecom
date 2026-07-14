import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Retailer } from '../../../service/retailer';
import { Coupon, CouponCreate, CouponUpdate, DiscountType } from '../../../interface/coupon';

type CouponFormState = {
  couponCode: string;
  description: string;
  discountType: DiscountType;
  discountValue: number | null;
  minimumOrderAmount: number | null;
  maximumDiscount: number | null;
  startDate: string;
  expiryDate: string;
  usageLimit: number | null;
};

const emptyForm = (): CouponFormState => ({
  couponCode: '',
  description: '',
  discountType: 'Flat',
  discountValue: null,
  minimumOrderAmount: 0,
  maximumDiscount: null,
  startDate: new Date().toISOString().slice(0, 10),
  expiryDate: '',
  usageLimit: null,
});

@Component({
  selector: 'app-retailer-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coupons.html',
  styleUrl: './coupons.css',
})
export class Coupons implements OnInit {
  private retailerService = inject(Retailer);
  private chng = inject(ChangeDetectorRef);

  coupons: Coupon[] = [];
  loading = true;
  errorMessage = '';

  searchTerm = '';
  statusFilter: 'All' | 'Active' | 'Inactive' | 'Expired' | 'Upcoming' = 'All';

  showFormModal = false;
  editingCoupon: Coupon | null = null;
  form: CouponFormState = emptyForm();
  formError = '';
  saving = false;

  copiedCode: string | null = null;

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.loading = true;
    this.errorMessage = '';

    this.retailerService.getMyCoupons().subscribe({
      next: (data) => {
        this.coupons = data;
        this.loading = false;
        this.chng.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load coupons.';
        this.loading = false;
        this.chng.detectChanges();
      },
    });
  }

  get filteredCoupons(): Coupon[] {
    return this.coupons.filter((c) => {
      const matchesSearch =
        !this.searchTerm ||
        c.couponCode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(this.searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      switch (this.statusFilter) {
        case 'Active':
          return c.isActive && !c.isExpired && !c.isUpcoming;
        case 'Inactive':
          return !c.isActive;
        case 'Expired':
          return c.isExpired;
        case 'Upcoming':
          return c.isUpcoming;
        default:
          return true;
      }
    });
  }

  statusBadge(c: Coupon): { label: string; cls: string } {
    if (c.isExpired) return { label: 'Expired', cls: 'badge-expired' };
    if (!c.isActive) return { label: 'Inactive', cls: 'badge-inactive' };
    if (c.isUpcoming) return { label: 'Upcoming', cls: 'badge-upcoming' };
    return { label: 'Active', cls: 'badge-active' };
  }

  discountLabel(c: Coupon): string {
    return c.discountType === 'Flat' ? `₹${c.discountValue} OFF` : `${c.discountValue}% OFF`;
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

  openCreateModal(): void {
    this.editingCoupon = null;
    this.form = emptyForm();
    this.formError = '';
    this.showFormModal = true;
  }

  openEditModal(c: Coupon): void {
    this.editingCoupon = c;
    this.form = {
      couponCode: c.couponCode,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minimumOrderAmount: c.minimumOrderAmount,
      maximumDiscount: c.maximumDiscount ?? null,
      startDate: c.startDate.slice(0, 10),
      expiryDate: c.expiryDate.slice(0, 10),
      usageLimit: c.usageLimit ?? null,
    };
    this.formError = '';
    this.showFormModal = true;
  }

  closeModal(): void {
    this.showFormModal = false;
    this.editingCoupon = null;
  }

  submitForm(): void {
    this.formError = '';

    if (!this.editingCoupon && !this.form.couponCode.trim()) {
      this.formError = 'Coupon code is required';
      return;
    }
    if (!this.form.discountValue || this.form.discountValue <= 0) {
      this.formError = 'Discount value must be greater than 0';
      return;
    }
    if (this.form.discountType === 'Percentage' && this.form.discountValue > 100) {
      this.formError = 'Percentage discount cannot exceed 100';
      return;
    }
    if (!this.form.expiryDate) {
      this.formError = 'Expiry date is required';
      return;
    }
    if (new Date(this.form.expiryDate) <= new Date(this.form.startDate)) {
      this.formError = 'Expiry date must be after start date';
      return;
    }

    this.saving = true;

    if (this.editingCoupon) {
      const dto: CouponUpdate = {
        description: this.form.description,
        discountValue: this.form.discountValue!,
        minimumOrderAmount: this.form.minimumOrderAmount ?? 0,
        maximumDiscount: this.form.maximumDiscount,
        startDate: this.form.startDate,
        expiryDate: this.form.expiryDate,
        usageLimit: this.form.usageLimit,
        isActive: this.editingCoupon.isActive,
      };

      this.retailerService.updateCoupon(this.editingCoupon.couponId, dto).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadCoupons();
        },
        error: (err) => {
          this.saving = false;
          this.formError = err?.error?.message || 'Failed to update coupon.';
          this.chng.detectChanges();
        },
      });
    } else {
      const dto: CouponCreate = {
        couponCode: this.form.couponCode.trim().toUpperCase(),
        description: this.form.description,
        discountType: this.form.discountType,
        discountValue: this.form.discountValue!,
        minimumOrderAmount: this.form.minimumOrderAmount ?? 0,
        maximumDiscount: this.form.maximumDiscount,
        startDate: this.form.startDate,
        expiryDate: this.form.expiryDate,
        usageLimit: this.form.usageLimit,
        couponScope: 'Retailer',
      };

      this.retailerService.createCoupon(dto).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadCoupons();
        },
        error: (err) => {
          this.saving = false;
          this.formError = err?.error?.message || 'Failed to create coupon.';
          this.chng.detectChanges();
        },
      });
    }
  }

  toggleStatus(c: Coupon): void {
    const dto: CouponUpdate = {
      description: c.description,
      discountValue: c.discountValue,
      minimumOrderAmount: c.minimumOrderAmount,
      maximumDiscount: c.maximumDiscount,
      startDate: c.startDate.slice(0, 10),
      expiryDate: c.expiryDate.slice(0, 10),
      usageLimit: c.usageLimit,
      isActive: !c.isActive,
    };

    this.retailerService.updateCoupon(c.couponId, dto).subscribe({
      next: () => this.loadCoupons(),
      error: () => {
        this.errorMessage = 'Failed to update status.';
        this.chng.detectChanges();
      },
    });
  }

  deleteCoupon(c: Coupon): void {
    const confirmed = confirm(`Delete coupon "${c.couponCode}"? This cannot be undone.`);
    if (!confirmed) return;

    this.retailerService.deleteCoupon(c.couponId).subscribe({
      next: () => {
        this.coupons = this.coupons.filter((x) => x.couponId !== c.couponId);
        this.chng.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to delete coupon.';
        this.chng.detectChanges();
      },
    });
  }
}
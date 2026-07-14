import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // ← ActivatedRoute added
import { Consumer } from '../../../service/consumer';
import { Address } from '../../../interface/address';
import { CartItem } from '../../../interface/cart-item';
import { Coupon } from '../../../interface/coupon';

declare var Razorpay: any;

type CheckoutStep = 'address' | 'payment' | 'review';
type PaymentMethod = 'razorpay' | 'cod';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  private consumerService = inject(Consumer);
  private router = inject(Router);
  private route = inject(ActivatedRoute); // ← added
  private fb = inject(FormBuilder);
  private chng = inject(ChangeDetectorRef);

  step: CheckoutStep = 'address';

  addresses: Address[] = [];
  selectedAddressId: number | null = null;
  showAddressForm = false;
  loadingAddresses = true;

  cartItems: CartItem[] = [];
  loadingCart = true;
  placingOrder = false;

  paymentMethod: PaymentMethod = 'razorpay';

  // ---- Coupon state ----
  availableCoupons: Coupon[] = [];
  appliedCoupon: Coupon | null = null;
  couponFromUrl = '';

  addressForm = this.fb.group({
    fullName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    addressLine: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    isDefault: [false],
  });

  readonly steps: { key: CheckoutStep; label: string }[] = [
    { key: 'address', label: 'Address' },
    { key: 'payment', label: 'Payment' },
    { key: 'review', label: 'Review' },
  ];

  ngOnInit(): void {
    this.loadAddresses();
    this.loadCart();
    this.loadCoupons();

    this.route.queryParams.subscribe((params) => {
      if (params['coupon']) {
        this.couponFromUrl = params['coupon'];
        this.tryApplyFromUrl();
      }
    });
  }

  loadCoupons(): void {
    this.consumerService.getactiveCoupons().subscribe({
      next: (data: Coupon[]) => {
        this.availableCoupons = data;
        this.tryApplyFromUrl();
        this.chng.detectChanges();
      },
      error: (err) => console.error('Failed to load coupons', err),
    });
  }

  // Re-validate the coupon passed from cart against the live coupon list —
  // never trust the query param code alone.
  private tryApplyFromUrl(): void {
    if (!this.couponFromUrl || !this.availableCoupons.length || this.appliedCoupon) return;

    const match = this.availableCoupons.find(
      (c) => c.couponCode.toUpperCase() === this.couponFromUrl.toUpperCase()
    );

    if (match && (!match.minimumOrderAmount || this.subtotal >= match.minimumOrderAmount)) {
      this.appliedCoupon = match;
    }
    // if invalid/expired/minimum not met, silently ignore — user can re-apply from cart
  }

  loadAddresses(): void { /* unchanged */ 
    this.loadingAddresses = true;
    this.consumerService.getAddresses().subscribe({
      next: (data: Address[]) => {
        this.addresses = data;
        const def = data.find((a) => a.isDefault) || data[0];
        if (def) this.selectedAddressId = def.addressId ?? null;
        this.loadingAddresses = false;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load addresses', err);
        this.loadingAddresses = false;
        this.chng.detectChanges();
      },
    });
  }

  loadCart(): void { /* unchanged */
    this.loadingCart = true;
    this.consumerService.getCartItems().subscribe({
      next: (res: any[]) => {
        this.cartItems = res.map((item) => ({
          ProductId: item.productId,
          ProductName: item.productName,
          ProductPrice: item.productPrice,
          ImagePath: item.imagePath,
          Quantity: item.quantity,
        }));
        this.loadingCart = false;
        this.tryApplyFromUrl();
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load cart', err);
        this.loadingCart = false;
        this.chng.detectChanges();
      },
    });
  }

  selectAddress(id: number | undefined): void {
    if (id === undefined) return;
    this.selectedAddressId = id;
  }

  saveNewAddress(): void { /* unchanged */
    if (this.addressForm.invalid) return;
    const payload: Address = {
      ...(this.addressForm.value as Address),
      isDefault: !!this.addressForm.value.isDefault,
    };
    this.consumerService.addAddress(payload).subscribe({
      next: () => {
        this.showAddressForm = false;
        this.addressForm.reset();
        this.loadAddresses();
      },
      error: (err) => console.error('Failed to save address', err),
    });
  }

  goToStep(target: CheckoutStep): void {
    if (target === 'payment' && !this.selectedAddressId) return;
    if (target === 'review' && !this.selectedAddressId) return;
    this.step = target;
  }

  nextFromAddress(): void {
    if (!this.selectedAddressId) return;
    this.step = 'payment';
  }

  nextFromPayment(): void {
    this.step = 'review';
  }

  removeCoupon(): void {
    this.appliedCoupon = null;
    this.couponFromUrl = '';
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
    return this.subtotal >= 999 || this.cartItems.length === 0 ? 0 : 49;
  }

  get tax(): number {
    return Math.round((this.subtotal - this.discount) * 0.05); // ← tax now off discounted subtotal
  }

  get total(): number {
    return this.subtotal - this.discount + this.shipping + this.tax; // ← discount applied
  }

  get selectedAddress(): Address | undefined {
    return this.addresses.find((a) => a.addressId === this.selectedAddressId);
  }

  placeOrder(): void {
    if (!this.selectedAddressId) {
      alert('Please select an address');
      return;
    }
    if (this.cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }
    if (this.placingOrder) return;

    this.placingOrder = true;
    const productIds = this.cartItems.map(item => item.ProductId);

    if (this.paymentMethod === 'cod') {
      this.submitOrder(productIds);
      return;
    }

    // total already reflects the discount, so Razorpay charges the right amount
    this.consumerService.payment(this.total).subscribe({
      next: (order: any) => {
        const options: any = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          name: 'Urban Nest',
          description: 'Order Payment',
          handler: (response: any) => {
            const verifyBody = {
              RazorpayOrderId: response.razorpay_order_id,
              RazorpayPaymentId: response.razorpay_payment_id,
              RazorpaySignature: response.razorpay_signature
            };
            this.consumerService.verifyPayment(verifyBody).subscribe({
              next: () => this.submitOrder(productIds),
              error: (err: any) => {
                console.error("Verification Failed", err.error);
                this.placingOrder = false;
                this.chng.detectChanges();
                alert("Payment verification failed.");
              }
            });
          },
          modal: {
            ondismiss: () => {
              this.placingOrder = false;
              this.chng.detectChanges();
            }
          },
          theme: { color: '#C9A55C' }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          console.log("Payment Failed", response);
          this.placingOrder = false;
          this.chng.detectChanges();
        });
        rzp.open();
      },
      error: (err: any) => {
        console.error("Create Razorpay Order Failed", err.error);
        this.placingOrder = false;
        this.chng.detectChanges();
      }
    });
  }

  private submitOrder(productIds: number[]): void {
    const body = {
      SelectedProductIds: productIds,
      AddressId: this.selectedAddressId!,
      CouponCode: this.appliedCoupon?.couponCode ?? null, // ← sent to backend
    };

    this.consumerService.placeOrder(body).subscribe({
      next: (res: any) => {
        this.placingOrder = false;
        this.router.navigate(['/consumerNavbar/order'], {
          state: { orderId: res.orderId },
        });
      },
      error: (err) => {
        console.error('Failed to place order', err.error);
        this.placingOrder = false;
        this.chng.detectChanges();
        alert('Failed to place your order. Please try again.');
      },
    });
  }

  trackByProductId(index: number, item: CartItem): number {
    return item.ProductId;
  }
}
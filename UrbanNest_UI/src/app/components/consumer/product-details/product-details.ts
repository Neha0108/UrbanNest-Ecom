import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Consumer } from '../../../service/consumer';
import { UserService } from '../../../service/user-service';
import { Product } from '../../../interface/product';
import { RatingSummary, Review } from '../../../interface/review';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consumerService = inject(Consumer);
  private userService = inject(UserService);
  private chng = inject(ChangeDetectorRef);

  product: Product | null = null;
  relatedProducts: Product[] = [];
  loading = true;
  notFound = false;

  activeImageIndex = 0;
  quantity = 1;

  activeTab: 'description' | 'specifications' | 'reviews' = 'description';

  pincode = '';
  deliveryChecked = false;
  deliveryMessage = '';

  addedToCart = false;
  addedToWishlist = false;
  isLoggedIn = false;
  cartProductIds = new Set<number>();
  wishlistProductIds = new Set<number>();

  // ---- Reviews state ----
  reviews: Review[] = [];
  reviewsLoading = false;
  avgRating = 0;
  totalReviews = 0;
  hasReviewed = false;

  newRating = 0;
  hoverRating = 0;
  newComment = '';
  submittingReview = false;
  reviewError = '';
  reviewSuccess = '';

  ngOnInit(): void {
    this.isLoggedIn = this.userService.isLoggedIn();

    this.route.params.subscribe((params) => {
      const id = Number(params['id']);
      if (id) this.loadProduct(id);
    });
  }

  loadProduct(productId: number): void {
    this.loading = true;
    this.notFound = false;

    this.consumerService.allProducts().subscribe({
      next: (data: Product[]) => {
        const found = data.find((p) => p.productId === productId);

        if (!found) {
          this.notFound = true;
          this.loading = false;
          this.chng.detectChanges();
          return;
        }

        this.product = found;
        this.activeImageIndex = 0;
        this.quantity = 1;
        this.deliveryChecked = false;
        this.refreshUserState();

        console.log('Product loaded:', found);

        this.relatedProducts = data
          .filter((p) => p.categoryName === found.categoryName && p.productId !== found.productId)
          .slice(0, 4);

        this.trackRecentlyViewed(found);
        this.loadReviews(found.productId);
        this.loadRatingSummary(found.productId);

        this.loading = false;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load product', err);
        this.notFound = true;
        this.loading = false;
        this.chng.detectChanges();
      },
    });
  }

  // ---- Reviews ----
  loadReviews(productId: number): void {
    this.reviewsLoading = true;

    this.consumerService.getProductReviews(productId).subscribe({
      next: (data: Review[]) => {
        this.reviews = data;
        this.totalReviews = data.length;
        this.avgRating = data.length
          ? Math.round((data.reduce((sum, r) => sum + r.rating, 0) / data.length) * 10) / 10
          : 0;

        const currentUserId = this.userService.getCurrentUserId();
        this.hasReviewed = !!currentUserId && data.some((r) => r.userId === currentUserId);

        this.reviewsLoading = false;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load reviews', err);
        this.reviewsLoading = false;
        this.chng.detectChanges();
      },
    });
  }

  setRating(star: number): void {
    this.newRating = star;
  }

  setHoverRating(star: number): void {
    this.hoverRating = star;
  }

  clearHoverRating(): void {
    this.hoverRating = 0;
  }

  submitReview(): void {
    this.reviewError = '';
    this.reviewSuccess = '';

    if (!this.requireLogin()) return;
    if (!this.product) return;

    if (this.newRating === 0) {
      this.reviewError = 'Please select a star rating';
      return;
    }
    if (!this.newComment.trim()) {
      this.reviewError = 'Please write a short comment';
      return;
    }

    this.submittingReview = true;

    this.consumerService
      .addReview(this.product.productId, this.newRating, this.newComment)
      .subscribe({
        next: () => {
          this.reviewSuccess = 'Review submitted, thank you!';
          this.newRating = 0;
          this.newComment = '';
          this.submittingReview = false;
          this.loadReviews(this.product!.productId);
          this.chng.detectChanges();
        },
        error: (err) => {
          this.reviewError = err?.error?.message || 'Could not submit review';
          this.submittingReview = false;
          this.chng.detectChanges();
        },
      });
  }

  starsArray(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map((i) => i <= Math.round(rating));
  }

  private refreshUserState(): void {
    this.isLoggedIn = this.userService.isLoggedIn();

    if (!this.isLoggedIn) {
      this.cartProductIds.clear();
      this.wishlistProductIds.clear();
      return;
    }

    this.consumerService.getCartItems().subscribe({
      next: (items: any[]) => {
        this.cartProductIds = new Set(items.map((item) => item.productId));
        this.chng.detectChanges();
      },
      error: (err) => console.error('Failed to load cart items', err),
    });

    this.consumerService.getWishlist().subscribe({
      next: (items: any[]) => {
        this.wishlistProductIds = new Set(items.map((item) => item.productId));
        this.chng.detectChanges();
      },
      error: (err) => console.error('Failed to load wishlist', err),
    });
  }

  isProductInCart(productId: number): boolean {
    return this.cartProductIds.has(productId);
  }

  isProductInWishlist(productId: number): boolean {
    return this.wishlistProductIds.has(productId);
  }

  private requireLogin(): boolean {
    this.isLoggedIn = this.userService.isLoggedIn();

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }

  private trackRecentlyViewed(product: Product): void {
    const viewed: number[] = JSON.parse(localStorage.getItem('recentProducts') || '[]');
    const filtered = viewed.filter((id) => id !== product.productId);
    filtered.unshift(product.productId);
    localStorage.setItem('recentProducts', JSON.stringify(filtered.slice(0, 10)));
    localStorage.setItem('lastCategory', product.categoryName);
  }

  setActiveImage(index: number): void {
    this.activeImageIndex = index;
  }

  increaseQty(): void {
    if (!this.product) return;
    if (this.quantity < this.product.stock) this.quantity++;
  }

  decreaseQty(): void {
    if (this.quantity > 1) this.quantity--;
  }

  setTab(tab: 'description' | 'specifications' | 'reviews'): void {
    this.activeTab = tab;
  }

  checkDelivery(): void {
    if (!this.pincode || this.pincode.length !== 6) {
      this.deliveryMessage = 'Please enter a valid 6-digit pincode';
      this.deliveryChecked = true;
      return;
    }
    this.deliveryChecked = true;
    this.deliveryMessage = `Delivery available to ${this.pincode}`;
  }

  addToCart(): void {
    if (!this.product || !this.requireLogin()) return;
    if (this.product.stock === 0 || this.isProductInCart(this.product.productId)) return;

    this.consumerService.addToCart(this.product.productId, this.quantity).subscribe({
      next: () => {
        this.cartProductIds.add(this.product!.productId);
        this.addedToCart = true;
        this.chng.detectChanges();
        setTimeout(() => {
          this.addedToCart = false;
          this.chng.detectChanges();
        }, 1800);
      },
      error: (err: any) => console.error('Failed to add to cart', err),
    });
  }

  addToWishlist(): void {
    if (!this.product || !this.requireLogin()) return;
    if (this.isProductInWishlist(this.product.productId)) return;

    this.consumerService.addToWishlist(this.product.productId).subscribe({
      next: () => {
        this.wishlistProductIds.add(this.product!.productId);
        this.addedToWishlist = true;
        this.chng.detectChanges();
        setTimeout(() => {
          this.addedToWishlist = false;
          this.chng.detectChanges();
        }, 1800);
      },
      error: (err: any) => console.error('Failed to add to wishlist', err),
    });
  }

  buyNow(): void {
    if (!this.product || this.product.stock === 0) return;

    this.router.navigate(['/consumerNavbar/address'], {
      state: {
        buyNow: true,
        productId: this.product.productId,
        quantity: this.quantity,
      },
    });
  }

  goToProduct(product: Product): void {
    this.router.navigate(['/consumerNavbar/product-details', product.productId]);
  }

  trackById(index: number, item: Product): number {
    return item.productId;
  }

  ratingSummary: RatingSummary | null = null;

  loadRatingSummary(productId: number): void {
    this.consumerService.getRatingSummary(productId).subscribe({
      next: (data: RatingSummary) => {
        this.ratingSummary = data;
        this.chng.detectChanges();
      },
      error: (err) => console.error('Failed to load rating summary', err),
    });
  }

  toggleHelpful(review: Review): void {
  if (!this.requireLogin()) return;

  this.consumerService.toggleHelpful(review.reviewId).subscribe({
    next: (res) => {
      review.helpfulCount = res.helpfulCount;
      review.markedHelpfulByMe = !review.markedHelpfulByMe;
      this.chng.detectChanges();
    },
    error: (err) => console.error('Failed to toggle helpful', err)
  });
}
}

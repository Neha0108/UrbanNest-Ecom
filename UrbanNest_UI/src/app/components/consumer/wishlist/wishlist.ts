import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Consumer } from '../../../service/consumer';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WishlistItem } from '../../../interface/WishlistItem';

@Component({
  selector: 'app-wishlist',
  imports: [CommonModule],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
})
export class Wishlist implements OnInit {

  wishlist: WishlistItem[] = [];
  loading = true;

  addingToCartId: number | null = null;
  addedToCartIds: Set<number> = new Set();

  private chg = inject(ChangeDetectorRef);
  private router = inject(Router);

  constructor(private consumerService: Consumer) { }

  ngOnInit(): void {
    this.loading = true;
    this.consumerService.getWishlist().subscribe({
      next: (data: WishlistItem[]) => {
        this.wishlist = data;
        this.loading = false;
        this.chg.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching wishlist:', error);
        this.loading = false;
        this.chg.detectChanges();
      }
    });
  }

  removeFromWishlist(productId: number) {
    this.consumerService.removeFromWishlist(productId).subscribe({
      next: () => {
        this.wishlist = this.wishlist.filter(item => item.productId !== productId);
        this.chg.detectChanges();
      },
      error: (error) => {
        console.error('Error removing from wishlist:', error)
      }
    });
  }

  addToCart(productId: number) {
    this.addingToCartId = productId;

    this.consumerService.addToCart(productId, 1).subscribe({
      next: () => {
        this.addedToCartIds.add(productId);
        this.addingToCartId = null;
        this.chg.detectChanges();
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.addingToCartId = null;
        this.chg.detectChanges();
      }
    });
  }

  buyNow(productId: number) {
    this.consumerService.addToCart(productId, 1).subscribe({
      next: () => {
        this.router.navigate(['/consumerNavbar/checkout']);
      },
      error: (error) => {
        console.error('Error processing buy now:', error);
      }
    });
  }

  viewDetails(productId: number) {
    this.router.navigate(['/consumerNavbar/product-details', productId]);
  }

  trackByProductId(index: number, item: WishlistItem): number {
    return item.productId;
  }
}
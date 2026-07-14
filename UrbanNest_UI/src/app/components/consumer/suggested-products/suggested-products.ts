import { ChangeDetectorRef, Component } from '@angular/core';
import { Product } from '../../../interface/product';
import { Consumer } from '../../../service/consumer';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-suggested-products',
  imports: [CommonModule],
  templateUrl: './suggested-products.html',
  styleUrl: './suggested-products.css',
})
export class SuggestedProducts {

  products: Product[] = [];
  recommended: Product[] = [];
  trending: Product[] = [];
  recentlyViewed: Product[] = [];

  lastCategory: string | null = null;

  constructor(
    private consumerService: Consumer,
    private router: Router,
    private chng: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    this.lastCategory = localStorage.getItem('lastCategory');

    const viewedIds = JSON.parse(localStorage.getItem('recentProducts') || '[]');

    this.consumerService.allProducts().subscribe(res => {

      this.products = res;

      if (this.lastCategory) {
        this.recommended = this.products.filter(
          p => p.categoryName?.toLowerCase() === this.lastCategory?.toLowerCase()
        );
      } else {
        this.recommended = this.products.slice(0, 6);
      }

      this.recentlyViewed = this.products.filter(
        p => viewedIds.includes(p.productId)
      );

      this.trending = this.products.slice(0, 10);
    });
  }

  // ✅ Navigate to product detail
  goToProduct(product: Product) {

    // ✅ Store recently viewed
    let viewed = JSON.parse(localStorage.getItem('recentProducts') || '[]');

    if (!viewed.includes(product.productId)) {
      viewed.unshift(product.productId);
    }

    localStorage.setItem('recentProducts', JSON.stringify(viewed.slice(0, 10)));

    // ✅ Store last category
    localStorage.setItem('lastCategory', product.categoryName);

    // ✅ Redirect to product details page
    this.router.navigate(['/consumerNavbar/product-details', product.productId]);
  }

}
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Consumer } from '../../service/consumer';
import { UserService } from '../../service/user-service';
import { Product } from '../../interface/product';
import { Category } from '../../interface/category';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'name';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {

  private consumerService = inject(Consumer);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chng = inject(ChangeDetectorRef);

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];

  selectedCategory: string | null = null;
  selectedMaxPrice: number | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  maxPriceAvailable = 0;
  sortBy: SortOption = 'newest';

  loading = true;
  filtersOpen = false;
  recentlyAddedId: number | null = null;
  recentlyWishlistedId: number | null = null;
  isLoggedIn = false;
  cartProductIds = new Set<number>();
  wishlistProductIds = new Set<number>();

  priceRanges = [
    { label: 'Under ₹99', value: 99 },
    { label: 'Under ₹199', value: 199 },
    { label: 'Under ₹299', value: 299 },
    { label: 'Under ₹499', value: 499 },
    { label: 'Under ₹999', value: 999 },
  ];

  ngOnInit(): void {
    this.isLoggedIn = this.userService.isLoggedIn();

    this.route.queryParams.subscribe((params) => {
      this.selectedCategory = params['category'] ? decodeURIComponent(params['category']) : null;
      this.selectedMaxPrice = params['maxPrice'] ? Number(params['maxPrice']) : null;
      this.applyFilters();
    });

    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.isLoggedIn = this.userService.isLoggedIn();

    this.consumerService.getCategories().subscribe({
      next: (cats: Category[]) => {
        this.categories = cats;
        this.chng.detectChanges();
      },
      error: (err) => console.error('Failed to load categories', err),
    });

    this.consumerService.allProducts().subscribe({
      next: (data: Product[]) => {
        this.allProducts = data;
        this.maxPriceAvailable = data.length ? Math.max(...data.map((p) => p.productPrice)) : 0;

        if (this.minPrice === null) {
          this.minPrice = 0;
        }

        if (this.maxPrice === null || this.maxPrice === 0) {
          this.maxPrice = this.maxPriceAvailable;
        }

        this.applyFilters();
        this.loading = false;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.loading = false;
        this.chng.detectChanges();
      },
    });
  }

  applyFilters(): void {
    let result = [...this.allProducts];

    if (this.selectedCategory) {
      result = result.filter(
        (p) => p.categoryName?.toLowerCase() === this.selectedCategory?.toLowerCase()
      );
    }

    let min = this.minPrice ?? 0;
    let max = this.maxPrice ?? this.maxPriceAvailable;

    if (min > max) {
      [min, max] = [max, min];
    }

    if (this.selectedMaxPrice !== null) {
      max = Math.min(max, this.selectedMaxPrice);
    }

    result = result.filter((p) => p.productPrice >= min && p.productPrice <= max);
    result = this.sortProducts(result, this.sortBy);

    this.filteredProducts = result;
    this.chng.detectChanges();
  }

  sortProducts(list: Product[], sort: SortOption): Product[] {
    const sorted = [...list];
    switch (sort) {
      case 'price-low':
        return sorted.sort((a, b) => a.productPrice - b.productPrice);
      case 'price-high':
        return sorted.sort((a, b) => b.productPrice - a.productPrice);
      case 'name':
        return sorted.sort((a, b) => a.productName.localeCompare(b.productName));
      default:
        return sorted;
    }
  }

  onSortChange(value: string): void {
    this.sortBy = value as SortOption;
    this.applyFilters();
  }

  selectCategory(name: string | null): void {
    this.router.navigate(['/products'], {
      queryParams: {
        category: name ? encodeURIComponent(name) : null,
        maxPrice: this.selectedMaxPrice ?? null,
      },
      queryParamsHandling: 'merge',
    });
  }

  selectPrice(value: number | null): void {
    this.selectedMaxPrice = value;
    this.router.navigate(['/products'], {
      queryParams: {
        category: this.selectedCategory ? encodeURIComponent(this.selectedCategory) : null,
        maxPrice: value,
      },
      queryParamsHandling: 'merge',
    });
  }

  applyPriceFilter(): void {
    this.applyFilters();
  }

  resetPrice(): void {
    this.minPrice = 0;
    this.maxPrice = this.maxPriceAvailable;
    this.applyFilters();
  }

  clearFilters(): void {
    this.router.navigate(['/products']);
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  goToProduct(product: Product): void {
    localStorage.setItem('lastCategory', product.categoryName);
    this.router.navigate(['/product-details', product.productId]);
  }

  goToLogin(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/login']);
  }

  trackById(index: number, item: Product): number {
    return item.productId;
  }
}
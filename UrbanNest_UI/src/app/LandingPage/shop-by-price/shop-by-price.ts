import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shop-by-price',
  imports: [CommonModule],
  templateUrl: './shop-by-price.html',
  styleUrl: './shop-by-price.css',
})
export class ShopByPrice {

  priceRanges = [
    { label: 'Under ₹99', value: 99 },
    { label: 'Under ₹199', value: 199 },
    { label: 'Under ₹299', value: 299 },
    { label: 'Under ₹499', value: 499 },
    { label: 'Under ₹999', value: 999 }
  ];

  constructor(private router: Router) {}

  filterByPrice(price: number) {
    this.router.navigate(['/products'], {
      queryParams: { maxPrice: price }
    });
  }
}
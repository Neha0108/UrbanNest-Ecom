import { ChangeDetectorRef, Component, Inject, inject, OnInit } from '@angular/core';
import { Product } from '../../../interface/product';
import { CommonModule } from '@angular/common';
import { Retailer } from '../../../service/retailer';
import { Router } from '@angular/router';

@Component({
  selector: 'app-load-products',
  imports: [CommonModule],
  templateUrl: './load-products.html',
  styleUrl: './load-products.css',
})
export class LoadProducts implements OnInit {

  products: Product[] = [];
  router = inject(Router);

  trackById(index: number, item: Product) {
    return item.productId;
  }

  private chng = inject(ChangeDetectorRef);

  constructor(private retailerService: Retailer) { }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.loadProducts();
  }

  loadProducts() {
    this.retailerService.getMyProducts().subscribe({
      next: (data: Product[]) => {
        this.products = data;
        this.chng.detectChanges();
        console.log(this.products);
      },
      error: err => console.error(err)
    })
  }

deleteProduct(productId: number) {
  const confirmed = confirm('Are you sure you want to delete this product?');
  if (!confirmed) return;
  this.retailerService.deleteProduct(productId).subscribe({
    next: () => {
      console.log('Product removed');
      this.chng.detectChanges();
      this.products = this.products.filter(
        p => p.productId !== productId
      );
    },
    error: (err) => {
      console.error(err);
      alert('Delete failed');
    }
  });
}
editProduct(productId: number) {
  this.router.navigate(['retailerNavbar/edit-product', productId]);
}
}

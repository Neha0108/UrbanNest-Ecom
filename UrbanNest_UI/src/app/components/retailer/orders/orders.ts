import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Retailer } from '../../../service/retailer';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {

  orders: any[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private retailerService: Retailer,
    private chng: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.errorMessage = '';

    this.retailerService.getRetailerOrders().subscribe({
      next: (res: any[]) => {

        this.orders = res.map(order => {
          const items = order.items || order.Items || [];

          const uniqueCategories = [
            ...new Set(
              items
                .map((item: any) => item.categoryName || item.CategoryName)
                .filter((category: string) => !!category)
            )
          ];

          console.log('Processed Order:', res);

          return {
            ...order,
            orderId: order.orderId || order.OrderId,
            orderDate: order.orderDate || order.OrderDate,
            status: order.status || order.Status,
            deliveryPersonName: order.deliveryPersonName || order.DeliveryPersonName || null,
            deliveryPersonPhone: order.deliveryPersonPhone || order.DeliveryPersonPhone || null,
            items: items.map((item: any) => ({
              productId: item.productId || item.ProductId,
              productName: item.productName || item.ProductName,
              quantity: item.quantity || item.Quantity,
              price: item.price || item.Price,
              stock: item.stock || item.Stock,
              categoryName: item.categoryName || item.CategoryName
            })),
            uniqueCategories
          };
        });

        this.loading = false;
        this.chng.detectChanges();
      },

      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load orders.';
        this.loading = false;
        this.chng.detectChanges();
      },
    });
  }

  updateStatus(orderId: number, event: any) {
    const status = event.target.value;

    this.retailerService.updateOrderStatus(orderId, status).subscribe({
      next: (res: any) => {
        const order = this.orders.find((o) => o.orderId === orderId);
        if (order) order.status = status;

        console.log(res.message);
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Status update failed');
        this.loadOrders();
      },
    });
  }

  getStatusClass(status: string): string {
    return 'status-' + status?.toLowerCase().replaceAll(' ', '-');
  }


deliveryModalOrderId: number | null = null;
deliveryForm = { deliveryPersonName: '', deliveryPersonPhone: '' };
deliverySubmitting = false;

openDeliveryModal(order: any) {
  this.deliveryModalOrderId = order.orderId;
  this.deliveryForm = {
    deliveryPersonName: order.deliveryPersonName || '',
    deliveryPersonPhone: order.deliveryPersonPhone || '',
  };
}

closeDeliveryModal() {
  this.deliveryModalOrderId = null;
}

submitDeliveryDetails() {
  if (!this.deliveryModalOrderId) return;
  if (!this.deliveryForm.deliveryPersonName.trim() || !this.deliveryForm.deliveryPersonPhone.trim()) {
    alert('Name and phone are required');
    return;
  }

  this.deliverySubmitting = true;
  this.retailerService.setDeliveryDetails(this.deliveryModalOrderId, this.deliveryForm).subscribe({
    next: () => {
      const order = this.orders.find(o => o.orderId === this.deliveryModalOrderId);
      if (order) {
        order.deliveryPersonName = this.deliveryForm.deliveryPersonName;
        order.deliveryPersonPhone = this.deliveryForm.deliveryPersonPhone;
      }
      this.deliverySubmitting = false;
      this.closeDeliveryModal();
    },
    error: (err) => {
      console.error(err);
      alert(err.error?.message || 'Failed to save delivery details');
      this.deliverySubmitting = false;
    }
  });
}
}
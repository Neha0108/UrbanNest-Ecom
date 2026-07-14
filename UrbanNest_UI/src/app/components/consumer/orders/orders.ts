import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Consumer } from '../../../service/consumer';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  stock?: number;
  categoryName?: string;
}

export interface Order {
  orderId: number;
  orderDate: string;
  status: OrderStatus;
  items: OrderItem[];
  deliveryPersonName?: string | null;
  deliveryPersonPhone?: string | null;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type OrderFilter = 'all' | 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

interface TimelineStepDef {
  key: OrderStatus;
  label: string;
}

const TIMELINE_STEPS: TimelineStepDef[] = [
  { key: 'Pending', label: 'Order Placed' },
  { key: 'Confirmed', label: 'Confirmed' },
  { key: 'Shipped', label: 'Shipped' },
  { key: 'Out for Delivery', label: 'Out for Delivery' },
  { key: 'Delivered', label: 'Delivered' },
];

const CANCELLABLE_STATUSES: OrderStatus[] = ['Pending', 'Confirmed'];

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
  animations: [
    trigger('listStagger', [
      transition(':enter', [
        query(
          '.order-card',
          [
            style({ opacity: 0, transform: 'translateY(14px)' }),
            stagger(60, [
              animate(
                '380ms cubic-bezier(0.16, 1, 0.3, 1)',
                style({ opacity: 1, transform: 'translateY(0)' }),
              ),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
    trigger('panelSlide', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('340ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('260ms cubic-bezier(0.4, 0, 1, 1)', style({ transform: 'translateX(100%)' })),
      ]),
    ]),
    trigger('overlayFade', [
      transition(':enter', [style({ opacity: 0 }), animate('260ms ease', style({ opacity: 1 }))]),
      transition(':leave', [animate('220ms ease', style({ opacity: 0 }))]),
    ]),
  ],
})
export class Orders implements OnInit {
  private consumerService = inject(Consumer);
  private router = inject(Router);

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly activeFilter = signal<OrderFilter>('all');
  readonly selectedOrder = signal<Order | null>(null);
  readonly cancellingId = signal<number | null>(null);

  readonly timelineSteps = TIMELINE_STEPS;

  readonly filters: { key: OrderFilter; label: string }[] = [
    { key: 'all', label: 'All Orders' },
    { key: 'Pending', label: 'Processing' },
    { key: 'Shipped', label: 'Shipped' },
    { key: 'Delivered', label: 'Delivered' },
    { key: 'Cancelled', label: 'Cancelled' },
  ];

  readonly filteredOrders = computed(() => {
    const filter = this.activeFilter();
    const list = this.orders();
    if (filter === 'all') return list;
    if (filter === 'Pending') {
      return list.filter((o) => o.status === 'Pending' || o.status === 'Confirmed');
    }
    return list.filter((o) => o.status === filter);
  });

  readonly hasOrders = computed(() => this.orders().length > 0);
  readonly hasFilteredOrders = computed(() => this.filteredOrders().length > 0);

  readonly selectedOrderStepIndex = computed(() => {
    const order = this.selectedOrder();
    if (!order) return -1;
    return this.timelineSteps.findIndex((s) => s.key === order.status);
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.consumerService.getUserOrders().subscribe({
      next: (res: any[]) => {
        const normalised: Order[] = (res ?? []).map((o) => ({
          orderId: o.orderId ?? o.OrderId,
          orderDate: o.orderDate ?? o.OrderDate,
          status: (o.status ?? o.Status ?? 'Pending') as OrderStatus,
          deliveryPersonName: o.deliveryPersonName ?? o.DeliveryPersonName ?? null,
          deliveryPersonPhone: o.deliveryPersonPhone ?? o.DeliveryPersonPhone ?? null,
          items: (o.items ?? o.Items ?? []).map((i: any) => ({
            productId: i.productId ?? i.ProductId,
            productName: i.productName ?? i.ProductName,
            quantity: i.quantity ?? i.Quantity,
            price: i.price ?? i.Price,
            stock: i.stock ?? i.Stock,
            categoryName: i.categoryName ?? i.CategoryName,
          })),
        }));

        this.orders.set(normalised);
        this.loading.set(false);
        console.log('Orders loaded:', normalised);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('We couldn\u2019t load your orders. Please try again.');
        this.loading.set(false);
      },
    });
  }

  setFilter(filter: OrderFilter): void {
    this.activeFilter.set(filter);
  }

  getOrderTotal(items: OrderItem[]): number {
    return (items ?? []).reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getItemCountLabel(items: OrderItem[]): string {
    const count = items?.length ?? 0;
    return count === 1 ? '1 item' : `${count} items`;
  }

  isCancellable(order: Order): boolean {
    return CANCELLABLE_STATUSES.includes(order.status);
  }

  getStatusClass(status: OrderStatus): string {
    return 'status-' + status.toLowerCase().replaceAll(' ', '-');
  }

  cancelOrder(order: Order, event: Event): void {
    event.stopPropagation();

    if (!confirm('Are you sure you want to cancel this order?')) return;

    this.cancellingId.set(order.orderId);

    this.consumerService.cancelOrder(order.orderId).subscribe({
      next: () => {
        this.orders.update((list) =>
          list.map((o) =>
            o.orderId === order.orderId ? { ...o, status: 'Cancelled' as OrderStatus } : o,
          ),
        );
        this.cancellingId.set(null);
      },
      error: (err) => {
        console.error(err);
        alert('Cancellation failed. Please try again.');
        this.cancellingId.set(null);
      },
    });
  }

  trackOrder(order: Order): void {
    this.selectedOrder.set(order);
  }

  closeTrack(): void {
    this.selectedOrder.set(null);
  }

  isStepDone(stepIndex: number): boolean {
    return stepIndex <= this.selectedOrderStepIndex();
  }

  goToProducts(): void {
    this.router.navigate(['/consumerNavbar/userdashboard']);
  }

  hasDeliveryInfo(order: Order): boolean {
    return (
      !!order.deliveryPersonName &&
      (order.status === 'Out for Delivery' || order.status === 'Delivered')
    );
  }
}

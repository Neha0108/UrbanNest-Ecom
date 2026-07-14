import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';

interface TimelineStep {
  label: string;
  description: string;
  done: boolean;
  active: boolean;
}

@Component({
  selector: 'app-ordersucccess',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ordersucccess.html',
  styleUrl: './ordersucccess.css',
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('420ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1 })),
      ]),
    ]),
    trigger('cardEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px) scale(0.98)' }),
        animate(
          '520ms 120ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        ),
      ]),
    ]),
    trigger('staggerRows', [
      transition(':enter', [
        query(
          '.stagger-item',
          [
            style({ opacity: 0, transform: 'translateY(10px)' }),
            stagger(70, [
              animate(
                '380ms cubic-bezier(0.16, 1, 0.3, 1)',
                style({ opacity: 1, transform: 'translateY(0)' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class Ordersucccess implements OnInit {
  private router = inject(Router);

  // ---- Incoming navigation state (backend contract unchanged) ----
  readonly orderId = signal<number | string>(
    (history.state && history.state['orderId']) ?? ''
  );
  readonly paymentMethod = signal<string>(
    (history.state && history.state['paymentMethod']) ?? 'Cash on Delivery'
  );
  readonly orderDate = signal<Date>(new Date());

  // ---- Derived / presentation state ----
  readonly formattedOrderId = computed(() => {
    const id = String(this.orderId());
    return id ? `#ORD${id.padStart(6, '0')}` : '#ORD------';
  });

  readonly formattedDate = computed(() =>
    this.orderDate().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  );

  readonly estimatedDeliveryLabel = computed(() => {
    const d = new Date(this.orderDate());
    d.setDate(d.getDate() + 5);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
  });

  readonly timeline = signal<TimelineStep[]>([
    { label: 'Order Placed', description: 'We\u2019ve received your order', done: true, active: false },
    { label: 'Confirmed', description: 'Retailer is preparing your items', done: false, active: true },
    { label: 'Shipped', description: 'On its way to you', done: false, active: false },
    { label: 'Delivered', description: 'Enjoy your new pieces', done: false, active: false },
  ]);

  ngOnInit(): void {
    // Move focus to the confirmation heading for screen-reader / keyboard users
    queueMicrotask(() => {
      document.getElementById('order-success-heading')?.focus();
    });
  }

  continueShopping(): void {
    this.router.navigate(['/consumerNavbar/userdashboard']);
  }

  viewOrders(): void {
    this.router.navigate(['/consumerNavbar/orders']);
  }
}
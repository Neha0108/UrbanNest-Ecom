import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Retailer } from '../../../service/retailer';
import { CommonModule, DatePipe } from '@angular/common';
import { Chart } from 'chart.js/auto';
import gsap from 'gsap';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface TopProduct {
  rank: number;
  name: string;
  sales: number;
  revenue: number;
  percent: number;
}

interface RecentActivity {
  action: string;
  time: string;
}

interface Alert {
  type: 'warning' | 'danger' | 'info';
  icon: string;
  title: string;
  message: string;
}

interface LowStockProduct {
  id: number;
  name: string;
  current: number;
  total: number;
  percentage: number;
}

@Component({
  selector: 'app-retailerdashboard',
  imports: [CommonModule, DatePipe, FormsModule, RouterLink],
  templateUrl: './retailerdashboard.html',
  styleUrl: './retailerdashboard.css',
})
export class Retailerdashboard implements OnInit {

  orders: any[] = [];
  totalRevenue = 0;
  totalOrders = 0;
  totalQuantity = 0;
  totalCustomers = 0;

  heroProduct = '';
  topCategory = '';
  retailerName = '';

  selectedCategory = 'All';
  categories: string[] = [];
  selectedDate = new Date().toISOString().split('T')[0];

  revenueGrowth = 0;
  ordersGrowth = 0;
  customersGrowth = 0;
  conversionGrowth = 0;
  monthlyGrowth = 0;
  conversionRate = 0;

  cardHovered: string | null = null;

  revenueChart: any;
  categoryChart: any;

  topProducts: TopProduct[] = [];
  recentActivities: RecentActivity[] = [];
  inventoryAlerts: Alert[] = [];
  lowStockProducts: LowStockProduct[] = [];

  private chng = inject(ChangeDetectorRef);

  constructor(
    private retailerService: Retailer,
    private router: Router) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  // ── Helper: safely get items array regardless of casing ───────────────
  private getItems(order: any): any[] {
    return order?.items ?? order?.Items ?? [];
  }

  loadOrders() {
    this.retailerService.getRetailerOrders().subscribe({
      next: (res) => {
        this.orders = res ?? [];

        this.retailerName = this.orders[0]?.RetailerName || 'Seller';

        const uniqueCategories = new Set<string>();
        this.orders.forEach(order => {
          this.getItems(order).forEach((item: any) => {
            if (item?.categoryName ?? item?.CategoryName)
              uniqueCategories.add(item.categoryName ?? item.CategoryName);
          });
        });
        this.categories = Array.from(uniqueCategories);

        this.calculateAnalytics();
        this.initializeDynamicData();

        setTimeout(() => {
          this.revenueChart?.destroy();
          this.categoryChart?.destroy();

          this.createRevenueChart();
          this.createCategoryChart();

          gsap.from('.kpi-card', { opacity: 0, y: 30, duration: 0.6, stagger: 0.1 });
          gsap.from('.content-card', { opacity: 0, y: 30, duration: 0.6, stagger: 0.08, delay: 0.2 });

          this.chng.detectChanges();
        }, 100);
      },
      error: (err) => console.error(err),
    });
  }

  calculateAnalytics() {
    let revenue = 0;
    let qty = 0;
    const productMap: any = {};
    const categoryMap: any = {};
    const customerSet = new Set();

    this.orders.forEach(order => {
      customerSet.add(order.CustomerId ?? order.OrderId);

      this.getItems(order).forEach((item: any) => {
        const price    = item.price    ?? item.Price    ?? 0;
        const quantity = item.quantity ?? item.Quantity ?? 0;
        const name     = item.productName ?? item.ProductName ?? '';
        const cat      = item.categoryName ?? item.CategoryName ?? '';

        revenue += price * quantity;
        qty     += quantity;

        if (name) productMap[name]  = (productMap[name]  || 0) + quantity;
        if (cat)  categoryMap[cat]  = (categoryMap[cat]  || 0) + quantity;
      });
    });

    this.totalRevenue   = revenue;
    this.totalOrders    = this.orders.length;
    this.totalQuantity  = qty;
    this.totalCustomers = customerSet.size;

    this.conversionRate = this.totalCustomers > 0
      ? (this.totalOrders / this.totalCustomers) * 100
      : 0;

    const products = Object.keys(productMap);
    this.heroProduct = products.length > 0
      ? products.reduce((a, b) => productMap[a] > productMap[b] ? a : b)
      : 'No Sales Yet';

    const categoryKeys = Object.keys(categoryMap);
    this.topCategory = categoryKeys.length > 0
      ? categoryKeys.reduce((a, b) => categoryMap[a] > categoryMap[b] ? a : b)
      : 'N/A';

    // Growth
    const now          = new Date();
    const currentMonth = now.getMonth();
    const lastMonth    = currentMonth === 0 ? 11 : currentMonth - 1;

    let currentRevenue = 0, lastRevenue = 0;
    let currentOrders  = 0, lastOrders  = 0;

    this.orders.forEach(order => {
      const month = new Date(order.OrderDate ?? order.orderDate).getMonth();
      let total = 0;
      this.getItems(order).forEach((item: any) => {
        total += (item.price ?? item.Price ?? 0) * (item.quantity ?? item.Quantity ?? 0);
      });

      if (month === currentMonth) { currentRevenue += total; currentOrders++; }
      else if (month === lastMonth) { lastRevenue += total; lastOrders++; }
    });

    this.revenueGrowth    = lastRevenue ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
    this.ordersGrowth     = lastOrders  ? ((currentOrders  - lastOrders)  / lastOrders)  * 100 : 0;
    this.customersGrowth  = this.ordersGrowth;
    this.conversionGrowth = this.ordersGrowth / 2;
    this.monthlyGrowth    = this.revenueGrowth;
  }

  initializeDynamicData() {
    const productMap: any = {};

    this.orders.forEach(order => {
      this.getItems(order).forEach((item: any) => {
        const name     = item.productName ?? item.ProductName ?? 'Unknown';
        const price    = item.price    ?? item.Price    ?? 0;
        const quantity = item.quantity ?? item.Quantity ?? 0;

        if (!productMap[name]) productMap[name] = { name, sales: 0, revenue: 0 };
        productMap[name].sales   += quantity;
        productMap[name].revenue += price * quantity;
      });
    });

    // FIX: was using p.name from object values but name wasn't set — now it is
    this.topProducts = Object.values(productMap)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 4)
      .map((p: any, i: number) => ({
        rank:    i + 1,
        name:    p.name,
        sales:   p.sales,
        revenue: p.revenue,
        percent: this.totalRevenue > 0
          ? +(p.revenue / this.totalRevenue * 100).toFixed(1)
          : 0,
      }));

    this.recentActivities = this.orders.slice(0, 5).map(order => {
      const firstItem = this.getItems(order)[0];
      return {
        action: `Order #${order.OrderId ?? order.orderId} - ${firstItem?.productName ?? firstItem?.ProductName ?? ''}`,
        time:   this.getTimeAgo(new Date(order.OrderDate ?? order.orderDate)),
      };
    });

    const stockMap: any = {};
    this.orders.forEach(order => {
      this.getItems(order).forEach((item: any) => {
        const name = item.productName ?? item.ProductName ?? 'Unknown';
        if (!stockMap[name]) {
          stockMap[name] = {
            id:    item.productId ?? item.ProductId ?? 0,
            name,
            stock: item.stock ?? item.Stock ?? item.quantity ?? item.Quantity ?? 0,
          };
        }
      });
    });

    this.inventoryAlerts = Object.values(stockMap)
      .filter((item: any) => item.stock < 50)
      .map((item: any) => ({
        type:    item.stock < 20 ? 'danger' : 'warning',
        icon:    item.stock < 20 ? '⚠️' : '📦',
        title:   item.stock < 20 ? 'Critical Stock' : 'Low Stock',
        message: `${item.name} - ${item.stock} units left`,
      }));

    this.lowStockProducts = Object.values(stockMap)
      .filter((item: any) => item.stock < 100)
      .slice(0, 4)
      .map((item: any) => ({
        id:         item.id,
        name:       item.name,
        current:    item.stock,
        total:      200,
        percentage: (item.stock / 200) * 100,
      }));
  }

  createRevenueChart() {
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(212, 175, 55, 0.4)');
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0.05)');

    const monthlyMap: any = {};
    this.orders.forEach(order => {
      const month = new Date(order.OrderDate ?? order.orderDate)
        .toLocaleString('default', { month: 'short' });

      let total = 0;
      this.getItems(order).forEach((item: any) => {
        const cat = item.categoryName ?? item.CategoryName ?? '';
        if (this.selectedCategory === 'All' || cat === this.selectedCategory) {
          total += (item.price ?? item.Price ?? 0) * (item.quantity ?? item.Quantity ?? 0);
        }
      });
      monthlyMap[month] = (monthlyMap[month] || 0) + total;
    });

    this.revenueChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: Object.keys(monthlyMap),
        datasets: [{ data: Object.values(monthlyMap), borderColor: '#D4AF37', backgroundColor: gradient, fill: true, tension: 0.45 }],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  createCategoryChart() {
    const canvas = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!canvas) return;

    const categoryMap: any = {};
    this.orders.forEach(order => {
      this.getItems(order).forEach((item: any) => {
        const cat = item.categoryName ?? item.CategoryName ?? 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + (item.quantity ?? item.Quantity ?? 0);
      });
    });

    this.categoryChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categoryMap),
        datasets: [{ data: Object.values(categoryMap), backgroundColor: ['#D4AF37', '#3498db', '#2ecc71', '#9b59b6'] }],
      },
    });
  }

  onCategoryChange() {
    this.revenueChart?.destroy();
    this.categoryChart?.destroy();
    this.createRevenueChart();
    this.createCategoryChart();
  }

  onDateChange() {
    console.log('Date:', this.selectedDate);
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60)    return 'now';
    if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  updateStatus(orderId: number, event: any) {
    const status = event.target.value;
    this.retailerService.updateOrderStatus(orderId, status).subscribe({
      next: (res: any) => {
        const order = this.orders.find(o => (o.OrderId ?? o.orderId) === orderId);
        if (order) order.Status = status;
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Status update failed');
        this.loadOrders();
      },
    });
  }

  gotoAddProduct()         { this.router.navigate(['/retailerNavbar/add-product']); }
  goToEditProduct(id: number) { this.router.navigate(['/retailerNavbar/edit-product', id]); }
}
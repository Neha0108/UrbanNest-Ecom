import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Retailer } from '../../../service/retailer';

@Component({
  selector: 'app-customers',
  imports: [CommonModule],
  templateUrl: './customers.html',
  styleUrl: './customers.css',
})
export class Customers implements OnInit {

  customers: any[] = [];
  loading = true;
  errorMessage = '';

  totalCustomers = 0;
  repeatCustomers = 0;
  newCustomers = 0;
  totalRevenue = 0;

  constructor(
    private retailerService: Retailer,
    private chng: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading = true;
    this.errorMessage = '';

    this.retailerService.getRetailerCustomers().subscribe({
      next: (res: any[]) => {
        this.customers = res.map(customer => ({
          customerId: customer.customerId || customer.CustomerId,
          customerName: customer.customerName || customer.CustomerName,
          email: customer.email || customer.Email,
          phone: customer.phone || customer.Phone,
          totalOrders: customer.totalOrders || customer.TotalOrders,
          totalSpent: customer.totalSpent || customer.TotalSpent,
          lastOrderDate: customer.lastOrderDate || customer.LastOrderDate,
          customerType: customer.customerType || customer.CustomerType,
          city: customer.city || customer.City
        }));

        this.calculateStats();

        this.loading = false;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load customers.';
        this.loading = false;
        this.chng.detectChanges();
      }
    });
  }

  calculateStats() {
    this.totalCustomers = this.customers.length;

    this.repeatCustomers = this.customers.filter(
      c => c.customerType === 'Repeat'
    ).length;

    this.newCustomers = this.customers.filter(
      c => c.customerType === 'New'
    ).length;

    this.totalRevenue = this.customers.reduce(
      (sum, c) => sum + Number(c.totalSpent || 0),
      0
    );
  }

  maskPhone(phone: string): string {
    if (!phone) return 'Not available';
    return phone.slice(0, 2) + '******' + phone.slice(-2);
  }

  getCustomerTypeClass(type: string): string {
    return type === 'Repeat' ? 'type-repeat' : 'type-new';
  }
}
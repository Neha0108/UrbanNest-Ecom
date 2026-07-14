import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RoleService } from '../../service/role-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../service/adminservice';
import { Category } from '../../interface/category';
import { Role } from '../../interface/role';
 
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit {
 
  activeTab = 'consumers';
 
  consumers: any[] = [];
  filteredConsumers: any[] = [];
  searchConsumers = '';
  selectedConsumers: any[] = [];
  selectAllConsumers = false;
 
  retailers: any[] = [];
  filteredRetailers: any[] = [];
  searchRetailers = '';
  selectedRetailers: any[] = [];
  selectAllRetailers = false;
 
  categories: Category[] = [];
  roles: Role[] = [];
 
  newCategory = { categoryName: '' };
  newRole = { name: '' } as Role;
 
  successMessage = '';
  errorMessage = '';
 
  constructor(
    private adminService: AdminService,
    private roleService: RoleService,
    private router: Router,
    private chng: ChangeDetectorRef
  ) {}
 
  ngOnInit() {
    this.loadConsumers();
  }
 
  scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
 
  // ======================
  //  CONSUMERS
  // ======================
  loadConsumers() {
    this.activeTab = 'consumers';
    this.scrollToTop();
    this.searchConsumers = '';
 
    this.adminService.getConsumers().subscribe({
      next: (res: any) => {
        console.log('Consumers response:', res);
        this.consumers = res;
        this.filteredConsumers = res;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.log('Consumers error:', err);
        this.errorMessage = 'Failed to load consumers';
      }
    });
  }
 
  filterUsers(type: string) {
    let filtered = this.consumers;
    if (type === 'active')
      filtered = this.consumers.filter(u => u.status === 'Active');
    else if (type === 'blocked')
      filtered = this.consumers.filter(u => u.status === 'Blocked');
   
    this.applyConsumerSearch(filtered);
  }
 
  applyConsumerSearch(data: any[] = this.consumers) {
    if (!this.searchConsumers.trim()) {
      this.filteredConsumers = data;
    } else {
      const search = this.searchConsumers.toLowerCase();
      this.filteredConsumers = data.filter(u =>
        u.name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search)
      );
    }
    this.chng.detectChanges();
  }
 
  clearConsumerSearch() {
    this.searchConsumers = '';
    this.applyConsumerSearch();
  }
 
  // ======================
  //  RETAILERS
  // ======================
  loadRetailers() {
    this.activeTab = 'retailers';
    this.scrollToTop();
    this.searchRetailers = '';
    this.adminService.getRetailers().subscribe({
      next: (res: any) => {
        console.log('Retailers response:', res);
        this.retailers = res;
        this.filteredRetailers = res;
        this.chng.detectChanges();
      },
      error: (err) => {
        console.log('Retailers error:', err);
        this.errorMessage = 'Failed to load retailers';
      }
    });
  }
 
  applyRetailerSearch() {
    if (!this.searchRetailers.trim()) {
      this.filteredRetailers = this.retailers;
    } else {
      const search = this.searchRetailers.toLowerCase();
      this.filteredRetailers = this.retailers.filter(u =>
        u.shopname?.toLowerCase().includes(search) ||
        u.uEmail?.toLowerCase().includes(search) ||
        u.uName?.toLowerCase().includes(search)
      );
    }
    this.chng.detectChanges();
  }
 
  clearRetailerSearch() {
    this.searchRetailers = '';
    this.applyRetailerSearch();
  }
 
  blockUser(id: number) {
    this.adminService.blockUser(id).subscribe({
      next: (res: any) => {
        this.successMessage = res.message;
        this.reloadCurrentTab();
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to update user'
    });
  }
 
  // ======================
  //  CATEGORY
  // ======================
  loadCategories() {
    this.activeTab = 'category';
 
    this.adminService.getCategories().subscribe({
      next: (res: any) => {
        this.categories = res;
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to load categories'
    });
  }
 
  addCategory() {
    if (!this.newCategory.categoryName.trim()) return;
 
    this.adminService.addCategory(this.newCategory).subscribe({
      next: () => {
        this.successMessage = 'Category added';
        this.newCategory.categoryName = '';
        this.loadCategories();
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to add category'
    });
  }
 
  deleteCategory(id: number) {
    this.adminService.deleteCategory(id).subscribe({
      next: () => {
        this.successMessage = 'Category deleted';
        this.loadCategories();
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to delete category'
    });
  }
 
  // ======================
  //  ROLE
  // ======================
  loadRoles() {
    this.activeTab = 'roles';
    this.scrollToTop();
 
    this.roleService.getRole().subscribe({
      next: (res: Role[]) => {
        this.roles = res;
        console.log(this.roles);
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to load roles'
    });
  }
 
  addRole() {
    if (!this.newRole.name.trim()) return;
    this.roleService.addRole(this.newRole).subscribe({
      next: () => {
        this.successMessage = 'Role added';
        this.newRole.name = '';
        this.loadRoles();
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to add role'
    });
  }
 
  deleteRole(id: number) {
    this.roleService.deleteRole(id).subscribe({
      next: (res: any) => {
        this.successMessage = res.message;
        this.loadRoles();
        this.chng.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to delete role'
    });
  }
 
  // ======================
  //  HELPERS
  // ======================
  reloadCurrentTab() {
    if (this.activeTab === 'consumers') this.loadConsumers();
    if (this.activeTab === 'retailers') this.loadRetailers();
    if (this.activeTab === 'category') this.loadCategories();
    if (this.activeTab === 'roles') this.loadRoles();
  }
 
  // ======================
  //  BULK ACTIONS - CONSUMERS
  // ======================
  toggleConsumerSelect(consumer: any) {
    const index = this.selectedConsumers.indexOf(consumer);
    if (index > -1) {
      this.selectedConsumers.splice(index, 1);
    } else {
      this.selectedConsumers.push(consumer);
    }
    this.updateSelectAllConsumers();
    this.chng.detectChanges();
  }
 
  toggleSelectAllConsumers() {
    if (this.selectAllConsumers) {
      this.selectedConsumers = [...this.filteredConsumers];
    } else {
      this.selectedConsumers = [];
    }
    this.chng.detectChanges();
  }
 
  updateSelectAllConsumers() {
    this.selectAllConsumers = this.filteredConsumers.length > 0 &&
      this.selectedConsumers.length === this.filteredConsumers.length;
  }
 
  bulkBlockConsumers() {
    if (this.selectedConsumers.length === 0) {
      this.errorMessage = 'No consumers selected';
      return;
    }
 
    if (!confirm(`Block ${this.selectedConsumers.length} consumer(s)?`)) return;
 
    let blocked = 0;
    this.selectedConsumers.forEach(consumer => {
      this.adminService.blockUser(consumer.id).subscribe({
        next: () => {
          blocked++;
          if (blocked === this.selectedConsumers.length) {
            this.successMessage = `Blocked ${blocked} consumer(s)`;
            this.selectedConsumers = [];
            this.selectAllConsumers = false;
            this.loadConsumers();
          }
        },
        error: () => this.errorMessage = 'Failed to block some consumers'
      });
    });
  }
 
  exportConsumersCSV() {
    const data = this.filteredConsumers.length > 0 ? this.filteredConsumers : this.consumers;
    if (data.length === 0) {
      this.errorMessage = 'No data to export';
      return;
    }
 
    const headers = ['Name', 'Email', 'Status'];
    const rows = data.map(c => [c.name, c.email, c.status]);
   
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
   
    link.setAttribute('href', url);
    link.setAttribute('download', `consumers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
   
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
   
    this.successMessage = 'Consumers exported successfully';
  }
 
  // ======================
  //  BULK ACTIONS - RETAILERS
  // ======================
  toggleRetailerSelect(retailer: any) {
    const index = this.selectedRetailers.indexOf(retailer);
    if (index > -1) {
      this.selectedRetailers.splice(index, 1);
    } else {
      this.selectedRetailers.push(retailer);
    }
    this.updateSelectAllRetailers();
    this.chng.detectChanges();
  }
 
  toggleSelectAllRetailers() {
    if (this.selectAllRetailers) {
      this.selectedRetailers = [...this.filteredRetailers];
    } else {
      this.selectedRetailers = [];
    }
    this.chng.detectChanges();
  }
 
  updateSelectAllRetailers() {
    this.selectAllRetailers = this.filteredRetailers.length > 0 &&
      this.selectedRetailers.length === this.filteredRetailers.length;
  }
 
  bulkBlockRetailers() {
    if (this.selectedRetailers.length === 0) {
      this.errorMessage = 'No retailers selected';
      return;
    }
 
    if (!confirm(`Block ${this.selectedRetailers.length} retailer(s)?`)) return;
 
    let blocked = 0;
    this.selectedRetailers.forEach(retailer => {
      this.adminService.blockUser(retailer.userId).subscribe({
        next: () => {
          blocked++;
          if (blocked === this.selectedRetailers.length) {
            this.successMessage = `Blocked ${blocked} retailer(s)`;
            this.selectedRetailers = [];
            this.selectAllRetailers = false;
            this.loadRetailers();
          }
        },
        error: () => this.errorMessage = 'Failed to block some retailers'
      });
    });
  }
 
  exportRetailersCSV() {
    const data = this.filteredRetailers.length > 0 ? this.filteredRetailers : this.retailers;
    if (data.length === 0) {
      this.errorMessage = 'No data to export';
      return;
    }
 
    const headers = ['Shop Name', 'Owner', 'Email', 'Phone', 'Address', 'Status'];
    const rows = data.map(r => [r.shopname, r.uName, r.uEmail, r.userPhoneNumber, r.userAddress, r.status]);
   
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
   
    link.setAttribute('href', url);
    link.setAttribute('download', `retailers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
   
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
   
    this.successMessage = 'Retailers exported successfully';
  }
 
  // ======================
  //  LOGOUT
  // ======================
  logout() {
    localStorage.clear();
    this.router.navigate(['/']);
  }
}
 
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive} from '@angular/router';
import { UserService } from '../../../service/user-service';
import { CommonModule } from '@angular/common';
import { NotificationPanel } from "../../../notification-panel/notification-panel";

@Component({
  selector: 'app-retailer-navbar',
  imports: [RouterOutlet, RouterLink, CommonModule, RouterLinkActive, NotificationPanel],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class RetailerNavbar implements OnInit {

  private router = inject(Router);
  private service = inject(UserService);
  private chng = inject(ChangeDetectorRef);

  userName: string = '';
  showDropdown = false;
  retailerId: number = 0;


  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  ngOnInit(): void {
    this.service.getUserInfo().subscribe({
      next: res => {
        this.userName = res.userName;
        this.retailerId = res.UserId;
        this.chng.detectChanges();
      },
      error: () => {
        this.logout();
      }
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['']);
  }
}

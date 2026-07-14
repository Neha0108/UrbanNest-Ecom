import { ChangeDetectorRef, Component, ElementRef, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive, RouterModule } from '@angular/router';
import { UserService } from '../../../service/user-service';
import { CommonModule } from '@angular/common';
import { NotificationPanel } from "../../../notification-panel/notification-panel";
import { Chatbot } from "../../../chatbot/chatbot";

@Component({
  selector: 'app-consumer-navbar',
  imports: [RouterLink, RouterOutlet, RouterLinkActive, CommonModule, RouterModule, NotificationPanel, Chatbot],
  templateUrl: './consumer-navbar.html',
  styleUrl: './consumer-navbar.css',
})
export class ConsumerNavbar {

  private router = inject(Router);
  userName = '';
  service = inject(UserService);
  consumerId: number = 0;

  private chng = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.service.getUserInfo().subscribe({
      next: res => {
        this.userName = res.userName;
        this.consumerId = res.UserId;
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

  showDropdown = false;

  @ViewChild('dropdownRef') dropdownRef!: ElementRef;

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  // ✅ CLICK OUTSIDE DETECT
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.dropdownRef?.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}
import { Component,Input,OnInit,OnDestroy,ChangeDetectionStrategy,ChangeDetectorRef,signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService } from '../service/notification-service';
import { Notification } from '../interface/notification';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-panel.html',
  styleUrl: './notification-panel.css',
})
export class NotificationPanel implements OnInit, OnDestroy {
  @Input() role!: 'Consumer' | 'Retailer';

  notifications = signal<Notification[]>([]);
  isOpen = signal(false);
  isLoading = signal(false);
  unreadCount = signal(0);

  private pollSub?: Subscription;
  private unreadSub?: Subscription;

  constructor(
    public notifService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Sync shared unread count into local signal
    this.unreadSub = this.notifService.unreadCount.subscribe((c) => {
      this.unreadCount.set(c);
      this.cdr.markForCheck();
    });

    // ── Consumer ──────────────────────────────────────────────────────
    if (this.role === 'Consumer') {
      this.notifService.refreshConsumerUnreadCount(); // initial badge count
      this.pollSub = this.notifService.startPollingConsumer(); // poll every 30s

      // ── Retailer ──────────────────────────────────────────────────────
    } else if (this.role === 'Retailer') {
      this.notifService.refreshRetailerUnreadCount(); // initial badge count
      this.pollSub = this.notifService.startPollingRetailer(); // poll every 30s
    }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.unreadSub?.unsubscribe();
  }

  // ── Toggle panel open/close ───────────────────────────────────────────

  togglePanel(): void {
    if (!this.isOpen()) this.loadNotifications();
    this.isOpen.update((v) => !v);
  }

  closePanel(): void {
    this.isOpen.set(false);
  }

  // ── Load notifications (consumer or retailer based on role) ───────────

  private loadNotifications(): void {
    this.isLoading.set(true);

    // ── Consumer ──────────────────────────────────────────────────────
    const obs =
      this.role === 'Consumer'
        ? this.notifService.getConsumerNotifications()
        : // ── Retailer ──────────────────────────────────────────────────────
          this.notifService.getRetailerNotifications();

    obs.subscribe({
      next: (data) => {
        this.notifications.set(data);
        this.isLoading.set(false);
        this.cdr.markForCheck();
        console.log('Notifications loaded:', data);
      },
      error: () => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  // ── Mark all read ─────────────────────────────────────────────────────

  markAllRead(): void {
    // ── Consumer ──────────────────────────────────────────────────────
    const obs =
      this.role === 'Consumer'
        ? this.notifService.markAllConsumerRead()
        : // ── Retailer ──────────────────────────────────────────────────────
          this.notifService.markAllRetailerRead();

    obs.subscribe(() => {
      this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
      this.cdr.markForCheck();
    });
  }

  // ── Single notification click → mark read ────────────────────────────

  onNotificationClick(notif: Notification): void {
    if (!notif.isRead) {
      this.notifService.markAsRead(notif.id).subscribe();
      this.notifications.update((list) =>
        list.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
      this.unreadCount.update((c) => Math.max(0, c - 1));
      this.cdr.markForCheck();
    }
  }
}
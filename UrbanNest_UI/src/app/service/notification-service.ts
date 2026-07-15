// src/app/service/notification.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, EMPTY } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { Notification, UnreadCount } from '../interface/notification';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private baseUrl = 'http://localhost:5146/api/Notification';

  private unreadCount$ = new BehaviorSubject<number>(0);
  unreadCount = this.unreadCount$.asObservable();

  constructor(private http: HttpClient) {}

  // ── Fetch — no userId needed, backend reads JWT ───────────────────────

  getConsumerNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/consumer/my`).pipe(
      catchError(() => EMPTY)
    );
  }

  getRetailerNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/retailer/my`).pipe(
      catchError(() => EMPTY)
    );
  }

  // ── Unread count ──────────────────────────────────────────────────────

  refreshConsumerUnreadCount(): void {
    this.http
      .get<UnreadCount>(`${this.baseUrl}/consumer/my/unread-count`)
      .pipe(catchError(() => EMPTY))
      .subscribe(res => res && this.unreadCount$.next(res.count));
  }

  refreshRetailerUnreadCount(): void {
    this.http
      .get<UnreadCount>(`${this.baseUrl}/retailer/my/unread-count`)
      .pipe(catchError(() => EMPTY))
      .subscribe(res => res && this.unreadCount$.next(res.count));
  }

  // ── Polling ───────────────────────────────────────────────────────────

  startPollingConsumer() {
    return interval(30000).pipe(
      switchMap(() =>
        this.http.get<UnreadCount>(`${this.baseUrl}/consumer/my/unread-count`).pipe(
          catchError(() => EMPTY)
        )
      ),
      tap(res => res && this.unreadCount$.next(res.count))
    ).subscribe();
  }

  startPollingRetailer() {
    return interval(30000).pipe(
      switchMap(() =>
        this.http.get<UnreadCount>(`${this.baseUrl}/retailer/my/unread-count`).pipe(
          catchError(() => EMPTY)
        )
      ),
      tap(res => res && this.unreadCount$.next(res.count))
    ).subscribe();
  }

  // ── Mark read ─────────────────────────────────────────────────────────

  markAsRead(notificationId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${notificationId}/read`, {}).pipe(
      catchError(() => EMPTY)
    );
  }

  markAllConsumerRead(): Observable<any> {
    return this.http.put(`${this.baseUrl}/consumer/my/mark-all-read`, {}).pipe(
      tap(() => this.unreadCount$.next(0)),
      catchError(() => EMPTY)
    );
  }

  markAllRetailerRead(): Observable<any> {
    return this.http.put(`${this.baseUrl}/retailer/my/mark-all-read`, {}).pipe(
      tap(() => this.unreadCount$.next(0)),
      catchError(() => EMPTY)
    );
  }

  // ── Icon & colour helpers (unchanged) ─────────────────────────────────

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      ORDER_PLACED: 'shopping_bag', ORDER_CONFIRMED: 'check_circle',
      ORDER_SHIPPED: 'local_shipping', OUT_FOR_DELIVERY: 'delivery_dining',
      ORDER_DELIVERED: 'done_all', ORDER_CANCELLED: 'cancel',
      PAYMENT_SUCCESSFUL: 'payment', NEW_OFFER: 'local_offer',
      NEW_ORDER_RECEIVED: 'inbox', RETAILER_ORDER_CANCELLED: 'remove_shopping_cart',
      LOW_STOCK: 'warning', PRODUCT_APPROVED: 'verified',
      NEW_REVIEW: 'star', PAYMENT_RECEIVED: 'account_balance_wallet',
    };
    return icons[type] ?? 'notifications';
  }

  getColorClass(type: string): string {
    const colors: Record<string, string> = {
      ORDER_PLACED: 'notif-blue', ORDER_CONFIRMED: 'notif-green',
      ORDER_SHIPPED: 'notif-blue', OUT_FOR_DELIVERY: 'notif-orange',
      ORDER_DELIVERED: 'notif-green', ORDER_CANCELLED: 'notif-red',
      PAYMENT_SUCCESSFUL: 'notif-green', NEW_OFFER: 'notif-purple',
      NEW_ORDER_RECEIVED: 'notif-blue', RETAILER_ORDER_CANCELLED: 'notif-red',
      LOW_STOCK: 'notif-orange', PRODUCT_APPROVED: 'notif-green',
      NEW_REVIEW: 'notif-purple', PAYMENT_RECEIVED: 'notif-green',
    };
    return colors[type] ?? 'notif-grey';
  }

  getRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1)  return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24)  return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7)  return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}
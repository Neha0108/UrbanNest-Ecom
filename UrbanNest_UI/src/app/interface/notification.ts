export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  relatedOrderId?: number;
  relatedProductId?: number;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}
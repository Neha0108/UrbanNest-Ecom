using UrbanNest.DTO;

namespace UrbanNest.Repository
{
    public interface INotification
    {
        // ── Send (called internally from SOrder, SProduct etc.) ───────────────
        Task SendToConsumerAsync(int consumerId, string type, string title, string message,
            int? orderId = null, int? productId = null);

        Task SendToRetailerAsync(int retailerId, string type, string title, string message,
            int? orderId = null, int? productId = null);

        // ── Fetch by UserId (used by controller — no need to know consumer/retailer ID) ──
        Task<List<NotificationDTO>> GetConsumerNotificationsByUserIdAsync(int userId);
        Task<List<NotificationDTO>> GetRetailerNotificationsByUserIdAsync(int userId);

        // ── Unread count by UserId ────────────────────────────────────────────
        Task<int> GetUnreadCountByUserIdAsync(int userId, string role);

        // ── Mark all read by UserId ───────────────────────────────────────────
        Task MarkAllReadByUserIdAsync(int userId, string role);

        // ── Mark single read (by notification id — same as before) ───────────
        Task<bool> MarkAsReadAsync(int notificationId);

        // ── Keep originals for internal service calls ─────────────────────────
        Task<int> GetUnreadCountConsumerAsync(int consumerId);
        Task<int> GetUnreadCountRetailerAsync(int retailerId);
    }
}
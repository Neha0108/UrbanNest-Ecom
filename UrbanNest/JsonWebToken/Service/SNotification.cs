using Microsoft.EntityFrameworkCore;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Model;
using UrbanNest.Repository;

namespace UrbanNest.Service
{
    public class SNotification : INotification
    {
        private readonly DataBase _db;

        public SNotification(DataBase db)
        {
            _db = db;
        }

        // ── Send ──────────────────────────────────────────────────────────────

        public async Task SendToConsumerAsync(int consumerId, string type, string title,
            string message, int? orderId = null, int? productId = null)
        {
            Console.WriteLine("========== Notification Called ==========");
            _db.Notifications.Add(new Notification
            {
                ConsumerId = consumerId,
                Type = type,
                Title = title,
                Message = message,
                RelatedOrderId = orderId,
                RelatedProductId = productId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
            Console.WriteLine("Added to DbContext");

            await _db.SaveChangesAsync();

            Console.WriteLine("Saved Successfully");

        }

        public async Task SendToRetailerAsync(int retailerId, string type, string title,
            string message, int? orderId = null, int? productId = null)
        {
            _db.Notifications.Add(new Notification
            {
                RetailerId = retailerId,
                Type = type,
                Title = title,
                Message = message,
                RelatedOrderId = orderId,
                RelatedProductId = productId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        // ── Fetch by UserId ───────────────────────────────────────────────────
        // Consumer.UserId links Consumer table → Users table

        public async Task<List<NotificationDTO>> GetConsumerNotificationsByUserIdAsync(int userId)
        {
            return await _db.Notifications
                .Where(n => n.Consumer != null && n.Consumer.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => MapToDTO(n))
                .ToListAsync();
        }

        public async Task<List<NotificationDTO>> GetRetailerNotificationsByUserIdAsync(int userId)
        {
            return await _db.Notifications
                .Where(n => n.Retailer != null && n.Retailer.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => MapToDTO(n))
                .ToListAsync();
        }

        // ── Unread count by UserId ────────────────────────────────────────────

        public async Task<int> GetUnreadCountByUserIdAsync(int userId, string role)
        {
            if (role == "Consumer")
                return await _db.Notifications
                    .CountAsync(n => n.Consumer != null && n.Consumer.UserId == userId && !n.IsRead);

            return await _db.Notifications
                .CountAsync(n => n.Retailer != null && n.Retailer.UserId == userId && !n.IsRead);
        }

        // ── Mark all read by UserId ───────────────────────────────────────────

        public async Task MarkAllReadByUserIdAsync(int userId, string role)
        {
            if (role == "Consumer")
            {
                var consumerId = await _db.consumers
                    .Where(c => c.UserId == userId)
                    .Select(c => c.ConsumerId)
                    .FirstOrDefaultAsync();

                if (consumerId > 0)
                    await _db.Notifications
                        .Where(n => n.ConsumerId == consumerId && !n.IsRead)
                        .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
            }
            else
            {
                var retailerId = await _db.retailers
                    .Where(r => r.UserId == userId)
                    .Select(r => r.RetailerId)
                    .FirstOrDefaultAsync();

                if (retailerId > 0)
                    await _db.Notifications
                        .Where(n => n.RetailerId == retailerId && !n.IsRead)
                        .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
            }
        }

        // ── Mark single read ──────────────────────────────────────────────────

        public async Task<bool> MarkAsReadAsync(int notificationId)
        {
            var n = await _db.Notifications.FindAsync(notificationId);
            if (n == null) return false;
            n.IsRead = true;
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Legacy by consumer/retailer id (used internally) ─────────────────

        public async Task<int> GetUnreadCountConsumerAsync(int consumerId) =>
            await _db.Notifications.CountAsync(n => n.ConsumerId == consumerId && !n.IsRead);

        public async Task<int> GetUnreadCountRetailerAsync(int retailerId) =>
            await _db.Notifications.CountAsync(n => n.RetailerId == retailerId && !n.IsRead);

        // ── Mapper ────────────────────────────────────────────────────────────

        private static NotificationDTO MapToDTO(Notification n) => new()
        {
            Id = n.Id,
            Type = n.Type,
            Title = n.Title,
            Message = n.Message,
            RelatedOrderId = n.RelatedOrderId,
            RelatedProductId = n.RelatedProductId,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt
        };
    }
}
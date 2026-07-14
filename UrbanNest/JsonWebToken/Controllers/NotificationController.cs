using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using UrbanNest.DataAccess;
using UrbanNest.Migrations;
using UrbanNest.Repository;

namespace UrbanNest.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotification notificationService;
        private readonly DataBase database;

        public NotificationController(INotification notificationService, DataBase database)
        {
            this.notificationService = notificationService;
            this.database = database;
        }

        // ── Same pattern as RetailerController ────────────────────────────────
        private int GetUserIdFromToken()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        // ── Consumer endpoints ────────────────────────────────────────────────

        [HttpGet("consumer/my")]
        public async Task<IActionResult> GetMyConsumerNotifications()
        {
            var userId = GetUserIdFromToken();
            var consumer = await database.consumers
                    .FirstOrDefaultAsync(c => c.UserId == userId);
            if (consumer == null)
            {
                return BadRequest("Consumer not found");
            }

            var notifications = await notificationService.GetConsumerNotificationsByUserIdAsync(consumer.ConsumerId);
            return Ok(notifications);
        }

        [HttpGet("consumer/my/unread-count")]
        public async Task<IActionResult> GetMyConsumerUnreadCount()
        {
            var userId = GetUserIdFromToken();
            var consumer = await database.consumers
                    .FirstOrDefaultAsync(c => c.UserId == userId);
            if (consumer == null)
            {
                return BadRequest("Consumer not found");
            }

            var count = await notificationService.GetUnreadCountByUserIdAsync(consumer.ConsumerId, "Consumer");
            return Ok(new { count });
        }

        [HttpPut("consumer/my/mark-all-read")]
        public async Task<IActionResult> MarkAllMyConsumerRead()
        {
            var userId = GetUserIdFromToken();
            var consumer = await database.consumers
                    .FirstOrDefaultAsync(c => c.UserId == userId);
            if (consumer == null)
            {
                return BadRequest("Consumer not found");
            }

            await notificationService.MarkAllReadByUserIdAsync(consumer.ConsumerId, "Consumer");
            return Ok(new { message = "All notifications marked as read." });
        }

        // ── Retailer endpoints ────────────────────────────────────────────────

        [HttpGet("retailer/my")]
        public async Task<IActionResult> GetMyRetailerNotifications()
        {
            var userId = GetUserIdFromToken();
            var retailer = await database.retailers
                    .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null)
                return BadRequest("Retailer not found");

            var notifications = await notificationService.GetRetailerNotificationsByUserIdAsync(retailer.RetailerId);
            return Ok(notifications);
        }

        [HttpGet("retailer/my/unread-count")]
        public async Task<IActionResult> GetMyRetailerUnreadCount()
        {
            var userId = GetUserIdFromToken();
            var retailer = await database.retailers
                    .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null)
                return BadRequest("Retailer not found");

            var count = await notificationService.GetUnreadCountByUserIdAsync(retailer.RetailerId, "Retailer");
            return Ok(new { count });
        }

        [HttpPut("retailer/my/mark-all-read")]
        public async Task<IActionResult> MarkAllMyRetailerRead()
        {
            var userId = GetUserIdFromToken();
            var retailer = await database.retailers
                    .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null)
                return BadRequest("Retailer not found");

            await notificationService.MarkAllReadByUserIdAsync(retailer.RetailerId, "Retailer");
            return Ok(new { message = "All notifications marked as read." });
        }

        // ── Shared ────────────────────────────────────────────────────────────

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var result = await notificationService.MarkAsReadAsync(id);
            if (!result) return NotFound(new { message = "Notification not found." });
            return Ok(new { message = "Marked as read." });
        }
    }
}
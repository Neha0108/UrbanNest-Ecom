using Microsoft.AspNetCore.Mvc;
using Razorpay.Api;
using System.Security.Claims;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Repository;

namespace UrbanNest.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly DataBase _db;
        private readonly IEmail email;
        private readonly IOrder order;

        public OrderController(DataBase db, IEmail email, IOrder order)
        {
            _db = db;
            this.email = email;
            this.order = order;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // ── Place Order ───────────────────────────────────────────────────────

        [HttpPost]
        public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderRequest request)
        {
            var userId = GetUserId();

            var (success, message, orderId) = await order.PlaceOrderAsync(userId, request);

            if (!success)
                return BadRequest(new { message });

            // PDF + email (kept in controller since it's a delivery concern, not order logic)
            byte[] pdfBytes;
            try
            {
                pdfBytes = await order.GenerateInvoicePdf(orderId);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }

            if (pdfBytes == null || pdfBytes.Length == 0)
                return StatusCode(500, "PDF generation failed");

            var user = await _db.Users.FindAsync(userId);
            try
            {
                await email.SendInvoiceEmail(user!.userEmail, pdfBytes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Email failed: " + ex.Message);
            }

            return Ok(new { message, orderId });
        }

        // ── Get Retailer Orders ───────────────────────────────────────────────

        [HttpGet]
        public async Task<IActionResult> GetRetailerOrders()
        {
            var result = await order.GetRetailerOrdersAsync(GetUserId());

            if (result == null)
                return BadRequest("Retailer not found");

            return Ok(result);
        }

        // ── Get User Orders ───────────────────────────────────────────────────

        [HttpGet]
        public async Task<IActionResult> GetUserOrders()
        {
            var result = await order.GetUserOrdersAsync(GetUserId());
            return Ok(result);
        }

        // ── Update Order Status ───────────────────────────────────────────────

        [HttpPut]
        public async Task<IActionResult> UpdateOrderStatus(int orderId, string status)
        {
            var (success, message) = await order.UpdateOrderStatusAsync(orderId, status, GetUserId());

            if (!success)
            {
                // Preserve original response codes
                if (message == "Forbidden") return Forbid();
                if (message == "Order not found") return NotFound(new { message });
                return BadRequest(new { message });
            }

            return Ok(new { message });
        }

        // ── Cancel Order ──────────────────────────────────────────────────────

        [HttpPut]
        public async Task<IActionResult> CancelOrder(int orderId)
        {
            var (success, message) = await order.CancelOrderAsync(orderId, GetUserId());

            if (!success)
            {
                if (message == "Order not found") return NotFound(new { message });
                return BadRequest(new { message });
            }

            return Ok(new { message });
        }

        [HttpPut("{orderId}")]
        public async Task<IActionResult> SetDeliveryDetails(int orderId, [FromBody] DeliveryDetailsDTO dto)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var (success, message) = await order.SetDeliveryDetailsAsync(orderId, dto, userId);
            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }
    }
}
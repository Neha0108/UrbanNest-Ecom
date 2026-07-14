using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Migrations;
using UrbanNest.Model;
using UrbanNest.Repository;

namespace UrbanNest.Service
{
    public class SOrder : IOrder
    {
        private readonly DataBase database;
        private readonly INotification notification;

        public SOrder(DataBase db, INotification notif)
        {
            database = db;
            notification = notif;
        }

        public async Task<(bool success, string message, int orderId)> PlaceOrderAsync(int userId, PlaceOrderRequest request)
        {
            var cartItems = await database.cartItems
                .Include(c => c.Product)
                .Include(c => c.Cart)
                .Where(c => c.Cart.UserId == userId &&
                            request.SelectedProductIds.Contains(c.ProductId))
                .ToListAsync();

            var address = await database.UserAddress
                .FirstOrDefaultAsync(a => a.AddressId == request.AddressId && a.UserId == userId);

            if (address == null)
                return (false, "Please select an address", 0);

            if (!cartItems.Any())
                return (false, "No items selected", 0);

            foreach (var item in cartItems)
            {
                if (item.Product == null || item.Product.stock < item.Quantity)
                    return (false, $"{item.Product?.productName} is out of stock", 0);
            }

            using var transaction = await database.Database.BeginTransactionAsync();

            try
            {
                var order = new Orders
                {
                    UsersId = userId,
                    OrderDate = DateTime.UtcNow,
                    AddressId = request.AddressId,
                    Status = "Pending"
                };

                database.orders.Add(order);
                await database.SaveChangesAsync();

                // Track unique retailers in this order for notifications
                var retailerIds = new HashSet<int>();

                foreach (var item in cartItems)
                {
                    database.orderItems.Add(new OrderItem
                    {
                        OrderId = order.OrderId,
                        ProductId = item.ProductId,
                        RetailerId = item.Product!.RetailerId,
                        Quantity = item.Quantity,
                        Price = item.Product.productPrice,
                        Status = "Pending"
                    });

                    item.Product.stock -= item.Quantity;
                    retailerIds.Add(item.Product.RetailerId);

                    // Low stock alert
                    if (item.Product.stock <= 5)
                    {
                        await notification.SendToRetailerAsync(
                            retailerId: item.Product.RetailerId,
                            type: NotificationTypes.LowStock,
                            title: "Low Stock Alert ⚠️",
                            message: $"'{item.Product.productName}' has only {item.Product.stock} units left.",
                            productId: item.Product.productId
                        );
                    }
                }

                database.cartItems.RemoveRange(cartItems);
                await database.SaveChangesAsync();
                await transaction.CommitAsync();

                // Get consumer record for notification
                var consumer = await database.consumers
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                if (consumer != null)
                {
                    await notification.SendToConsumerAsync(
                        consumerId: consumer.ConsumerId,
                        type: NotificationTypes.OrderPlaced,
                        title: "Order Placed! 🎉",
                        message: $"Your order #{order.OrderId} has been placed successfully.",
                        orderId: order.OrderId
                    );
                }

                // Notify every retailer who has items in this order
                foreach (var retailerId in retailerIds)
                {
                    await notification.SendToRetailerAsync(
                        retailerId: retailerId,
                        type: NotificationTypes.NewOrderReceived,
                        title: "New Order Received 📦",
                        message: $"You have a new order #{order.OrderId}.",
                        orderId: order.OrderId
                    );
                }

                return (true, "Order placed successfully", order.OrderId);
            }
            catch (Exception ex)
            {
                try { await transaction.RollbackAsync(); } catch { }
                return (false, $"Order failed: {ex.Message} | Inner: {ex.InnerException?.Message}", 0);
            }
        }

        // ── Get Retailer Orders ───────────────────────────────────────────────

        public async Task<object?> GetRetailerOrdersAsync(int userId)
        {
            var retailer = await database.retailers
                .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null) return null;

            var orders = await database.orderItems
                .Include(o => o.Product)
                .Include(o => o.Order)
                .Where(o => o.RetailerId == retailer.RetailerId)
                .GroupBy(o => o.Order)
                .Select(group => new
                {
                    OrderId = group.Key.OrderId,
                    OrderDate = group.Key.OrderDate,
                    Status = group.Key.Status,
                    CustomerName = group.Key.User.userName,
                    CustomerEmail = group.Key.User.userEmail,
                    DeliveryPersonName = group.Key.DeliveryPersonName,
                    DeliveryPersonPhone = group.Key.DeliveryPersonPhone,
                    Items = group.Select(o => new
                    {
                        ProductId = o.ProductId,
                        ProductName = o.Product.productName,
                        Quantity = o.Quantity,
                        Price = o.Price,
                        Stock = o.Product.stock,
                        CategoryName = o.Product.Category.CategoryName
                    })
                })
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return orders;
        }

        // ── Get User Orders ───────────────────────────────────────────────────

        public async Task<object?> GetUserOrdersAsync(int userId)
        {
            return await database.orders
                .Where(o => o.UsersId == userId)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new
                {
                    o.OrderId,
                    o.OrderDate,
                    o.Status,
                    o.DeliveryPersonName,
                    o.DeliveryPersonPhone,
                    Items = o.OrderItems.Select(oi => new
                    {
                        oi.Product.productName,
                        oi.Quantity,
                        oi.Price
                    })
                })
                .ToListAsync();
        }

        // ── Update Order Status ───────────────────────────────────────────────

        public async Task<(bool success, string message)> UpdateOrderStatusAsync(
            int orderId, string status, int userId)
        {
            var retailer = await database.retailers
                .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null)
                return (false, "Retailer not found");

            var order = await database.orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null)
                return (false, "Order not found");

            bool isRetailerOrder = order.OrderItems
                .Any(oi => oi.RetailerId == retailer.RetailerId);

            if (!isRetailerOrder)
                return (false, "Forbidden");

            if (order.Status == "Cancelled by User")
                return (false, "This order was cancelled by user and cannot be updated.");

            if (order.Status == "Delivered")
                return (false, "Delivered order cannot be updated.");

            var allowedStatuses = new List<string>
            {
                "Pending", "Confirmed", "Shipped", "Out for Delivery", "Delivered"
            };

            if (!allowedStatuses.Contains(status))
                return (false, "Invalid order status");

            order.Status = status;
            await database.SaveChangesAsync();

            // Notify consumer of status change
            var consumer = await database.consumers
                .FirstOrDefaultAsync(c => c.UserId == order.UsersId);

            if (consumer != null)
            {
                var (type, title, msg) = status switch
                {
                    "Confirmed" => (NotificationTypes.OrderConfirmed, "Order Confirmed ✅", $"Your order #{orderId} has been confirmed."),
                    "Shipped" => (NotificationTypes.OrderShipped, "Order Shipped 🚚", $"Your order #{orderId} is on its way!"),
                    "Out for Delivery" => (NotificationTypes.OutForDelivery, "Out for Delivery 🛵", $"Your order #{orderId} will arrive today."),
                    "Delivered" => (NotificationTypes.OrderDelivered, "Delivered! 📬", $"Your order #{orderId} has been delivered. Enjoy!"),
                    _ => (null, null, null)
                };

                if (type != null)
                {
                    await notification.SendToConsumerAsync(
                        consumerId: consumer.ConsumerId,
                        type: type,
                        title: title!,
                        message: msg!,
                        orderId: orderId
                    );
                }
            }

            return (true, "Status updated");
        }

        // ── Cancel Order ──────────────────────────────────────────────────────

        public async Task<(bool success, string message)> CancelOrderAsync(int orderId, int userId)
        {
            var order = await database.orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UsersId == userId);

            if (order == null)
                return (false, "Order not found");

            if (order.Status is "Shipped" or "Out for Delivery" or "Delivered")
                return (false, "Order cannot be cancelled now");

            if (order.Status == "Cancelled by User")
                return (false, "Order already cancelled");

            order.Status = "Cancelled by User";

            foreach (var item in order.OrderItems)
            {
                if (item.Product != null)
                    item.Product.stock += item.Quantity;
            }

            await database.SaveChangesAsync();

            // Notify consumer
            var consumer = await database.consumers
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (consumer != null)
            {
                await notification.SendToConsumerAsync(
                    consumerId: consumer.ConsumerId,
                    type: NotificationTypes.OrderCancelled,
                    title: "Order Cancelled",
                    message: $"Your order #{orderId} has been cancelled.",
                    orderId: orderId
                );
            }

            // Notify each retailer whose items were in the order
            var retailerIds = order.OrderItems
                .Select(oi => oi.RetailerId)
                .Distinct();

            foreach (var retailerId in retailerIds)
            {
                await notification.SendToRetailerAsync(
                    retailerId: retailerId,
                    type: NotificationTypes.RetailerOrderCancelled,
                    title: "Order Cancelled by Customer",
                    message: $"Order #{orderId} was cancelled by the customer.",
                    orderId: orderId
                );
            }

            return (true, "Order cancelled by user");
        }
        public async Task<byte[]> GenerateInvoicePdf(int orderId)
        {
            var order = await database.orders
                .Include(o => o.Address)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstAsync(o => o.OrderId == orderId);

            var address = order.Address;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(30);

                    page.Header().Row(row =>
                    {
                        row.ConstantItem(100).Image(File.ReadAllBytes("wwwroot/FinalBrand.png")).FitArea();

                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("UrbanNest")
                                .FontSize(24)
                                .Bold()
                                .FontColor("#C9A45C");

                            col.Item().Text("Luxury Living")
                                .FontSize(10)
                                .FontColor(Colors.Grey.Medium);
                        });

                        row.ConstantItem(180).Column(col =>
                        {
                            col.Item().AlignRight().Text("INVOICE")
                                .FontSize(18).Bold();

                            col.Item().AlignRight().Text($"Order ID: {order.OrderId}");
                            col.Item().AlignRight().Text($"Date: {order.OrderDate:dd MMM yyyy}");
                        });
                    });

                    page.Content().PaddingVertical(15).Column(col =>
                    {
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("Shipping Address").Bold().FontSize(12);

                                c.Item().Text(address?.FullName ?? "Customer");
                                c.Item().Text(address?.AddressLine ?? "Address not available");
                                c.Item().Text($"{address?.City}, {address?.State} - {address?.Pincode}");
                                c.Item().Text($"Phone: {address?.Phone ?? "N/A"}");
                            });

                            row.RelativeItem().Column(c =>
                            {
                                c.Item().AlignRight().Text("Payment").Bold().FontSize(12);
                                c.Item().AlignRight().Text("Mode: Online");
                                c.Item().AlignRight().Text("Status: Paid");
                            });
                        });

                        col.Item().PaddingVertical(10).LineHorizontal(1).LineColor("#C9A45C");

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(4);
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background("#C9A45C").Padding(5)
                                    .Text("Product").Bold().FontColor(Colors.White);

                                header.Cell().Background("#C9A45C").Padding(5)
                                    .AlignCenter().Text("Qty").Bold().FontColor(Colors.White);

                                header.Cell().Background("#C9A45C").Padding(5)
                                    .AlignRight().Text("Price").Bold().FontColor(Colors.White);

                                header.Cell().Background("#C9A45C").Padding(5)
                                    .AlignRight().Text("Total").Bold().FontColor(Colors.White);
                            });

                            double subtotal = 0;

                            foreach (var item in order.OrderItems)
                            {
                                var name = item.Product?.productName ?? "Product";
                                double total = item.Price * item.Quantity;
                                subtotal += total;

                                table.Cell().Padding(5).Text(name);
                                table.Cell().Padding(5).AlignCenter().Text(item.Quantity.ToString());
                                table.Cell().Padding(5).AlignRight().Text($"Rs {item.Price}");
                                table.Cell().Padding(5).AlignRight().Text($"Rs {total}");
                            }

                            double gst = subtotal * 0.18;
                            double grandTotal = subtotal + gst;

                            table.Cell().ColumnSpan(3).AlignRight().Text("Subtotal:");
                            table.Cell().AlignRight().Text($"Rs {subtotal}");

                            table.Cell().ColumnSpan(3).AlignRight().Text("GST (18%):");
                            table.Cell().AlignRight().Text($"Rs {gst}");

                            table.Cell().ColumnSpan(3).AlignRight().Text("Grand Total:")
                                .Bold().FontColor("#C9A45C");

                            table.Cell().AlignRight()
                                .Text($"Rs {grandTotal}")
                                .Bold().FontColor("#C9A45C");
                        });

                        col.Item().PaddingTop(15).LineHorizontal(1).LineColor("#C9A45C");

                        col.Item().PaddingTop(10)
                            .AlignCenter()
                            .Text("Thank you for shopping with UrbanNest!")
                            .Italic()
                            .FontSize(10);
                    });

                    page.Footer().AlignCenter().Text(txt =>
                    {
                        txt.Span("UrbanNest • Premium Experience ")
                            .FontSize(9)
                            .FontColor("#C9A45C");
                    });
                });
            });

            return document.GeneratePdf();
        }

        public async Task<(bool success, string message)> SetDeliveryDetailsAsync(int orderId, DeliveryDetailsDTO dto, int retailerUserId)
        {
            var retailer = await database.retailers.FirstOrDefaultAsync(r => r.UserId == retailerUserId);
            if (retailer == null)
                return (false, "Retailer profile not found");

            var order = await database.orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null)
                return (false, "Order not found");

            bool ownsOrder = order.OrderItems.Any(i => i.RetailerId == retailer.RetailerId);
            if (!ownsOrder)
                return (false, "You do not have permission to update this order");

            order.DeliveryPersonName = dto.DeliveryPersonName;
            order.DeliveryPersonPhone = dto.DeliveryPersonPhone;
            await database.SaveChangesAsync();

            var consumer = await database.consumers.FirstOrDefaultAsync(c => c.UserId == order.UsersId);
            if (consumer != null)
            {
                await notification.SendToConsumerAsync(
                    consumer.ConsumerId,
                    NotificationTypes.OutForDelivery,
                    "Delivery partner assigned",
                    $"{dto.DeliveryPersonName} will deliver your order #{order.OrderId}.",
                    orderId: order.OrderId
                );
            }

            return (true, "Delivery details updated");
        }
    }
}
using UrbanNest.DTO;

namespace UrbanNest.Repository
{
    public interface IOrder
    {
        Task<(bool success, string message, int orderId)> PlaceOrderAsync(int userId, PlaceOrderRequest request);
        Task<object?> GetRetailerOrdersAsync(int userId);
        Task<object?> GetUserOrdersAsync(int userId);
        Task<(bool success, string message)> UpdateOrderStatusAsync(int orderId, string status, int userId);
        Task<(bool success, string message)> CancelOrderAsync(int orderId, int userId);
        Task<byte[]> GenerateInvoicePdf(int orderId);
        Task<(bool success, string message)> SetDeliveryDetailsAsync(int orderId, DeliveryDetailsDTO dto, int retailerUserId);
    }
}
namespace UrbanNest.Model
{
    /// <summary>
    /// Central registry of all notification type constants.
    /// Use these when calling INotification.SendAsync(type, ...).
    /// </summary>
    public static class NotificationTypes
    {
        public const string OrderPlaced = "ORDER_PLACED";
        public const string OrderConfirmed = "ORDER_CONFIRMED";
        public const string OrderShipped = "ORDER_SHIPPED";
        public const string OutForDelivery = "OUT_FOR_DELIVERY";
        public const string OrderDelivered = "ORDER_DELIVERED";
        public const string OrderCancelled = "ORDER_CANCELLED";
        public const string PaymentSuccessful = "PAYMENT_SUCCESSFUL";
        public const string NewOffer = "NEW_OFFER";

        public const string NewOrderReceived = "NEW_ORDER_RECEIVED";
        public const string RetailerOrderCancelled = "RETAILER_ORDER_CANCELLED";
        public const string LowStock = "LOW_STOCK";
        public const string ProductApproved = "PRODUCT_APPROVED";
        public const string NewReview = "NEW_REVIEW";
        public const string PaymentReceived = "PAYMENT_RECEIVED";
    }
}
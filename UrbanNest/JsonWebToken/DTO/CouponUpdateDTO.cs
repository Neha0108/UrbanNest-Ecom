namespace UrbanNest.DTO
{
    public class CouponUpdateDTO
    {
        public string Description { get; set; } = string.Empty;
        public double DiscountValue { get; set; }
        public double MinimumOrderAmount { get; set; }
        public double? MaximumDiscount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int? UsageLimit { get; set; }
        public bool IsActive { get; set; }
    }

    public class CouponResponseDTO
    {
        public int CouponId { get; set; }
        public string CouponCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string DiscountType { get; set; } = string.Empty;
        public double DiscountValue { get; set; }
        public double MinimumOrderAmount { get; set; }
        public double? MaximumDiscount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int? UsageLimit { get; set; }
        public int UsedCount { get; set; }
        public bool IsActive { get; set; }
        public string CouponScope { get; set; } = string.Empty;
        public int? RetailerId { get; set; }
        public string? RetailerShopName { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsExpired { get; set; }
        public bool IsUpcoming { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanNest.Model
{
    public enum DiscountType
    {
        Flat,
        Percentage
    }

    public enum CouponScope
    {
        Global,
        Retailer
    }

    public class Coupon
    {
        [Key]
        public int CouponId { get; set; }

        [Required]
        [StringLength(30)]
        public string CouponCode { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required]
        public DiscountType DiscountType { get; set; }

        public double DiscountValue { get; set; }

        public double MinimumOrderAmount { get; set; } = 0;

        public double? MaximumDiscount { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime ExpiryDate { get; set; }

        public int? UsageLimit { get; set; }

        public int UsedCount { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public int CreatedByUserId { get; set; }

        [Required]
        public CouponScope CouponScope { get; set; }

        public int? RetailerId { get; set; }

        [ForeignKey("RetailerId")]
        public Retailer? Retailer { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
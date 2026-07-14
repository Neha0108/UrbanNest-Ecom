using System.ComponentModel.DataAnnotations;
using UrbanNest.Model;

namespace UrbanNest.DTO
{
    public class CouponCreateDTO
    {
        public string CouponCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DiscountType DiscountType { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Discount value must be greater than 0")]
        public double DiscountValue { get; set; }
        [Range(0, double.MaxValue)]
        public double MinimumOrderAmount { get; set; } = 0;
        public double? MaximumDiscount { get; set; }
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public DateTime ExpiryDate { get; set; }
        public int? UsageLimit { get; set; }
        [Required]
        public CouponScope CouponScope { get; set; }
        public int? RetailerId { get; set; }
    }
}
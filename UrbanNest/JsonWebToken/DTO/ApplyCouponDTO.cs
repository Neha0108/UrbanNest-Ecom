using System.ComponentModel.DataAnnotations;

namespace UrbanNest.DTO
{
    public class ApplyCouponRequestDTO
    {
        [Required]
        public string CouponCode { get; set; } = string.Empty;

        [Required]
        public List<ApplyCouponCartItemDTO> CartItems { get; set; } = new();
    }

    public class ApplyCouponCartItemDTO
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public double Price { get; set; }
    }

    public class ApplyCouponResultDTO
    {
        public bool Valid { get; set; }
        public string Reason { get; set; } = string.Empty;
        public double DiscountAmount { get; set; }
        public double OriginalTotal { get; set; }
        public double FinalTotal { get; set; }
        public string? CouponCode { get; set; }
    }
}

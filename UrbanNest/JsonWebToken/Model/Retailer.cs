using System.ComponentModel.DataAnnotations;

namespace UrbanNest.Model
{
    public class Retailer
    {
        [Key]
        public int RetailerId { get; set; }
        public int UserId { get; set; }
        public Users User { get; set; }

        public string ShopName { get; set; } = string.Empty;
        public string ShopDescription { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;

        [DataType(DataType.PostalCode)]
        public string Pincode { get; set; } = string.Empty;

        [DataType(DataType.PhoneNumber)]
        public string ContactNumber { get; set; } = string.Empty;
        [DataType(DataType.PhoneNumber)]
        public string? AlternateNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(15)]
        public string GSTNumber { get; set; } = string.Empty;
        public string PANNumber { get; set; } = string.Empty;
        public string BankAccountNumber { get; set; } = string.Empty;
        public string IFSCCode { get; set; } = string.Empty;
        public string AccountHolderName { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? BannerUrl { get; set; }
        public bool IsVerified { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
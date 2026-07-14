using System.ComponentModel.DataAnnotations;

namespace UrbanNest.Model
{
    public class Product
    {
        [Key]
        public int productId { get; set; }
        public string productName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime productAdded { get; set; } = DateTime.UtcNow;
        public int CategoryId { get; set; }
        public Category Category { get; set; }
        public int SubCategoryId { get; set; }
        public SubCategory SubCategory { get; set; }
        public double productPrice { get; set; }
        public ICollection<WishlistItem> WishlistItems { get; set; }
        public List<ProductImage> imagepath { get; set; } = new();
        public int RetailerId { get; set; }
        public Retailer Retailer { get; set; }
        public int stock { get; set; }
    }
}

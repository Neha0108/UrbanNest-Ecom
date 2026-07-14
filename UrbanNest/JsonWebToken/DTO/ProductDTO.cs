using System.ComponentModel.DataAnnotations;

namespace UrbanNest.DTO
{
    public class ProductDTO
    {
        public int productId { get; set; }
        public string productName { get; set; } = string.Empty;
        public string productDescription { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string SubCategoryName { get; set; } = string.Empty;
        public double productPrice { get; set; }
        public List<IFormFile>? imagepath { get; set; }
        public int stock { get; set; }

    }
}

namespace UrbanNest.DTO
{
    public class ProductViewDTO
    {
        public int productId { get; set; }
        public string productName { get; set; } = string.Empty;
        public string? retailerName { get; set; } = string.Empty;
        public string productDescription { get; set; } = string.Empty;
        public string categoryName { get; set; } = string.Empty;
        public string subCategoryName { get; set; } = string.Empty;
        public double productPrice { get; set; }
        public List<string> imagepath { get; set; }
        public int stock { get; set; }
        public DateTime expectedDelivery { get; set; }
    }
}
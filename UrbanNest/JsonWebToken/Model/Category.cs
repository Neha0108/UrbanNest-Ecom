using UrbanNest.Model;

namespace UrbanNest.Model
{
    public class Category
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? ImageUrl { get; set; } = string.Empty;
        public ICollection<Product> products { get; set; }
        public ICollection<SubCategory> SubCategories { get; set; }
    }
}

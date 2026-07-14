using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanNest.Model
{
    public class SubCategory
    {
        [Key]
        public int SubCategoryId { get; set; }

        [Required]
        public string SubCategoryName { get; set; } = string.Empty;

        [ForeignKey("Category")]
        public int CategoryId { get; set; }

        public Category Category { get; set; }

        public ICollection<Product> Products { get; set; }
    }
}
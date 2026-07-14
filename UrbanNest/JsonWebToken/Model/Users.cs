using UrbanNest.DTO;
using System.ComponentModel.DataAnnotations;
using System.Data;

namespace UrbanNest.Model
{
    public class Users
    {
        [Key]
        public int UserId { get; set; }
        [Required]
        public string userName { get; set; } = string.Empty;
        [Required]
        [EmailAddress]
        public string userEmail { get; set; } = string.Empty;
        [Required]
        public string userPassword { get; set; } = string.Empty;

        public string Status { get; set; } = "Active";
        public int RoleId { get; set; }
        public Role Role { get; set; }
        public ICollection<Product> Products { get; set; }
        public ICollection<WishlistItem> Wishlist { get; set; }
    }
}

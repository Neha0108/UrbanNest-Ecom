using UrbanNest.Model;
using System.ComponentModel.DataAnnotations;

namespace UrbanNest.Model
{
    public class Cart
    {
        [Key]
        public int CartId { get; set; }
        public int UserId { get; set; }
        public Users User { get; set; }
        public ICollection<CartItem> CartItems { get; set; }
    }
}

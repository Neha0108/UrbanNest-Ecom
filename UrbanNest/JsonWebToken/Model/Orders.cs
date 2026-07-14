using System.ComponentModel.DataAnnotations;

namespace UrbanNest.Model
{
    public class Orders
    {
        [Key]
        public int OrderId { get; set; }
        public int UsersId { get; set; }
        public Users User { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.Now;
        public string Status { get; set; } = "Pending";
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public int AddressId { get; set; }
        public UserAddress Address { get; set; }
        public string? DeliveryPersonName { get; set; }
        public string? DeliveryPersonPhone { get; set; }
    }
}
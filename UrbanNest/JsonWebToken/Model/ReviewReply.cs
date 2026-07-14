using System.ComponentModel.DataAnnotations;

namespace UrbanNest.Model
{
    public class ReviewReply
    {
        [Key]
        public int Id { get; set; }
        public int ReviewId { get; set; }
        public Review Review { get; set; }
        public int RetailerId { get; set; }
        public Retailer Retailer { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
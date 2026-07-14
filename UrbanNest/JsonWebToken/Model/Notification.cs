using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanNest.Model
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        public int? ConsumerId { get; set; }
        public int? RetailerId { get; set; }

        [Required]
        public string Type { get; set; } = string.Empty;

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;

        public int? RelatedOrderId { get; set; }
        public int? RelatedProductId { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ConsumerId")]
        public Consumer? Consumer { get; set; }

        [ForeignKey("RetailerId")]
        public Retailer? Retailer { get; set; }
    }
}
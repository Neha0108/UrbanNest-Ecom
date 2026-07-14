using System.ComponentModel.DataAnnotations;

namespace UrbanNest.Model
{
    public class Review
    {
        [Key]
        public int ReviewId { get; set; }
        public int ProductId { get; set; }
        public Product Product { get; set; }
        public int UserId { get; set; }
        public Users User { get; set; }
        [Range(1, 5)]
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public bool IsVerifiedPurchase { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<ReviewHelpful> HelpfulVotes { get; set; }
        public ReviewReply? Reply { get; set; }
    }
}
using System.ComponentModel.DataAnnotations;

namespace UrbanNest.Model
{
    public class ReviewHelpful
    {
        [Key]
        public int Id { get; set; }
        public int ReviewId { get; set; }
        public Review Review { get; set; }
        public int UserId { get; set; }
        public Users User { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
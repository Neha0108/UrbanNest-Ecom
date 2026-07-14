using System.ComponentModel.DataAnnotations;

namespace UrbanNest.DTO
{
    public class AddReviewDTO
    {
        public int ProductId { get; set; }
        [Range(1, 5)]
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
    }
}
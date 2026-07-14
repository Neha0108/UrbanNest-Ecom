namespace UrbanNest.DTO
{
    public class ReviewDTO
    {
        public int ReviewId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public bool IsVerifiedPurchase { get; set; }
        public DateTime CreatedAt { get; set; }

        public int HelpfulCount { get; set; }
        public bool MarkedHelpfulByMe { get; set; }

        public string? ReplyMessage { get; set; }
        public DateTime? ReplyDate { get; set; }
    }
}
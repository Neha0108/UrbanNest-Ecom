using UrbanNest.DTO;

namespace UrbanNest.Repository
{
    public interface IReview
    {
        Task<(bool success, string message)> AddReview(int userId, AddReviewDTO dto);
        Task<List<ReviewDTO>> GetProductReviews(int productId, int? currentUserId);
        Task<List<ReviewDTO>> GetRetailerReviews(int userId);
        Task<RatingSummaryDTO> GetRatingSummary(int productId);
        Task<bool> DeleteReview(int reviewId, int userId);

        Task<(bool success, string message, int helpfulCount)> ToggleHelpful(int reviewId, int userId);
        Task<(bool success, string message)> AddReply(int retailerUserId, AddReplyDTO dto);
    }
}
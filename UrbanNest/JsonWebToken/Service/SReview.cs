using Microsoft.EntityFrameworkCore;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Model;
using UrbanNest.Repository;

namespace UrbanNest.Service
{
    public class SReview : IReview
    {
        private readonly DataBase database;
        private readonly INotification notification;

        public SReview(DataBase database, INotification notification)
        {
            this.database = database;
            this.notification = notification;
        }

        public async Task<(bool success, string message)> AddReview(int userId, AddReviewDTO dto)
        {
            var product = await database.Products
                .FirstOrDefaultAsync(p => p.productId == dto.ProductId);

            if (product == null)
                return (false, "Product not found");

            bool alreadyReviewed = await database.Reviews
                .AnyAsync(r => r.ProductId == dto.ProductId && r.UserId == userId);

            if (alreadyReviewed)
                return (false, "You have already reviewed this product");

            bool purchased = await database.orderItems
                .Include(oi => oi.Order)
                .AnyAsync(oi => oi.ProductId == dto.ProductId
                    && oi.Order.UsersId == userId
                    && oi.Status == "Delivered");

            var review = new Review
            {
                ProductId = dto.ProductId,
                UserId = userId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                IsVerifiedPurchase = purchased,
                CreatedAt = DateTime.UtcNow
            };

            database.Reviews.Add(review);
            await database.SaveChangesAsync();

            await notification.SendToRetailerAsync(
                product.RetailerId,
                NotificationTypes.NewReview,
                "New Review Received",
                $"Your product \"{product.productName}\" received a {dto.Rating}-star review.",
                productId: dto.ProductId
            );

            return (true, "Review added successfully");
        }

        public async Task<List<ReviewDTO>> GetProductReviews(int productId, int? currentUserId)
        {
            return await database.Reviews
                .Where(r => r.ProductId == productId)
                .Include(r => r.User)
                .Include(r => r.Product)
                .Include(r => r.HelpfulVotes)
                .Include(r => r.Reply)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewDTO
                {
                    ReviewId = r.ReviewId,
                    ProductId = r.ProductId,
                    ProductName = r.Product.productName,
                    UserId = r.UserId,
                    UserName = r.User.userName,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    IsVerifiedPurchase = r.IsVerifiedPurchase,
                    CreatedAt = r.CreatedAt,
                    HelpfulCount = r.HelpfulVotes.Count,
                    MarkedHelpfulByMe = currentUserId != null && r.HelpfulVotes.Any(h => h.UserId == currentUserId),
                    ReplyMessage = r.Reply != null ? r.Reply.Message : null,
                    ReplyDate = r.Reply != null ? r.Reply.CreatedAt : (DateTime?)null
                })
                .ToListAsync();
        }

        public async Task<List<ReviewDTO>> GetRetailerReviews(int userId)
        {
            var retailer = await database.retailers
                .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null)
                return new List<ReviewDTO>();

            return await database.Reviews
                .Where(r => r.Product.RetailerId == retailer.RetailerId)
                .Include(r => r.User)
                .Include(r => r.Product)
                .Include(r => r.HelpfulVotes)
                .Include(r => r.Reply)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewDTO
                {
                    ReviewId = r.ReviewId,
                    ProductId = r.ProductId,
                    ProductName = r.Product.productName,
                    UserId = r.UserId,
                    UserName = r.User.userName,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    IsVerifiedPurchase = r.IsVerifiedPurchase,
                    CreatedAt = r.CreatedAt,
                    HelpfulCount = r.HelpfulVotes.Count,
                    MarkedHelpfulByMe = false,
                    ReplyMessage = r.Reply != null ? r.Reply.Message : null,
                    ReplyDate = r.Reply != null ? r.Reply.CreatedAt : (DateTime?)null
                })
                .ToListAsync();
        }

        public async Task<RatingSummaryDTO> GetRatingSummary(int productId)
        {
            var ratings = await database.Reviews
                .Where(r => r.ProductId == productId)
                .Select(r => r.Rating)
                .ToListAsync();

            if (ratings.Count == 0)
            {
                return new RatingSummaryDTO
                {
                    AverageRating = 0,
                    TotalReviews = 0,
                    RecommendPercent = 0,
                    Breakdown = new List<RatingBreakdownDTO>
                    {
                        new() { Star = 5, Count = 0, Percent = 0 },
                        new() { Star = 4, Count = 0, Percent = 0 },
                        new() { Star = 3, Count = 0, Percent = 0 },
                        new() { Star = 2, Count = 0, Percent = 0 },
                        new() { Star = 1, Count = 0, Percent = 0 },
                    }
                };
            }

            int total = ratings.Count;
            int recommendCount = ratings.Count(r => r >= 4);

            var breakdown = new List<RatingBreakdownDTO>();
            for (int star = 5; star >= 1; star--)
            {
                int count = ratings.Count(r => r == star);
                breakdown.Add(new RatingBreakdownDTO
                {
                    Star = star,
                    Count = count,
                    Percent = Math.Round((double)count / total * 100, 1)
                });
            }

            return new RatingSummaryDTO
            {
                AverageRating = Math.Round(ratings.Average(), 1),
                TotalReviews = total,
                RecommendPercent = Math.Round((double)recommendCount / total * 100, 1),
                Breakdown = breakdown
            };
        }

        public async Task<bool> DeleteReview(int reviewId, int userId)
        {
            var review = await database.Reviews
                .FirstOrDefaultAsync(r => r.ReviewId == reviewId && r.UserId == userId);

            if (review == null) return false;

            database.Reviews.Remove(review);
            await database.SaveChangesAsync();
            return true;
        }

        public async Task<(bool success, string message, int helpfulCount)> ToggleHelpful(int reviewId, int userId)
        {
            var review = await database.Reviews.FirstOrDefaultAsync(r => r.ReviewId == reviewId);
            if (review == null)
                return (false, "Review not found", 0);

            var existingVote = await database.ReviewHelpful
                .FirstOrDefaultAsync(h => h.ReviewId == reviewId && h.UserId == userId);

            if (existingVote != null)
            {
                database.ReviewHelpful.Remove(existingVote);
                await database.SaveChangesAsync();
            }
            else
            {
                database.ReviewHelpful.Add(new ReviewHelpful
                {
                    ReviewId = reviewId,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                });
                await database.SaveChangesAsync();
            }

            int count = await database.ReviewHelpful.CountAsync(h => h.ReviewId == reviewId);
            return (true, existingVote != null ? "Removed" : "Marked helpful", count);
        }

        public async Task<(bool success, string message)> AddReply(int retailerUserId, AddReplyDTO dto)
        {
            var retailer = await database.retailers
                .FirstOrDefaultAsync(r => r.UserId == retailerUserId);

            if (retailer == null)
                return (false, "Retailer profile not found");

            var review = await database.Reviews
                .Include(r => r.Product)
                .FirstOrDefaultAsync(r => r.ReviewId == dto.ReviewId);

            if (review == null)
                return (false, "Review not found");

            if (review.Product.RetailerId != retailer.RetailerId)
                return (false, "You can only reply to reviews on your own products");

            bool alreadyReplied = await database.ReviewReplies
                .AnyAsync(rep => rep.ReviewId == dto.ReviewId);

            if (alreadyReplied)
                return (false, "You have already replied to this review");

            database.ReviewReplies.Add(new ReviewReply
            {
                ReviewId = dto.ReviewId,
                RetailerId = retailer.RetailerId,
                Message = dto.Message,
                CreatedAt = DateTime.UtcNow
            });

            await database.SaveChangesAsync();
            return (true, "Reply added");
        }
    }
}
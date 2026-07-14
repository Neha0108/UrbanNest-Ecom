using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UrbanNest.DTO;
using UrbanNest.Repository;

namespace UrbanNest.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly IReview review;
        public ReviewController(IReview review)
        {
            this.review = review;
        }

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        private int? GetOptionalUserId()
        {
            if (User.Identity == null || !User.Identity.IsAuthenticated) return null;
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null ? int.Parse(claim.Value) : null;
        }

        [Authorize(Roles = "Consumer")]
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] AddReviewDTO dto)
        {
            var (success, message) = await review.AddReview(GetUserId(), dto);
            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }

        [HttpGet("{productId}")]
        public async Task<IActionResult> GetByProduct(int productId)
        {
            var data = await review.GetProductReviews(productId, GetOptionalUserId());
            return Ok(data);
        }

        [HttpGet("{productId}")]
        public async Task<IActionResult> GetSummary(int productId)
        {
            var summary = await review.GetRatingSummary(productId);
            return Ok(summary);
        }

        [Authorize(Roles = "Retailer")]
        [HttpGet]
        public async Task<IActionResult> GetMine()
        {
            var data = await review.GetRetailerReviews(GetUserId());
            return Ok(data);
        }

        [Authorize]
        [HttpDelete("{reviewId}")]
        public async Task<IActionResult> Delete(int reviewId)
        {
            var success = await review.DeleteReview(reviewId, GetUserId());
            return Ok(new { success });
        }

        [Authorize]
        [HttpPost("{reviewId}")]
        public async Task<IActionResult> Helpful(int reviewId)
        {
            var (success, message, count) = await review.ToggleHelpful(reviewId, GetUserId());
            if (!success) return BadRequest(new { message });
            return Ok(new { message, helpfulCount = count });
        }

        [Authorize(Roles = "Retailer")]
        [HttpPost]
        public async Task<IActionResult> Reply([FromBody] AddReplyDTO dto)
        {
            var (success, message) = await review.AddReply(GetUserId(), dto);
            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }
    }
}
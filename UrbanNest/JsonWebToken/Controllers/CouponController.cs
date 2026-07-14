using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UrbanNest.DTO;
using UrbanNest.Repository;

namespace UrbanNest.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CouponController : ControllerBase
    {
        private readonly ICoupon coupon;

        public CouponController(ICoupon coupon)
        {
            this.coupon = coupon;
        }

        [HttpGet]
        public async Task<IActionResult> GetActiveCoupons()
        {
            var data = await coupon.GetActiveCouponsAsync();
            return Ok(data);
        }

        [Authorize]
        [HttpPost("apply")]
        public async Task<IActionResult> ApplyCoupon([FromBody] ApplyCouponRequestDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid request" });
            }

            var result = await coupon.ApplyCouponAsync(dto);
            return Ok(result);
        }
    }
}
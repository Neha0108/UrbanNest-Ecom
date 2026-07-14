using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Migrations;
using UrbanNest.Model;
using UrbanNest.Repository;

namespace UrbanNest.Controllers
{
    [Authorize(Roles = "Retailer")]
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class RetailerController : ControllerBase
    {
        private readonly IProduct iproduct;
        private readonly DataBase database;
        private readonly IProfile iprofile;
        private readonly ICoupon coupon;

        public RetailerController(IProduct iproduct, DataBase database, IProfile iprofile, ICoupon coupon)
        {
            this.iproduct = iproduct;
            this.database = database;
            this.iprofile = iprofile;
            this.coupon = coupon;
        }

        [HttpPost]
        public async Task<IActionResult> add([FromForm] ProductDTO prod)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

            var retailer = await database.retailers
                    .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null)
                return BadRequest("Retailer not found");


            var result = await iproduct.add(prod, retailer.RetailerId);


            return result != null ? Ok() : BadRequest();
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] ProductDTO prod)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

            var retailer = await database.retailers
                    .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null)
                return BadRequest("Retailer not found");

            var result = await iproduct.update(id, prod, retailer.RetailerId);

            if (result == null)
                return Unauthorized("You can update only your own product");

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

            var retailer = await database.retailers
                    .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null)
                return BadRequest("Retailer not found");

            var data = await iproduct.getByRetailerId(retailer.RetailerId);
            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await iproduct.getbyId(id);
            if (product == null) return NotFound();
            return Ok(product);
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

            var retailer = await database.retailers
                    .FirstOrDefaultAsync(r => r.UserId == userId);

            bool isDeleted = await iproduct.delete(id, retailer.RetailerId);

            if (!isDeleted)
                return Unauthorized("You can delete only your own product");

            return Ok(new { message = "Product deleted successfully" });
        }

        [HttpGet]
        public async Task<IActionResult> getCategory()
        {
            var categories = await database.Category
                .Select(c => new CategoryDTO
                {
                    CategoryId = c.CategoryId,
                    CategoryName = c.CategoryName
                })
                .ToListAsync();

            return Ok(categories);
        }

        [HttpGet("{categoryId}")]
        public async Task<IActionResult> GetSubCategory(int categoryId)
        {
            var subcategories = await database.SubCategory
                .Where(s => s.CategoryId == categoryId)
                .Select(s => new
                {
                    s.SubCategoryId,
                    s.SubCategoryName
                })
                .ToListAsync();

            return Ok(subcategories);
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            int userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

            var data = await iprofile.GetRetailerProfile(userId);

            if (data == null)
                return NotFound();

            return Ok(data);
        }


        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] RetailerDTO dto)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var result = await iprofile.UpdateRetailerProfile(userId, dto);

            if (!result)
                return NotFound();

            return Ok(new { message = "Profile updated successfully" });
        }

        [HttpGet]
        public async Task<IActionResult> GetRetailerCustomers()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var retailer = await database.retailers
                .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null)
                return BadRequest("Retailer not found");

            int retailerId = retailer.RetailerId;

            var customers = await database.orderItems
                .Include(oi => oi.Order)
                    .ThenInclude(o => o.User)
                .Where(oi => oi.RetailerId == retailerId)
                .GroupBy(oi => new
                {
                    oi.Order.User.UserId,
                    oi.Order.User.userName,
                    oi.Order.User.userEmail,
                })
                .Select(group => new RetailerCustomerDto
                {
                    CustomerId = group.Key.UserId,
                    CustomerName = group.Key.userName,
                    Email = group.Key.userEmail, 

                    TotalOrders = group
                        .Select(x => x.OrderId)
                        .Distinct()
                        .Count(),

                    TotalSpent = group.Sum(x => x.Price * x.Quantity),

                    LastOrderDate = group
                        .Max(x => x.Order.OrderDate),

                    CustomerType = group
                        .Select(x => x.OrderId)
                        .Distinct()
                        .Count() > 1 ? "Repeat" : "New"
                })
                .OrderByDescending(c => c.LastOrderDate)
                .ToListAsync();

            return Ok(customers);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCoupon([FromBody] CouponCreateDTO dto)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var (success, message, data) = await coupon.RetailerCreateAsync(userId, dto);
            if (!success) return BadRequest(new { message });
            return Ok(data);
        }

        [HttpGet]
        public async Task<IActionResult> GetMyCoupons()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var data = await coupon.RetailerGetAllAsync(userId);
            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetMyCouponById(int id)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var data = await coupon.RetailerGetByIdAsync(userId, id);
            if (data == null) return NotFound();
            return Ok(data);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMyCoupon(int id, [FromBody] CouponUpdateDTO dto)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var (success, message) = await coupon.RetailerUpdateAsync(userId, id, dto);
            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMyCoupon(int id)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var (success, message) = await coupon.RetailerDeleteAsync(userId, id);
            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }
    }
}
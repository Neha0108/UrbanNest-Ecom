using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Razorpay.Api;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Model;
using UrbanNest.Repository;

namespace UrbanNest.Controllers
{

    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ConsumerController : ControllerBase
    {
        private readonly IProduct iproduct;
        private readonly DataBase database;
        private readonly IWishlist iwishlist;
        private readonly ICart icart;
        private readonly IProfile iprofile;
        private readonly IAddress iaddress;
        private readonly IConfiguration configuration;

        public ConsumerController(IProduct iproduct, DataBase database, IWishlist iwishlist, ICart icart, IProfile iprofile, IAddress iaddress, IConfiguration configuration)
        {
            this.iproduct = iproduct;
            this.database = database;
            this.iwishlist = iwishlist;
            this.icart = icart;
            this.iprofile = iprofile;
            this.iaddress = iaddress;
            this.configuration = configuration;
        }

        [Authorize(Roles = "Consumer")]
        [HttpGet]
        public async Task<IActionResult> getProfile()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var data = await iprofile.getConsumerProfile(userId);

            return Ok(data);
        }

        [Authorize(Roles = "Consumer")]
        [HttpPut]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> EditProfile([FromForm] ConsumerDTO consumerDto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            string mesaage = await iprofile.editConsumerProfile(userId, consumerDto, consumerDto.profileimage);

            return Ok(new { mesaage });

        }


        [HttpGet]
        public async Task<IActionResult> getCategory()
        {
            var categories = await database.Category
                .Select(c => new CategoryDTO
                {
                    CategoryId = c.CategoryId,
                    CategoryName = c.CategoryName,
                    ImageUrl = c.ImageUrl
                })
                .ToListAsync();

            return Ok(categories);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllForUsers()
        {
            var products = await iproduct.getAll();
            return Ok(products);

        }

        [Authorize(Roles = "Consumer")]
        [HttpGet]
        public async Task<IActionResult> GetWishlist()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized("UserId claim missing or invalid");

            var wishlist = await iwishlist.GetWishlist(userId);
            return Ok(wishlist);
        }

        [Authorize(Roles = "Consumer")]
        [HttpDelete("{productId}")]
        public async Task<IActionResult> RemoveFromWishlist(int productId)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized("UserId claim missing or invalid");

            var removed = await iwishlist.RemoveFromWishlist(userId, productId);
            if (!removed)
                return NotFound();

            return Ok();
        }

        [Authorize(Roles = "Consumer")]
        [HttpPost("{productId}")]
        public async Task<IActionResult> AddToWishlist(int productId)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized("UserId claim missing or invalid");

            bool added = await iwishlist.AddToWishlist(userId, productId);

            if (!added)
                return BadRequest("Product already in wishlist");

            return Ok("Product added to wishlist");
        }

        [Authorize(Roles = "Consumer")]
        [HttpGet]
        public async Task<IActionResult> CountofWishlist()
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            int count = await iwishlist.getCount(userId);
            return Ok(count);
        }

        [Authorize(Roles = "Consumer")]
        [HttpPost]
        public async Task<IActionResult> AddToCart(AddToCart addtocart)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
            {
                return Unauthorized("UserId claim not found in token");
            }

            int userId = int.Parse(userIdClaim.Value);

            await icart.AddToCart(userId, addtocart);

            return Ok(new { message = "Added to cart" });
        }

        [Authorize(Roles = "Consumer")]
        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var items = await icart.get(userId);

            return Ok(items);
        }

        [Authorize(Roles = "Consumer")]
        [HttpPut]
        public async Task<IActionResult> UpdateQuantity([FromBody] AddToCart dto)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            if (userId == null) { return Unauthorized(); }

            await icart.updateQuantity(userId, dto.ProductId, dto.Quantity);
            return Ok(new { success = true });
        }

        [Authorize(Roles = "Consumer")]
        [HttpDelete("{productId}")]
        public async Task<IActionResult> RemoveFromCart(int productId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
                return Unauthorized("User not logged in");

            int userId = int.Parse(userIdClaim.Value);

            await icart.RemoveFromCart(userId, productId);

            return Ok(new { success = true });
        }

        [HttpGet("{productId}")]
        public async Task<IActionResult> getProductbyId(int productId)
        {
            var product = await iproduct.getbyId(productId);

            return Ok(product);
        }

        [Authorize(Roles = "Consumer")]
        [HttpGet]
        public async Task<IActionResult> GetMyAddresses()
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var data = await iaddress.GetUserAddresses(userId);

            var result = data.Select(a => new AddressDto
            {
                AddressId = a.AddressId,
                FullName = a.FullName,
                Phone = a.Phone,
                AddressLine = a.AddressLine,
                City = a.City,
                State = a.State,
                Pincode = a.Pincode,
                IsDefault = a.IsDefault
            });


            return Ok(result);
        }

        [Authorize(Roles = "Consumer")]
        [HttpDelete("{addressId}")]
        public async Task<IActionResult> deleteAddress(int addressId)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var data = await iaddress.DeleteAddress(addressId, userId);

            return Ok();
        }

        [Authorize(Roles = "Consumer")]
        [HttpPost()]
        public async Task<IActionResult> addAddress([FromBody] AddressDto dto)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var data = new UserAddress
            {
                UserId = userId,
                FullName = dto.FullName,
                Phone = dto.Phone,
                AddressLine = dto.AddressLine,
                City = dto.City,
                State = dto.State,
                Pincode = dto.Pincode,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                IsDefault = dto.IsDefault
            };

            var result = await iaddress.AddAddress(data, userId);

            return Ok(result);
        }

        [HttpPut("{addressId}")]
        public async Task<IActionResult> EditAddress (int addressId,[FromBody] AddressDto dto)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var data = new UserAddress
            {
                UserId = userId,
                FullName = dto.FullName,
                Phone = dto.Phone,
                AddressLine = dto.AddressLine,
                City = dto.City,
                State = dto.State,
                Pincode = dto.Pincode,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                IsDefault = dto.IsDefault
            };

            var result = await iaddress.EditAddress(data, addressId,userId);

            if (result == null)
            {
                return NotFound("Address not found.");
            }

            return Ok(result);
        }

        [HttpPost]
        public IActionResult CreateOrder([FromBody] PaymentDTO dto)
        {
            var key = configuration["Razorpay:Key"];
            var secret = configuration["Razorpay:Secret"];

            RazorpayClient client = new RazorpayClient(key, secret);

            Dictionary<string, object> options = new Dictionary<string, object>
            {
                { "amount", (int)(dto.Amount * 100) }, // IMPORTANT
                { "currency", "INR" },
                { "receipt", "urban_nest_" + DateTime.UtcNow.Ticks },
                { "payment_capture", 1 }
            };

            Order order = client.Order.Create(options);
            Console.WriteLine("===== ORDER CREATED =====");

            Console.WriteLine(order["id"].ToString());
            Console.WriteLine(order["amount"].ToString());
            Console.WriteLine(order["currency"].ToString());

            Console.WriteLine("=========================");

            return Ok(new
            {
                orderId = order["id"].ToString(),
                amount = order["amount"],
                currency = order["currency"],
                key = key
            });
        }
        [HttpPost]
        public IActionResult VerifyPayment([FromBody] VerifyPaymentDTO dto)
        {
            var secret = configuration["Razorpay:Secret"];

            string payload = dto.RazorpayOrderId + "|" + dto.RazorpayPaymentId;

            string generatedSignature;

            using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret)))
            {
                byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
                generatedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();
            }

            if (generatedSignature == dto.RazorpaySignature)
            {
                return Ok(new { success = true, message = "Payment verified" });
            }

            return BadRequest(new { success = false, message = "Payment verification failed" });
        }
    }
}
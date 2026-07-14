using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Repository;

namespace UrbanNest.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUser service;
        private readonly IEmail semail;
        private readonly DataBase database;

        public AuthController(IUser service, IEmail semail, DataBase database)
        {
            this.service = service;
            this.semail = semail;
            this.database = database;
        }

        [HttpPost]
        public async Task<IActionResult> Register([FromBody] Register request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid Request Body" });
            }

            var isVerified = await semail.IsEmailVerified(request.UserEmail);

            if (!isVerified)
            {
                return BadRequest(new { message = "Please verify OTP first" });
            }

            var result = await service.register(request);

            if (result == null)
            {
                return Unauthorized(new { message = "User already exist with this email" });
            }

            return Ok(new { message = "User registered successfully" });
        }

        [HttpPost]
        public async Task<IActionResult> Login([FromBody] Login login)
        {
            var token = await service.login(login);

            if (token is null)
            {
                return Unauthorized("INVALID EMAIL OR PASSWORD");
            }
            else
            {
                return Ok(new { token });
            }
        }

        [HttpGet]
        public IActionResult GetUserName()
        {
            var userName = User.FindFirst(ClaimTypes.Name)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            return Ok(new { userName = userName, role = role });
        }

        [Authorize]
        [HttpPut]
        public async Task<IActionResult> ChangePass([FromBody] ChangePassword changePassword)
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (claim == null || !int.TryParse(claim.Value, out int userId))
            {
                return Unauthorized();
            }

            var result = await service.changePassword(userId, changePassword);

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> SendOtp([FromBody] EmailDTO email)
        {
            var otp = new Random().Next(100000, 999999).ToString();

            // Save OTP in DB (call repo/service)
            await semail.SaveOTP(email.Email, otp);

            await semail.SendOTP(email.Email, otp);

            return Ok(new { message = "OTP sent successfully" });
        }

        [HttpPost]
        public async Task<IActionResult> VerifyOtp([FromBody] OtpDTO otp)
        {
            var isValid = await semail.VerifyOTP(otp.Email, otp.OTP);

            if (!isValid)
            {
                return BadRequest(new { message = "Invalid or expired OTP" });
            }
            Console.WriteLine($"EMAIL: {otp.Email}, OTP: {otp.OTP}");
            return Ok(new { message = "OTP verified successfully" });
        }

        [HttpPost]
        public async Task<IActionResult> ResendOtp([FromBody] EmailDTO email)
        {
            var lastOtp = await database.emailOTPs
                .Where(x => x.Email == email.Email)
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync();

            if (lastOtp != null && lastOtp.CreatedAt > DateTime.UtcNow.AddSeconds(-30))
            {
                return BadRequest("Please wait before requesting new OTP");
            }

            // ✅ AFTER check → delete old
            var oldOtps = database.emailOTPs.Where(x => x.Email == email.Email);
            database.emailOTPs.RemoveRange(oldOtps);

            var otp = new Random().Next(100000, 999999).ToString();

            await semail.SaveOTP(email.Email, otp);
            await semail.SendOTP(email.Email, otp);

            return Ok(new { message = "OTP resent successfully" });
        }

        [HttpGet]
        public async Task<IActionResult> GetProductsByPrice(double maxPrice)
        {
            var products = await database.Products
                .Where(p => p.productPrice <= maxPrice)
                .ToListAsync();

            return Ok(products);
        }

        [HttpPost]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDTO google)
        {
            try
            {
                var token = await service.GoogleLogin(google.IdToken);

                if (token == null)
                    return Unauthorized();

                return Ok(new { token });
            }
            catch
            {
                return BadRequest("Invalid Google token");
            }
        }
    }
}
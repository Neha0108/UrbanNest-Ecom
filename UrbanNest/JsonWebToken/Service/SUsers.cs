using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Model;
using UrbanNest.Repository;

namespace UrbanNest.Service
{
    public class SUsers : IUser
    {
        private readonly DataBase database;
        private readonly IConfiguration configuration;
        public SUsers(DataBase database, IConfiguration configuration)
        {
            this.database = database;
            this.configuration = configuration;
        }

        public async Task<Register?> register(Register registerRequest)
        {
            bool exists = await database.Users
                .AnyAsync(u => u.userEmail == registerRequest.UserEmail);

            if (exists)
                return null;

            string passwordhashed = BCrypt.Net.BCrypt.HashPassword(registerRequest.UserPassword);

            var role = await database.Role
                .FirstOrDefaultAsync(r => r.Name == registerRequest.Roles);

            if (role == null)
                throw new Exception("Invalid role");

            var user = new Users
            {
                userName = registerRequest.UserName,
                userEmail = registerRequest.UserEmail,
                userPassword = passwordhashed,
                RoleId = role.RoleId,
                Status = "Active"
            };

            await database.Users.AddAsync(user);
            await database.SaveChangesAsync();

            if (role.Name == "Consumer")
            {
                var consumer = new Consumer
                {
                    UserId = user.UserId,
                    FirstName = user.userName
                };

                await database.consumers.AddAsync(consumer);
                await database.SaveChangesAsync();
            }

            if (role.Name == "Retailer")
            {
                if (string.IsNullOrEmpty(registerRequest.shopName) ||
                    string.IsNullOrEmpty(registerRequest.gstNumber) ||
                    string.IsNullOrEmpty(registerRequest.panNumber) ||
                    string.IsNullOrEmpty(registerRequest.contactNumber) ||
                    string.IsNullOrEmpty(registerRequest.address))
                {
                    throw new Exception("Retailer details are required");
                }

                var retailer = new Retailer
                {
                    UserId = user.UserId,
                    ShopName = registerRequest.shopName,
                    GSTNumber = registerRequest.gstNumber,
                    PANNumber = registerRequest.panNumber,
                    ContactNumber = registerRequest.contactNumber,
                    Address = registerRequest.address,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true,
                    IsVerified = false
                };

                await database.retailers.AddAsync(retailer);

                await database.SaveChangesAsync();
            }

            return registerRequest;
        }

        public async Task<string?> login(Login log)
        {
            var user = await database.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.userEmail == log.UserEmail);

            if(user.Status == "Blocked")
            {
                return "User is Blocked by Admin";
            }

            if (user == null) return null;

            bool isValid;
            try
            {
                isValid = BCrypt.Net.BCrypt.Verify(log.UserPassword, user.userPassword);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                // Account has no usable password hash (e.g. Google-only account)
                return null;
            }

            if (!isValid) return null;

            return IssueToken(user);
        }

        private string IssueToken(Users user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]));

            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.userName),
                new Claim(ClaimTypes.Email, user.userEmail),
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(ClaimTypes.Role, user.Role.Name)
            };

            var token = new JwtSecurityToken(
                issuer: configuration["Jwt:Issuer"],
                audience: configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<string> updateUser(int userId, Register dto)
        {
            var user = await database.Users.FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return "User not found";

            user.userName = dto.UserName;
            user.userEmail = dto.UserEmail;

            if (!string.IsNullOrWhiteSpace(dto.UserPassword))
            {
                user.userPassword = BCrypt.Net.BCrypt.HashPassword(dto.UserPassword);
            }

            await database.SaveChangesAsync();
            return "Profile updated successfully";
        }

        public async Task<string?> GoogleLogin(string idToken)
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { configuration["Google:ClientId"] }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);

            var user = await database.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.userEmail == payload.Email);

            if (user.Status == "Blocked")
            {
                return "User is Blocked by Admin";
            }

            if (user == null)
            {
                var consumerRole = await database.Role
                    .FirstOrDefaultAsync(r => r.Name == "Consumer");

                user = new Users
                {
                    userName = payload.Name,
                    userEmail = payload.Email,
                    // Random unusable hash — Google-only accounts can never log in via
                    // password, and this avoids BCrypt.Verify throwing on an empty string.
                    userPassword = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                    RoleId = consumerRole.RoleId
                };

                database.Users.Add(user);
                await database.SaveChangesAsync();

                var consumer = new Consumer
                {
                    UserId = user.UserId,
                    FirstName = payload.Name
                };

                database.consumers.Add(consumer);
                await database.SaveChangesAsync();

                user = await database.Users
                    .Include(x => x.Role)
                    .FirstOrDefaultAsync(x => x.UserId == user.UserId);
            }

            return IssueToken(user);
        }

        public async Task<string> changePassword(int id, ChangePassword changePassword)
        {
            var user = await database.Users.FirstOrDefaultAsync(u => u.UserId == id);

            if (user is null) return "User not found";

            // ✅ Verify old password
            if (!BCrypt.Net.BCrypt.Verify(changePassword.oldPassword, user.userPassword))
            {
                return "Old password is incorrect";
            }

            // ✅ Match new + confirm
            if (changePassword.newPassword != changePassword.confirmPassword)
            {
                return "New password does not match confirm password";
            }

            // ✅ SAVE NEW PASSWORD (IMPORTANT FIX)
            user.userPassword = BCrypt.Net.BCrypt.HashPassword(changePassword.newPassword);

            await database.SaveChangesAsync();

            return "Password changed successfully";
        }
    }
}
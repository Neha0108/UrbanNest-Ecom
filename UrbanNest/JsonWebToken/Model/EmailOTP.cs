using System.ComponentModel.DataAnnotations;

namespace UrbanNest.Model
{
    public class EmailOTP
    {
        [Key]
        public int Id { get; set; }

        public string Email { get; set; } = string.Empty;

        public string OTP { get; set; } = string.Empty;

        public DateTime ExpiryTime { get; set; }

        public bool IsVerified { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}

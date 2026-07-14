using System.ComponentModel.DataAnnotations;

namespace UrbanNest.Model
{
    public class UserAddress
    {
        [Key]
        public int AddressId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string AddressLine { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Pincode { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public Boolean IsDefault { get; set; }
        public Users User { get; set; }
    }
}

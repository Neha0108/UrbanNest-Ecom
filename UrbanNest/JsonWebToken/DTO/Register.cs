using System.ComponentModel.DataAnnotations;

namespace UrbanNest.DTO
{
    public class Register
    {
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string UserPassword { get; set; } = string.Empty;
        public string Roles { get; set; }

        // FOR RETAILER 
        public string? shopName { get; set; }
        public string? gstNumber { get; set; }
        public string? panNumber { get; set; }
        public string? contactNumber { get; set; }
        public string? address
        {
            get; set;

        }
    }
}

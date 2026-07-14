using UrbanNest.Model;

namespace UrbanNest.DTO
{
    public class ConsumerDTO
    {
        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Gender { get; set; } = string.Empty;

        public DateTime Date_of_Birth { get; set; }

        public IFormFile? profileimage { get; set; }
    }
}

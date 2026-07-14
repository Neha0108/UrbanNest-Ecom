using UrbanNest.Model;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanNest.Model
{
    public class Consumer
    {
        public int ConsumerId { get; set; }

        public int UserId { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Gender { get; set; } = string.Empty;

        public DateTime Date_of_Birth { get; set; }

        public string profileimage { get; set; } = string.Empty;

        public Users? Users { get; set; }
    }
}
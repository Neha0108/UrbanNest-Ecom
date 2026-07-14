using System.ComponentModel.DataAnnotations;

namespace UrbanNest.Model
{
    public class Role
    {
        [Key]
        public int RoleId { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public ICollection<Users> user { get; set; }
    }
}

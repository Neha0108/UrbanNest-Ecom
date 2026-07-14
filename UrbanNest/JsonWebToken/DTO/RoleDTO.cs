using System.ComponentModel.DataAnnotations;

namespace UrbanNest.DTO
{
    public class RoleDTO
    {
        [Key]
        public int id { get; set; }
        [Required]
        public string name { get; set; } = string.Empty;
    }
}

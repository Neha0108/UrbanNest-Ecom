namespace UrbanNest.DTO
{
    public class ChangePassword
    {
        public string oldPassword { get; set; } = string.Empty;
        public string newPassword { get; set; } = string.Empty;
        public string confirmPassword { get; set; } = string.Empty;
    }
}

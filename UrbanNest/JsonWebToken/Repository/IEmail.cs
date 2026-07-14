namespace UrbanNest.Repository
{
    public interface IEmail
    {
        Task SendOTP(string toEmail, string otp);
        Task SaveOTP(string email, string otp);
        Task<bool> VerifyOTP(string email, string otp);
        Task<bool> IsEmailVerified(string email);
        Task SendInvoiceEmail(string toEmail, byte[] pdfBytes);
    }
}

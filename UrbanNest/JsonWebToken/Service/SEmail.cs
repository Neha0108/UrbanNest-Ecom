using Microsoft.EntityFrameworkCore;
using MimeKit;
using MailKit.Net.Smtp;
using UrbanNest.DataAccess;
using UrbanNest.Model;
using UrbanNest.Repository;

namespace UrbanNest.Service
{
    public class SEmail : IEmail
    {
        private readonly IConfiguration _config;
        private readonly DataBase database;

        public SEmail(IConfiguration config, DataBase database)
        {
            _config = config;
            this.database = database;
        }


        public async Task SendOTP(string toEmail, string otp)
        {
            var email = new MimeMessage();

            email.From.Add(new MailboxAddress(
                _config["SmtpSettings:SenderName"],
                _config["SmtpSettings:SenderEmail"]
            ));

            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = "UrbanNest Email Verification OTP";

            var builder = new BodyBuilder
            {
                HtmlBody = $"<h2>UrbanNest OTP</h2><p>Your OTP is <b>{otp}</b></p>"
            };

            email.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();

            int port = int.Parse(_config["SmtpSettings:Port"] ?? "587");

            await smtp.ConnectAsync(_config["SmtpSettings:Server"], port, false);
            await smtp.AuthenticateAsync(
                _config["SmtpSettings:Username"],
                _config["SmtpSettings:Password"]
            );

            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }


        public async Task SaveOTP(string email, string otp)
        {
            var otpEntry = new EmailOTP
            {
                Email = email,
                OTP = otp,
                CreatedAt = DateTime.UtcNow,
                ExpiryTime = DateTime.UtcNow.AddMinutes(5),
                IsVerified = false
            };

            await database.emailOTPs.AddAsync(otpEntry);
            await database.SaveChangesAsync();
        }

        public async Task<bool> VerifyOTP(string email, string otp)
        {
            var record = await database.emailOTPs
                .Where(x => x.Email.ToLower() == email.ToLower()
                         && x.OTP == otp
                         && !x.IsVerified)
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync();

            if (record == null)
                return false;

            if (record.ExpiryTime < DateTime.UtcNow)
                return false;

            record.IsVerified = true;

            await database.SaveChangesAsync();

            return true;
        }

        public async Task<bool> IsEmailVerified(string email)
        {
            return await database.emailOTPs
                .AnyAsync(x => x.Email == email && x.IsVerified);
        }

        public async Task SendInvoiceEmail(string toEmail, byte[] pdfBytes)
        {
            var email = new MimeMessage();

            email.From.Add(new MailboxAddress(
                _config["SmtpSettings:SenderName"],
                _config["SmtpSettings:SenderEmail"]
            ));

            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = "Your Order Invoice";

            var builder = new BodyBuilder
            {
                HtmlBody = "<h3>Thanks for your order!</h3><p>Your invoice is attached.</p>"
            };

            builder.Attachments.Add("Invoice.pdf", pdfBytes);

            email.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();

            int port = int.Parse(_config["SmtpSettings:Port"] ?? "587");

            await smtp.ConnectAsync(_config["SmtpSettings:Server"], port, false);
            await smtp.AuthenticateAsync(
                _config["SmtpSettings:Username"],
                _config["SmtpSettings:Password"]
            );

            try
            {
                await smtp.SendAsync(email);
            }
            catch
            {
                // optional: log error
            }

            await smtp.DisconnectAsync(true);
        }
    }
}
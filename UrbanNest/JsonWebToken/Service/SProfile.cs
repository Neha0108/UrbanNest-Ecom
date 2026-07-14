using Microsoft.EntityFrameworkCore;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Model;
using UrbanNest.Repository;
using static System.Net.Mime.MediaTypeNames;

namespace UrbanNest.Service
{
    public class SProfile : IProfile
    {
        private readonly DataBase database;

        public SProfile(DataBase database)
        {
            this.database = database;
        }

        public async Task<string> editConsumerProfile(int userId, ConsumerDTO consumer, IFormFile? image)
        {
            var consumerdata = await database.consumers.FirstOrDefaultAsync(c => c.UserId == userId);

            if (consumerdata == null)
            {
                return "Consumer doesn't exist";
            }

            consumerdata.FirstName = consumer.FirstName;
            consumerdata.LastName = consumer.LastName;
            consumerdata.Phone = consumer.Phone;
            consumerdata.Date_of_Birth = DateTime.SpecifyKind(consumer.Date_of_Birth, DateTimeKind.Utc);
            consumerdata.Gender = consumer.Gender;

            if (image != null && image.Length > 0)
            {
                var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");

                if (!Directory.Exists(uploadFolder))
                    Directory.CreateDirectory(uploadFolder);

                var fileName = Guid.NewGuid() + "_" + image.FileName;
                var filePath = Path.Combine(uploadFolder, fileName);

                using var stream = new FileStream(filePath, FileMode.Create);
                await image.CopyToAsync(stream);

                consumerdata.profileimage = "/images/" + fileName;
            }

            await database.SaveChangesAsync();

            return "Consumer updated Successfulyy";

        }

        public async Task<Consumer> getConsumerProfile(int userId)
        {
            var consumerData = await database.consumers.FirstOrDefaultAsync(c => c.UserId == userId);
            return consumerData;
        }

        public async Task<RetailerDTO?> GetRetailerProfile(int userId)
        {
            var retailer = await database.retailers
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null) return null;

            return new RetailerDTO
            {
                ShopName = retailer.ShopName,
                ShopDescription = retailer.ShopDescription,
                Address = retailer.Address,
                City = retailer.City,
                State = retailer.State,
                Pincode = retailer.Pincode,
                ContactNumber = retailer.ContactNumber,
                Email = retailer.User.userEmail,   // ✅ IMPORTANT
                GSTNumber = retailer.GSTNumber,
                PANNumber = retailer.PANNumber,
                BankAccountNumber = retailer.BankAccountNumber,
                IFSCCode = retailer.IFSCCode,
                AccountHolderName = retailer.AccountHolderName
            };
        }

        // ✅ UPDATE PROFILE
        public async Task<bool> UpdateRetailerProfile(int userId, RetailerDTO dto)
        {
            var retailer = await database.retailers
                .FirstOrDefaultAsync(r => r.UserId == userId);

            if (retailer == null) return false;

            retailer.ShopName = dto.ShopName;
            retailer.ShopDescription = dto.ShopDescription;
            retailer.Address = dto.Address;
            retailer.City = dto.City;
            retailer.State = dto.State;
            retailer.Pincode = dto.Pincode;

            retailer.ContactNumber = dto.ContactNumber;

            retailer.BankAccountNumber = dto.BankAccountNumber;
            retailer.IFSCCode = dto.IFSCCode;
            retailer.AccountHolderName = dto.AccountHolderName;

            await database.SaveChangesAsync();

            return true;
        }
    }
}

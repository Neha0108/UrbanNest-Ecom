using UrbanNest.Model;
using UrbanNest.Repository;
using Microsoft.EntityFrameworkCore;
using UrbanNest.DataAccess;
using UrbanNest.DTO;

namespace UrbanNest.Service
{
    public class SWishlist : IWishlist
    {
        private readonly DataBase database;
        public SWishlist(DataBase database)
        {
            this.database = database;
        }
        // ✅ ADD TO WISHLIST
        public async Task<bool> AddToWishlist(int userId, int productId)
        {
            bool exists = await database.WishlistItems.AnyAsync(w => w.UserId == userId && w.ProductId == productId);

            if (exists)
                return false;

            var wishlistItem = new WishlistItem
            {
                UserId = userId,
                ProductId = productId,
                AddedOn = DateTime.UtcNow
            };

            database.WishlistItems.Add(wishlistItem);
            await database.SaveChangesAsync();

            return true;
        }

        // ✅ GET USER WISHLIST
        public async Task<List<WishlistItemDTO>> GetWishlist(int userId)
        {
            var wishlist = await database.WishlistItems
                .Where(w => w.UserId == userId)
                .Include(w => w.Product)
                .Select(w => new WishlistItemDTO
                {
                    WishlistItemId = w.WishlistItemId,
                    ProductId = w.ProductId,
                    ProductName = w.Product.productName,
                    ProductPrice = w.Product.productPrice,
                    ImagePath = w.Product.imagepath.Select(i => i.ImageUrl).ToList(),
                    AddedOn = w.AddedOn
                })
                .ToListAsync();

            return wishlist;
        }

        // ✅ REMOVE FROM WISHLIST
        public async Task<bool> RemoveFromWishlist(int userId, int productId)
        {
            var item = await database.WishlistItems.FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

            if (item == null)
                return false;

            database.WishlistItems.Remove(item);
            await database.SaveChangesAsync();

            return true;
        }

        public async Task<int> getCount(int userId)
        {
            return await database.WishlistItems.CountAsync();
        }

    }
}
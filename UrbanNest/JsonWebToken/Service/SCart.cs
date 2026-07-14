using UrbanNest.Repository;
using Microsoft.EntityFrameworkCore;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Model;

namespace UrbanNest.Service
{
    public class SCart : ICart
    {
        private readonly DataBase database;

        public SCart(DataBase database)
        {
            this.database = database;
        }
        public async Task AddToCart(int userId, AddToCart dto)
        {
            var cart = await database.Cart
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart
                {
                    UserId = userId,
                    CartItems = new List<CartItem>()
                };
                database.Cart.Add(cart);
            }

            var existingItem = cart.CartItems
                .FirstOrDefault(ci => ci.ProductId == dto.ProductId);

            if (existingItem != null)
            {
                existingItem.Quantity += dto.Quantity;
            }
            else
            {
                cart.CartItems.Add(new CartItem
                {
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity,
                    Cart = cart
                });
            }

            await database.SaveChangesAsync();
        }

        public async Task<List<CartItemDTO>> get(int userId)
        {
            var cart = await database.Cart
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
                .ThenInclude(p => p.imagepath)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
                return new List<CartItemDTO>();

            return cart.CartItems.Select(ci => new CartItemDTO
            {
                ProductId = ci.ProductId,
                ProductName = ci.Product.productName,
                ProductPrice = ci.Product.productPrice,
                ImagePath = ci.Product.imagepath.Select(i => i.ImageUrl).ToList(),
                Quantity = ci.Quantity
            }).ToList();

        }

        public async Task updateQuantity(int userId, int productId, int quantity)
        {
            var item = await database.cartItems
                        .Include(ci => ci.Cart)
                        .FirstOrDefaultAsync(ci =>
                        ci.Cart.UserId == userId && ci.ProductId == productId);

            if (item == null)
                return;

            if (quantity <= 0)
            {
                database.cartItems.Remove(item);
            }
            else
            {
                item.Quantity = quantity;
            }
            await database.SaveChangesAsync();
        }

        public async Task RemoveFromCart(int userId, int productId)
        {
            var item = await database.cartItems
                .Include(ci => ci.Cart)
                .FirstOrDefaultAsync(ci =>
                    ci.Cart.UserId == userId &&
                    ci.ProductId == productId);

            if (item == null)
                return;

            database.cartItems.Remove(item);
            await database.SaveChangesAsync();
        }


    }
}

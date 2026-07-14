using UrbanNest.DTO;

namespace UrbanNest.Repository
{
    public interface ICart
    {
        Task AddToCart(int userId, AddToCart dto);
        Task<List<CartItemDTO>> get(int userId);
        Task updateQuantity(int userId, int productId, int quanity);
        Task RemoveFromCart(int userId, int productId);


    }
}

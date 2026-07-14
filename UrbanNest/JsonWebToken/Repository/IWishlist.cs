using UrbanNest.DTO;

namespace UrbanNest.Repository
{
    public interface IWishlist
    {
        Task<List<WishlistItemDTO>> GetWishlist(int userId);
        Task<bool> RemoveFromWishlist(int userId, int productId);
        Task<bool> AddToWishlist(int userId, int productId);
        Task<int> getCount(int userId);
    }
}

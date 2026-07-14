using UrbanNest.Model;

namespace UrbanNest.Repository
{
    public interface IAddress
    {
        Task<UserAddress> AddAddress(UserAddress address, int userId);
        Task<List<UserAddress>> GetUserAddresses(int userId);
        Task<UserAddress?> GetAddressById(int addressId, int userId);
        Task<bool> DeleteAddress(int addressId, int userId);
        Task<UserAddress?> GetDefaultAddress(int userId);
        Task<UserAddress?> EditAddress(UserAddress updatedAddress, int addressId, int userId);
    }
}

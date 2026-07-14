using UrbanNest.DTO;
using UrbanNest.Model;

namespace UrbanNest.Repository
{
    public interface IProfile
    {
        Task<Consumer> getConsumerProfile(int userId);

        Task<string> editConsumerProfile(int userId, ConsumerDTO consumer, IFormFile? image);

        Task<RetailerDTO?> GetRetailerProfile(int userId);

        Task<bool> UpdateRetailerProfile(int userId, RetailerDTO dto);

    }
}

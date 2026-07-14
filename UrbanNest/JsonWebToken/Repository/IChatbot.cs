using UrbanNest.DTO;

namespace UrbanNest.Repository
{
    public interface IChatbot
    {
        Task<ChatResponseDTO> GetReplyAsync(int userId, string message);
    }
}
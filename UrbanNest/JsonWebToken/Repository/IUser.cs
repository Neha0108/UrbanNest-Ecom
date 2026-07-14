using UrbanNest.Model;
using UrbanNest.DTO;

namespace UrbanNest.Repository
{
    public interface IUser
    {
        Task<Register> register(Register registerRequest);
        Task<string?> login(Login login);
        Task<string> updateUser(int id, Register register);
        Task<string> changePassword(int id, ChangePassword changePassword);
        Task<string?> GoogleLogin(string idToken);
    }
}

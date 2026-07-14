using UrbanNest.Model;
using UrbanNest.DTO;

namespace UrbanNest.Repository
{
    public interface IRole
    {
        Task<List<RoleDTO>> getAll();

        //Task<List<Role>> getAllRole();
        Task<string> add(RoleDTO roleDTO);
        Task<string> delete(int id);
        Task<string> deleteRoleUser(int id);


    }
}

using UrbanNest.Model;
using UrbanNest.Repository;
using Microsoft.EntityFrameworkCore;
using UrbanNest.DataAccess;
using UrbanNest.DTO;

namespace UrbanNest.Service
{
    public class SRole : IRole
    {
        private readonly DataBase database;
        private readonly IConfiguration configuration;

        public SRole(DataBase database, IConfiguration configuration)
        {
            this.database = database;
            this.configuration = configuration;
        }

        // ✅ ADD ROLE
        public async Task<string> add(RoleDTO roledto)
        {
            var exists = await database.Role
                .FirstOrDefaultAsync(r => r.Name == roledto.name);

            if (exists != null)
                return "role already exist";

            var role = new Role()
            {
                Name = roledto.name
            };

            database.Role.Add(role);
            await database.SaveChangesAsync();

            return "role added";
        }

        // ✅ GET ALL ROLES
        public async Task<List<RoleDTO>> getAll()
        {
            return await database.Role
                .Select(r => new RoleDTO
                {
                    id = r.RoleId,
                    name = r.Name
                })
                .ToListAsync();
        }

        // ✅ DELETE ROLE (SAFE)
        public async Task<string> delete(int id)
        {
            // ✅ ONE-TO-MANY CHECK
            bool used = await database.Users
                .AnyAsync(u => u.RoleId == id);

            if (used)
                return "Cannot delete role. Users are assigned to this role";

            var role = await database.Role.FindAsync(id);

            if (role == null)
                return "Role not found";

            database.Role.Remove(role);
            await database.SaveChangesAsync();

            return "Role Deleted";
        }

        // ✅ DELETE ROLE + USERS
        public async Task<string> deleteRoleUser(int id)
        {
            var role = await database.Role
                .Include(r => r.user) // ✅ correct
                .FirstOrDefaultAsync(r => r.RoleId == id);

            if (role == null)
                return "role not found";

            // ✅ delete all users of this role
            if (role.user != null && role.user.Any())
            {
                database.Users.RemoveRange(role.user);
            }

            database.Role.Remove(role);
            await database.SaveChangesAsync();

            return "Role and assigned users are deleted successfully";
        }
    }
}
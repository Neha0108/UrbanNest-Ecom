using UrbanNest.Repository;
using Microsoft.AspNetCore.Mvc;
using UrbanNest.DTO;
using Microsoft.AspNetCore.Authorization;

namespace UrbanNest.Controllers
{
    //[Authorize(Roles = "Admin")]
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class RoleController : ControllerBase
    {
        private readonly IRole role;
        public RoleController(IRole role)
        {
            this.role = role;
        }

        [HttpPost]
        public async Task<IActionResult> addRole([FromBody] RoleDTO roles)
        {
            var data = await role.add(roles);
            return Ok(data);
        }

        [HttpGet]
        public async Task<IActionResult> getAllRoles()
        {
            var data = await role.getAll();
            return Ok(data);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> deleteRole(int id)
        {
            var message = await role.delete(id);
            return Ok(message);
        }

        [HttpDelete]
        public async Task<IActionResult> deleteRoleUser(int id)
        {
            var message = await role.deleteRoleUser(id);
            return Ok(message);
        }
    }
}

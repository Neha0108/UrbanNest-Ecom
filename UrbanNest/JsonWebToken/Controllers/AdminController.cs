using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using UrbanNest.Repository;
using UrbanNest.DTO;

namespace UrbanNest.Controllers

{

    [Route("api/[controller]")]

    [ApiController]

    [Authorize(Roles = "Admin")]

    public class AdminController : ControllerBase
    {

        private readonly IAdmin admin;


        public AdminController(IAdmin admin)

        {

            this.admin = admin;

        }


        // =====================================================// ✅ CONSUMERS// =====================================================

        [HttpGet("consumers")]

        public async Task<IActionResult> GetConsumers()

        {

            var data = await admin.getConsumers();

            return Ok(data);

        }


        [HttpGet("retailers")]

        public async Task<IActionResult> GetRetailers()

        {

            var data = await admin.getRetailers();

            return Ok(data);

        }




        [HttpPut("block/{id}")]

        public async Task<IActionResult> BlockUser(int id)

        {

            var message = await admin.blockUser(id);

            return Ok(new { message });

        }



        [HttpPost("addCategory")]

        public async Task<IActionResult> AddCategory([FromBody] CategoryDTO dto)

        {

            var data = await admin.addCategory(dto);

            return Ok(data);

        }


        [HttpGet("getCategories")]

        public async Task<IActionResult> GetCategories()

        {

            var data = await admin.getCategories();

            return Ok(data);

        }


        [HttpDelete("deleteCategory/{id}")]

        public async Task<IActionResult> DeleteCategory(int id)

        {

            var message = await admin.deleteCategory(id);

            return Ok(message);

        }

    }

}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UrbanNest.DTO;
using UrbanNest.Repository;

namespace UrbanNest.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    [Authorize]
    public class ChatbotController : ControllerBase
    {
        private readonly IChatbot chatbot;

        public ChatbotController(IChatbot chatbot)
        {
            this.chatbot = chatbot;
        }

        [HttpPost]
        public async Task<IActionResult> Ask([FromBody] ChatMessageDTO dto)
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (claim == null ||
                !int.TryParse(claim.Value, out int userId))
            {
                return Unauthorized();
            }
            ChatResponseDTO response = await chatbot.GetReplyAsync(userId, dto.Message);
            return Ok(response);
        }
    }
}
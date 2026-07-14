using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Repository;

namespace UrbanNest.Service
{
    public class SChatbot : IChatbot
    {
        private readonly DataBase database;
        private readonly IProduct product;
        private readonly ICart cart;
        private readonly IWishlist wishlist;
        private readonly IGemini gemini;

        private static readonly string[] DefaultQuickReplies =
            { "Track Order", "Categories", "Show my Cart", "Show my Wishlist", "Help" };

        public SChatbot(DataBase db, IProduct product, ICart cart, IWishlist wishlist, IGemini gemini)
        {
            database = db;
            this.product = product;
            this.cart = cart;
            this.wishlist = wishlist;
            this.gemini = gemini;
        }

        private class GeminiChatResult
        {
            public string Reply { get; set; } = string.Empty;
            public List<string> RecommendedProducts { get; set; } = new();
            public List<int> OrderReferences { get; set; } = new();
        }

        public async Task<ChatResponseDTO> GetReplyAsync(int userId, string message)
        {
            try
            {
                var products = await product.getAll();
                var wishlistItems = await wishlist.GetWishlist(userId) ?? [];
                var cartItems = await cart.get(userId) ?? [];

                var orders = await database.orders
                    .Where(o => o.UsersId == userId)
                    .OrderByDescending(o => o.OrderDate)
                    .Take(5)
                    .ToListAsync();

                var prompt = $@"You are Urban Nest shopping assistant.
User Message:
{message}

User Cart:
{string.Join("\n", cartItems.Select(c => $"{c.ProductName} | Quantity:{c.Quantity} | Price:{c.ProductPrice}"))}

User Wishlist:
{string.Join("\n", wishlistItems.Select(w => $"{w.ProductName} | Price:{w.ProductPrice}"))}

Recent Orders:
{string.Join("\n", orders.Select(o => $"Order #{o.OrderId} | Status:{o.Status} | Date:{o.OrderDate:d}"))}

Products Available:
{string.Join("\n", products.Take(100).Select(p => $"{p.productName} | Category:{p.categoryName} | Price:{p.productPrice}"))}

Rules:
- Answer as Urban Nest assistant.
- Use cart information when user asks about cart.
- Use wishlist information when user asks about wishlist.
- Keep answers short and friendly.

- PRODUCT CARDS: If the reply mentions specific products — whether from a browsing/recommendation
  request, the user's cart, or the user's wishlist — include the exact matching product name(s)
  from ""Products Available"" (match by name against Cart/Wishlist/Products Available, up to 4) in
  recommendedProducts. Otherwise leave recommendedProducts as an empty array.

- ORDERS: If the user asks about their orders in general (e.g. ""track my order"", ""show my
  orders"", ""where is my stuff"") and has not specified which order, do NOT give full details yet.
  Instead, list each recent order's ID and status in the reply, then ask which order they'd like to
  see details for. Put each listed order's numeric ID (no ""#"") in orderReferences.
  If the user's message specifies a particular order (mentions an order number, or replies to a
  previous ""which order"" prompt with one), answer with full details for that specific order only,
  and leave orderReferences as an empty array.

Respond ONLY with valid JSON in exactly this shape, no other text:
{{
  ""reply"": ""your short friendly reply here"",
  ""recommendedProducts"": [""Exact Product Name 1"", ""Exact Product Name 2""],
  ""orderReferences"": [123, 124]
}}
";

                var rawJson = await gemini.AskJsonAsync(prompt);

                GeminiChatResult parsed;
                try
                {
                    parsed = JsonSerializer.Deserialize<GeminiChatResult>(
                        rawJson,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                    ) ?? new GeminiChatResult { Reply = rawJson };
                }
                catch
                {
                    parsed = new GeminiChatResult { Reply = rawJson };
                }

                var matchedProducts = ResolveProductCards(
                    parsed.RecommendedProducts, products, cartItems, wishlistItems);

                var quickReplies = new List<string>();
                if (parsed.OrderReferences.Count > 0)
                {
                    quickReplies.AddRange(
                        parsed.OrderReferences
                            .Where(id => orders.Any(o => o.OrderId == id))
                            .Take(5)
                            .Select(id => $"Order #{id}"));
                }
                quickReplies.AddRange(DefaultQuickReplies);

                return new ChatResponseDTO
                {
                    Reply = parsed.Reply,
                    Products = matchedProducts.Count > 0 ? matchedProducts : null,
                    QuickReplies = quickReplies
                };
            }
            catch (Exception ex)
            {
                return new ChatResponseDTO
                {
                    Reply = $"AI assistant unavailable. {ex.Message}",
                    QuickReplies = DefaultQuickReplies.ToList()
                };
            }
        }

        private static List<ChatProductCardDTO> ResolveProductCards(
            List<string> names,
            dynamic products,            
            List<CartItemDTO> cartItems,
            List<WishlistItemDTO> wishlistItems)
        {
            if (names.Count == 0)
            {
                return new List<ChatProductCardDTO>();
            }

            var idsByName = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            foreach (var c in cartItems)
            {
                idsByName.TryAdd(c.ProductName, c.ProductId);
            }
            foreach (var w in wishlistItems)
            {
                idsByName.TryAdd(w.ProductName, w.ProductId);
            }
            foreach (var p in products)
            {
                idsByName.TryAdd((string)p.productName, (int)p.productId);
            }

            var wantedIds = names
                .Select(n => idsByName.TryGetValue(n, out var id) ? id : (int?)null)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            var result = new List<ChatProductCardDTO>();
            foreach (var p in products)
            {
                if (result.Count >= 4) break;
                if (!wantedIds.Contains((int)p.productId)) continue;

                result.Add(new ChatProductCardDTO
                {
                    ProductId = p.productId,
                    ProductName = p.productName,
                    ProductPrice = p.productPrice,
                    ImagePath = p.imagepath ?? new List<string>(),
                    Stock = p.stock,
                    CategoryName = p.categoryName
                });
            }
            return result;
        }
    }
}
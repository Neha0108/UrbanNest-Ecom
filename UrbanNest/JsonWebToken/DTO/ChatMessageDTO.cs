namespace UrbanNest.DTO
{
    public class ChatMessageDTO
    {
        public string Message { get; set; } = string.Empty;
    }
        public class ChatProductCardDTO
        {
            public int ProductId { get; set; }
            public string ProductName { get; set; } = string.Empty;
            public double ProductPrice { get; set; }
            public List<string> ImagePath { get; set; }
            public int Stock { get; set; }
            public string CategoryName { get; set; } = string.Empty;
        }

        public class ChatResponseDTO
        {
            public string Reply { get; set; } = string.Empty;
            public List<ChatProductCardDTO>? Products { get; set; }
            public List<string> QuickReplies { get; set; } = new();
        }
    }
namespace UrbanNest.DTO
{
    public class WishlistItemDTO
    {
        public int WishlistItemId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public double ProductPrice { get; set; }
        public List<string> ImagePath { get; set; }
        public DateTime AddedOn { get; set; }

    }
}

namespace UrbanNest.Model
{
    public class WishlistItem
    {
        public int WishlistItemId { get; set; }
        public int UserId { get; set; }
        public Users User { get; set; }
        public int ProductId { get; set; }
        public Product Product { get; set; }
        public DateTime AddedOn { get; set; }
    }
}
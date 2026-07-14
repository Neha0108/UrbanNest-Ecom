namespace UrbanNest.DTO
{
    public class CartItemDTO
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public double ProductPrice { get; set; }
        public List<string> ImagePath { get; set; }
        public int Quantity { get; set; }
    }
}

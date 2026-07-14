namespace UrbanNest.DTO
{
    public class PlaceOrderRequest
    {
        public List<int> SelectedProductIds { get; set; } = new();
        public int AddressId { get; set; }
    }
}

namespace UrbanNest.DTO
{
    public class RetailerCustomerDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public int TotalOrders { get; set; }
        public double TotalSpent { get; set; }
        public DateTime LastOrderDate { get; set; }
        public string CustomerType { get; set; } = string.Empty;
        public string? City { get; set; }
    }
}

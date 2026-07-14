namespace UrbanNest.DTO
{
    public class RatingSummaryDTO
    {
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public double RecommendPercent { get; set; }
        public List<RatingBreakdownDTO> Breakdown { get; set; } = new();
    }

    public class RatingBreakdownDTO
    {
        public int Star { get; set; }
        public int Count { get; set; }
        public double Percent { get; set; }
    }
}
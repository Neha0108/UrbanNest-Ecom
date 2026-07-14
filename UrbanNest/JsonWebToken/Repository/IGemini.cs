namespace UrbanNest.Repository
{
    public interface IGemini
    {
        Task<string> AskAsync(string prompt);
        Task<string> AskJsonAsync(string prompt);
    }
}

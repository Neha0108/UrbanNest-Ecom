using UrbanNest.Model;
using UrbanNest.DTO;

namespace UrbanNest.Repository
{
    public interface IProduct
    {
        Task<Product> add(ProductDTO pro, int retailerId);
        Task<bool> delete(int id, int retailerId);
        Task<List<ProductViewDTO>> getAll();
        Task<Product> update(int productId, ProductDTO pro, int retailerId);
        Task<ProductViewDTO?> getbyId(int id);
        Task<List<ProductViewDTO>> getByRetailerId(int retailerId);
    }
}

using UrbanNest.DTO;

namespace UrbanNest.Repository

{
    public interface IAdmin
    {

        Task<object> getConsumers();

        Task<object> getRetailers();

        Task<string> blockUser(int id);


        Task<object> addCategory(CategoryDTO dto);

        Task<object> getCategories();

        Task<string> deleteCategory(int id);

    }

}
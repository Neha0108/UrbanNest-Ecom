using UrbanNest.DTO;

namespace UrbanNest.Repository
{
    public interface ICoupon
    {
        Task<CouponResponseDTO> AdminCreateAsync(int adminUserId, CouponCreateDTO dto);
        Task<List<CouponResponseDTO>> AdminGetAllAsync();
        Task<CouponResponseDTO?> AdminGetByIdAsync(int couponId);
        Task<(bool success, string message)> AdminUpdateAsync(int couponId, CouponUpdateDTO dto);
        Task<(bool success, string message)> AdminDeleteAsync(int couponId);
        Task<(bool success, string message)> AdminSetStatusAsync(int couponId, bool isActive);
        Task<(bool success, string message, CouponResponseDTO? coupon)> RetailerCreateAsync(int retailerUserId, CouponCreateDTO dto);
        Task<List<CouponResponseDTO>> RetailerGetAllAsync(int retailerUserId);
        Task<CouponResponseDTO?> RetailerGetByIdAsync(int retailerUserId, int couponId);
        Task<(bool success, string message)> RetailerUpdateAsync(int retailerUserId, int couponId, CouponUpdateDTO dto);
        Task<(bool success, string message)> RetailerDeleteAsync(int retailerUserId, int couponId);
        Task<List<CouponResponseDTO>> GetActiveCouponsAsync();
        Task<ApplyCouponResultDTO> ApplyCouponAsync(ApplyCouponRequestDTO dto);
    }
}
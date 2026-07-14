using Microsoft.EntityFrameworkCore;
using UrbanNest.DataAccess;
using UrbanNest.DTO;
using UrbanNest.Model;
using UrbanNest.Repository;

namespace UrbanNest.Service
{
    public class SCoupon : ICoupon
    {
        private readonly DataBase database;

        public SCoupon(DataBase database)
        {
            this.database = database;
        }

        private static DateTime AsUtc(DateTime dt) =>
            dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

        public async Task<CouponResponseDTO> AdminCreateAsync(int adminUserId, CouponCreateDTO dto)
        {
            await ValidateCreateAsync(dto);

            if (dto.CouponScope == CouponScope.Retailer && dto.RetailerId == null)
                throw new InvalidOperationException("RetailerId is required when scope is Retailer");

            var coupon = new Coupon
            {
                CouponCode = dto.CouponCode.Trim().ToUpperInvariant(),
                Description = dto.Description,
                DiscountType = dto.DiscountType,
                DiscountValue = dto.DiscountValue,
                MinimumOrderAmount = dto.MinimumOrderAmount,
                MaximumDiscount = dto.MaximumDiscount,
                StartDate = AsUtc(dto.StartDate),
                ExpiryDate = AsUtc(dto.ExpiryDate),
                UsageLimit = dto.UsageLimit,
                CouponScope = dto.CouponScope,
                RetailerId = dto.CouponScope == CouponScope.Retailer ? dto.RetailerId : null,
                CreatedByUserId = adminUserId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            database.Coupons.Add(coupon);
            await database.SaveChangesAsync();

            return await MapToResponseAsync(coupon);
        }

        public async Task<List<CouponResponseDTO>> AdminGetAllAsync()
        {
            var coupons = await database.Coupons
                .Include(c => c.Retailer)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var result = new List<CouponResponseDTO>();
            foreach (var c in coupons)
                result.Add(await MapToResponseAsync(c));

            return result;
        }

        public async Task<CouponResponseDTO?> AdminGetByIdAsync(int couponId)
        {
            var coupon = await database.Coupons
                .Include(c => c.Retailer)
                .FirstOrDefaultAsync(c => c.CouponId == couponId);

            return coupon == null ? null : await MapToResponseAsync(coupon);
        }

        public async Task<(bool success, string message)> AdminUpdateAsync(int couponId, CouponUpdateDTO dto)
        {
            var coupon = await database.Coupons.FindAsync(couponId);
            if (coupon == null)
                return (false, "Coupon not found");

            ApplyUpdate(coupon, dto);
            await database.SaveChangesAsync();

            return (true, "Coupon updated successfully");
        }

        public async Task<(bool success, string message)> AdminDeleteAsync(int couponId)
        {
            var coupon = await database.Coupons.FindAsync(couponId);
            if (coupon == null)
                return (false, "Coupon not found");

            database.Coupons.Remove(coupon);
            await database.SaveChangesAsync();

            return (true, "Coupon deleted successfully");
        }

        public async Task<(bool success, string message)> AdminSetStatusAsync(int couponId, bool isActive)
        {
            var coupon = await database.Coupons.FindAsync(couponId);
            if (coupon == null)
                return (false, "Coupon not found");

            coupon.IsActive = isActive;
            coupon.UpdatedAt = DateTime.UtcNow;
            await database.SaveChangesAsync();

            return (true, isActive ? "Coupon enabled" : "Coupon disabled");
        }

        public async Task<(bool success, string message, CouponResponseDTO? coupon)> RetailerCreateAsync(int retailerUserId, CouponCreateDTO dto)
        {
            var retailer = await database.retailers.FirstOrDefaultAsync(r => r.UserId == retailerUserId);

            if (retailer == null)
                return (false, "Retailer profile not found", null);

            try
            {
                await ValidateCreateAsync(dto);
            }
            catch (InvalidOperationException ex)
            {
                return (false, ex.Message, null);
            }

            var coupon = new Coupon
            {
                CouponCode = dto.CouponCode.Trim().ToUpperInvariant(),
                Description = dto.Description,
                DiscountType = dto.DiscountType,
                DiscountValue = dto.DiscountValue,
                MinimumOrderAmount = dto.MinimumOrderAmount,
                MaximumDiscount = dto.MaximumDiscount,
                StartDate = AsUtc(dto.StartDate),
                ExpiryDate = AsUtc(dto.ExpiryDate),
                UsageLimit = dto.UsageLimit,
                CouponScope = CouponScope.Retailer,
                RetailerId = retailer.RetailerId,
                CreatedByUserId = retailerUserId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            database.Coupons.Add(coupon);
            await database.SaveChangesAsync();

            return (true, "Coupon created successfully", await MapToResponseAsync(coupon));
        }

        public async Task<List<CouponResponseDTO>> RetailerGetAllAsync(int retailerUserId)
        {
            var retailer = await database.retailers.FirstOrDefaultAsync(r => r.UserId == retailerUserId);
            if (retailer == null)
                return new List<CouponResponseDTO>();

            var coupons = await database.Coupons
                .Include(c => c.Retailer)
                .Where(c => c.RetailerId == retailer.RetailerId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var result = new List<CouponResponseDTO>();
            foreach (var c in coupons)
                result.Add(await MapToResponseAsync(c));

            return result;
        }

        public async Task<CouponResponseDTO?> RetailerGetByIdAsync(int retailerUserId, int couponId)
        {
            var retailer = await database.retailers.FirstOrDefaultAsync(r => r.UserId == retailerUserId);
            if (retailer == null) return null;

            var coupon = await database.Coupons
                .Include(c => c.Retailer)
                .FirstOrDefaultAsync(c => c.CouponId == couponId && c.RetailerId == retailer.RetailerId);

            return coupon == null ? null : await MapToResponseAsync(coupon);
        }

        public async Task<(bool success, string message)> RetailerUpdateAsync(int retailerUserId, int couponId, CouponUpdateDTO dto)
        {
            var retailer = await database.retailers.FirstOrDefaultAsync(r => r.UserId == retailerUserId);
            if (retailer == null)
                return (false, "Retailer profile not found");

            var coupon = await database.Coupons
                .FirstOrDefaultAsync(c => c.CouponId == couponId && c.RetailerId == retailer.RetailerId);

            if (coupon == null)
                return (false, "Coupon not found or you do not own this coupon");

            ApplyUpdate(coupon, dto);
            await database.SaveChangesAsync();

            return (true, "Coupon updated successfully");
        }

        public async Task<(bool success, string message)> RetailerDeleteAsync(int retailerUserId, int couponId)
        {
            var retailer = await database.retailers.FirstOrDefaultAsync(r => r.UserId == retailerUserId);
            if (retailer == null)
                return (false, "Retailer profile not found");

            var coupon = await database.Coupons
                .FirstOrDefaultAsync(c => c.CouponId == couponId && c.RetailerId == retailer.RetailerId);

            if (coupon == null)
                return (false, "Coupon not found or you do not own this coupon");

            database.Coupons.Remove(coupon);
            await database.SaveChangesAsync();

            return (true, "Coupon deleted successfully");
        }

        public async Task<List<CouponResponseDTO>> GetActiveCouponsAsync()
        {
            var now = DateTime.UtcNow;

            var coupons = await database.Coupons
                .Include(c => c.Retailer)
                .Where(c => c.IsActive
                    && c.ExpiryDate >= now
                    && c.StartDate <= now
                    && (c.UsageLimit == null || c.UsedCount < c.UsageLimit))
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var result = new List<CouponResponseDTO>();
            foreach (var c in coupons)
                result.Add(await MapToResponseAsync(c));

            return result;
        }

        public async Task<ApplyCouponResultDTO> ApplyCouponAsync(ApplyCouponRequestDTO dto)
        {
            var originalTotal = dto.CartItems.Sum(i => i.Price * i.Quantity);

            var code = dto.CouponCode.Trim().ToUpperInvariant();

            var coupon = await database.Coupons
                .FirstOrDefaultAsync(c => c.CouponCode == code);

            if (coupon == null)
                return Invalid("Invalid coupon code", originalTotal);

            if (!coupon.IsActive)
                return Invalid("This coupon is no longer active", originalTotal);

            var now = DateTime.UtcNow;

            if (now < coupon.StartDate)
                return Invalid("This coupon is not active yet", originalTotal);

            if (now > coupon.ExpiryDate)
                return Invalid("This coupon has expired", originalTotal);

            if (coupon.UsageLimit != null && coupon.UsedCount >= coupon.UsageLimit)
                return Invalid("This coupon has reached its usage limit", originalTotal);

            double eligibleAmount;

            if (coupon.CouponScope == CouponScope.Retailer)
            {
                if (coupon.RetailerId == null)
                    return Invalid("Coupon configuration error", originalTotal);

                var productIds = dto.CartItems.Select(i => i.ProductId).ToList();

                var retailerProductIds = await database.Products
                    .Where(p => productIds.Contains(p.productId) && p.RetailerId == coupon.RetailerId)
                    .Select(p => p.productId)
                    .ToListAsync();

                if (retailerProductIds.Count == 0)
                    return Invalid("This coupon is not applicable to any items in your cart", originalTotal);

                eligibleAmount = dto.CartItems
                    .Where(i => retailerProductIds.Contains(i.ProductId))
                    .Sum(i => i.Price * i.Quantity);
            }
            else
            {
                eligibleAmount = originalTotal;
            }

            if (eligibleAmount < coupon.MinimumOrderAmount)
            {
                return Invalid(
                    $"Minimum order amount of ₹{coupon.MinimumOrderAmount:0} not met" +
                    (coupon.CouponScope == CouponScope.Retailer ? " for this retailer's items" : ""),
                    originalTotal);
            }

            double discount = coupon.DiscountType == DiscountType.Flat
                ? coupon.DiscountValue
                : eligibleAmount * (coupon.DiscountValue / 100.0);

            if (coupon.MaximumDiscount.HasValue && discount > coupon.MaximumDiscount.Value)
                discount = coupon.MaximumDiscount.Value;

            if (discount > eligibleAmount)
                discount = eligibleAmount;

            var finalTotal = originalTotal - discount;
            if (finalTotal < 0)
                finalTotal = 0;

            return new ApplyCouponResultDTO
            {
                Valid = true,
                Reason = "Coupon applied successfully",
                DiscountAmount = Math.Round(discount, 2),
                OriginalTotal = Math.Round(originalTotal, 2),
                FinalTotal = Math.Round(finalTotal, 2),
                CouponCode = coupon.CouponCode
            };
        }

        public async Task IncrementUsageAsync(string couponCode)
        {
            var code = couponCode.Trim().ToUpperInvariant();
            var coupon = await database.Coupons.FirstOrDefaultAsync(c => c.CouponCode == code);

            if (coupon != null)
            {
                coupon.UsedCount += 1;
                await database.SaveChangesAsync();
            }
        }

        private async Task ValidateCreateAsync(CouponCreateDTO dto)
        {
            var code = dto.CouponCode.Trim().ToUpperInvariant();

            bool exists = await database.Coupons.AnyAsync(c => c.CouponCode == code);
            if (exists)
                throw new InvalidOperationException("Coupon code already exists");

            if (dto.ExpiryDate <= dto.StartDate)
                throw new InvalidOperationException("Expiry date must be after start date");

            if (dto.DiscountType == DiscountType.Percentage && dto.DiscountValue > 100)
                throw new InvalidOperationException("Percentage discount cannot exceed 100");

            if (dto.DiscountValue <= 0)
                throw new InvalidOperationException("Discount value must be greater than 0");

            if (dto.MinimumOrderAmount < 0)
                throw new InvalidOperationException("Minimum order amount cannot be negative");

            if (dto.MaximumDiscount.HasValue && dto.MaximumDiscount.Value <= 0)
                throw new InvalidOperationException("Maximum discount must be greater than 0");
        }

        private void ApplyUpdate(Coupon coupon, CouponUpdateDTO dto)
        {
            coupon.Description = dto.Description;
            coupon.DiscountValue = dto.DiscountValue;
            coupon.MinimumOrderAmount = dto.MinimumOrderAmount;
            coupon.MaximumDiscount = dto.MaximumDiscount;
            coupon.StartDate = AsUtc(dto.StartDate);
            coupon.ExpiryDate = AsUtc(dto.ExpiryDate);
            coupon.UsageLimit = dto.UsageLimit;
            coupon.IsActive = dto.IsActive;
            coupon.UpdatedAt = DateTime.UtcNow;
        }

        private async Task<CouponResponseDTO> MapToResponseAsync(Coupon c)
        {
            string createdByName = "System";

            var creator = await database.Users.FirstOrDefaultAsync(u => u.UserId == c.CreatedByUserId);
            if (creator != null)
                createdByName = creator.userName;

            var now = DateTime.UtcNow;

            return new CouponResponseDTO
            {
                CouponId = c.CouponId,
                CouponCode = c.CouponCode,
                Description = c.Description,
                DiscountType = c.DiscountType.ToString(),
                DiscountValue = c.DiscountValue,
                MinimumOrderAmount = c.MinimumOrderAmount,
                MaximumDiscount = c.MaximumDiscount,
                StartDate = c.StartDate,
                ExpiryDate = c.ExpiryDate,
                UsageLimit = c.UsageLimit,
                UsedCount = c.UsedCount,
                IsActive = c.IsActive,
                CouponScope = c.CouponScope.ToString(),
                RetailerId = c.RetailerId,
                RetailerShopName = c.Retailer?.ShopName,
                CreatedByName = createdByName,
                CreatedAt = c.CreatedAt,
                IsExpired = c.ExpiryDate < now,
                IsUpcoming = c.StartDate > now
            };
        }

        private static ApplyCouponResultDTO Invalid(string reason, double originalTotal) => new()
        {
            Valid = false,
            Reason = reason,
            DiscountAmount = 0,
            OriginalTotal = Math.Round(originalTotal, 2),
            FinalTotal = Math.Round(originalTotal, 2)
        };
    }
}
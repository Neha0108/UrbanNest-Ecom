using UrbanNest.Model;
using UrbanNest.Repository;
using Microsoft.EntityFrameworkCore;
using UrbanNest.DataAccess;
using UrbanNest.DTO;

namespace UrbanNest.Service
{
    public class SProduct : IProduct
    {
        private readonly DataBase database;

        public SProduct(DataBase database)
        {
            this.database = database;
        }
        public async Task<Product?> add(ProductDTO pro, int retailerId)
        {
            var category = await database.Category
                .FirstOrDefaultAsync(c => c.CategoryName == pro.CategoryName);

            var subcategory = await database.SubCategory
                .FirstOrDefaultAsync(s => s.SubCategoryName == pro.SubCategoryName);

            Console.WriteLine($"Category: {pro.CategoryName}");
            Console.WriteLine($"SubCategory: {pro.SubCategoryName}");


            if (category == null || subcategory == null)
                return null;

            var product = new Product
            {
                productName = pro.productName,
                Description = pro.productDescription,
                productPrice = pro.productPrice,
                CategoryId = category.CategoryId,
                SubCategoryId = subcategory.SubCategoryId,
                productAdded = DateTime.UtcNow,
                stock = pro.stock,
                RetailerId = retailerId,
                imagepath = new List<ProductImage>()
            };

            // ✅ HANDLE MULTIPLE imagepath
            if (pro.imagepath != null && pro.imagepath.Count > 0)
            {
                var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "imagepath");

                if (!Directory.Exists(uploadFolder))
                    Directory.CreateDirectory(uploadFolder);

                foreach (var image in pro.imagepath)
                {
                    if (image.Length > 0)
                    {
                        var fileName = Guid.NewGuid() + "_" + image.FileName;
                        var filePath = Path.Combine(uploadFolder, fileName);

                        using var stream = new FileStream(filePath, FileMode.Create);
                        await image.CopyToAsync(stream);

                        product.imagepath.Add(new ProductImage
                        {
                            ImageUrl = "/imagepath/" + fileName
                        });
                    }
                }
            }

            await database.Products.AddAsync(product);
            await database.SaveChangesAsync();

            return product;
        }
        public async Task<bool> delete(int productId, int retailerId)
        {
            var product = await database.Products
                .Include(p => p.imagepath)
                .FirstOrDefaultAsync(p => p.productId == productId && p.RetailerId == retailerId);

            if (product == null)
                return false;

            // ✅ 1. Remove CartItems
            var cartItems = database.cartItems
                .Where(c => c.ProductId == productId);
            database.cartItems.RemoveRange(cartItems);

            // ✅ 2. Remove OrderItems (THIS IS MISSING 🔥)
            var orderItems = database.orderItems
                .Where(o => o.ProductId == productId);
            database.orderItems.RemoveRange(orderItems);

            // ✅ 3. Remove images from DB
            database.ProductImages.RemoveRange(product.imagepath);

            // ✅ 4. Delete image files (optional but BEST)
            foreach (var img in product.imagepath)
            {
                var fullPath = Path.Combine("wwwroot", img.ImageUrl.TrimStart('/'));
                if (File.Exists(fullPath))
                    File.Delete(fullPath);
            }

            // ✅ 5. Remove product
            database.Products.Remove(product);

            await database.SaveChangesAsync();

            return true;
        }

        public async Task<Product> update(int productId, ProductDTO pro, int retailerId)
        {
            var data = await database.Products
                .Include(p => p.imagepath)
                .FirstOrDefaultAsync(p => p.productId == productId && p.RetailerId == retailerId);

            if (data == null)
                return null;

            var category = await database.Category
                .FirstOrDefaultAsync(c => c.CategoryName == pro.CategoryName);

            var subcategory = await database.SubCategory
                .FirstOrDefaultAsync(c => c.SubCategoryName == pro.SubCategoryName);

            if (category != null)
                data.CategoryId = category.CategoryId;

            if (subcategory != null)
                data.SubCategoryId = subcategory.SubCategoryId;

            data.productName = pro.productName;
            data.productPrice = pro.productPrice;
            data.Description = pro.productDescription;
            data.stock = pro.stock;


            if (pro.imagepath != null && pro.imagepath.Count > 0)
            {
                var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");

                if (!Directory.Exists(uploadFolder))
                    Directory.CreateDirectory(uploadFolder);

                foreach (var image in pro.imagepath)
                {
                    if (image.Length > 0)
                    {
                        var fileName = Guid.NewGuid() + "_" + image.FileName;
                        var filePath = Path.Combine(uploadFolder, fileName);

                        using var stream = new FileStream(filePath, FileMode.Create);
                        await image.CopyToAsync(stream);

                        data.imagepath.Add(new ProductImage
                        {
                            ImageUrl = "/images/" + fileName
                        });
                    }
                }
            }

            await database.SaveChangesAsync();
            return data;
        }

        public async Task<ProductViewDTO?> getbyId(int id)
        {
            var raw = await database.Products.Include(p => p.SubCategory).FirstOrDefaultAsync(p => p.productId == id);
            Console.WriteLine($"SubCategoryId: {raw?.SubCategoryId}, SubCategory: {raw?.SubCategory?.SubCategoryName}");

            var data =  await database.Products
                .Include(p => p.Category)
                .Include(p => p.SubCategory)
                .Include(p => p.Retailer)
                .Where(p => p.productId == id)
                .Select(p => new ProductViewDTO
                {
                    productId = p.productId,
                    productName = p.productName,
                    retailerName = p.Retailer.ShopName,
                    productDescription = p.Description,
                    categoryName = p.Category.CategoryName,
                    subCategoryName = p.SubCategory.SubCategoryName,
                    productPrice = p.productPrice,
                    imagepath = p.imagepath.Select(i => i.ImageUrl).ToList(),
                    stock = p.stock,
                    expectedDelivery = DateTime.Now.AddDays(7)
                })
                .FirstOrDefaultAsync();
            Console.WriteLine(data);
            return data;
        }


        public async Task<List<ProductViewDTO>> getAll()
        {
            var products = await database.Products
                .Select(p => new ProductViewDTO
                {
                    productId = p.productId,
                    productName = p.productName,
                    productDescription = p.Description,
                    productPrice = p.productPrice,
                    imagepath = p.imagepath.Select(i => i.ImageUrl).ToList(),
                    stock = p.stock,
                    categoryName = p.Category.CategoryName,
                    expectedDelivery = DateTime.Now.AddDays(7)
                })
                .ToListAsync();
            if (products is not null)
            {
                return products;
            }
            return null;
        }
        public async Task<List<ProductViewDTO>> getByRetailerId(int retailerId)
        {
            return await database.Products
                .Where(p => p.RetailerId == retailerId)
                .Include(p => p.Category)
                .Select(p => new ProductViewDTO
                {
                    productId = p.productId,
                    productName = p.productName,
                    //RetailerName = p.Retailer.userName,     
                    productDescription = p.Description,
                    categoryName = p.Category.CategoryName,
                    productPrice = p.productPrice,
                    imagepath = p.imagepath != null ? p.imagepath.Select(i => i.ImageUrl).ToList() : new List<string>(),
                    stock = p.stock
                })
                .ToListAsync();
        }

    }
}
using UrbanNest.Model;
using Microsoft.EntityFrameworkCore;
using UrbanNest.DTO;

namespace UrbanNest.DataAccess
{
    public class DataBase : DbContext
    {
        public DataBase(DbContextOptions<DataBase> options) : base(options)
        { }
        public DbSet<Users> Users { get; set; }
        public DbSet<Role> Role { get; set; }
        public DbSet<Consumer> consumers { get; set; }
        public DbSet<Retailer> retailers { get; set; }
        public DbSet<Category> Category { get; set; }
        public DbSet<SubCategory> SubCategory { get; set; }
        public DbSet<WishlistItem> WishlistItems { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Cart> Cart { get; set; }
        public DbSet<CartItem> cartItems { get; set; }
        public DbSet<Orders> orders { get; set; }
        public DbSet<OrderItem> orderItems { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<EmailOTP> emailOTPs { get; set; }
        public DbSet<UserAddress> UserAddress { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<ReviewHelpful> ReviewHelpful { get; set; }
        public DbSet<ReviewReply> ReviewReplies { get; set; }
        public DbSet<Coupon> Coupons { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Users>()
                .HasOne(u => u.Role)
                .WithMany(r => r.user)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WishlistItem>()
                .HasOne(w => w.User)
                .WithMany(u => u.Wishlist)
                .HasForeignKey(w => w.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<WishlistItem>()
                .HasOne(w => w.Product)
                .WithMany(p => p.WishlistItems)
                .HasForeignKey(w => w.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Consumer>()
                .HasOne(c => c.Users)
                .WithOne()
                .HasForeignKey<Consumer>(c => c.UserId);

            modelBuilder.Entity<Product>()
                .HasOne(p => p.Retailer)
                .WithMany(r => r.Products)
                .HasForeignKey(p => p.RetailerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Retailer>().ToTable("Retailers");

            modelBuilder.Entity<ProductImage>().ToTable("ProductImages");

            // ✅ CartItem → Product (NO CASCADE)
            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Product)
                .WithMany()
                .HasForeignKey(ci => ci.ProductId)
                .OnDelete(DeleteBehavior.NoAction);

            // ✅ OrderItem → Product (NO CASCADE)
            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Product)
                .WithMany()
                .HasForeignKey(oi => oi.ProductId)
                .OnDelete(DeleteBehavior.NoAction);

            // ✅ Product → Images (ONLY CASCADE HERE)
            modelBuilder.Entity<ProductImage>()
                .HasOne(i => i.Product)
                .WithMany(p => p.imagepath)
                .HasForeignKey(i => i.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Coupon>()
                .HasIndex(c => c.CouponCode)
                .IsUnique();
        }
    }
}

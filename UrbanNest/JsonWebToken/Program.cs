using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QuestPDF;
using QuestPDF.Infrastructure;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using UrbanNest.DataAccess;
using UrbanNest.Repository;
using UrbanNest.Service;


var builder = WebApplication.CreateBuilder(args);
builder.Configuration
.AddJsonFile("secure.json", optional: true, reloadOnChange: true);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
});
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<DataBase>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"));
});

builder.Services.AddScoped<IUser, SUsers>();
builder.Services.AddScoped<IRole, SRole>();
builder.Services.AddScoped<IProduct, SProduct>();
builder.Services.AddScoped<IWishlist, SWishlist>();
builder.Services.AddScoped<ICart, SCart>();
builder.Services.AddScoped<IProfile, SProfile>();
builder.Services.AddScoped<IEmail, SEmail>();
builder.Services.AddScoped<IOrder, SOrder>();
builder.Services.AddScoped<IAdmin, SAdmin>();
builder.Services.AddScoped<IAddress, SAddress>();
builder.Services.AddScoped<INotification, SNotification>();
builder.Services.AddScoped<IReview, SReview>();
builder.Services.AddScoped<IChatbot, SChatbot>();
builder.Services.AddHttpClient<IGemini, SGemini>();
builder.Services.AddScoped<ICoupon, SCoupon>();

QuestPDF.Settings.License = LicenseType.Community;

builder.Services.AddAuthorization();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])
        )
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy => policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod());
});


var app = builder.Build();

app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngular");

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

app.Run();
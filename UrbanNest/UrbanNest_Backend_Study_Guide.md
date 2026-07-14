# UrbanNest Backend — Complete Study Guide

# PART 1 — Backend Overview

### Simple explanation
UrbanNest's backend is the "engine room" of an e-commerce site. The Angular frontend never touches the database directly — it only talks to this ASP.NET Core Web API over HTTP. The backend:
- Checks who you are (login, JWT tokens)
- Stores and fetches products, orders, carts, wishlists, reviews, coupons
- Talks to outside services: Razorpay (payments), Gemini AI (chatbot), Gmail/SMTP (emails), Google (OAuth login)
- Generates PDF invoices
- Enforces rules like "only the retailer who owns a product can edit it"

### Technical explanation
- **Framework:** ASP.NET Core Web API, .NET 10, C#
- **Architecture:** Layered — Controller → Service (business logic) → EF Core DbContext → PostgreSQL
- **Pattern:** Interface-driven services (`IProduct`/`SProduct`, `IOrder`/`SOrder`, etc.) registered via Dependency Injection, `Scoped` lifetime
- **Database:** PostgreSQL, hosted on Supabase, accessed via Npgsql + EF Core (code-first, migrations)
- **Auth:** JWT Bearer tokens + ASP.NET Core `[Authorize(Roles=...)]`, passwords hashed with BCrypt, Google Sign-In supported
- **Other integrations:** Razorpay (payment gateway + HMAC signature verification), Google Gemini (AI chatbot with JSON-mode responses), MailKit/MimeKit (SMTP email for OTP + invoices), QuestPDF (invoice PDF generation)

### Request-response lifecycle (typical flow)
```
Angular (HTTP request with JWT in Authorization header)
        ↓
Program.cs middleware pipeline:
  CORS → HTTPS Redirect → Authentication (validates JWT) → Authorization (checks [Authorize]/[Roles]) → Routing to Controller
        ↓
Controller action (extracts UserId from JWT claims, calls Service)
        ↓
Service (business logic: validation, calculations, orchestration)
        ↓
DataBase (EF Core DbContext) → LINQ query → Npgsql → PostgreSQL
        ↓
Service maps entity → DTO (hides internal fields)
        ↓
Controller returns IActionResult (Ok/BadRequest/NotFound/Unauthorized) → JSON (camelCase) → Angular
```

### Main responsibilities of the backend
1. Authentication & authorization (JWT, roles: Consumer/Retailer/Admin, Google OAuth, OTP email verification)
2. Product catalog management (CRUD, categories/subcategories, image upload)
3. Shopping flow (cart, wishlist, checkout, Razorpay payment + verification)
4. Order lifecycle (place → confirm → ship → deliver/cancel, with stock adjustment and PDF invoice + email)
5. Reviews & ratings (with "verified purchase" logic, retailer replies, helpful votes)
6. Coupons (Admin-global and Retailer-scoped, with usage limits and validation)
7. Notifications (in-app, per consumer/retailer, read/unread state)
8. AI Chatbot (Gemini-powered, JSON-structured responses with product cards)
9. Admin controls (block users, manage categories, oversee all coupons)

---

# PART 2 — Project Structure

```
JsonWebToken/
├── Controllers/     → HTTP entry points (10 controllers)
├── Service/          → Business logic (13 services, e.g. SProduct, SOrder)
├── Repository/       → Interfaces only (IProduct, IOrder...) — contract for services
├── Model/            → EF Core entities = actual DB tables (20 models)
├── DTO/              → Data shapes for API requests/responses (31 DTOs)
├── DataAccess/        → DataBase.cs — the EF Core DbContext
├── Migrations/       → EF Core-generated schema history (8 migrations)
├── wwwroot/          → Static files served directly (product images, brand logo)
├── Program.cs        → App startup: DI registration, JWT config, middleware pipeline
└── appsettings.json  → Configuration (connection strings, currently exposed — see warning above)
```

**Why each folder exists, and who talks to whom:**

- **Controllers** — thin. They only: read the JWT claims (`User.FindFirst(...)`), call one service method, and translate the result into an HTTP response (`Ok()`, `BadRequest()`, etc.). They never touch the database directly (except a few, like `ConsumerController` and `RetailerController`, which inject `DataBase` directly for simple lookups — more on this below).
- **Repository** (interfaces) — defines *what* a service can do without saying *how*. This is what gets injected into controllers, not the concrete class. This is what enables Dependency Injection and mocking/testing.
- **Service** (implementations) — the "how." Contains actual business rules: stock checks, transaction handling, coupon math, notification triggering.
- **Model** — these classes map directly to Postgres tables via EF Core. They contain navigation properties (`public Users User { get; set; }`) that EF Core uses to build JOINs.
- **DTO** — never expose Models directly over the API. DTOs strip out sensitive/irrelevant fields (e.g., you'd never want to accidentally serialize `userPassword` back to the client) and shape data exactly how the frontend needs it (e.g., `ProductViewDTO` flattens category/subcategory names instead of nested objects).
- **DataAccess/DataBase.cs** — the single EF Core `DbContext`. Every `DbSet<T>` here is a table. `OnModelCreating` is where relationships, cascade rules, and unique indexes are configured in code (Fluent API) instead of just annotations.

**A pattern worth calling out in your presentation:** some controllers (`ConsumerController`, `RetailerController`, `NotificationController`, `OrderController`) inject `DataBase` *directly* alongside services, for simple lookups (like fetching categories) rather than adding a service method for everything. This is a pragmatic shortcut, not a violation of layering in a strict sense — but if asked "why doesn't this go through a service," the honest answer is: "for simple read-only queries we allowed direct DbContext access to avoid interface bloat; core business logic (orders, coupons, reviews) always goes through a service."

---

# PART 3 — Program.cs (line by line)

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("secure.json", optional: true, reloadOnChange: true);
```
Creates the app builder, then layers in `secure.json` as an *additional* config source (on top of `appsettings.json`). Because it's `optional: true`, the app still runs if the file is missing. This is the intended place for secrets (JWT key, Gemini API key, Razorpay keys, SMTP password) — see the security note at the top.

```csharp
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
});
```
- Registers MVC controllers.
- `IgnoreCycles`: prevents infinite loops when serializing (e.g., `Product → Category → Products → Category → ...`).
- `CamelCase`: converts C#'s `PascalCase` properties to `camelCase` JSON — this is the fix you made earlier for the Angular `Category` interface mismatch.
- Enum converter: serializes enums like `DiscountType.Percentage` as the string `"percentage"` instead of a raw integer.

```csharp
builder.Services.AddDbContext<DataBase>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});
```
Registers `DataBase` (your DbContext) with a **Scoped** lifetime (default for `AddDbContext`) and tells EF Core to use the Npgsql provider (PostgreSQL) with the connection string from config.

```csharp
builder.Services.AddScoped<IUser, SUsers>();
builder.Services.AddScoped<IRole, SRole>();
// ... (13 total service registrations)
builder.Services.AddHttpClient<IGemini, SGemini>();
```
This is **Dependency Injection** setup. Each line says "whenever a class asks for `IUser` in its constructor, give it an `SUsers` instance." `Scoped` = one instance per HTTP request. `IGemini`/`SGemini` uses `AddHttpClient<TInterface, TImplementation>` instead, which additionally configures a managed, pooled `HttpClient` for outbound calls to the Gemini API (avoids socket exhaustion from creating raw `new HttpClient()` per request).

```csharp
QuestPDF.Settings.License = LicenseType.Community;
```
QuestPDF (the invoice PDF library) requires an explicit license declaration even for the free Community tier.

```csharp
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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});
```
This is the **entire JWT validation setup**. On every incoming request with an `Authorization: Bearer <token>` header, ASP.NET Core will:
1. Check the token's issuer matches `Jwt:Issuer` config
2. Check the audience matches `Jwt:Audience`
3. Check the token hasn't expired (`ValidateLifetime`)
4. Check the token's signature was produced using the same secret key (`Jwt:Key`) — this proves the token wasn't tampered with, since only the server knows the key (HMAC-SHA256, symmetric).

If any check fails, the request never reaches your controller — it's auto-rejected with 401.

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy => policy
        .AllowAnyOrigin()
        .AllowAnyHeader()
        .AllowAnyMethod());
});
```
CORS lets the Angular app (running on a different origin/port during dev) call this API. `AllowAnyOrigin()` is **very permissive** — fine for a college project, but in production you'd lock this to your actual frontend domain. Worth mentioning if asked about production-readiness.

```csharp
var app = builder.Build();
app.UseStaticFiles();
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
app.Run();
```
**Middleware pipeline — order matters here:**
1. `UseStaticFiles()` — serves everything in `wwwroot/` (product images, brand logo) directly via URL.
2. Swagger UI — only in Development, gives you the interactive API docs/testing page.
3. `UseCors` — must come before auth/routing so cross-origin preflight requests succeed.
4. `UseHttpsRedirection` — forces HTTP → HTTPS.
5. `UseAuthentication` — reads the JWT, populates `HttpContext.User` with claims (this is what lets `User.FindFirst(ClaimTypes.NameIdentifier)` work later in controllers).
6. `UseAuthorization` — enforces `[Authorize]` / `[Authorize(Roles=...)]` attributes, using the claims populated above.
7. `MapControllers()` — routes the request to the matching controller action.

**Interview-ready one-liner:** "Authentication answers 'who are you', Authorization answers 'what are you allowed to do' — and Authentication always has to run first, or there's no identity to check permissions against."

---

# PART 4 — Controllers (all 10)

**Common pattern across every controller:** extract `userId` from JWT claims via `User.FindFirst(ClaimTypes.NameIdentifier)!.Value`, then delegate to a service. Never contains business logic itself — only orchestration + response codes.

## 1. AuthController — `/api/Auth/[action]`
No `[Authorize]` on most endpoints (this is the public entry point).

| Action | Method | What it does |
|---|---|---|
| Register | POST | Requires OTP already verified (`semail.IsEmailVerified`) before allowing registration. Calls `IUser.register`. |
| Login | POST | Verifies email+password via BCrypt, issues JWT. |
| GetUserName | GET | Reads `Name`/`Role` claims straight off the token — no DB call needed. |
| ChangePass | PUT `[Authorize]` | Requires valid JWT; extracts userId from claim. |
| SendOtp / VerifyOtp / ResendOtp | POST | 6-digit OTP flow via email, with a 30-second resend cooldown check against `CreatedAt`. |
| GetProductsByPrice | GET | Direct DB query (`database.Products.Where(p => p.productPrice <= maxPrice)`) — a controller bypassing the service layer for a trivial read. |
| GoogleLogin | POST | Validates Google ID token, calls `IUser.GoogleLogin`. |

**Why OTP-before-register matters:** it stops fake/typo'd emails from being used to register — verifying you actually own the inbox first.

## 2. AdminController — `/api/Admin` — `[Authorize(Roles="Admin")]` (whole controller)
- `GetConsumers` / `GetRetailers` — lists users by role, includes computed `status` field (`Blocked` if `RoleId == 4`)
- `BlockUser` — sets `RoleId = 4` (a special "blocked" pseudo-role rather than a boolean flag — a dedicated `IsBlocked` bool would be cleaner, but this works and is worth mentioning if asked to critique your own design)
- Category CRUD
- Coupon endpoints for **global, admin-created** coupons (separate from retailer-scoped ones)

## 3. RetailerController — `/api/Retailer/[action]` — `[Authorize(Roles="Retailer")]` (whole controller)
Every action first resolves `retailer = database.retailers.FirstOrDefaultAsync(r => r.UserId == userId)` — the critical "which retailer am I" lookup, since the JWT only carries `Users.UserId`, not `Retailer.RetailerId`.

- `add` / `Update` / `Delete` — product CRUD, all scoped to `retailer.RetailerId` so a retailer can never touch another retailer's product (ownership check baked into the query itself: `WHERE productId = X AND RetailerId = mine`)
- `GetRetailerCustomers` — the most complex query in the whole codebase: joins `orderItems → Order → User`, groups by customer, computes `TotalOrders`, `TotalSpent`, `CustomerType` ("Repeat" vs "New") — good to walk through live if asked to demonstrate LINQ skills
- Coupon CRUD scoped to the retailer's own coupons only

## 4. ConsumerController — `/api/Consumer/[action]`
Mixed authorization — some endpoints `[Authorize(Roles="Consumer")]`, some public (`GetAllForUsers`, `getCategory`, `getProductbyId` — anyone can browse products without logging in).

- `EditProfile` — uses `[Consumes("multipart/form-data")]` + `[FromForm]` because it accepts an image file alongside text fields
- Wishlist, Cart endpoints — all pull `userId` from JWT, no ID passed in the route (prevents a user from manipulating another user's cart by changing a URL parameter)
- `CreateOrder` / `VerifyPayment` — Razorpay integration (detailed in Part 12)

## 5. OrderController — `/api/Order/[action]`
No class-level `[Authorize]` — every action relies on `GetUserId()` reading a JWT claim that would throw for anonymous users, meaning it fails ungracefully rather than returning a clean 401. **Good to mention proactively as a known gap if asked about security review** — shows awareness.

- `PlaceOrder` — calls service, then **in the controller** generates the invoice PDF and emails it. Deliberate layering: order logic (stock check, transaction) lives in the service, but "send this PDF as email" is treated as a delivery/notification concern kept at controller level.
- `UpdateOrderStatus` — maps custom string returns (`"Forbidden"`, `"Order not found"`) to real HTTP status codes (`Forbid()`, `NotFound()`) — the service returns a tuple `(success, message)` and the controller translates `message` into the right response code.

## 6. ReviewController — `/api/Review/[action]`
- `GetOptionalUserId()` — allows anonymous users to view reviews (`GetByProduct`) while still passing along the current user's ID *if logged in*, so the response can include `MarkedHelpfulByMe`.
- Verified purchase logic lives in the service, not here.

## 7. CouponController — `/api/Coupon`
Public `GetActiveCoupons`, but `[Authorize]` on `ApplyCoupon` — you must be logged in to apply a coupon, but anyone can see what's available (marketing display).

## 8. NotificationController — `/api/Notification` — `[Authorize]` (whole controller)
This is the controller with the architectural fix from your history: `GetUserIdFromToken()` reads `ClaimTypes.NameIdentifier` instead of accepting a route parameter like `/notifications/{userId}` — trusting a client-supplied ID would let anyone read anyone else's notifications by just changing the URL. Every endpoint first maps `userId → consumer/retailer` before querying.

## 9. ChatbotController — `/api/Chatbot/[action]` — `[Authorize]`
Single endpoint (`Ask`), thin wrapper — all Gemini prompt-engineering logic lives in `SChatbot`.

## 10. RoleController — `/api/Role/[action]`
Note the commented-out `[Authorize(Roles = "Admin")]` at the top — currently **anyone** can call `addRole`/`deleteRole`/`deleteRoleUser`, including the destructive "delete role + all its users" endpoint. **A real gap** worth acknowledging proactively if asked a security question.

---

# PART 5 — Services (business logic layer)

## SUsers (IUser) — Auth core
- `register` — checks email uniqueness, hashes password with BCrypt, looks up `Role` by name, creates `Users` row, then **conditionally** creates a `Consumer` or `Retailer` profile row depending on role (retailer requires GST/PAN/shop details or throws).
- `login` — finds user by email, verifies password with `BCrypt.Verify` (wrapped in try/catch for `SaltParseException` — protects against Google-only accounts that have a random unusable hash, so they don't crash the app, just fail login cleanly).
- `IssueToken` (private) — builds the JWT: 5 claims (NameIdentifier, Name, Email, Sub, Role), signed HMAC-SHA256, 1-hour expiry.
- `GoogleLogin` — validates the Google ID token server-side via `GoogleJsonWebSignature.ValidateAsync`, auto-registers a Consumer account on first login with an unusable random BCrypt hash as a password placeholder (so pure-password login can never succeed for that account, but registration/login flow doesn't break).
- `changePassword` — verifies old password, checks new+confirm match, re-hashes.
- Called by: `AuthController` (register/login/changePassword/googleLogin).

## SProduct (IProduct) — Catalog
- `add` — looks up Category+SubCategory by name (not by ID — a minor fragility: renaming a category breaks this), saves uploaded images to `wwwroot/imagepath/` with GUID-prefixed filenames (avoids name collisions), creates `ProductImage` rows.
- `delete` — cascades manually: removes CartItems referencing the product, OrderItems referencing it, ProductImage rows, then deletes the physical image files from disk, then the Product itself. (Manual cascade because DB-level cascade was deliberately turned off for CartItem/OrderItem → Product, see Part 9.)
- `update` — same image-upload pattern but into `wwwroot/images/` (inconsistent folder from `add`'s `wwwroot/imagepath/` — worth noting as a small bug/inconsistency if asked).
- `getbyId` / `getAll` / `getByRetailerId` — map `Product` entity → `ProductViewDTO`, flattening `Category.CategoryName`, `SubCategory.SubCategoryName`, `Retailer.ShopName` and `imagepath` (list of URLs) into a client-friendly shape.
- Called by: `RetailerController`, `ConsumerController`, `SChatbot`.

## SCart (ICart) — Cart
- `AddToCart` — finds or creates the user's single `Cart`, then finds or creates a `CartItem` for the product (increments quantity if it already exists rather than duplicating rows).
- `get` — deep include chain: `Cart → CartItems → Product → imagepath`, mapped to `CartItemDTO`.
- `updateQuantity` — deletes the row entirely if quantity ≤ 0 (treats "set to 0" as "remove").
- Called by: `ConsumerController`, `SChatbot` (for the AI to describe your cart), `SOrder` (reads cart at checkout).

## SOrder (IOrder) — Order lifecycle (most complex service)
- `PlaceOrderAsync` — **the most important method to understand for your demo.** Steps:
  1. Loads selected cart items + validates address exists
  2. Validates stock ≥ requested quantity for every item (fails fast with a specific product name if not)
  3. Opens an **EF Core transaction** (`database.Database.BeginTransactionAsync()`)
  4. Creates `Orders` row, then one `OrderItem` per cart item (snapshotting price + retailer at time of order — important, since product price could change later but the order should remember what was actually paid)
  5. Decrements `Product.stock`; if stock ≤ 5, fires a "Low Stock" notification to that retailer
  6. Removes the now-ordered items from the cart
  7. Commits transaction
  8. Fires "Order Placed" notification to consumer + "New Order Received" notification to every distinct retailer involved
  9. On any exception, rolls back the transaction — **this is the textbook use case for DB transactions**: either the whole order succeeds atomically, or none of it does (you never want stock decremented but the order row missing, or vice versa).
- `UpdateOrderStatusAsync` — validates the calling retailer actually owns items in this order (`Forbidden` if not), blocks updates on already-`Delivered`/`Cancelled` orders, whitelists allowed status strings, fires a status-specific consumer notification via a `switch` expression.
- `CancelOrderAsync` — blocks cancellation once `Shipped`/`Out for Delivery`/`Delivered`, restores stock, notifies consumer + all involved retailers.
- `GenerateInvoicePdf` — builds a PDF with QuestPDF's fluent/declarative API (header with logo, shipping address, itemized table, GST 18% calculation, footer).
- `SetDeliveryDetailsAsync` — retailer-only, verifies ownership, sets delivery person name/phone, notifies consumer.
- Called by: `OrderController`.

## SCoupon (ICoupon) — Coupons (Admin + Retailer scoped)
- Two creation paths: `AdminCreateAsync` (any scope, including retailer-assigned-by-admin) and `RetailerCreateAsync` (retailer can only create `CouponScope.Retailer` coupons tied to themselves).
- `ValidateCreateAsync` — shared validation: unique code, expiry after start, percentage ≤ 100%, positive discount value, non-negative minimum order.
- `ApplyCouponAsync` — the core discount-calculation logic:
  - For `Retailer`-scoped coupons, only counts cart items belonging to that retailer toward the minimum-order-amount check and the discount base (`eligibleAmount`) — so a retailer coupon can't discount another retailer's items in a mixed cart.
  - Applies flat or percentage discount, caps at `MaximumDiscount` if set, never lets discount exceed the eligible amount itself.
- Called by: `AdminController`, `RetailerController`, `CouponController`.

## SReview (IReview) — Reviews
- `AddReview` — blocks duplicate reviews per user/product, checks `IsVerifiedPurchase` by looking for a `Delivered` OrderItem matching that user+product, notifies the retailer.
- `GetRatingSummary` — computes average rating, recommend-percentage (≥4 stars), and a 5-star-to-1-star breakdown with percentages — good to demo as an aggregation/LINQ example.
- `ToggleHelpful` — a toggle pattern: if a vote exists, remove it; if not, add it. Single method handles both "mark helpful" and "unmark."
- `AddReply` — retailer can only reply once per review, and only to reviews on their own products.
- Called by: `ReviewController`.

## SNotification (INotification) — Notifications
- Two "audiences": Consumer and Retailer, distinguished by nullable `ConsumerId`/`RetailerId` on the `Notification` model.
- `MarkAllReadByUserIdAsync` uses `ExecuteUpdateAsync` — a newer EF Core 7+ feature that runs a bulk `UPDATE` directly in SQL without loading rows into memory first (much faster than loading N rows, setting a property, then SaveChanges).
- Called by: `SOrder`, `SReview` (to fire notifications), `NotificationController` (to fetch/mark-read).

## SGemini (IGemini) — Raw Gemini API wrapper
- Two methods: `AskAsync` (plain text response) and `AskJsonAsync` (sets `generationConfig.responseMimeType = "application/json"` — tells Gemini to force valid JSON output, which is what makes `SChatbot`'s structured parsing reliable).
- Manually builds the HTTP request/response parsing via `JsonDocument` rather than a typed Gemini SDK — a valid but "low-level" approach worth acknowledging.

## SChatbot (IChatbot) — AI shopping assistant
- Builds one large prompt string containing: the user's message, their cart, wishlist, last 5 orders, and up to 100 available products — then asks Gemini to reply **only in JSON** matching a specific shape (`reply`, `recommendedProducts`, `orderReferences`).
- `ResolveProductCards` — cross-references Gemini's suggested product *names* back to actual product IDs/prices/images from cart, wishlist, or the catalog — because Gemini only returns text, not real DB-backed IDs, so this step "grounds" the AI's answer back into real data (prevents the AI hallucinating a product that doesn't exist from being shown as a clickable card).
- This is genuinely one of the more advanced things in your project — worth spending real presentation time on.

## SAddress, SAdmin, SProfile, SWishlist, SRole, SEmail
Simpler CRUD-style services — straightforward EF Core operations, one default-address-per-user invariant enforced in `SAddress.AddAddress` (unsets other defaults when a new default is added).

---

# PART 6 — Models (Entities) — all 20

Every model maps 1:1 to a Postgres table (via the matching `DbSet<T>` in `DataBase.cs`).

| Model | Key annotations | Key relationships |
|---|---|---|
| `Users` | `[Key] UserId`, `[Required]`, `[EmailAddress]` | 1-to-many → `Role`; 1-to-many → `Product`, `WishlistItem` |
| `Role` | `[Key] RoleId` | 1-to-many → `Users` (`user` collection) |
| `Consumer` | — | 1-to-1 → `Users` (`HasOne().WithOne()` in Fluent API) |
| `Retailer` | `[Key]`, `[Required][StringLength(15)]` on GST | 1-to-many → `Product`; 1-to-1-ish → `Users` |
| `Category` / `SubCategory` | `[ForeignKey("Category")]` on SubCategory | Category 1-to-many SubCategory, 1-to-many Product |
| `Product` | `[Key] productId` | many-to-1 Category/SubCategory/Retailer; 1-to-many `ProductImage`, `WishlistItem` |
| `ProductImage` | — | many-to-1 `Product` (cascade delete — only cascade relationship in the whole schema) |
| `Cart` / `CartItem` | `[Key]` | Cart 1-to-many CartItem; CartItem many-to-1 Product (**NoAction**, not cascade) |
| `Orders` / `OrderItem` | `[Key]` | Orders 1-to-many OrderItem; OrderItem many-to-1 Product (**NoAction**) |
| `UserAddress` | `[Key] AddressId` | many-to-1 Users (implicit, no FK constraint configured in Fluent API — relies on convention) |
| `WishlistItem` | — | many-to-1 Users (NoAction) + many-to-1 Product (Cascade) |
| `Review` / `ReviewHelpful` / `ReviewReply` | `[Range(1,5)]` on Rating | Review 1-to-many HelpfulVotes, 1-to-1(ish) Reply; ReviewReply many-to-1 Retailer |
| `Notification` | `[ForeignKey("ConsumerId")]`, `[ForeignKey("RetailerId")]` | Nullable FKs to both Consumer and Retailer — only one is populated per row depending on audience |
| `Coupon` | `[StringLength(30)]` on code, `[ForeignKey("RetailerId")]` | Nullable `RetailerId` — null means "Global" scope |
| `EmailOTP` | `[Key] Id` | No FK — just a flat table keyed by email string |

**On annotations, explained:**
- `[Key]` — marks the primary key (EF Core also auto-detects `Id`/`{ClassName}Id` by convention, so this is often just being explicit)
- `[Required]` — generates a `NOT NULL` column + adds model validation
- `[ForeignKey("X")]` — explicitly names which property is the foreign key when EF Core's naming convention wouldn't guess correctly
- `[Range(1,5)]` — model validation only (doesn't touch the DB schema) — enforced when `ModelState.IsValid` is checked
- `[StringLength(n)]` — sets a `varchar(n)` limit at the DB level

**Cascade delete design (intentional, not accidental):** Notice `ProductImage` is the *only* cascade-delete relationship. Everything referencing `Product` from `CartItem`/`OrderItem`/`WishlistItem` uses `NoAction` or is handled manually in code (see `SProduct.delete`). This is because you **don't want deleting a product to silently wipe historical order records** — an order should stay intact even if the product is later removed, which is why `SProduct.delete()` manually cleans up cart/order items in application code rather than relying on the database to cascade automatically.

---

# PART 7 — DTOs

**Why DTOs exist (the interview answer):** Entities (Models) represent the database shape and often carry sensitive fields (`userPassword`), circular navigation properties (`Product.Category.Products...`), or more data than a specific endpoint needs. A DTO is a plain data-shape class tailored to exactly what one request or response needs — nothing more.

**Concrete example from your code:** `Users` entity has `userPassword`. If a controller ever accidentally did `return Ok(user)` instead of mapping to a DTO first, the password hash would leak into the JSON response. Every controller in this project returns DTOs or anonymous objects, never raw entities with sensitive fields — that discipline is what DTOs buy you.

**Notable DTO patterns in your project:**
- `ProductViewDTO` — flattens 3 joined tables (`Category.CategoryName`, `SubCategory.SubCategoryName`, `Retailer.ShopName`) into flat strings, so Angular never has to do nested property drilling.
- `ProductDTO` (input) vs `ProductViewDTO` (output) — different shapes for the same entity depending on direction (input takes `List<IFormFile>` for image upload; output returns `List<string>` of image URLs).
- `CouponCreateDTO` vs `CouponUpdateDTO` vs `CouponResponseDTO` — three different shapes for the same entity across create/update/read, each with only the fields relevant to that operation (e.g., you can't change `CouponCode` or `CouponScope` on update — those are excluded from `CouponUpdateDTO` on purpose, an immutability decision).
- `RegisterDTO`/`Register` — accepts optional retailer-only fields (`shopName`, `gstNumber`, etc.) even though most registrations are Consumer — validated conditionally in the service, not via DTO-level annotations.

---

# PART 8 — Database (Postgres via Supabase)

**Provider:** Npgsql + `Npgsql.EntityFrameworkCore.PostgreSQL` — note your `.csproj` **also** references `Microsoft.EntityFrameworkCore.SqlServer`, which is unused dead weight (leftover from before you switched to Postgres, most likely) — fine to mention as cleanup you're aware of.

**Migrations timeline (tells the story of your build):**
1. `database` (Jun 9) — initial schema
2. `SUBCATEGORY` (Jun 9) — added subcategories
3. `Notification` (Jun 28) — notification system
4. `review` (Jul 5) — review tables (partial)
5. `addreviewTables` (Jul 6) — helpful votes + replies
6. `deliverydetails` (Jul 7) — delivery person name/phone on Orders
7. `coupon` (Jul 9) — coupon system
8. `newfieldinUserTable` (Jul 9) — most recent

**Key relationships (from `OnModelCreating` Fluent API):**
- `Users ↔ Role`: many-to-one, cascade delete (deleting a Role deletes its Users — matches `SRole.deleteRoleUser`)
- `WishlistItem ↔ Users`: NoAction (deleting a user doesn't auto-delete via DB; would need manual cleanup — a potential orphan-data risk worth flagging)
- `WishlistItem ↔ Product`: Cascade
- `Consumer ↔ Users`: one-to-one via `HasForeignKey<Consumer>(c => c.UserId)`
- `Product ↔ Retailer`: many-to-one, Cascade (deleting a retailer deletes their products)
- `CartItem`/`OrderItem` ↔ `Product`: explicitly **NoAction** (see Part 6 rationale)
- `Coupon.CouponCode`: unique index (`HasIndex().IsUnique()`) — enforced at the DB level, in addition to the app-level uniqueness check in `SCoupon.ValidateCreateAsync` (defense in depth: even if application logic has a bug/race condition, the DB itself refuses a duplicate)

---

# PART 9 — Entity Framework Core Concepts Used

| Concept | What it means | Where used |
|---|---|---|
| `DbContext` | Session with the database; tracks entities, translates LINQ → SQL | `DataBase.cs` |
| `DbSet<T>` | Represents one table | Every property in `DataBase.cs` |
| LINQ (`Where`, `Select`, `OrderBy`, `GroupBy`) | Query the DB using C# syntax instead of raw SQL | Everywhere — e.g. `RetailerController.GetRetailerCustomers` |
| `Include` / `ThenInclude` | Eager-loads related entities (avoids N+1 query problem, prevents `null` navigation properties) | `SCart.get` (`Cart → CartItems → Product → imagepath`) |
| `FirstOrDefaultAsync` | Returns first match or `null` (vs `.First()` which throws) | Used defensively everywhere ownership/existence checks are needed |
| `AnyAsync` | Existence check without loading the row | `SUsers.register` (email uniqueness), `SReview.AddReview` (duplicate check) |
| `AddAsync` / `Add` | Marks entity for insertion (not yet in DB until `SaveChanges`) | All create operations |
| `SaveChangesAsync` | Flushes all tracked changes to the DB in one round-trip | Called after every mutation |
| `ExecuteUpdateAsync` | Bulk SQL UPDATE, bypasses change tracking, faster for mass updates | `SNotification.MarkAllReadByUserIdAsync` |
| Transactions (`BeginTransactionAsync`/`CommitAsync`/`RollbackAsync`) | Groups multiple writes into one all-or-nothing unit | `SOrder.PlaceOrderAsync` |
| Migrations (`Add-Migration`, `Update-Database`) | Version-controlled schema changes generated from model diffs | `Migrations/` folder, 8 migrations |
| Fluent API (`OnModelCreating`) | Configures relationships/constraints in code instead of attributes, for things attributes can't express (e.g., `DeleteBehavior`, composite uniqueness) | `DataBase.cs` |
| Async/await throughout | Non-blocking I/O — frees the thread while waiting on the DB, so the server can handle other requests concurrently | Virtually every service method |

**Interview-ready explanation of `Include`:** "By default, EF Core is lazy about relationships — if you query a `Product` without `Include(p => p.Category)`, `product.Category` will be `null`, not an error. `Include` tells EF Core to generate a SQL `JOIN` and populate that navigation property. Forgetting it is one of the most common EF Core bugs — you get a null reference exception later when you try to read `product.Category.CategoryName`."

---

# PART 10 — Authentication: Complete JWT Flow

### Registration
1. User calls `SendOtp` → random 6-digit code saved in `EmailOTP` table (5-min expiry) → emailed via MailKit/SMTP.
2. User calls `VerifyOtp` → matches email+otp+not-yet-verified → marks `IsVerified = true`.
3. User calls `Register` → `AuthController` checks `IsEmailVerified(email)` first — **rejects registration if OTP was never verified**, closing the loop.
4. `SUsers.register`: checks email doesn't already exist → hashes password with **BCrypt** (`BCrypt.Net.BCrypt.HashPassword`) → looks up the `Role` row by name → creates `Users` row → conditionally creates `Consumer` or `Retailer` profile row.

### Login
1. `SUsers.login`: finds user by email → `BCrypt.Net.BCrypt.Verify(plainPassword, storedHash)` — this re-hashes the input with the same salt embedded in the stored hash and compares, so the plaintext password is never stored or compared directly.
2. If valid, calls private `IssueToken(user)`.

### Token creation (`IssueToken`)
```csharp
var claims = new List<Claim> {
    new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
    new Claim(ClaimTypes.Name, user.userName),
    new Claim(ClaimTypes.Email, user.userEmail),
    new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
    new Claim(ClaimTypes.Role, user.Role.Name)
};
var token = new JwtSecurityToken(issuer, audience, claims, expires: DateTime.Now.AddHours(1), signingCredentials);
```
- **Claims** are key-value facts embedded in the token payload. `ClaimTypes.NameIdentifier` is the one nearly every controller reads to get "who is making this request."
- `ClaimTypes.Role` is what `[Authorize(Roles="Retailer")]` checks against.
- Signed with `HmacSha256` using a **symmetric** key (`Jwt:Key`) — the same secret both signs and verifies, meaning that secret must **never** be exposed (currently it likely lives in `secure.json`/`appsettings.json` — same category of risk as the DB password flagged above).
- 1-hour expiry — after that, the token is rejected regardless of validity, forcing re-login (no refresh-token mechanism currently implemented — worth mentioning as a future improvement if asked).

### Token validation (happens automatically, every request)
Configured once in `Program.cs` (`AddJwtBearer` — see Part 3). On every request with an `Authorization: Bearer <token>` header, ASP.NET Core's JWT middleware verifies issuer, audience, expiry, and signature **before** your controller code ever runs. If it fails, the request is auto-rejected with 401 and your action method body never executes.

### Authorization (role-based)
- `[Authorize]` — just requires *any* valid token.
- `[Authorize(Roles = "Retailer")]` — requires a valid token **and** a `Role` claim matching "Retailer".
- Applied at controller level (whole class) in `AdminController`, `RetailerController`; applied at action level selectively in `ConsumerController`, `ReviewController`.

### Google OAuth flow (`GoogleLogin`)
1. Frontend gets a Google ID token via Google Sign-In JS SDK.
2. Backend validates it server-side: `GoogleJsonWebSignature.ValidateAsync(idToken, settings)` — checks the token was actually issued by Google for *your* app's Client ID (`Google:ClientId`), preventing someone from forging a token for a different app and reusing it here.
3. If no `Users` row exists for that email, auto-creates one with `RoleId` = Consumer and a **random unusable BCrypt hash** as the password — a deliberate placeholder so that:
   - `BCrypt.Verify` on a normal login attempt will just return `false` (safe failure) rather than crash
   - The account can genuinely never be logged into via password, only via Google — matching the intent of "Google-only account"
4. Issues a normal JWT — from this point on, a Google-login user is indistinguishable from a password user to the rest of the app.

### Password hashing (BCrypt) — why not plain SHA256?
BCrypt is a **slow, salted** hashing algorithm designed specifically for passwords. "Slow" is a feature: it makes brute-force attacks computationally expensive even if a hacker steals your entire `Users` table. It also auto-generates and embeds a unique salt per password, so two users with the same password get completely different hashes — defeating rainbow-table attacks. Fast general-purpose hashes like SHA256 are the *wrong* tool for passwords precisely because they're fast (attackers can try billions of guesses/second).

---

# PART 11 — Dependency Injection

**What it is:** Instead of a class creating its own dependencies (`new SProduct()`), it declares what it needs in its constructor, and the framework "injects" the right instance automatically.

**Why:** Loose coupling. `RetailerController` depends on `IProduct`, not `SProduct` directly — so the concrete implementation can be swapped (e.g., for a mock in unit tests) without touching the controller.

**Where in your project:** Every service is registered in `Program.cs`:
```csharp
builder.Services.AddScoped<IProduct, SProduct>();
```
Then simply requested via constructor injection:
```csharp
public RetailerController(IProduct iproduct, DataBase database, IProfile iprofile, ICoupon coupon)
{
    this.iproduct = iproduct;
    // ...
}
```
The DI container resolves this automatically at request time — you never call `new RetailerController(...)` yourself.

**Service lifetimes used:**
- **Scoped** (used for everything: `AddScoped<IUser, SUsers>`, and `AddDbContext` defaults to Scoped too) — one instance created per HTTP request, shared by everything within that request, then disposed. This matters because `DataBase` (the DbContext) is Scoped — if it were Singleton, all requests would share one DbContext instance and corrupt each other's change-tracking; if it were Transient, you couldn't share tracked entities across two services within the same request.
- **`AddHttpClient<IGemini, SGemini>`** — a specialized registration that internally manages HttpClient pooling to avoid socket exhaustion; the resulting `SGemini` behaves as Scoped-ish but the underlying HttpClient is pooled/reused by `IHttpClientFactory`.
- No `Singleton` or plain `Transient` registrations appear in this project — worth knowing the difference if asked: Singleton = one instance for the entire app lifetime (dangerous for stateful/DB-touching services); Transient = a new instance every single time it's requested, even multiple times within one request.

---

# PART 12 — API Flow: Major Features

### Login
```
Angular POST /api/Auth/Login {UserEmail, UserPassword}
→ AuthController.Login → IUser.login (SUsers)
→ EF Core: Users.Include(Role).FirstOrDefault(email match)
→ BCrypt.Verify(password, hash)
→ IssueToken() → JWT string
→ Ok({ token })
→ Angular stores token in localStorage, attaches to future requests via HTTP interceptor
```

### Place Order (the most important flow to know cold)
```
Angular POST /api/Order/PlaceOrder { SelectedProductIds, AddressId }
→ OrderController.PlaceOrder → GetUserId() from JWT claim
→ SOrder.PlaceOrderAsync(userId, request)
    → Load matching CartItems (Include Product, Cart)
    → Validate address exists
    → Validate stock for every item
    → BEGIN TRANSACTION
        → Create Orders row
        → For each item: create OrderItem (snapshot price/retailer), decrement stock, check low-stock → notify retailer
        → Remove ordered CartItems
    → COMMIT
    → Notify consumer "Order Placed"
    → Notify each distinct retailer "New Order Received"
→ back in OrderController: GenerateInvoicePdf(orderId) via QuestPDF
→ SendInvoiceEmail(user.email, pdfBytes) via SEmail/MailKit
→ Ok({ message, orderId })
```

### Add Product (Retailer)
```
Angular POST /api/Retailer/add (multipart/form-data: ProductDTO + images)
→ RetailerController.add → resolve retailer from userId claim
→ IProduct.add(prod, retailer.RetailerId)
    → Look up Category + SubCategory by name
    → Save each uploaded image to wwwroot/imagepath/{guid}_{filename}
    → Create Product row + ProductImage rows
    → SaveChangesAsync
→ Ok()
```

### Razorpay Payment (two-step: create then verify)
```
Step 1 — Create order:
Angular POST /api/Consumer/CreateOrder { Amount }
→ ConsumerController.CreateOrder → RazorpayClient.Order.Create({amount*100, currency:"INR", ...})
→ returns { orderId, amount, currency, key } to Angular
→ Angular opens Razorpay Checkout widget with this orderId

Step 2 — Verify payment (after user pays):
Angular POST /api/Consumer/VerifyPayment { RazorpayOrderId, RazorpayPaymentId, RazorpaySignature }
→ ConsumerController.VerifyPayment
    → Recompute HMAC-SHA256 signature locally from OrderId|PaymentId using Razorpay secret
    → Compare to RazorpaySignature sent by Razorpay
    → Match = genuine payment confirmed by Razorpay, not spoofed by the client
→ Ok({ success: true })
```
**Why signature verification matters (good interview question):** never trust the frontend to say "payment succeeded" — a malicious user could call `VerifyPayment` directly with fake data and skip paying entirely. The HMAC signature can only be produced by someone who knows the secret key (Razorpay + your server), so recomputing and matching it proves the payment confirmation genuinely came from Razorpay.

---

# PART 16 — API Endpoint Reference (abbreviated — key endpoints)

| Endpoint | Method | Purpose | Auth |
|---|---|---|---|
| `/api/Auth/Register` | POST | Register (needs verified OTP) | None |
| `/api/Auth/Login` | POST | Login, issue JWT | None |
| `/api/Auth/GoogleLogin` | POST | Google OAuth login | None |
| `/api/Auth/SendOtp` / `VerifyOtp` / `ResendOtp` | POST | Email OTP flow | None |
| `/api/Auth/ChangePass` | PUT | Change password | JWT |
| `/api/Consumer/GetAllForUsers` | GET | Browse all products | None |
| `/api/Consumer/getProductbyId/{id}` | GET | Product detail | None |
| `/api/Consumer/AddToCart` | POST | Add to cart | Consumer |
| `/api/Consumer/GetCart` | GET | View cart | Consumer |
| `/api/Consumer/CreateOrder` | POST | Razorpay order creation | None* |
| `/api/Consumer/VerifyPayment` | POST | Razorpay signature verify | None* |
| `/api/Order/PlaceOrder` | POST | Place order + invoice + email | JWT (implicit) |
| `/api/Order/GetUserOrders` | GET | Consumer's order history | JWT (implicit) |
| `/api/Order/GetRetailerOrders` | GET | Retailer's incoming orders | JWT (implicit) |
| `/api/Order/UpdateOrderStatus` | PUT | Retailer updates status | JWT (implicit) |
| `/api/Order/CancelOrder` | PUT | Cancel + restock | JWT (implicit) |
| `/api/Retailer/add` | POST | Add product | Retailer |
| `/api/Retailer/Update/{id}` | PUT | Edit product | Retailer |
| `/api/Retailer/Delete/{id}` | DELETE | Delete product | Retailer |
| `/api/Retailer/GetRetailerCustomers` | GET | Customer analytics | Retailer |
| `/api/Retailer/CreateCoupon` | POST | Create retailer coupon | Retailer |
| `/api/Admin/consumers` / `/retailers` | GET | List users | Admin |
| `/api/Admin/block/{id}` | PUT | Block a user | Admin |
| `/api/Admin/coupons` | POST/GET/PUT/DELETE | Global coupon management | Admin |
| `/api/Coupon` | GET | List active coupons (public display) | None |
| `/api/Coupon/apply` | POST | Apply coupon, get discount | JWT |
| `/api/Review/Add` | POST | Submit review | Consumer |
| `/api/Review/GetByProduct/{id}` | GET | View reviews | None (optional JWT) |
| `/api/Review/Reply` | POST | Retailer replies to review | Retailer |
| `/api/Notification/consumer/my` | GET | My notifications | JWT |
| `/api/Notification/{id}/read` | PUT | Mark one read | JWT |
| `/api/Chatbot/Ask` | POST | AI chatbot query | JWT |

*Marked "None" for Razorpay endpoints — no `[Authorize]` attribute present on `CreateOrder`/`VerifyPayment` in `ConsumerController`; may be worth flagging as a gap since payment endpoints are usually locked down.

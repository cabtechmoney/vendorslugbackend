package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

// Product represents the structure of a thrift item in the database
type Product struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       int       `json:"price"`
	ImageURL    string    `json:"image_url"`
	Tag         string    `json:"tag"`
	Category    string    `json:"category"`
	IsAvailable bool      `json:"is_available"`
	VendorSlug  string    `json:"vendor_slug"`
	CreatedAt   time.Time `json:"created_at"`
}

// Vendor represents a vendor (used for validation)
type Vendor struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Slug     string `json:"slug"`
	IsActive bool   `json:"is_active"`
}

var db *sql.DB
var jwtSecret []byte

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️ No .env file found, using system variables.")
	}

	jwtSecret = []byte(os.Getenv("SECRET_KEY"))
	if len(jwtSecret) == 0 {
		log.Fatal("❌ SECRET_KEY environment variable is missing!")
	}

	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		log.Fatal("❌ DATABASE_URL environment variable is missing!")
	}

	if strings.HasPrefix(connStr, "postgresql+asyncpg://") {
		connStr = strings.Replace(connStr, "postgresql+asyncpg://", "postgresql://", 1)
	}

	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		log.Fatal("❌ Database connection failed: ", err)
	}
	fmt.Println("✅ Go Product Service connected to PostgreSQL successfully!")

	app := fiber.New()

	corsOrigins := os.Getenv("CORS_ORIGINS")
	if corsOrigins == "" {
		corsOrigins = "http://localhost:3000,http://127.0.0.1:3000,https://your-project.vercel.app"
	}
	origins := strings.Split(corsOrigins, ",")
	for index, origin := range origins {
		origin = strings.TrimSpace(origin)
		if origin != "*" && !strings.HasPrefix(origin, "http://") && !strings.HasPrefix(origin, "https://") {
			origin = "https://" + origin
		}
		origins[index] = origin
	}
	corsOrigins = strings.Join(origins, ",")

	app.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	app.Get("/api/products", getProducts)
	app.Get("/api/products/:id", getProductByID)
	app.Get("/api/products/:vendor", getProductsByVendor)
	app.Post("/api/products", authenticate, createProduct)
	app.Put("/api/products/:id", authenticate, updateProduct)
	app.Delete("/api/products/:id", authenticate, deleteProduct)

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "product-service"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = os.Getenv("PRODUCT_SERVICE_PORT")
	}
	if port == "" {
		port = "8081"
	}
	fmt.Printf("🚀 Go Product Service running on http://localhost:%s\n", port)
	log.Fatal(app.Listen(":" + port))
}

func authenticate(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Authorization header is required"})
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid authorization format. Use: Bearer <token>"})
	}

	tokenString := parts[1]

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid or expired token: " + err.Error()})
	}

	if !token.Valid {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token claims"})
	}

	email, ok := claims["sub"].(string)
	if !ok || email == "" || claims["type"] != "admin_session" {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token claims"})
	}
	c.Locals("user_email", email)
	c.Locals("user_type", claims["type"])
	return c.Next()
}

func getProducts(c *fiber.Ctx) error {
	rows, err := db.Query(`
        SELECT id, name, description, price, image_url, tag, category, is_available, vendor_slug, created_at
        FROM products
        WHERE is_available = true
        ORDER BY created_at DESC
    `)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch products: " + err.Error()})
	}
	defer rows.Close()

	products, err := scanProducts(rows)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to scan products: " + err.Error()})
	}

	return c.JSON(products)
}

func getProductsByVendor(c *fiber.Ctx) error {
	vendorSlug := c.Params("vendor")

	var exists bool
	err := db.QueryRow(`
        SELECT EXISTS(SELECT 1 FROM vendors WHERE slug = $1 AND is_active = true)
    `, vendorSlug).Scan(&exists)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to verify vendor: " + err.Error()})
	}
	if !exists {
		return c.Status(404).JSON(fiber.Map{"error": "Vendor not found or inactive"})
	}

	rows, err := db.Query(`
        SELECT id, name, description, price, image_url, tag, category, is_available, vendor_slug, created_at
        FROM products
        WHERE vendor_slug = $1 AND is_available = true
        ORDER BY created_at DESC
    `, vendorSlug)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch products: " + err.Error()})
	}
	defer rows.Close()

	products, err := scanProducts(rows)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to scan products: " + err.Error()})
	}

	return c.JSON(products)
}

func getProductByID(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid product ID"})
	}

	var product Product
	err = db.QueryRow(`
		SELECT p.id, p.name, COALESCE(p.description, ''), p.price,
		       COALESCE(p.image_url, ''), COALESCE(p.tag, ''),
		       COALESCE(p.category, ''), COALESCE(p.is_available, true),
		       COALESCE(p.vendor_slug, v.slug), COALESCE(p.created_at, now())
		FROM products p
		JOIN vendors v ON v.slug = p.vendor_slug OR v.id = p.vendor_id
		WHERE p.id = $1 AND p.is_available = true AND v.is_active = true
	`, id).Scan(
		&product.ID,
		&product.Name,
		&product.Description,
		&product.Price,
		&product.ImageURL,
		&product.Tag,
		&product.Category,
		&product.IsAvailable,
		&product.VendorSlug,
		&product.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "Product not found"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch product: " + err.Error()})
	}

	return c.JSON(product)
}

func createProduct(c *fiber.Ctx) error {
	var p Product
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body: " + err.Error()})
	}

	if p.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Product name is required"})
	}
	if p.Price < 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Product price cannot be negative"})
	}
	if p.VendorSlug == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Vendor slug is required"})
	}

	merchantEmail := c.Locals("user_email").(string)
	var vendorExists bool
	err := db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM vendors v
			JOIN merchants m ON m.id = v.merchant_id
			WHERE v.slug = $1 AND v.is_active = true AND m.email = $2 AND m.is_active = true
		)
	`, p.VendorSlug, merchantEmail).Scan(&vendorExists)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to verify vendor: " + err.Error()})
	}
	if !vendorExists {
		return c.Status(404).JSON(fiber.Map{"error": "Vendor not found or inactive"})
	}

	query := `
        INSERT INTO products (name, description, price, image_url, tag, category, is_available, vendor_slug, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, created_at
    `

	err = db.QueryRow(
		query,
		p.Name,
		p.Description,
		p.Price,
		p.ImageURL,
		p.Tag,
		p.Category,
		true,
		p.VendorSlug,
		time.Now(),
	).Scan(&p.ID, &p.CreatedAt)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create product: " + err.Error()})
	}

	p.IsAvailable = true
	return c.Status(201).JSON(p)
}

func updateProduct(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid product ID"})
	}

	var p Product
	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body: " + err.Error()})
	}

	query := "UPDATE products SET "
	args := []interface{}{}
	argIdx := 1

	if p.Name != "" {
		query += fmt.Sprintf("name = $%d, ", argIdx)
		args = append(args, p.Name)
		argIdx++
	}
	if p.Description != "" {
		query += fmt.Sprintf("description = $%d, ", argIdx)
		args = append(args, p.Description)
		argIdx++
	}
	if p.Price >= 0 {
		query += fmt.Sprintf("price = $%d, ", argIdx)
		args = append(args, p.Price)
		argIdx++
	}
	if p.ImageURL != "" {
		query += fmt.Sprintf("image_url = $%d, ", argIdx)
		args = append(args, p.ImageURL)
		argIdx++
	}
	if p.Tag != "" {
		query += fmt.Sprintf("tag = $%d, ", argIdx)
		args = append(args, p.Tag)
		argIdx++
	}
	if p.Category != "" {
		query += fmt.Sprintf("category = $%d, ", argIdx)
		args = append(args, p.Category)
		argIdx++
	}
	if !p.IsAvailable {
		query += fmt.Sprintf("is_available = $%d, ", argIdx)
		args = append(args, p.IsAvailable)
		argIdx++
	}

	if len(args) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "No valid fields provided for update"})
	}

	merchantEmail := c.Locals("user_email").(string)
	query = query[:len(query)-2]
	query += fmt.Sprintf(`
		WHERE products.id = $%d
		AND EXISTS (
			SELECT 1 FROM vendors v
			JOIN merchants m ON m.id = v.merchant_id
			WHERE v.slug = products.vendor_slug AND m.email = $%d AND m.is_active = true
		)`, argIdx, argIdx+1)
	args = append(args, id)
	args = append(args, merchantEmail)

	result, err := db.Exec(query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update product: " + err.Error()})
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Product not found"})
	}

	return c.JSON(fiber.Map{"success": true, "message": "Product updated successfully"})
}

func deleteProduct(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid product ID"})
	}

	merchantEmail := c.Locals("user_email").(string)
	result, err := db.Exec(`
		UPDATE products
		SET is_available = false
		WHERE products.id = $1
		AND EXISTS (
			SELECT 1 FROM vendors v
			JOIN merchants m ON m.id = v.merchant_id
			WHERE v.slug = products.vendor_slug AND m.email = $2 AND m.is_active = true
		)
	`, id, merchantEmail)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete product: " + err.Error()})
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Product not found"})
	}

	return c.JSON(fiber.Map{"success": true, "message": "Product deleted successfully"})
}

func scanProducts(rows *sql.Rows) ([]Product, error) {
	var products []Product
	for rows.Next() {
		var p Product
		err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.Description,
			&p.Price,
			&p.ImageURL,
			&p.Tag,
			&p.Category,
			&p.IsAvailable,
			&p.VendorSlug,
			&p.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

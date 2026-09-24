//go:build ignore

package main

import (
	"database/sql"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf(".env not loaded: %v", err)
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}
	if !strings.Contains(databaseURL, "sslmode=") {
		if strings.Contains(databaseURL, "?") {
			databaseURL += "&sslmode=disable"
		} else {
			databaseURL += "?sslmode=disable"
		}
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	statements := []string{
		`CREATE TABLE IF NOT EXISTS vendors (
			id SERIAL PRIMARY KEY,
			name TEXT,
			slug TEXT UNIQUE,
			description TEXT,
			whatsapp TEXT,
			is_active BOOLEAN NOT NULL DEFAULT true
		)`,
		`CREATE TABLE IF NOT EXISTS products (
			id SERIAL PRIMARY KEY,
			vendor_id INT REFERENCES vendors(id) ON DELETE CASCADE,
			vendor_slug TEXT REFERENCES vendors(slug) ON DELETE CASCADE,
			name TEXT,
			description TEXT,
			price INT,
			image_url TEXT,
			tag TEXT,
			category TEXT,
			is_available BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)`,
		`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`,
		`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS whatsapp TEXT`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_id INT REFERENCES vendors(id) ON DELETE CASCADE`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_slug TEXT`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS tag TEXT`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()`,
		`TRUNCATE products, vendors RESTART IDENTITY CASCADE`,
		`INSERT INTO vendors (id, name, slug, description, whatsapp, is_active)
		 VALUES (1, 'Yaba Thrift', 'yaba-thrift', 'Thrift wears in Yaba Lagos', '2348012345678', true)`,
		`INSERT INTO products (id, vendor_id, vendor_slug, name, description, price, image_url, tag, category, is_available) VALUES
			(1, 1, 'yaba-thrift', 'Plain T-Shirt', 'A clean everyday cotton tee.', 500000, 'https://picsum.photos/seed/plain-tshirt/600', 'New', 'Clothing', true),
			(2, 1, 'yaba-thrift', 'Denim Jeans', 'Classic denim jeans for daily wear.', 1200000, 'https://picsum.photos/seed/denim-jeans/600', 'Popular', 'Clothing', true),
			(3, 1, 'yaba-thrift', 'Vintage Jacket', 'A distinctive vintage jacket in great condition.', 1500000, 'https://picsum.photos/seed/vintage-jacket/600', 'Vintage', 'Outerwear', true),
			(4, 1, 'yaba-thrift', 'Cargo Trousers', 'Relaxed cargo trousers with useful pockets.', 950000, 'https://picsum.photos/seed/cargo-trousers/600', 'New', 'Clothing', true),
			(5, 1, 'yaba-thrift', 'Oxford Shirt', 'A smart cotton shirt for everyday styling.', 750000, 'https://picsum.photos/seed/oxford-shirt/600', 'Classic', 'Clothing', true),
			(6, 1, 'yaba-thrift', 'Canvas Sneakers', 'Comfortable low-top canvas sneakers.', 1100000, 'https://picsum.photos/seed/canvas-sneakers/600', 'Popular', 'Footwear', true),
			(7, 1, 'yaba-thrift', 'Knit Sweater', 'A warm textured sweater for cool evenings.', 1350000, 'https://picsum.photos/seed/knit-sweater/600', 'Warm', 'Knitwear', true),
			(8, 1, 'yaba-thrift', 'Leather Belt', 'A durable leather belt with a simple buckle.', 450000, 'https://picsum.photos/seed/leather-belt/600', 'Essential', 'Accessories', true),
			(9, 1, 'yaba-thrift', 'Denim Skirt', 'A versatile mid-length denim skirt.', 850000, 'https://picsum.photos/seed/denim-skirt/600', 'Popular', 'Clothing', true),
			(10, 1, 'yaba-thrift', 'Bomber Jacket', 'A lightweight bomber jacket with a clean finish.', 1750000, 'https://picsum.photos/seed/bomber-jacket/600', 'Trending', 'Outerwear', true),
			(11, 1, 'yaba-thrift', 'Linen Shorts', 'Breathable linen shorts for warm days.', 650000, 'https://picsum.photos/seed/linen-shorts/600', 'Summer', 'Clothing', true),
			(12, 1, 'yaba-thrift', 'Graphic Tee', 'A bold graphic tee with a relaxed fit.', 550000, 'https://picsum.photos/seed/graphic-tee/600', 'New', 'Clothing', true),
			(13, 1, 'yaba-thrift', 'Suede Loafers', 'Classic suede loafers for polished outfits.', 1600000, 'https://picsum.photos/seed/suede-loafers/600', 'Classic', 'Footwear', true),
			(14, 1, 'yaba-thrift', 'Maxi Dress', 'A flowing maxi dress with a simple silhouette.', 1450000, 'https://picsum.photos/seed/maxi-dress/600', 'Featured', 'Dresses', true),
			(15, 1, 'yaba-thrift', 'Track Jacket', 'A sporty retro track jacket.', 1250000, 'https://picsum.photos/seed/track-jacket/600', 'Retro', 'Outerwear', true),
			(16, 1, 'yaba-thrift', 'Bucket Hat', 'A casual bucket hat for sunny days.', 350000, 'https://picsum.photos/seed/bucket-hat/600', 'Essential', 'Accessories', true),
			(17, 1, 'yaba-thrift', 'Pleated Trousers', 'Tailored pleated trousers with a relaxed cut.', 1150000, 'https://picsum.photos/seed/pleated-trousers/600', 'Classic', 'Clothing', true),
			(18, 1, 'yaba-thrift', 'Cardigan', 'A soft button-front cardigan for layering.', 1050000, 'https://picsum.photos/seed/cardigan/600', 'Layering', 'Knitwear', true),
			(19, 1, 'yaba-thrift', 'Crossbody Bag', 'A compact crossbody bag for daily essentials.', 900000, 'https://picsum.photos/seed/crossbody-bag/600', 'Popular', 'Accessories', true),
			(20, 1, 'yaba-thrift', 'Vintage Sunglasses', 'Retro sunglasses with a timeless frame.', 600000, 'https://picsum.photos/seed/vintage-sunglasses/600', 'Vintage', 'Accessories', true)`,
	}

	for _, statement := range statements {
		if _, err := db.Exec(statement); err != nil {
			log.Fatal(err)
		}
	}

	log.Println("Seeded successfully: 1 vendor, 20 products")
}

-- Create products metadata table for faster queries
CREATE TABLE IF NOT EXISTS products (
    gtin BIGINT PRIMARY KEY,
    name TEXT,
    vendor_name TEXT,
    country_of_origin TEXT,
    category TEXT,
    brand TEXT,
    sales_unit TEXT,
    base_unit TEXT,
    product_data JSONB
);

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

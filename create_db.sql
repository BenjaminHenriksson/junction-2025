-- Create the database
CREATE DATABASE test_valio_product_catalog;

-- Connect to it
\c test_valio_product_catalog;

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the embeddings table
CREATE TABLE embeddings (
    gtin      BIGINT PRIMARY KEY,
    embedding vector(1536)
);

-- (Optional) Add an index for vector similarity
CREATE INDEX embeddings_hnsw_idx
ON embeddings USING hnsw (embedding vector_cosine_ops);

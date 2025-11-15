# This is how the database was created:

CREATE ROLE valio_app WITH
    LOGIN
    PASSWORD 'qwerty'
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE;

CREATE DATABASE product_catalog OWNER valio_app;
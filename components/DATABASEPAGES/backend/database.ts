// Database connection configuration
// This is a placeholder - replace with your actual database configuration

import knex from 'knex';

// Example configuration for PostgreSQL
export const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'database_pages'
  },
  pool: {
    min: 2,
    max: 10
  }
});

// Example configuration for SQLite (for development)
// export const db = knex({
//   client: 'sqlite3',
//   connection: {
//     filename: './database.sqlite'
//   },
//   useNullAsDefault: true
// });

// Example configuration for MySQL
// export const db = knex({
//   client: 'mysql2',
//   connection: {
//     host: process.env.DB_HOST || 'localhost',
//     port: parseInt(process.env.DB_PORT || '3306'),
//     user: process.env.DB_USER || 'root',
//     password: process.env.DB_PASSWORD || 'password',
//     database: process.env.DB_NAME || 'database_pages'
//   }
// });

export default db;
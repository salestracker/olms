import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
export const db = new Database(path.join(dataDir, 'zenith.db'), { 
  verbose: console.log 
});

/**
 * Initialize the database schema and seed initial data
 */
export const initDatabase = () => {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      details TEXT,
      suggestion TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Create order_timeline table for tracking status changes
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  // Check if we need to seed initial data
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (userCount.count === 0) {
    console.log('Seeding initial data...');
    seedInitialData();
  }
};

/**
 * Seed the database with initial data
 */
const seedInitialData = () => {
  const saltRounds = 10;
  
  // Insert admin user
  const adminPassword = bcrypt.hashSync('admin123', saltRounds);
  db.prepare(`
    INSERT INTO users (id, name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('admin-1', 'Admin User', 'admin@zenith.com', adminPassword, 'admin');
  
  // Insert customer user
  const customerPassword = bcrypt.hashSync('customer123', saltRounds);
  db.prepare(`
    INSERT INTO users (id, name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('customer-1', 'Customer One', 'customer@zenith.com', customerPassword, 'customer');
  
  // Insert factory user
  const factoryPassword = bcrypt.hashSync('factory123', saltRounds);
  db.prepare(`
    INSERT INTO users (id, name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('factory-1', 'Factory Staff', 'factory@zenith.com', factoryPassword, 'factory');
  
  // Insert sample orders
  const orders = [
    {
      id: 'order-1',
      user_id: 'customer-1',
      status: 'processing',
      customer_name: 'Akshay Kumar',
      amount: 12000,
      details: JSON.stringify({ items: [{ name: 'Diamond Ring', quantity: 1 }] })
    },
    {
      id: 'order-2',
      user_id: 'customer-1',
      status: 'manufacturing',
      customer_name: 'Priyanka Chopra',
      amount: 25000,
      details: JSON.stringify({ items: [{ name: 'Diamond Necklace', quantity: 1 }] })
    },
    {
      id: 'order-3',
      user_id: 'customer-1',
      status: 'delivered',
      customer_name: 'Akshay Kumar',
      amount: 8000,
      details: JSON.stringify({ items: [{ name: 'Diamond Earrings', quantity: 1 }] })
    }
  ];
  
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, user_id, status, customer_name, amount, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const insertTimeline = db.prepare(`
    INSERT INTO order_timeline (order_id, status, description)
    VALUES (?, ?, ?)
  `);
  
  // Use a transaction for bulk inserts
  const transaction = db.transaction(() => {
    for (const order of orders) {
      insertOrder.run(
        order.id, 
        order.user_id, 
        order.status, 
        order.customer_name,
        order.amount,
        order.details
      );
      
      // Add initial timeline entry for each order
      insertTimeline.run(
        order.id,
        order.status,
        `Order ${order.status}`
      );
    }
  });
  
  transaction();
  
  console.log('Database seeded successfully!');
};

import { db } from './index';
import { v4 as uuidv4 } from 'uuid';

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'manufacturing' | 'quality_check' | 'shipped' | 'delivered' | 'cancelled';
  customer_name: string;
  amount: number;
  details?: string;
  suggestion?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimelineEvent {
  id?: number;
  order_id: string;
  status: string;
  description?: string;
  created_at?: string;
}

/**
 * Repository for order-related database operations
 */
export class OrderRepository {
  /**
   * Get all orders
   */
  getAll(): Order[] {
    return db.prepare(`
      SELECT * FROM orders
    `).all() as Order[];
  }

  /**
   * Get orders by user ID
   */
  getByUserId(userId: string): Order[] {
    return db.prepare(`
      SELECT * FROM orders
      WHERE user_id = ?
    `).all(userId) as Order[];
  }

  /**
   * Get orders by status
   */
  getByStatus(status: Order['status']): Order[] {
    return db.prepare(`
      SELECT * FROM orders
      WHERE status = ?
    `).all(status) as Order[];
  }

  /**
   * Get a single order by ID
   */
  getById(id: string): Order | null {
    const order = db.prepare(`
      SELECT * FROM orders
      WHERE id = ?
    `).get(id) as Order | undefined;

    return order || null;
  }

  /**
   * Get timeline events for an order
   */
  getOrderTimeline(orderId: string): TimelineEvent[] {
    return db.prepare(`
      SELECT * FROM order_timeline
      WHERE order_id = ?
      ORDER BY created_at ASC
    `).all(orderId) as TimelineEvent[];
  }

  /**
   * Create a new order
   */
  create(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Order {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Start transaction
    const transaction = db.transaction(() => {
      // Insert the order
      db.prepare(`
        INSERT INTO orders (
          id, user_id, status, customer_name, 
          amount, details, suggestion, 
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        orderData.user_id,
        orderData.status,
        orderData.customer_name,
        orderData.amount,
        orderData.details || null,
        orderData.suggestion || null,
        now,
        now
      );

      // Add initial timeline entry
      db.prepare(`
        INSERT INTO order_timeline (
          order_id, status, description, created_at
        )
        VALUES (?, ?, ?, ?)
      `).run(
        id,
        orderData.status,
        `Order created with status: ${orderData.status}`,
        now
      );
    });

    // Execute transaction
    transaction();

    // Return the created order
    return {
      id,
      ...orderData,
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Update order status
   */
  updateStatus(orderId: string, newStatus: Order['status'], description?: string): Order | null {
    const order = this.getById(orderId);
    if (!order) {
      return null;
    }

    const now = new Date().toISOString();
    const statusDescription = description || `Status changed to ${newStatus}`;

    // Start transaction
    const transaction = db.transaction(() => {
      // Update the order
      db.prepare(`
        UPDATE orders
        SET status = ?, updated_at = ?
        WHERE id = ?
      `).run(newStatus, now, orderId);

      // Add timeline entry
      db.prepare(`
        INSERT INTO order_timeline (
          order_id, status, description, created_at
        )
        VALUES (?, ?, ?, ?)
      `).run(orderId, newStatus, statusDescription, now);
    });

    // Execute transaction
    transaction();

    // Return updated order
    return {
      ...order,
      status: newStatus,
      updated_at: now
    };
  }

  /**
   * Add a suggestion to an order
   */
  addSuggestion(orderId: string, suggestion: string): Order | null {
    const order = this.getById(orderId);
    if (!order) {
      return null;
    }

    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE orders
      SET suggestion = ?, updated_at = ?
      WHERE id = ?
    `).run(suggestion, now, orderId);

    if (result.changes === 0) {
      return null;
    }

    return {
      ...order,
      suggestion,
      updated_at: now
    };
  }

  /**
   * Get analytics data - grouped by status
   */
  getAnalytics() {
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `).all() as { status: string; count: number }[];

    const allOrders = this.getAll();
    const totalOrders = allOrders.length;

    // Format for pie chart
    const pieChartData = statusCounts.map(({ status, count }) => ({
      status,
      count,
      percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0
    }));

    return {
      totalOrders,
      byStatus: statusCounts.reduce((acc, { status, count }) => {
        acc[status] = count;
        return acc;
      }, {} as Record<string, number>),
      pieChartData
    };
  }

  /**
   * Delete an order (for admin use only)
   */
  delete(orderId: string): boolean {
    // This is a destructive operation - so we use transaction
    const transaction = db.transaction(() => {
      // First delete timeline events
      db.prepare(`
        DELETE FROM order_timeline
        WHERE order_id = ?
      `).run(orderId);

      // Then delete the order
      db.prepare(`
        DELETE FROM orders
        WHERE id = ?
      `).run(orderId);
    });

    try {
      transaction();
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const orderRepository = new OrderRepository();

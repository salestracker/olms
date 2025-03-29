import { BaseRepository } from './baseRepository';

export type TimelineEvent = {
  status: string;
  timestamp: string;
  description: string;
};

export type Order = {
  id: string;
  userId: string;
  customerName: string;
  status: 'pending' | 'processing' | 'manufacturing' | 'quality_check' | 'shipped' | 'delivered' | 'cancelled';
  timeline: TimelineEvent[];
  suggestion?: string;
  createdAt: string;
  updatedAt: string;
  details: {
    items: {
      name: string;
      quantity: number;
      price: number;
    }[];
    totalAmount: number;
  };
};

class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super('orders');
    
    // Add some sample data for development
    this.createSampleData();
  }

  getByUserId(userId: string): Order[] {
    return this.filter(order => order.userId === userId);
  }

  getByStatus(status: Order['status']): Order[] {
    return this.filter(order => order.status === status);
  }

  updateStatus(orderId: string, status: Order['status']): Order | undefined {
    const order = this.getById(orderId);
    if (!order) return undefined;
    
    const now = new Date().toISOString();
    
    // Add event to timeline
    const timelineEvent: TimelineEvent = {
      status,
      timestamp: now,
      description: `Order status changed to ${status}`
    };
    
    return this.update(orderId, {
      status,
      timeline: [...order.timeline, timelineEvent],
      updatedAt: now
    });
  }

  addSuggestion(orderId: string, suggestion: string): Order | undefined {
    const order = this.getById(orderId);
    if (!order) return undefined;
    
    const now = new Date().toISOString();
    
    return this.update(orderId, {
      suggestion,
      updatedAt: now
    });
  }

  createSampleData() {
    const now = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    
    const sampleOrders: Order[] = [
      {
        id: '1',
        userId: 'customer1',
        customerName: 'Akshay Kumar',
        status: 'processing',
        timeline: [
          {
            status: 'pending',
            timestamp: yesterday,
            description: 'Order placed'
          },
          {
            status: 'processing',
            timestamp: now,
            description: 'Order confirmed and processing started'
          }
        ],
        createdAt: yesterday,
        updatedAt: now,
        details: {
          items: [
            {
              name: 'Diamond Ring',
              quantity: 1,
              price: 12000
            }
          ],
          totalAmount: 12000
        }
      },
      {
        id: '2',
        userId: 'customer2',
        customerName: 'Priyanka Chopra',
        status: 'manufacturing',
        timeline: [
          {
            status: 'pending',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            description: 'Order placed'
          },
          {
            status: 'processing',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            description: 'Order confirmed and processing started'
          },
          {
            status: 'manufacturing',
            timestamp: now,
            description: 'Order in manufacturing'
          }
        ],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: now,
        details: {
          items: [
            {
              name: 'Diamond Necklace',
              quantity: 1,
              price: 25000
            }
          ],
          totalAmount: 25000
        }
      },
      {
        id: '3',
        userId: 'customer1',
        customerName: 'Akshay Kumar',
        status: 'delivered',
        timeline: [
          {
            status: 'pending',
            timestamp: new Date(Date.now() - 1000000000).toISOString(),
            description: 'Order placed'
          },
          {
            status: 'processing',
            timestamp: new Date(Date.now() - 900000000).toISOString(),
            description: 'Order confirmed and processing started'
          },
          {
            status: 'manufacturing',
            timestamp: new Date(Date.now() - 800000000).toISOString(),
            description: 'Order in manufacturing'
          },
          {
            status: 'quality_check',
            timestamp: new Date(Date.now() - 700000000).toISOString(),
            description: 'Quality check in progress'
          },
          {
            status: 'shipped',
            timestamp: new Date(Date.now() - 600000000).toISOString(),
            description: 'Order shipped'
          },
          {
            status: 'delivered',
            timestamp: new Date(Date.now() - 500000000).toISOString(),
            description: 'Order delivered'
          }
        ],
        createdAt: new Date(Date.now() - 1000000000).toISOString(),
        updatedAt: new Date(Date.now() - 500000000).toISOString(),
        details: {
          items: [
            {
              name: 'Diamond Earrings',
              quantity: 1,
              price: 8000
            }
          ],
          totalAmount: 8000
        }
      }
    ];
    
    sampleOrders.forEach(order => this.db.push(order));
  }
}

export const orderRepository = new OrderRepository();

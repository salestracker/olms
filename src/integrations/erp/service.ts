/**
 * ERP Service Implementation
 * This file implements the ERP service using the adapters defined in index.ts
 */
import { LogicMateAdapter, SuntecAdapter, ERPIntegrationService } from './index';

// Create instances of the ERP adapters
const logicMateAdapter = new LogicMateAdapter({
  baseUrl: 'https://api.logicmate.example.com',
  apiKey: 'lm-api-key-12345'
});

const suntecAdapter = new SuntecAdapter({
  baseUrl: 'https://erp.suntec.example.com',
  apiKey: 'suntec-api-key-67890'
});

// LogicMate ERP service implementation
class LogicMateService {
  private adapter: LogicMateAdapter;

  constructor(adapter: LogicMateAdapter) {
    this.adapter = adapter;
  }

  async syncOrders(): Promise<any> {
    console.log('Syncing orders with LogicMate ERP');
    return this.adapter.fetchData('/orders');
  }

  async updateInventory(productId: string, quantity: number): Promise<boolean> {
    console.log(`Updating inventory for product ${productId} to ${quantity}`);
    return this.adapter.pushData('/inventory/update', { productId, quantity });
  }
}

// Suntec ERP service implementation
class SuntecService {
  private adapter: SuntecAdapter;

  constructor(adapter: SuntecAdapter) {
    this.adapter = adapter;
  }

  async getFactoryStatus(): Promise<any> {
    console.log('Getting factory status from Suntec ERP');
    return this.adapter.fetchData('/factory/status');
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    console.log(`Updating order ${orderId} status to ${status}`);
    return this.adapter.pushData('/orders/status', { orderId, status });
  }
}

// Main ERP service that combines all ERP systems
class ERPService {
  readonly logicMate: LogicMateService;
  readonly suntec: SuntecService;
  private integrationService: ERPIntegrationService;

  constructor() {
    this.logicMate = new LogicMateService(logicMateAdapter);
    this.suntec = new SuntecService(suntecAdapter);
    this.integrationService = new ERPIntegrationService({
      logicMate: {
        baseUrl: 'https://api.logicmate.example.com',
        apiKey: 'lm-api-key-12345'
      },
      suntec: {
        baseUrl: 'https://api.suntec.example.com',
        apiKey: 'suntec-api-key-67890'
      }
    });
  }

  async syncAllSystems(): Promise<any> {
    console.log('Syncing all ERP systems');
    
    // Fetch data from all adapters
    const logicMateData = await this.logicMate.syncOrders();
    const suntecData = await this.suntec.getFactoryStatus();
    
    return {
      timestamp: new Date().toISOString(),
      systems: {
        logicMate: logicMateData,
        suntec: suntecData
      }
    };
  }

  async getOrderDetails(orderId: string): Promise<any> {
    console.log(`Getting order details for ${orderId} from all ERP systems`);
    
    // Fetch order details from both systems
    const logicMateOrder = await logicMateAdapter.fetchData(`/orders/${orderId}`);
    const suntecOrder = await suntecAdapter.fetchData(`/orders/${orderId}`);
    
    return {
      orderId,
      logicMate: logicMateOrder,
      suntec: suntecOrder
    };
  }
}

// Create and export the ERP service instance
export const erpService = new ERPService();
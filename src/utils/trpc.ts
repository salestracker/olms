import { createTRPCClient, lumosLoginService, lumosOrdersService } from 'lumos-ts';
import superjson from 'superjson';

// Create a TRPC client using lumos-ts's built-in services for authentication and order management.
export const trpcClient = createTRPCClient({
  url: '/api/trpc',
  transformer: superjson,
  loginService: lumosLoginService,
  ordersService: lumosOrdersService,
});

// Re-export login and orders services for component-level usage.
export const loginService = lumosLoginService;
export const ordersService = lumosOrdersService;

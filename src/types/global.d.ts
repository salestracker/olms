// Global type declarations

declare module 'better-sqlite3';
declare module 'bcrypt';
declare module 'cors';
declare module 'cookie-parser';
declare module 'express';
declare module './mockApi' {
  export const mockAuth: any;
  export const mockOrderService: any;
  export const shouldUseMockApi: () => boolean;
}
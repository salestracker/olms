const express = require('express');
const cors = require('cors');
const { createExpressMiddleware } = require('@trpc/server/adapters/express');
const { ordersRouter } = require('./modules/orders');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/trpc', createExpressMiddleware({
  router: ordersRouter,
  createContext: () => ({}),
}));

app.listen(4000, () => {
  console.log("Express TRPC server running on http://localhost:4000");
});

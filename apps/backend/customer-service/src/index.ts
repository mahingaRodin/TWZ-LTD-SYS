import app from './app';

const PORT = process.env.CUSTOMER_SERVICE_PORT || 4002;

app.listen(PORT, () => {
  console.log(`Customer Service running on port ${PORT}`);
});

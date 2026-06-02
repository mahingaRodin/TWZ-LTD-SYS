import app from './app';

const PORT = process.env.NOTIFICATION_SERVICE_PORT || 4004;

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});

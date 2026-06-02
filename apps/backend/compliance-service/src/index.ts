import app from './app';

const PORT = process.env.COMPLIANCE_SERVICE_PORT || 4005;

app.listen(PORT, () => {
  console.log(`Compliance Service running on port ${PORT}`);
});

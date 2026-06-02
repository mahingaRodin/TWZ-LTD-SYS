import app from './app';

const PORT = process.env.EXTINGUISHER_SERVICE_PORT || 4003;

app.listen(PORT, () => {
  console.log(`Fire Extinguisher Service running on port ${PORT}`);
});

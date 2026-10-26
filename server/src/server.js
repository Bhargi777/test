require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

const port = Number(process.env.PORT) || 4000;

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => {
    console.log(`Personal Notes API listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Could not start the server:', error.message);
  process.exit(1);
});

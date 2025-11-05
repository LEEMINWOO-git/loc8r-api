import mongoose from 'mongoose';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();
mongoose.set("strictQuery", false);

const dbPassword = process.env.MONGODB_PASSWORD;
const dbURI = `mongodb+srv://myatlasbuser:${encodeURIComponent(dbPassword)}@cluster0.sz8ahic.mongodb.net/Loc8r`;

const connect = async () => {
  try {
    await mongoose.connect(dbURI);
  } catch (err) {
    console.error('Initial MongoDB connection error:', err.message);
    setTimeout(connect, 3000); 
  }
};

mongoose.connection.on('connected', () => {
  console.log(`Mongoose connected to ${dbURI}`);
});

mongoose.connection.on('error', err => {
  console.error('Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected');
});

if (process.platform === 'win32') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.on('SIGINT', () => {
    process.emit("SIGINT");
  });
}

const gracefulShutdown = async (msg) => {
  try {
    await mongoose.connection.close();
    console.log(`Mongoose disconnected through ${msg}`);
  } catch (err) {
    console.error('Error during mongoose disconnection:', err);
  }
};

process.once('SIGUSR2', async () => {
  await gracefulShutdown('nodemon restart');
  process.kill(process.pid, 'SIGUSR2');
});

process.on('SIGINT', async () => {
  await gracefulShutdown('app termination');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await gracefulShutdown('Heroku app shutdown');
  process.exit(0);
});

await connect(); 


import './locations.js';

import mongoose from 'mongoose';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();
mongoose.set("strictQuery", false);

// 환경변수
const dbUser = process.env.MONGODB_USER;
const dbPassword = process.env.MONGODB_PASSWORD;
const dbCluster = process.env.MONGODB_CLUSTER;
const dbName = process.env.MONGODB_DBNAME;

if (!dbUser || !dbPassword || !dbCluster || !dbName) {
  console.error('❌ Missing DB environment variables');
  process.exit(1);
}

// MongoDB Atlas 연결 URI 생성
const dbURI = `mongodb+srv://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbCluster}/${dbName}?retryWrites=true&w=majority`;

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

// Windows 종료 처리
if (process.platform === 'win32') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.on('SIGINT', () => {
    process.emit("SIGINT");
  });
}

// 안전 종료 핸들러
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

// 모델 로딩
import './locations.js';
import './users.js';

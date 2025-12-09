import dotenv from 'dotenv';
dotenv.config();

import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import passport from 'passport';
import cors from 'cors';

// __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB 연결
import './app_api/models/db.js';
import './app_api/models/locations.js';
import './app_api/models/users.js';

// passport 설정 파일 로드 (DB 모델 로드 후)
import './app_api/config/passport.js';

// 라우터
import usersRouter from './app_server/routes/users.js';
import locationsRouter from './app_server/routes/locations.js';
import othersRouter from './app_server/routes/others.js';
import apiRouter from './app_api/routes/index.js';

const app = express();

// ▼ CORS 설정 (순서 중요!)
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // For legacy browser support
};
app.use(cors(corsOptions));

app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

// 뷰 엔진
app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'pug');

// 미들웨어
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Passport 초기화
app.use(passport.initialize());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'app_public', 'build')));

// API 라우트
app.use('/api', apiRouter);

// 서버 라우트
app.use('/users', usersRouter);
app.use('/locations', locationsRouter);
app.use('/', othersRouter);

// SPA 라우팅
app.get(/(\/about)|(\/location\/[a-z0-9]{24})/, (req, res) => {
  res.sendFile(path.join(__dirname, 'app_public', 'build', 'index.html'));
});

// JWT 에러 핸들러
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: `${err.name}: ${err.message}`
    });
  }
  next(err);
});

// 404 처리
app.use((req, res, next) => {
  next(createError(404));
});

// 에러 핸들러
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

export default app;

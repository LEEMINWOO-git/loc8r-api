// app.js
import 'dotenv/config'; 
import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';

// 1) DB 연결 및 모델 등록을 먼저 로드 (컨트롤러에서 mongoose.model('Location') 사용 가능하도록)
import './app_server/models/db.js';
import './app_server/models/locations.js';   // ← 모델 파일은 기존 위치(app_server) 그대로 사용

// 2) 라우터는 그 다음에 로드
import indexRouter from './app_server/routes/index.js';
import usersRouter from './app_server/routes/users.js';
import locationsRouter from './app_server/routes/locations.js';
import othersRouter from './app_server/routes/others.js';
import apiRouter from './app_api/routes/index.js';

const app = express();

// __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// view engine setup
app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 웹 앱 라우트
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/locations', locationsRouter);
app.use('/', othersRouter);

// API 라우트 (prefix: /api)
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});


// error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

export default app;

// app_server/routes/index.js
import express from 'express';
import {
  homelist,
  locationInfo,
  addReview,
  doAddReview 
} from '../controllers/locations.js';
import { about } from '../controllers/others.js';

const router = express.Router();

/* Locations pages */
router.get('/', homelist);

//상세 정보 페이지 (13-1)
router.get('/location/:locationid', locationInfo);

//리뷰 작성 페이지 (14-1)
router
  .route('/location/:locationid/review/new')
  .get(addReview)      // Add Review 폼 열기
  .post(doAddReview);  // 폼 제출 시 API로 POST

// About 페이지
router.get('/about', about);

export default router;

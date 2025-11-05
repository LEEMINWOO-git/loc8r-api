// app_api/routes/index.js
import express from 'express';
import * as ctrlLocations from '../controllers/locations.js';
import * as ctrlReviews from '../controllers/reviews.js';

const router = express.Router();

// 간단한 요청 로깅
router.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  next();
});

/* ========= locations ========= */
router.get('/locations',             ctrlLocations.locationsListByDistance);
router.post('/locations',            ctrlLocations.locationsCreate);
router.get('/locations/:locationid', ctrlLocations.locationsReadOne);
router.put('/locations/:locationid', ctrlLocations.locationsUpdateOne);
router.delete('/locations/:locationid', ctrlLocations.locationsDeleteOne);

/* ========= reviews (subdocuments) ========= */
router.post('/locations/:locationid/reviews',               ctrlReviews.reviewsCreate);
router.get('/locations/:locationid/reviews/:reviewid',      ctrlReviews.reviewsReadOne);
router.put('/locations/:locationid/reviews/:reviewid',      ctrlReviews.reviewsUpdateOne);
router.delete('/locations/:locationid/reviews/:reviewid',   ctrlReviews.reviewsDeleteOne);

export default router;

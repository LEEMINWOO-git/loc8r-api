// app_api/routes/index.js
import express from 'express';
import { expressjwt as jwt } from 'express-jwt';
import * as ctrlLocations from '../controllers/locations.js';
import * as ctrlReviews from '../controllers/reviews.js';
import * as ctrlAuth from '../controllers/authentication.js';

const router = express.Router();

/* ===== JWT Auth middleware ===== */
const auth = jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  requestProperty: 'auth'   // req.auth 에 payload 저장
});

/* ===== Logging ===== */
router.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  next();
});

/* ========= locations ========= */
router.get('/locations', ctrlLocations.locationsListByDistance);
router.post('/locations', ctrlLocations.locationsCreate);
router.get('/locations/:locationid', ctrlLocations.locationsReadOne);
router.put('/locations/:locationid', ctrlLocations.locationsUpdateOne);
router.delete('/locations/:locationid', ctrlLocations.locationsDeleteOne);

/* ========= reviews ========= */
router
  .route('/locations/:locationid/reviews')
  .post(auth, ctrlReviews.reviewsCreate);

router
  .route('/locations/:locationid/reviews/:reviewid')
  .get(ctrlReviews.reviewsReadOne)
  .put(auth, ctrlReviews.reviewsUpdateOne)
  .delete(auth, ctrlReviews.reviewsDeleteOne);

/* ========= authentication ========= */
router.post('/register', ctrlAuth.register);
router.post('/login', ctrlAuth.login);

export default router;

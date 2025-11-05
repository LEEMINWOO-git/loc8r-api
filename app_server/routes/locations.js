import express from 'express';
import { locationInfo, addReview, homelist } from '../controllers/locations.js';

const router = express.Router();

router.get('/', homelist);
router.get('/info', locationInfo);
router.get('/review/new', addReview);

export default router;

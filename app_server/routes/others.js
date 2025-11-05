import express from 'express';
const router = express.Router();
import { about } from '../controllers/others.js';

router.get('/about', about);

export default router;

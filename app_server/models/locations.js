// app_api/models/locations.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  author: String,
  rating: { type: Number, required: true, min: 0, max: 5 },
  reviewText: String,
  createdOn: { type: Date, default: Date.now }
});

const openingTimeSchema = new mongoose.Schema({
  days: { type: String, required: true },
  opening: String,
  closing: String,
  closed: { type: Boolean, required: true }
});

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  rating: { type: Number, default: 0, min: 0, max: 5 },
  facilities: [String],
  coords: { type: [Number], index: '2dsphere' },
  openingTimes: [openingTimeSchema],
  reviews: [reviewSchema]
});

// ✅ 모델 생성 및 export
const Location = mongoose.model('Location', locationSchema);
export default Location;

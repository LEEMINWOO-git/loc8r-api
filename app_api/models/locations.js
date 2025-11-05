// app_api/models/locations.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  author: { type: String, required: true, minlength: 1  },
  rating: { type: Number, required: true, min: 0, max: 5 },
  reviewText: { type: String, required: true, minlength: 1 },
  createdOn: { type: Date, default: Date.now }
});

const openingTimesSchema = new mongoose.Schema({
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
  openingTimes: [openingTimesSchema],
  reviews: [reviewSchema]
});

mongoose.model('Location', locationSchema);

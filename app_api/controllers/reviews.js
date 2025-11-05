// app_api/controllers/reviews.js (ESM 버전)
import mongoose from 'mongoose';
const Loc = mongoose.model('Location');

const doSetAverageRating = async (location) => {
  if (location.reviews && location.reviews.length > 0) {
    const count = location.reviews.length;
    const total = location.reviews.reduce((acc, { rating }) => {
      return acc + rating;
    }, 0);

    location.rating = parseInt(total / count, 10);
    try {
      await location.save();
      console.log(`Average rating updated to ${location.rating}`);
    } catch (err) {
      console.log(err);
    }
  }
};

const updateAverageRating = async (locationId) => {
  try {
    const location = await Loc.findById(locationId).select('rating reviews').exec();
    if (location) {
      await doSetAverageRating(location);
    }
  } catch (err) {
    console.log(err);
  }
};

const doAddReview = async (req, res, location) => {
  if (!location) {
    return res.status(404).json({ message: 'Location not found' });
  }

  const { author, rating, reviewText } = req.body;
  location.reviews.push({ author, rating, reviewText });
  if (!author || !reviewText) {
    // app_server/controllers/locations.js 에서 잡을 수 있게
    return res.status(400).json({
      name: 'ValidationError',
      message: 'All fields required'
    });
  }
  
  try {
    const updatedLocation = await location.save();
    await updateAverageRating(updatedLocation._id);
    const thisReview = updatedLocation.reviews.slice(-1).pop();
    return res.status(201).json(thisReview);
  } catch (err) {
    // Mongoose ValidationError 그대로 내려가게
    return res.status(400).json(err);
  }
};

export const reviewsCreate = async (req, res) => {
  const locationId = req.params.locationid;
  if (!locationId) {
    return res.status(404).json({ message: 'Location not found' });
  }

  try {
    const location = await Loc.findById(locationId).select('reviews').exec();
    if (location) {
      await doAddReview(req, res, location);
    } else {
      return res.status(404).json({ message: 'Location not found' });
    }
  } catch (err) {
    return res.status(400).json(err);
  }
};

export const reviewsReadOne = async (req, res) => {
  try {
    const location = await Loc.findById(req.params.locationid).select('name reviews').exec();
    if (!location) {
      return res.status(404).json({ message: 'location not found' });
    }

    if (location.reviews && location.reviews.length > 0) {
      const review = location.reviews.id(req.params.reviewid);
      if (!review) {
        return res.status(404).json({ message: 'review not found' });
      }

      const response = {
        location: {
          name: location.name,
          id: req.params.locationid
        },
        review
      };
      return res.status(200).json(response);
    } else {
      return res.status(404).json({ message: 'No reviews found' });
    }
  } catch (err) {
    return res.status(400).json(err);
  }
};

export const reviewsUpdateOne = async (req, res) => {
  if (!req.params.locationid || !req.params.reviewid) {
    return res
      .status(404)
      .json({ message: 'Not found, locationid and reviewid are both required' });
  }

  try {
    const location = await Loc.findById(req.params.locationid).select('reviews').exec();
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    if (location.reviews && location.reviews.length > 0) {
      const thisReview = location.reviews.id(req.params.reviewid);
      if (!thisReview) {
        return res.status(404).json({ message: 'Review not found' });
      }

      thisReview.author = req.body.author;
      thisReview.rating = req.body.rating;
      thisReview.reviewText = req.body.reviewText;

      const updatedLocation = await location.save();
      await updateAverageRating(updatedLocation._id);
      return res.status(200).json(thisReview);
    } else {
      return res.status(404).json({ message: 'No review to update' });
    }
  } catch (err) {
    return res.status(400).json(err);
  }
};

export const reviewsDeleteOne = async (req, res) => {
  const { locationid, reviewid } = req.params;
  if (!locationid || !reviewid) {
    return res
      .status(404)
      .json({ message: 'Not found, locationid and reviewid are both required' });
  }

  try {
    const location = await Loc.findById(locationid).select('reviews').exec();
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    if (location.reviews && location.reviews.length > 0) {
      const review = location.reviews.id(reviewid);
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      await review.deleteOne(); // review.remove() 써도 됨
      await location.save();
      await updateAverageRating(location._id);
      return res.status(204).json(null);
    } else {
      return res.status(404).json({ message: 'No Review to delete' });
    }
  } catch (err) {
    return res.status(400).json(err);
  }
};



// app_api/controllers/reviews.js
import mongoose from 'mongoose';
const Loc = mongoose.model('Location');
const User = mongoose.model('User');

// 작성자 정보 가져오기
const getAuthor = async (req, res, callback) => {
  if (!req.auth || !req.auth.email) {
    return res.status(404).json({ message: 'User not found' });
  }

  try {
    const user = await User.findOne({ email: req.auth.email }).exec();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // user.name 전달
    callback(req, res, user.name);

  } catch (err) {
    console.log(err);
    return res.status(404).json(err);
  }
};

// 평균 평점 계산 및 저장
const doSetAverageRating = async (location) => {
  if (location.reviews && location.reviews.length > 0) {
    const count = location.reviews.length;
    const total = location.reviews.reduce((acc, { rating }) => acc + rating, 0);
    location.rating = parseInt(total / count, 10);
    await location.save();
  }
};

const updateAverageRating = async (locationId) => {
  try {
    const location = await Loc.findById(locationId).select('rating reviews').exec();
    if (location) await doSetAverageRating(location);
  } catch (err) {
    console.log(err);
  }
};

// 리뷰 추가 내부 함수
const doAddReview = async (req, res, location, authorName) => {
  if (!location) {
    return res.status(404).json({ message: 'Location not found' });
  }

  const { rating, reviewText } = req.body;

  if (!rating || !reviewText) {
    return res.status(400).json({ message: 'All fields required' });
  }

  location.reviews.push({
    author: authorName,    
    rating,
    reviewText
  });

  try {
    const updatedLocation = await location.save();
    await updateAverageRating(updatedLocation._id);

    const thisReview = updatedLocation.reviews.slice(-1).pop();
    return res.status(201).json(thisReview);

  } catch (err) {
    return res.status(400).json(err);
  }
};

// 리뷰 생성
export const reviewsCreate = async (req, res) => {
  getAuthor(req, res, async (req, res, userName) => {
    const locationId = req.params.locationid;

    if (!locationId) {
      return res.status(404).json({ message: 'Location not found' });
    }

    try {
      const location = await Loc.findById(locationId).select('reviews').exec();

      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }

      await doAddReview(req, res, location, userName);

    } catch (err) {
      return res.status(400).json(err);
    }
  });
};

// 리뷰 조회
export const reviewsReadOne = async (req, res) => {
  try {
    const location = await Loc.findById(req.params.locationid)
      .select('name reviews')
      .exec();

    if (!location) {
      return res.status(404).json({ message: 'location not found' });
    }

    if (location.reviews && location.reviews.length > 0) {
      const review = location.reviews.id(req.params.reviewid);
      if (!review) {
        return res.status(404).json({ message: 'review not found' });
      }

      return res.status(200).json({
        location: { name: location.name, id: req.params.locationid },
        review
      });
    } else {
      return res.status(404).json({ message: 'No reviews found' });
    }
  } catch (err) {
    return res.status(400).json(err);
  }
};

// 리뷰 수정
export const reviewsUpdateOne = async (req, res) => {
  if (!req.params.locationid || !req.params.reviewid) {
    return res.status(404).json({ message: 'Not found, locationid and reviewid required' });
  }

  try {
    const location = await Loc.findById(req.params.locationid)
      .select('reviews')
      .exec();

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const thisReview = location.reviews.id(req.params.reviewid);
    if (!thisReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    thisReview.rating = req.body.rating;
    thisReview.reviewText = req.body.reviewText;
    thisReview.author = req.body.author;

    const updatedLocation = await location.save();
    await updateAverageRating(updatedLocation._id);

    return res.status(200).json(thisReview);

  } catch (err) {
    return res.status(400).json(err);
  }
};

// 리뷰 삭제 
export const reviewsDeleteOne = async (req, res) => {
  const { locationid, reviewid } = req.params;

  if (!locationid || !reviewid) {
    return res.status(404).json({
      message: 'Not found, locationid and reviewid required'
    });
  }

  try {
    const location = await Loc.findById(locationid)
      .select('reviews')
      .exec();

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const review = location.reviews.id(reviewid);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.deleteOne();
    await location.save();
    await updateAverageRating(location._id);

    return res.status(204).json(null);

  } catch (err) {
    return res.status(400).json(err);
  }
};

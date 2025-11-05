// app_api/controllers/locations.js
import mongoose from 'mongoose';
const Loc = mongoose.model('Location'); 

/* ──────────────────────────── */
/* [GET] 단일 장소 조회          */
/* ──────────────────────────── */
export const locationsReadOne = async (req, res) => {
  try {
    const { locationid } = req.params;
    const location = await Loc.findById(locationid).exec();

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    return res.status(200).json(location);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid locationid' });
    }
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* ──────────────────────────── */
/* [GET] 거리 기준 목록 조회     */
/* 12-2 규칙: distance는 숫자만  */
/* ──────────────────────────── */
export const locationsListByDistance = async (req, res) => {
  const lng = parseFloat(req.query.lng);
  const lat = parseFloat(req.query.lat);

  // 숫자 검증 (NaN 방지)
  if (Number.isNaN(lng) || Number.isNaN(lat)) {
    return res
      .status(400)
      .json({ message: 'lng and lat query parameters are required as numbers' });
  }

  const near = { type: 'Point', coordinates: [lng, lat] };

  // 필요 시 쿼리로 maxDistance 조절 가능(기본 200km = 200,000m)
  const maxDistance = req.query.maxDistance
    ? Number(req.query.maxDistance)
    : 200000;

  const geoOptions = {
    distanceField: 'distance.calculated',
    key: 'coords',
    spherical: true,
    maxDistance
  };

  try {
    const results = await Loc.aggregate([
      {
        $geoNear: {
          near,
          ...geoOptions
        }
      }
    ]);

    // ✅ 단위 제거: 숫자 그대로 반환 (m 단위)
    const locations = results.map(result => {
      return {
        id: result._id,
        name: result.name,
        address: result.address,
        rating: result.rating,
        facilities: result.facilities,
        distance: result.distance.calculated
      };
    });

    res
      .status(200)
      .json(locations);
  } catch (err) {
    res
      .status(404)
      .json(err);
  }
};

/* ──────────────────────────── */
/* [POST] 장소 생성              */
/* ──────────────────────────── */
export const locationsCreate = async (req, res) => {
  try {
    const location = await Loc.create({
      name: req.body.name,
      address: req.body.address,
      facilities: (req.body.facilities || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      // 스키마에 맞게 "배열"로 저장
      coords: [
        parseFloat(req.body.lng),
        parseFloat(req.body.lat)
      ],
      openingTimes: [
        {
          days: req.body.days1,
          opening: req.body.opening1,
          closing: req.body.closing1,
          // x-www-form-urlencoded면 문자열로 오므로 boolean 변환
          closed: String(req.body.closed1).toLowerCase() === 'true'
        },
        {
          days: req.body.days2,
          opening: req.body.opening2,
          closing: req.body.closing2,
          closed: String(req.body.closed2).toLowerCase() === 'true'
        }
      ]
    });

    return res.status(201).json(location);
  } catch (err) {
    return res.status(400).json(err);
  }
};

/* ──────────────────────────── */
/* [PUT] 장소 수정               */
/* ──────────────────────────── */
export const locationsUpdateOne = async (req, res) => {
  const { locationid } = req.params;
  if (!locationid) {
    return res.status(404).json({ message: 'Not found, locationid is required' });
  }

  try {
    // reviews, rating은 이번 수정 대상이 아니므로 제외(전송량/충돌 방지)
    const location = await Loc.findById(locationid)
      .select('-reviews -rating')
      .exec();

    if (!location) {
      return res.status(404).json({ message: 'locationid not found' });
    }

    // ── 입력값 전처리 및 검증 ───────────────────────────────
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'name is required' });

    const facilities =
      (req.body.facilities || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    const lng = parseFloat(req.body.lng);
    const lat = parseFloat(req.body.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return res.status(400).json({ message: 'lng/lat must be valid numbers' });
    }

    const days1 = (req.body.days1 || '').trim();
    const days2 = (req.body.days2 || '').trim();
    if (!days1 || !days2) {
      return res.status(400).json({ message: 'days1 and days2 are required' });
    }

    const closed1 = String(req.body.closed1).toLowerCase() === 'true';
    const closed2 = String(req.body.closed2).toLowerCase() === 'true';

    // ── 실제 필드 갱신 ─────────────────────────────────────
    location.name = name;
    location.address = req.body.address;
    location.facilities = facilities;

    // coords는 [lng, lat] 배열
    location.coords = [lng, lat];

    location.openingTimes = [
      {
        days: days1,
        opening: req.body.opening1,
        closing: req.body.closing1,
        closed: closed1
      },
      {
        days: days2,
        opening: req.body.opening2,
        closing: req.body.closing2,
        closed: closed2
      }
    ];

    const updated = await location.save();
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(400).json(err);
  }
};

/* ──────────────────────────── */
/* 평균 평점 갱신 유틸          */
/* ──────────────────────────── */
const doSetAverageRating = async (location) => {
  if (location.reviews && location.reviews.length > 0) {
    const total = location.reviews.reduce((sum, { rating }) => sum + rating, 0);
    location.rating = Math.round(total / location.reviews.length);
  } else {
    location.rating = 0;
  }
  await location.save();
};

const updateAverageRating = async (locationid) => {
  try {
    const location = await Loc.findById(locationid).select('rating reviews').exec();
    if (location) await doSetAverageRating(location);
  } catch (err) {
    console.error('updateAverageRating error:', err.message);
  }
};

/* ──────────────────────────── */
/* [PUT] 리뷰 수정               */
/* ──────────────────────────── */
export const reviewsUpdateOne = async (req, res) => {
  if (!req.params.locationid || !req.params.reviewid) {
    return res.status(404).json({
      message: 'Not found, locationid and reviewid are both required'
    });
  }

  try {
    const location = await Loc.findById(req.params.locationid)
      .select('reviews')
      .exec();

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    if (location.reviews && location.reviews.length > 0) {
      const thisReview = location.reviews.id(req.params.reviewid);
      if (!thisReview) {
        return res.status(404).json({ message: 'Review not found' });
      }

      // ✏️ 수정할 필드 반영
      thisReview.author = req.body.author ?? thisReview.author;
      thisReview.rating = Number(req.body.rating ?? thisReview.rating);
      thisReview.reviewText = req.body.reviewText ?? thisReview.reviewText;
      thisReview.createdOn = Date.now(); // 수정 시점으로 갱신해도 됨

      const updatedLocation = await location.save();

      // 평균 평점 재계산
      await updateAverageRating(updatedLocation._id);

      return res.status(200).json(thisReview);
    } else {
      return res.status(404).json({ message: 'No review to update' });
    }
  } catch (err) {
    return res.status(400).json(err);
  }
};

/* ──────────────────────────── */
/* [DELETE] 장소 삭제            */
/* ──────────────────────────── */
export const locationsDeleteOne = async (req, res) => {
  const { locationid } = req.params;
  if (!locationid) {
    return res.status(404).json({ message: 'No Location' });
  }

  try {
    const deleted = await Loc.findByIdAndDelete(locationid).exec(); // findByIdAndRemove도 OK
    if (!deleted) {
      return res.status(404).json({ message: 'locationid not found' });
    }
    // 204: 본문 없이 성공
    return res.status(204).send();
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid locationid' });
    }
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

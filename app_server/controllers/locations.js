// app_server/controllers/locations.js
import request from 'request';

const apiOptions = {
  server: 'http://localhost:3000'
};

/* 거리 포맷 함수는 그대로 */
const formatDistance = (distance) => {
  distance = parseFloat(distance);
  if (Number.isNaN(distance)) return '';

  let thisDistance = 0;
  let unit = 'm';

  if (distance > 1000) {
    thisDistance = parseFloat(distance / 1000).toFixed(1);
    unit = 'km';
  } else {
    thisDistance = Math.floor(distance);
  }
  return thisDistance + unit;
};

/* 공통 에러 렌더 */
export const showError = (req, res, status) => {
  let title = '';
  let content = '';

  if (status === 404) {
    title = '404, page not found';
    content = "Oh dear. Looks like you can't find this page. Sorry.";
  } else {
    title = `${status || 500}, something's gone wrong`;
    content = 'Something, somewhere, has gone just a little bit wrong.';
  }

  res.status(status || 500);
  res.render('generic-text', { title, content });
};

/* ❶ 공통으로 쓸 API 호출 함수 (교안 7.21 스타일) */
const getLocationInfo = (req, res, callback) => {
  const path = `/api/locations/${req.params.locationid}`;
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'GET',
    json: {}
  };

  request(requestOptions, (err, { statusCode } = {}, body) => {
    if (!err && statusCode === 200 && body) {
      // 좌표 배열이면 객체로 바꿔주기
      if (Array.isArray(body.coords) && body.coords.length === 2) {
        body.coords = {
          lng: body.coords[0],
          lat: body.coords[1]
        };
      }
      // ✅ 성공했으면 콜백으로 넘김
      callback(req, res, body);
    } else {
      // ❗ 실패하면 여기서 바로 공통 에러
      showError(req, res, statusCode);
    }
  });
};

/* 홈 화면은 그대로 */
const renderHomepage = (req, res, responseBody) => {
  let message = null;

  if (!(responseBody instanceof Array)) {
    message = 'API lookup error';
    responseBody = [];
  } else if (!responseBody.length) {
    message = 'No places found nearby';
  }

  res.render('locations-list', {
    title: 'Loc8r - find a place to work with wifi',
    pageHeader: { title: 'Loc8r', strapline: 'Find places to work with wifi near you!' },
    sidebar:
      "Looking for wifi and a seat? Loc8r helps you find places \
to work when out and about. Perhaps with coffee, cake or a pint? \
Let Loc8r help you find the place you're looking for.",
    locations: responseBody,
    message
  });
};

export const homelist = (req, res) => {
  const path = '/api/locations';
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'GET',
    json: {},
    qs: {
      lng: 127.264062,
      lat: 37.018769,
      maxDistance: 200000
    }
  };

  request(requestOptions, (err, { statusCode } = {}, body) => {
    let data = [];

    if (!err && statusCode === 200 && Array.isArray(body) && body.length) {
      data = body.map((item) => {
        item.distance = formatDistance(item.distance);
        return item;
      });
    }

    renderHomepage(req, res, data);
  });
};

/* ❷ 상세 페이지 렌더 함수 */
const renderDetailPage = (req, res, location) => {
  res.render('location-info', {
    title: location.name,
    pageHeader: { title: location.name },
    sidebar: {
      context:
        'is on Loc8r because it has accessible wifi and space to sit down with your laptop and get some work done.',
      callToAction:
        "If you've been and you like it - or if you don't - please leave a review to help other people just like you."
    },
    location
  });
};

/* ❸ 리뷰 폼 렌더 함수 */
const renderReviewForm = (req, res, location) => {
  res.render('location-review-form', {
    title: `Review ${location.name} on Loc8r`,
    pageHeader: { title: `Review ${location.name}` },
    error: req.query.err
  });
};

/* ❹ 상세 페이지 컨트롤러: 공통 함수 재사용 */
export const locationInfo = (req, res) => {
  getLocationInfo(req, res, (req, res, responseData) =>
    renderDetailPage(req, res, responseData)
  );
};

/* ❺ Add Review 컨트롤러: 공통 함수 재사용 */
export const addReview = (req, res) => {
  getLocationInfo(req, res, (req, res, responseData) =>
    renderReviewForm(req, res, responseData)
  );
};

// app_server/controllers/locations.js
export const doAddReview = (req, res) => {
  const locationid = req.params.locationid;
  const path = `/api/locations/${locationid}/reviews`;

  const postdata = {
    author: req.body.name,
    rating: parseInt(req.body.rating, 10),
    reviewText: req.body.review
  };

  // 14-5 핵심: 서버(app_server)에서 1차 검증 추가
  if (!postdata.author || !postdata.rating || !postdata.reviewText) {
    return res.redirect(`/location/${locationid}/review/new?err=val`);
  }

  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'POST',
    json: postdata
  };

  // API 요청 및 응답 처리
  request(requestOptions, (_err, { statusCode } = {}, body) => {
    if (statusCode === 201) {
      // 리뷰 등록 성공 → 상세 페이지로 이동
      res.redirect(`/location/${locationid}`);
    } 
    else if (statusCode === 400 && body?.name === 'ValidationError') {
      // API단에서도 검증 오류 → 다시 폼으로 이동 + 빨간 경고 표시
      res.redirect(`/location/${locationid}/review/new?err=val`);
    } 
    else {
      // 그 외 오류 → generic error 페이지 표시
      showError(req, res, statusCode);
    }
  });
};


// app_api/controllers/authentication.js
import passport from 'passport';
import mongoose from 'mongoose';

const User = mongoose.model('User');

/* ===== Register (Mongoose 7 대응) ===== */
export const register = async (req, res) => {
  try {
    // 필수 값 체크
    if (!req.body.name || !req.body.email || !req.body.password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // 새 User 생성
    const user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.setPassword(req.body.password);

    // await 방식으로 DB 저장
    await user.save();

    // JWT 생성
    const token = user.generateJwt();
    return res.status(200).json({ token });

  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};


/* ===== Login ===== */
export const login = (req, res) => {
  // 이메일/비밀번호 체크
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ message: "All fields required" });
  }

  passport.authenticate('local', (err, user, info) => {
    // 에러 발생
    if (err) {
      return res.status(404).json(err);
    }

    // 인증 성공 → JWT 발급
    if (user) {
      const token = user.generateJwt();
      return res.status(200).json({ token });
    }

    // 인증 실패
    return res.status(401).json(info);

  })(req, res);
};

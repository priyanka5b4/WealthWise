const jwt = require('jsonwebtoken');
const envConfig = require('../config/config').get_config();

exports.verifyToken = (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(' ')[0] === 'Bearer'
  ) {
    req.user = {};
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, envConfig.jwtSecretKey, (err, tokenData) => {
      if (err && err.name === 'TokenExpiredError') {
        res.json({ status: false, message: err.name });
      } else if (err) {
        res
          .status(400)
          .json({ status: false, message: 'Request Unauthorized' });
      } else if (tokenData) {
        req.user = tokenData;
        next();
      }
    });
    return;
  }
  res.json({ status: false, message: 'Token Not Found' });
};

exports.generateToken = (user) => {
  console.log(`GENERATING TOKEN FOR ${JSON.stringify(user)}`);
  const token = {
    email: user.email,
    _id: user._id,
    businessName: user.businessName,
  };
  console.log(token);
  return jwt.sign(token, envConfig.jwtSecretKey, { expiresIn: '30 days' });
};

// decode a token
exports.decodeToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(' ')[0] === 'Bearer'
  ) {
    req.user = {};
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, envConfig.jwtSecretKey, (err, tokenData) => {
      if (tokenData) {
        req.user = tokenData;
      }
    });
  }
};

const User = require('../../modules/User/user.model');
const middleware = require('../middleware/verifyUser');

// eslint-disable-next-line consistent-return
exports.apiLogin = async (req, res) => {
  console.log('Chex');
  try {
    const { email, password } = req.body;
    console.log(req.body);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(500).json({
        status: false,
        message: 'Email not registered, please register',
      });
    }
    if (user.validPassword(password)) {
      // Needed in generateToken
      const token = middleware.generateToken(user);
      res
        .status(200)
        .json({ status: true, token, message: 'Login Successful' });
    } else {
      res.status(500).json({ status: false, message: 'Invalid Credentials' });
    }
  } catch (error) {
    console.log('error', error);
    res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
};

exports.apiSignUp = async (req, res) => {
  console.log('Check');
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });

    if (!user) {
      const details = req.body;
      const user = new User(details);
      user.password = user.generateHash(user.password);
      user.save((err) => {
        if (err) {
          console.log('Error while Signing up: ', err);
          res
            .status(500)
            .json({ status: false, message: 'Internal Server Error' });
        } else {
          res.status(200).json({
            status: true,
            message: 'Account Created Successfully! Login',
          });
        }
      });
    } else
      res
        .status(500)
        .json({ status: false, message: 'Account exists!Please login' });
  } catch (error) {
    console.log('error', error);
    res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
};

exports.apiResetPass = async function (req, res) {
  console.log('chk');
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    console.log(user);
    if (!user) {
      res.status(500).json({ status: false, message: 'Invalid userMailId' });
    } else {
      user.password = user.generateHash(req.body.newPassword);
      await user.save((err) => {
        if (err) {
          console.log('Error while Signing up: ', err);
          res
            .status(500)
            .json({ status: false, message: 'Internal Server Error' });
        } else {
          res
            .status(200)
            .json({ status: true, message: 'updated password Successfully' });
        }
      });
    }
  } catch (error) {
    console.log('error', error);
    res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
};

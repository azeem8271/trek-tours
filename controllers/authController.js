const jwt = require('jsonwebtoken');

const { promisify } = require('util');
const crypto = require('crypto');

const User = require('../models/userModel');
const catchAsyncError = require('../utils/catchAsyncErrors');
const AppError = require('../utils/appErrors');
const sendMail = require('../utils/emails');

// **************************************************************
// *******************  Helper Functions  ***********************
// **************************************************************
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined; // So that password has don't show up
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// **************************************************************
// *******************  AUTH CONTROLLERS  ***********************
// **************************************************************
exports.signUp = catchAsyncError(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createAndSendToken(newUser, 201, res);
});

exports.logIn = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const error = new AppError('Please Provide both Email and Password', 400);
    return next(error);
  }

  const user = await User.findOne({ email: email }).select('+password');
  if (!user || !(await user.isPasswordCorrect(password, user.password))) {
    const error = new AppError('Incorrect email or password', 401);
    return next(error);
  }

  createAndSendToken(user, 200, res);
});

exports.protect = catchAsyncError(async (req, res, next) => {
  // 1.) Check if header contains a JWT Tokin
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged In, Please log In first', 401),
    );
  }

  // 2.) Check authenticity of Token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3.) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The User belonging to this token does not exists', 401),
    );
  }

  // 4.) Check if user has changed password after the token was issued
  if (currentUser.hasPasswordChangedAfter(decoded.iat)) {
    return next(
      new AppError('Password has changed, please login again !..', 401),
    );
  }
  // 5.) if everything is fine, then allow access
  req.user = currentUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You don not have permission to perform this action', 403),
      );
    }
    next();
  };

exports.frogotPassword = catchAsyncError(async (req, res, next) => {
  // Check if email is Vaild
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('User does not exists with this email', 404));
  }

  // Generate a Random Password Reset Token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send token to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/resetPassword/${resetToken}`;

  const message = `Forgot your password? Send a patch request with new password and password confirm to: ${resetURL}\nIf you did not forget your password, Please ignore this mail`;

  try {
    await sendMail({
      email: user.email,
      subject: 'Your password reset token (valid for only 10 min)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to registered Email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('Error sending Reset Token Mail, try again later!', 500),
    );
  }
});

exports.resetPassword = catchAsyncError(async (req, res, next) => {
  // 1.) Get the user based upon token
  const encryptedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: encryptedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2.) if(token has not expired && user exists), set password
  if (!user) {
    return next(new AppError('Either token is invalid or expired', 400));
  }

  // 3.) update Password properties for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4.) log the user in i.e. send a new JWT token
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsyncError(async (req, res, next) => {
  // 1.) take out current user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2.) check user and provided current password === stored password
  if (
    !(await user.isPasswordCorrect(req.body.currentPassword, user.password))
  ) {
    const error = new AppError('Provided password is Incorrect', 401);
    return next(error);
  }

  // 3.) Then update password in Database
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4.) log user In, and send new JWT
  createAndSendToken(user, 200, res);
});

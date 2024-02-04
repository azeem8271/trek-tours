const User = require('../models/userModel');
const AppError = require('../utils/appErrors');
const catchAsyncErrors = require('../utils/catchAsyncErrors');
const factory = require('./handleFactory');

// **************************************************************
// *******************  HELPER FUNCTIONS  ***********************
// **************************************************************
const filterAllowedFields = (body, ...allowedFields) => {
  const newBody = {};
  Object.keys(body).forEach((field) => {
    if (allowedFields.includes(field)) {
      newBody[field] = body[field];
    }
  });
  return newBody;
};

// **************************************************************
// *******************  USER CONTROLLERS  ***********************
// **************************************************************
exports.updateMe = catchAsyncErrors(async (req, res, next) => {
  // 1.) if user tries to update password create error
  if (req.body.password || req.body.passwordConfirm) {
    next(
      new AppError(
        'This route is not for password updation. Please use /updateMyPassword',
        404,
      ),
    );
  }
  // 2.) filtered out unwanted fields name
  const filteredBody = filterAllowedFields(req.body, 'name', 'email');
  // 2.) else update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsyncErrors(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// **************************************************************
// ******************  ADMIN CONTROLLERS  ***********************
// **************************************************************
exports.createUser = (req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please use /signUp instead',
  });
};

// exports.getAllUsers = catchAsyncErrors(async (req, res) => {
//   const users = await User.find();
//   res.status(200).json({
//     status: 'success',
//     length: users.length,
//     users,
//   });
// });
exports.getAllUsers = factory.getAll(User);

exports.getUserById = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

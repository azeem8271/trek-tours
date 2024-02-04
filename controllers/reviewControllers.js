const Review = require('../models/reviewModel');
const factory = require('./handleFactory');

// **************************************************************
// *******************  HELPER MIDDLEWARE  **********************
// **************************************************************
exports.setTourAndUserIds = (req, res, next) => {
  // Allow nested routes eg: /tours/:tourId/reviews
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// **************************************************************
// ******************  REVIEW CONTROLLERS  **********************
// **************************************************************
exports.getAllReviews = factory.getAll(Review);
exports.getReviewById = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

// catchAsyncErrors(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   const reviews = await Review.find(filter);
//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

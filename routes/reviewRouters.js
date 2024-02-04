const express = require('express');
const reviewController = require('../controllers/reviewControllers');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

// **************************************************************
// authController.protect middleware protects all routes below it
// **************************************************************
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourAndUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReviewById)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  );

module.exports = router;

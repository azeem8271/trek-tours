const express = require('express');
const reviewRouter = require('./reviewRouters');
const tourController = require('../controllers/tourControllers');
const authController = require('../controllers/authController');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTop5Cheap, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStatsByDifficulty);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('guide', 'lead-guide', 'admin'),
    tourController.getMonthlyPlan,
  );

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('lead-guide', 'admin'),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTourById)
  .patch(
    authController.protect,
    authController.restrictTo('lead-guide', 'admin'),
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('lead-guide', 'admin'),
    tourController.deleteTour,
  );

module.exports = router;

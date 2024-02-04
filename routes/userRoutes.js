const express = require('express');
const userController = require('../controllers/userControllers');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.logIn);
router.post('/forgotPassword', authController.frogotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// **************************************************************
// authController.protect middleware protects all routes below it
// **************************************************************
router.use(authController.protect);

router.get('/me', userController.getMe, userController.getUserById);
router.patch('/updateMe', userController.updateMe);
router.patch('/updateMyPassword', authController.updatePassword);
router.delete('/deleteMe', userController.deleteMe);

// *****************************************************************
// authController.restrictTo('admin') middleware allow to admin only
// *****************************************************************
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;

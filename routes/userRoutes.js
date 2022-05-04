const express = require('express');
const multer = require('multer');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');



const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// using middleware to protect the rest routes
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.heicToJpeg,
  userController.resizeUserImage,
  userController.updateMe
);
router.patch('/deleteMe', userController.deleteMe);

router.route('/').get(userController.getAllUsers);
// .post(userController.createUser());

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;

const multer = require('multer');
const sharp = require('sharp');
const heicConvert = require('heic-convert');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handleFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-userId-currentTimeStamp.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });const multerStorage = multer.memoryStorage();
//
// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image')) {
//     cb(null, true);
//   } else {
//     cb(new AppError('Not an image! Please upload only images', 400), false);
//   }
// };
//
// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter,
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    // console.log(el);
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.uploadUserPhoto = upload.single('photo');

exports.heicToJpeg = catchAsync(async (req, res, next) => {
  if (!req.file.mimetype.endsWith('heic')) return next();
  const outputBuffer = await heicConvert({
    buffer: req.file.buffer,
    format: 'JPEG',
  });

  req.file.mimetype = 'image/jpeg';
  req.file.buffer = outputBuffer;

  next();
});

exports.resizeUserImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  // console.log(req.file);

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.getMe = (req, res, next) => {
  // console.log(req.user.id);
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  // 1) create error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('this route is not used for password updates', 400)
    );
  }

  // 2) Update user document
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

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

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// exports.createUser = (req, res, next) => {
//   res.status(404).json({
//     status: 'fail',
//     message: 'use sign up route',
//   });
// };

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

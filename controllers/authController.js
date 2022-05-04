const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util'); // built it node module to promisify something

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res, req = undefined) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, //makes sure cookies only work through http and cannot be edited by any browser to eliminate XSS
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  user.password = undefined;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: user,
  });
};

exports.signup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  console.log('email sent');

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if email and password exists
  console.log('login side');
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  console.log(email, password);

  // 2) check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');
  // return "null" if nothin found
  // appending + to make password visible again

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) if everything is OK, send token to client

  createSendToken(user, 200, res, req);
});

//PROTECTING routes
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and checking if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ').at(1);
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token || token === 'null') {
    return next(new AppError('you are not logged in', 401));
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //going to use the decoded payload to get that id

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('user belonging to this token no longer exixts', 401)
    );
  }
  // 4) Check if user changed password after the JWT token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//only for rendered pages
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    // 2) Verification token
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );
    //going to use the decoded payload to get that id

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next();
    }
    // 4) Check if user changed password after the JWT token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }

    //there is a logged user
    res.locals.user = currentUser;
    return next();
  }
  next();
});

exports.logout = (req, res) => {
  try {
    // res.cookie('jwt', 'loggedOut', {
    //   expires: new Date(Date.now() + 10 * 1000),
    //   httpOnly: true,
    // });
    res.clearCookie('jwt');
    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.log(err);
  }
};

exports.restrictTo =
  (...roles) =>
  //good use case for closures
  (req, _res, next) => {
    //roles ['admin', 'lead-guide']
    console.log(req.user.role);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to access this', 403)
      );
    }

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed emails
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('there is no user with that email address', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //removes all previous validators like password, required, e.t.c

  //after pragmatically adding a new field, do model.save()

  // 3) Send it to users email using nodemailer
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request to reset your password. ${resetURL}`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: `This is akpor kofi, i've been learning node and i've come accross that gmail problem`,
    //   message,
    // });
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'sucess',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('there was an error with the email, try again', 500)
    );
  }
});

exports.resetPassword = async (req, res, next) => {
  // 1) Get User based on the tokens
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() - 2000 },
  });

  console.log(user);

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired'));
  }
  // modisying and not updateing the document so must save
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) logged the user in, send JWT
  createSendToken(user, 200, res);
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const { passwordCurrent, password, passwordConfirm } = req.body;
  const user = await User.findOne({ _id: req.user.id }).select('+password'); //select("+password") cause it is invisible

  // 2) Check if POSTED current password is correct
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError('Password is wrong', 401));
  }

  // 3) if so, update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});

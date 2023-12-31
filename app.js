const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appErrors');
const globalErrorHandler = require('./controllers/errorControllers');
const reviewRouter = require('./routes/reviewRouters');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// **************************************************************
// *******************  GLOBAL MIDDLEWARES  *********************
// **************************************************************
// set secure http headers
app.use(helmet());

// development logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// set rate limit for same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, Please try after in 1 hour!..',
});
app.use('/api', limiter);

// body parser: data -> req.body
app.use(express.json({ limit: '10kb' }));

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

// data sanitization against Cross-site scripting / XSS attacks
app.use(xss());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// serving static files
app.use(express.static(`${__dirname}/public`));

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers)
  next();
});

// **************************************************************
// *******************  RESOURCE ROUTES  ************************
// **************************************************************
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// **************************************************************
// ****************  INVALID ROUTES HANDLER  ********************
// **************************************************************
app.all('*', (req, res, next) => {
  const error = new AppError(
    `Can't find { ${req.originalUrl} } route on this server !..`,
    404,
  );
  next(error);
});

// **************************************************************
// ****************  GLOBAL ERROR HANDLER  **********************
// **************************************************************
app.use(globalErrorHandler);

module.exports = app;

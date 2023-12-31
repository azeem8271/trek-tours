const mongoose = require('mongoose');
const slugify = require('slugify');

// **************************************************************
// *********************  TOUR SCHEMA  **************************
// **************************************************************
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name must have less than or equal to 40 characters',
      ],
      minlength: [
        3,
        'A tour name must have grater than or equal to 3 characters',
      ],
    },
    slug: String,
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings Average must be greater than or equal to 1.0'],
      max: [5, 'Ratings Average must be smaller than or equal to 5.0'],
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // only run on creation not on updation
        validator: function (discountPrice) {
          return this.price >= discountPrice;
        },
        message: 'Error: Discount Price is greater than Price itself !..',
      },
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a dutation'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a max group size'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    difficulty: {
      type: String,
      require: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficulty must be in: [easy, medium, difficult] ',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: { type: String, trim: true },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a image'],
    },
    images: [String],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // mongoDb GeoJson
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// fields that need not to be stored: can be drived from existing fields
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// **************************************************************
// **************  PRE-SAVE MIDDLEWARE HOOKS  *******************
// **************************************************************
// DOCUMENT MIDDLEWARE: runs before .save() | .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// // DOCUMENT MIDDLEWARE: To impliment user embedding
// tourSchema.pre('save', async function (next) {
//   const guidePromices = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidePromices);
//   next();
// });

// QUERY MIDDLEWARE:
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

// **************************************************************
// **********************  TOUR MODEL  **************************
// **************************************************************
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;

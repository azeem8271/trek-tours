const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// **************************************************************
// *********************  USER SCHEMA  **************************
// **************************************************************
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'A user must have a email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid Email'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'A user must provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A user must confirm their password'],
    validate: {
      validator: function (confirmPassword) {
        return this.password === confirmPassword;
      },
      message: 'Opps!, password and password Confirm are not same',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// **************************************************************
// **************  PRE-SAVE MIDDLEWARE HOOKS  *******************
// **************************************************************
// DOCUMENT MIDDLEWARE: runs only on .save() | .create()
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  this.passwordConfirm = undefined;
  next();
});

// DOCUMENT MIDDLEWARE: runs only on .save() | .create()
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// QUERY MIDDLEWARE:
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// **************************************************************
// *******************  INSTANCE METHODS  ***********************
// **************************************************************
userSchema.methods.isPasswordCorrect = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.hasPasswordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const lastPasswordUpdation = this.passwordChangedAt.getTime() / 1000;
    return lastPasswordUpdation > JWTTimestamp;
  }
  return false;
};

userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  console.log({ token, hash: this.passwordResetToken });
  return token;
};

// **************************************************************
// **********************  USER MODEL  **************************
// **************************************************************
const User = mongoose.model('User', userSchema);
module.exports = User;

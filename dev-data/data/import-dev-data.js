const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// mongoose
//   .connect(DB)
//   .then(() => console.log('Connected to Natours DB'))
//   .catch((err) => console.log('Error occured : ', err.message));

// Read data from file
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours.json`, { encoding: 'utf-8' }),
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/users.json`, { encoding: 'utf-8' }),
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, { encoding: 'utf-8' }),
);

// Add data to database
const importData = async () => {
  try {
    await mongoose.connect(DB);
    console.log('Connected to Natours DB');
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Tours, Users & Reviews data Successfully added to Natours...');
  } catch (error) {
    console.log(error);
  } finally {
    process.exit();
  }
};

// Delete previous data
const deleteData = async () => {
  try {
    await mongoose.connect(DB);
    console.log('Connected to Natours DB');
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Tours, Users & Reviews deleted Successfully...');
  } catch (error) {
    console.log(error);
  } finally {
    process.exit();
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

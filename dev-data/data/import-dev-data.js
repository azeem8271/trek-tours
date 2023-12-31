const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

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

// Add data to database
const importData = async () => {
  try {
    await mongoose.connect(DB);
    console.log('Connected to Natours DB');
    await Tour.insertMany(tours);
    console.log('data Successfully added to Natours Tours');
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
    console.log('data deleted Successfully');
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

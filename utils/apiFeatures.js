class APIFeatures {
  constructor(mongooseQuery, expressQueryObj) {
    this.mongooseQuery = mongooseQuery;
    this.expressQueryObj = expressQueryObj;
  }

  filter() {
    // Remove extra Fields
    const queryObj = { ...this.expressQueryObj };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((field) => delete queryObj[field]);
    // Make proper nested objects with operaters
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.expressQueryObj.sort) {
      const sortBy = this.expressQueryObj.sort.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.expressQueryObj.fields) {
      const fields = this.expressQueryObj.fields.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select('-__v');
    }
    return this;
  }

  paginate() {
    const { page = 1, limit = 10 } = this.expressQueryObj;
    const skip = (page - 1) * limit;
    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;

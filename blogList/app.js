const config = require('./utils/config');
const express = require('express');
require('express-async-errors');
const app = express();
const cors = require('cors');
const blogsRouter = require('./controllers/blogs');
const logger = require('./utils/logger');
const middleware = require('./utils/middleware');
const mongoose = require('mongoose');
const loginRouter = require('./controllers/login');
const usersRouter = require('./controllers/users');

mongoose.set('strictQuery', false);

logger.info('connecting to', config.MONGODB_URI);

const connectDB = async () => {
  mongoose
    .connect(config.MONGODB_URI)
    .then(() => {
      logger.info('connected to MongoDB');
    })
    .catch((error) => {
      logger.error('error connecting to MongoDB:', error.message);
    });
};

app.use(cors());
// app.use(express.static("dist"));
app.use(express.json());
// app.use(middleware.requestLogger);

app.use(middleware.tokenExtractor);

app.use('/api/blogs', middleware.userExtractor, blogsRouter);

app.use('/api/login', loginRouter);

app.use('/api/users', usersRouter);

if (process.env.NODE_ENV === 'test') {
  const testingRouter = require('./controllers/testing');
  app.use('/api/testing', testingRouter);
}

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

connectDB();

module.exports = { app, connectDB };

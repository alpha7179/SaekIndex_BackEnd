// src/app.js
const express = require('express');
const cors = require('cors');
const surveysRouter = require('./routes/surveys.routes');
const notFound = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');
const mongoose = require('mongoose');

function createApp() {
  const app = express();

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  app.get('/health', (req, res) => {
    const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    res.json({ status: 'ok', db: state });
  });

  app.use('/api/surveys', surveysRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
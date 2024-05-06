const fs = require('fs');

// Middleware function to log API calls
function apiLogger(req, res, next) {
  const { method, url, body } = req;
  const metadata = {
    route: req.originalUrl,
    buttonClicked: req.headers['button-clicked'],
    // Add more metadata as needed
  };
  const logData = {
    timestamp: new Date().toISOString(),
    method,
    url,
    metadata,
    body,
  };
  const logString = JSON.stringify(logData);

  // Write log to file
  fs.appendFile('api_logs.txt', logString + '\n', (err) => {
    if (err) {
      console.error('Error writing log:', err);
    }
  });

  next();
}

module.exports = apiLogger;

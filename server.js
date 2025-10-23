// server.js
require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('_middleware/error-handler');
const positionRoutes = require('./positions');

// Database initialization
const db = require('_helpers/db');

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Allow CORS from any origin with credentials
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  })
);

// Routes
const accountRoutes = require('./accounts/accounts.controller');
const employeeRoutes = require('./employees/employee.controller');
const departmentRoutes = require('./departments');
const requestRoutes = require('./requests');

app.use('/accounts', accountRoutes);
app.use('/employees', employeeRoutes);
app.use('/departments', departmentRoutes);
app.use('/requests', requestRoutes);
app.use('/positions', positionRoutes);

// Employee workflow routes
app.use('/employee-workflows', require('./employees/employee-workflow.controller'));

// Global error handler
app.use(errorHandler);

// Start server
const port = process.env.NODE_ENV === 'production' ? process.env.PORT || 80 : 4000;
app.listen(port, () => console.log(`Server listening on port ${port}`));

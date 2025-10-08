// server.js
require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('_middleware/error-handler');

// middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// allow cors requests from any origin and with credentials
//app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));
// ✅ CORS configuration for HTTPS production
const allowedOrigins = [
  'https://api-angular-frontend-mu.vercel.app/', // 👈 replace this with your actual frontend URL
  'http://localhost:4200' // keep localhost for testing
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (e.g., mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));






// api routes
const accountRoutes = require('./accounts/accounts.controller');
const employeeRoutes = require('./employees/employee.controller');
const departmentRoutes = require('./departments');
const requestRoutes = require('./requests');

// mount routes
app.use('/accounts', accountRoutes);
app.use('/employees', employeeRoutes);
app.use('/departments', departmentRoutes);
app.use('/requests', requestRoutes);

// mount workflow routes (separate to avoid conflict)
app.use('/employee-workflows', require('./employees/employee-workflow.controller'));

// global error handler
app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => console.log('Server listening on port ' + port));

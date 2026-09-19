const express = require('express');
const path = require('path');
const hbs = require('express-handlebars');
require('dotenv').config();

const app = express();
app.disable('x-powered-by');

const publicPath = path.join(__dirname, 'public');

// Configure Handlebars
app.engine('handlebars', hbs({
  defaultLayout: 'dashboardLayout',
  helpers: {
    json: (context) => JSON.stringify(context),
    eq: (a, b) => a === b,
    gt: (a, b) => a > b
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(publicPath));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
const indexRoute = require('./routers/index');
app.use('/', indexRoute);
app.use('/dashboard', indexRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`YouTube Channel Analyzer running on port ${PORT}`);
});

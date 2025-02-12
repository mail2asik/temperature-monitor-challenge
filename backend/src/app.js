require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const mongoose = require("mongoose");
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const Temperature = require("./models/temperatureModel");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const { time } = require('console');

var app = express();

// Set up CORS options
const corsOptions = {
  origin: process.env.CLIENT_APP_HOST, // Replace with your React app URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

// Apply CORS middleware
app.use(cors(corsOptions));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_APP_HOST, // Replace with your React app URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Wait for database to connect, logging an error if there is a problem
const mongoDB = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/temperature`;
mongoose.set("strictQuery", false);
main().catch((err) => console.log(err));
async function main() {
  console.log('Mongodb connection done');
  await mongoose.connect(mongoDB);
}

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Socket server listening
server.listen(process.env.SOCKET_PORT, () => console.log(`Server running on port ${process.env.SOCKET_PORT}`));

// Update every minutes
const intervals = new Map();
const updateTemperature = async (socket, city) => {
  const temperature = await getTemperature(city);
  socket.emit('temperatureUpdate', { city, temperature, status: (temperature <= process.env.TEMP_NORMAL) ? 'NORMAL' : 'HIGH', timestamp: new Date().toISOString() });
};

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('getTemperature', async (city) => {
    const temperature = await getTemperature(city);
    socket.emit('temperatureUpdate', { city, temperature, status: (temperature <= process.env.TEMP_NORMAL) ? 'NORMAL' : 'HIGH', timestamp: new Date().toISOString() });

    // Clear any existing interval for this socket
    if (intervals.has(socket.id)) {
      clearInterval(intervals.get(socket.id));
    }

    // Set interval to update temperature every 60 seconds
    const interval = setInterval(() => updateTemperature(socket, city), 60000);
    intervals.set(socket.id, interval);
  });

  socket.on('getRecentTemperatures', async (city) => {
    const recentTemperatures = await Temperature.find({ city })
      .sort({ timestamp: -1 }) // Sort by timestamp in descending order
      .limit(5); // Limit to the most recent 5 records

      socket.emit('recentTemperatures', recentTemperatures);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');

    if (intervals.has(socket.id)) {
      clearInterval(intervals.get(socket.id));
      intervals.delete(socket.id);
    }
  });

});

// Get Temperature from external service
const getTemperature = async (city) => {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?appid=${process.env.OPEN_WEATHER_APP_KEY}&q=${city}&units=metric`);
  const data = await response.json();
  const temperature = data.main.temp;

  // Insert into DB
  const newTemperature = new Temperature({
    city,
    temperature,
    rawData: data
  });

  await newTemperature.save();

  return temperature;
};

module.exports = app;

// temperatureModel.js
const mongoose = require('mongoose');

const temperatureSchema = new mongoose.Schema({
  city: String,
  temperature: Number,
  rawData: Object,
  timestamp: { type: Date, default: Date.now }
});

const Temperature = mongoose.model('Temperature', temperatureSchema);

module.exports = Temperature;
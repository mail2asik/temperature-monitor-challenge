// temperatureModel.js
const mongoose = require('mongoose');

const temperatureSchema = new mongoose.Schema({
  city: String,
  temperature: Number,
  rawData: Object,
  timestamp: { type: Date, default: Date.now }
});

// Define a virtual property 'status'
temperatureSchema.virtual('status').get(function() {
  return (this.temperature <= process.env.TEMP_NORMAL) ? 'NORMAL' : 'HIGH';
});

// Ensure virtual fields are included in toJSON
temperatureSchema.set('toJSON', { virtuals: true });

const Temperature = mongoose.model('Temperature', temperatureSchema);

module.exports = Temperature;
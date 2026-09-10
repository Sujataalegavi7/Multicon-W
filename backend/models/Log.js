const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  userName: {
    type: String,
    default: 'System',
  },
  action: {
    type: String,
    required: true,
  },
  paper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paper',
    default: null,
  },
  paperTitle: {
    type: String,
    default: null,
  },
  ip: {
    type: String,
    default: 'unknown',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

logSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Log', logSchema);

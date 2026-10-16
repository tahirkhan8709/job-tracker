const mongoose = require('mongoose');

const STATUSES = ['wishlist', 'applied', 'interview', 'offer', 'rejected'];

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: { type: String, required: [true, 'Company is required'], trim: true },
    position: { type: String, required: [true, 'Position is required'], trim: true },
    location: { type: String, trim: true },
    jobUrl: { type: String, trim: true },
    salary: { type: String, trim: true },
    status: { type: String, enum: STATUSES, default: 'wishlist' },
    order: { type: Number, default: 0 }, // position inside its column
    appliedDate: Date,
    deadline: Date,
    notes: { type: String, maxlength: 5000 },
    contacts: [
      {
        name: String,
        email: String,
        role: String,
      },
    ],
    timeline: [
      {
        event: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);
module.exports.STATUSES = STATUSES;

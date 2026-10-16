const mongoose = require('mongoose');
const Application = require('../models/Application');
const { STATUSES } = require('../models/Application');

// Only these fields can be set by the client (blocks sneaking in `user`, etc.)
const ALLOWED_FIELDS = [
  'company',
  'position',
  'location',
  'jobUrl',
  'salary',
  'status',
  'appliedDate',
  'deadline',
  'notes',
  'contacts',
  'timeline',
];

const pickAllowed = (body) => {
  const data = {};
  ALLOWED_FIELDS.forEach((key) => {
    if (body[key] !== undefined) data[key] = body[key];
  });
  return data;
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/applications?status=applied&search=google
const getApplications = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };

    if (req.query.status) {
      if (!STATUSES.includes(req.query.status)) {
        res.status(400);
        throw new Error('Invalid status filter');
      }
      filter.status = req.query.status;
    }

    if (req.query.search) {
      const regex = new RegExp(escapeRegex(String(req.query.search)), 'i');
      filter.$or = [{ company: regex }, { position: regex }];
    }

    const applications = await Application.find(filter).sort({ status: 1, order: 1 });
    res.json(applications);
  } catch (err) {
    next(err);
  }
};

// POST /api/applications
const createApplication = async (req, res, next) => {
  try {
    const data = pickAllowed(req.body);
    const status = data.status || 'wishlist';

    // New cards go to the bottom of their column
    const count = await Application.countDocuments({ user: req.user._id, status });

    const application = await Application.create({
      ...data,
      status,
      order: count,
      user: req.user._id,
    });

    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
};

// GET /api/applications/:id
const getApplication = async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, user: req.user._id });
    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }
    res.json(application);
  } catch (err) {
    next(err);
  }
};

// PUT /api/applications/:id
const updateApplication = async (req, res, next) => {
  try {
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      pickAllowed(req.body),
      { new: true, runValidators: true }
    );
    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }
    res.json(application);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/applications/:id/status   body: { status, order }
// Called after a drag-and-drop. Moves the card and makes room in the target column.
const updateStatus = async (req, res, next) => {
  try {
    const { status, order } = req.body;

    if (!STATUSES.includes(status)) {
      res.status(400);
      throw new Error(`Status must be one of: ${STATUSES.join(', ')}`);
    }
    const newOrder = Number.isInteger(order) && order >= 0 ? order : 0;

    const application = await Application.findOne({ _id: req.params.id, user: req.user._id });
    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    const previousStatus = application.status;
    const columnOrder = { order: 1, createdAt: 1 };

    // Re-number the destination column with the dropped card at its new position
    const destination = await Application.find({
      user: req.user._id,
      status,
      _id: { $ne: application._id },
    })
      .sort(columnOrder)
      .select('_id');

    const position = Math.min(newOrder, destination.length);
    const destinationIds = destination.map((d) => d._id);
    destinationIds.splice(position, 0, application._id);

    const operations = destinationIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, user: req.user._id },
        update: { $set: { order: index } },
      },
    }));

    // If the card changed columns, close the gap it left behind
    if (previousStatus !== status) {
      const source = await Application.find({
        user: req.user._id,
        status: previousStatus,
        _id: { $ne: application._id },
      })
        .sort(columnOrder)
        .select('_id');

      source.forEach((doc, index) => {
        operations.push({
          updateOne: {
            filter: { _id: doc._id, user: req.user._id },
            update: { $set: { order: index } },
          },
        });
      });
    }

    await Application.bulkWrite(operations);

    application.status = status;
    application.order = position;

    // Moving to "applied" for the first time sets the applied date
    if (status === 'applied' && !application.appliedDate) {
      application.appliedDate = new Date();
    }
    // Record the move in the timeline
    if (previousStatus !== status) {
      application.timeline.push({ event: `Moved to ${status}`, date: new Date() });
    }

    await application.save();
    res.json(application);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/applications/:id
const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }
    res.json({ message: 'Application deleted', id: application._id });
  } catch (err) {
    next(err);
  }
};

// GET /api/applications/stats
const getStats = async (req, res, next) => {
  try {
    const rows = await Application.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    rows.forEach((r) => (byStatus[r._id] = r.count));

    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    // Everything past "wishlist" counts as an application actually sent
    const sent = total - byStatus.wishlist;
    const interviewRate = sent > 0 ? Math.round(((byStatus.interview + byStatus.offer) / sent) * 100) : 0;

    res.json({ total, byStatus, interviewRate });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getApplications,
  createApplication,
  getApplication,
  updateApplication,
  updateStatus,
  deleteApplication,
  getStats,
};
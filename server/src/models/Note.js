const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 50000
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: (tags) => tags.length <= 20 && tags.every((tag) => tag.length <= 40),
      message: 'Tags must contain no more than 20 entries of 40 characters each'
    }
  },
  pinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, result) => {
      result.id = result._id.toString();
      delete result._id;
      delete result.__v;
      delete result.user;
      return result;
    }
  }
});

module.exports = mongoose.model('Note', noteSchema);

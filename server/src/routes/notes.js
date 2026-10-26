const express = require('express');
const mongoose = require('mongoose');
const Note = require('../models/Note');
const authenticate = require('../middleware/authenticate');

const router = express.Router();
router.use(authenticate);

function isValidNoteId(id) {
  return mongoose.isValidObjectId(id);
}

function validateNoteFields(fields, partial = false) {
  const allowed = ['title', 'content', 'tags', 'pinned'];
  const keys = Object.keys(fields);
  if (!keys.length || keys.some((key) => !allowed.includes(key))) {
    return 'Provide one or more valid note fields: title, content, tags, pinned';
  }
  if (!partial && (!Object.hasOwn(fields, 'title') || !Object.hasOwn(fields, 'content'))) {
    return 'Title and content are required';
  }
  if (Object.hasOwn(fields, 'title') &&
      (typeof fields.title !== 'string' || !fields.title.trim() || fields.title.length > 200)) {
    return 'Title must be a non-empty string of at most 200 characters';
  }
  if (Object.hasOwn(fields, 'content') &&
      (typeof fields.content !== 'string' || fields.content.length > 50000)) {
    return 'Content must be a string of at most 50000 characters';
  }
  if (Object.hasOwn(fields, 'tags') &&
      (!Array.isArray(fields.tags) || fields.tags.length > 20 ||
        fields.tags.some((tag) => typeof tag !== 'string' || tag.trim().length > 40))) {
    return 'Tags must be an array of at most 20 strings, each no longer than 40 characters';
  }
  if (Object.hasOwn(fields, 'pinned') && typeof fields.pinned !== 'boolean') {
    return 'Pinned must be a boolean';
  }
  return null;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', async (req, res, next) => {
  const { search, tag } = req.query;
  if ((search !== undefined && typeof search !== 'string') ||
      (tag !== undefined && typeof tag !== 'string')) {
    return res.status(400).json({ error: 'Search and tag filters must be strings' });
  }
  if ((search && search.length > 200) || (tag && tag.length > 40)) {
    return res.status(400).json({ error: 'Search must be at most 200 characters and tag at most 40' });
  }

  const filter = { user: req.userId };
  if (search && search.trim()) {
    const searchPattern = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ title: searchPattern }, { content: searchPattern }];
  }
  if (tag && tag.trim()) filter.tags = tag.trim();

  try {
    const notes = await Note.find(filter).sort({ pinned: -1, updatedAt: -1 });
    return res.json({ notes });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const fields = req.body || {};
  const validationError = validateNoteFields(fields);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const note = await Note.create({ ...fields, user: req.userId });
    return res.status(201).json({ note });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  if (!isValidNoteId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }
  const fields = req.body || {};
  const validationError = validateNoteFields(fields, true);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: fields },
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found' });
    return res.json({ note });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  if (!isValidNoteId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }

  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    return res.json({ message: 'Note deleted' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

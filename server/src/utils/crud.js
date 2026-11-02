const express = require('express');

const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function crud(Model, { allowed, populate = '', filterKeys = [] }) {
  const r = express.Router();

  r.get('/', wrap(async (req, res) => {
    res.json(await Model.find(pick(req.query, filterKeys)).populate(populate).sort('-createdAt'));
  }));

  r.get('/:id', wrap(async (req, res) => {
    const doc = await Model.findById(req.params.id).populate(populate);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  }));

  r.post('/', wrap(async (req, res) => {
    res.status(201).json(await Model.create(pick(req.body, allowed)));
  }));

  r.patch('/:id', wrap(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, pick(req.body, allowed), {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  }));

  r.delete('/:id', wrap(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  }));

  return r;
}

module.exports = { crud, wrap, pick };  
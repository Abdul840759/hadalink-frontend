import { Router } from 'express';
import { Equipment, equipmentCategories } from '../models/index.js';
import { mongoose } from '../config/database.js';

const router = Router();
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const requireDatabase = (_request, response, next) => {
  if (mongoose.connection.readyState !== 1) {
    return response.status(503).json({ error: 'The equipment service is not connected to its database.' });
  }
  return next();
};

router.get('/', requireDatabase, async (request, response) => {
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(request.query.limit, 10) || 12));
  const filter = { status: 'available' };
  const category = typeof request.query.category === 'string' ? request.query.category.trim() : '';
  const area = typeof request.query.area === 'string' ? request.query.area.trim() : '';
  const search = typeof request.query.search === 'string' ? request.query.search.trim() : '';
  const minRate = Number(request.query.minRate);
  const maxRate = Number(request.query.maxRate);

  if (category && equipmentCategories.includes(category)) filter.category = category;
  if (area) filter.$or = [
    { 'location.lga': { $regex: escapeRegex(area), $options: 'i' } },
    { 'location.area': { $regex: escapeRegex(area), $options: 'i' } },
  ];
  if (search) {
    const searchFields = [
      { name: { $regex: escapeRegex(search), $options: 'i' } },
      { makeModel: { $regex: escapeRegex(search), $options: 'i' } },
      { category: { $regex: escapeRegex(search), $options: 'i' } },
      { 'location.lga': { $regex: escapeRegex(search), $options: 'i' } },
    ];
    filter.$and = [{ $or: searchFields }];
  }
  if (Number.isFinite(minRate) && minRate >= 0 || Number.isFinite(maxRate) && maxRate >= 0) {
    filter['rate.amount'] = {};
    if (Number.isFinite(minRate) && minRate >= 0) filter['rate.amount'].$gte = minRate;
    if (Number.isFinite(maxRate) && maxRate >= 0) filter['rate.amount'].$lte = maxRate;
  }

  const [items, total] = await Promise.all([
    Equipment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('provider', 'name profile.businessName')
      .lean(),
    Equipment.countDocuments(filter),
  ]);

  return response.json({
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

router.get('/:id', requireDatabase, async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid equipment id.' });
  const item = await Equipment.findOne({ _id: request.params.id, status: 'available' })
    .populate('provider', 'name profile.businessName profile.primaryArea')
    .lean();
  if (!item) return response.status(404).json({ error: 'Equipment listing not found.' });
  return response.json({ data: item });
});

export default router;

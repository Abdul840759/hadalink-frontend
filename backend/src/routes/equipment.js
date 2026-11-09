import { Router } from 'express';
import { createHash } from 'node:crypto';
import { Equipment, equipmentCategories } from '../models/index.js';
import { mongoose } from '../config/database.js';
import requireAuth from '../middleware/requireAuth.js';

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

router.get('/mine', requireAuth, requireDatabase, async (request, response) => {
  if (request.user.role !== 'provider') return response.status(403).json({ error: 'Only provider accounts can manage equipment listings.' });
  const items = await Equipment.find({ provider: request.user._id })
    .sort({ createdAt: -1 })
    .lean();
  return response.json({ data: items });
});

router.post('/', requireAuth, requireDatabase, async (request, response) => {
  if (request.user.role !== 'provider') return response.status(403).json({ error: 'Only provider accounts can publish equipment listings.' });

  const body = request.body || {};
  const name = String(body.name || '').trim();
  const category = String(body.category || '').trim();
  const area = String(body.area || '').trim();
  const services = Array.isArray(body.services)
    ? [...new Set(body.services.map(value => String(value).trim()).filter(Boolean))].slice(0, 20)
    : [];
  const amount = Number(String(body.rate ?? '').replace(/[₦,\s]/g, ''));
  const areaParts = area.split(',').map(part => part.trim()).filter(Boolean);
  const images = Array.isArray(body.images) ? body.images : [];

  if (name.length < 2 || name.length > 140 || !equipmentCategories.includes(category)
    || !Number.isFinite(amount) || amount <= 0 || !areaParts.length || area.length > 220
    || services.length === 0 || images.length > 6) {
    return response.status(400).json({ error: 'Add a valid machine name, category, rate, operating area, and at least one service.' });
  }

  const ownerFolder = `hadalink/${request.user._id}/equipment/`;
  const validImages = [];
  for (const image of images) {
    if (!image || typeof image.url !== 'string' || typeof image.publicId !== 'string'
      || !image.url.startsWith('https://res.cloudinary.com/') || !image.publicId.startsWith(ownerFolder)) {
      return response.status(400).json({ error: 'One of the equipment photos is invalid. Upload it again and retry.' });
    }
    validImages.push({
      url: image.url,
      publicId: image.publicId,
      ...(Number.isFinite(Number(image.width)) ? { width: Number(image.width) } : {}),
      ...(Number.isFinite(Number(image.height)) ? { height: Number(image.height) } : {}),
    });
  }

  const operatorAvailable = body.operatorAvailable !== false;
  const item = await Equipment.create({
    provider: request.user._id,
    name,
    makeModel: name,
    category,
    description: String(body.description || '').trim().slice(0, 3000),
    images: validImages,
    location: { state: 'Plateau', lga: areaParts[0].slice(0, 100), ...(areaParts[1] ? { area: areaParts.slice(1).join(', ').slice(0, 120) } : {}) },
    rate: { amount, unit: 'hectare' },
    services,
    operatorArrangement: operatorAvailable ? 'by-arrangement' : 'not-included',
    status: 'available',
  });
  return response.status(201).json({ data: item });
});

router.patch('/:id', requireAuth, requireDatabase, async (request, response) => {
  if (request.user.role !== 'provider') return response.status(403).json({ error: 'Only providers can update equipment listings.' });
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid equipment id.' });
  const body = request.body || {};
  const name = String(body.name || '').trim();
  const category = String(body.category || '').trim();
  const area = String(body.area || '').trim();
  const services = Array.isArray(body.services) ? [...new Set(body.services.map(value => String(value).trim()).filter(Boolean))].slice(0, 20) : [];
  const amount = Number(String(body.rate ?? '').replace(/[₦,\s]/g, ''));
  const areaParts = area.split(',').map(part => part.trim()).filter(Boolean);
  const hasImages = Object.hasOwn(body, 'images');
  const images = Array.isArray(body.images) ? body.images : [];
  if (name.length < 2 || name.length > 140 || !equipmentCategories.includes(category) || !Number.isFinite(amount) || amount <= 0 || !areaParts.length || area.length > 220 || !services.length) {
    return response.status(400).json({ error: 'Add a valid machine name, category, rate, operating area, and at least one service.' });
  }
  if (hasImages && images.length > 6) return response.status(400).json({ error: 'A listing can have up to six equipment photos.' });
  const ownerFolder = `hadalink/${request.user._id}/equipment/`;
  const validImages = [];
  for (const image of images) {
    if (!image || typeof image.url !== 'string' || typeof image.publicId !== 'string'
      || !image.url.startsWith('https://res.cloudinary.com/') || !image.publicId.startsWith(ownerFolder)) {
      return response.status(400).json({ error: 'One of the equipment photos is invalid. Upload it again and retry.' });
    }
    validImages.push({ url: image.url, publicId: image.publicId,
      ...(Number.isFinite(Number(image.width)) ? { width: Number(image.width) } : {}),
      ...(Number.isFinite(Number(image.height)) ? { height: Number(image.height) } : {}),
    });
  }
  const updates = {
    name, makeModel: name, category, description: String(body.description || '').trim().slice(0, 3000), services,
    'location.state': 'Plateau', 'location.lga': areaParts[0].slice(0, 100), 'location.area': areaParts.slice(1).join(', ').slice(0, 120),
    'rate.amount': amount, 'rate.unit': 'hectare', operatorArrangement: body.operatorAvailable === false ? 'not-included' : 'by-arrangement',
  };
  if (hasImages) updates.images = validImages;
  const item = await Equipment.findOneAndUpdate({ _id: request.params.id, provider: request.user._id }, {
    $set: updates,
  }, { new: true, runValidators: true }).lean();
  if (!item) return response.status(404).json({ error: 'Equipment listing not found in your account.' });
  return response.json({ data: item });
});

router.patch('/:id/status', requireAuth, requireDatabase, async (request, response) => {
  if (request.user.role !== 'provider') return response.status(403).json({ error: 'Only providers can change equipment listing status.' });
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid equipment id.' });
  const status = String(request.body?.status || '').toLowerCase();
  if (!['available', 'paused'].includes(status)) return response.status(400).json({ error: 'Choose a valid listing status.' });
  const item = await Equipment.findOneAndUpdate({ _id: request.params.id, provider: request.user._id }, { $set: { status } }, { new: true, runValidators: true }).lean();
  if (!item) return response.status(404).json({ error: 'Equipment listing not found in your account.' });
  return response.json({ data: item });
});

router.delete('/:id', requireAuth, requireDatabase, async (request, response) => {
  if (request.user.role !== 'provider') return response.status(403).json({ error: 'Only providers can remove equipment listings.' });
  if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid equipment id.' });
  const item = await Equipment.findOne({ _id: request.params.id, provider: request.user._id });
  if (!item) return response.status(404).json({ error: 'Equipment listing not found in your account.' });
  await item.deleteOne();
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = process.env;
  if (cloudName && apiKey && apiSecret) {
    await Promise.allSettled((item.images || []).map(async image => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = createHash('sha1').update(`public_id=${image.publicId}&timestamp=${timestamp}${apiSecret}`).digest('hex');
      const result = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ public_id: image.publicId, timestamp: String(timestamp), api_key: apiKey, signature }),
      });
      if (!result.ok) console.error('[cloudinary] Could not remove equipment image:', image.publicId, result.status);
    }));
  }
  return response.status(204).end();
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

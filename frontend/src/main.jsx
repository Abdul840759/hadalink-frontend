import React, { Suspense, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowRight, Bell, CalendarDays, Check, CheckCircle2, ChevronDown, CircleHelp, ClipboardPaste, Download, Home, LogOut, Menu, MessageCircle, Plus, Search, Settings, ShieldCheck, Sprout, Tractor, Wallet, X, ArrowDown, ArrowUpRight, BadgeCheck, Banknote, BarChart3, Camera, ChevronLeft, ChevronRight, Clock3, CreditCard, Eye, EyeOff, Filter, Gauge, Globe2, Image, Leaf, LockKeyhole, Mail, MapPin, SlidersHorizontal, Star, TrendingUp, Upload, User, Users, Wrench, Sun, Moon, Truck, ClipboardList, Route, Monitor } from 'lucide-react';
import './styles.css';

// Keep the charting package out of the initial app bundle. It is only needed
// after a user opens a dashboard or analytics view.
const Area = React.lazy(() => import('recharts').then(module => ({ default: module.Area })));
const AreaChart = React.lazy(() => import('recharts').then(module => ({ default: module.AreaChart })));
const Bar = React.lazy(() => import('recharts').then(module => ({ default: module.Bar })));
const BarChart = React.lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
const CartesianGrid = React.lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })));
const Cell = React.lazy(() => import('recharts').then(module => ({ default: module.Cell })));
const ResponsiveContainer = React.lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));
const Tooltip = React.lazy(() => import('recharts').then(module => ({ default: module.Tooltip })));
const XAxis = React.lazy(() => import('recharts').then(module => ({ default: module.XAxis })));

const machines = [
  { name: 'Massey Ferguson 375 4WD', kind: 'Tractor', area: 'Jos South, Barkin Ladi', rate: '45,000', rating: '4.9', image: 'photo-1592982537447-7440770cbfc9', status: 'Available' },
  { name: 'New Holland 6010 4WD', kind: 'Tractor', area: 'Mangu, Bokkos', rate: '52,000', rating: '4.8', image: 'photo-1530267981375-f0de937f5f13', status: 'Booked' },
  { name: 'John Deere 5075E', kind: 'Tractor', area: 'Jos East, Bassa', rate: '30,000', rating: '5.0', image: 'photo-1605000797499-95a51c5269ae', status: 'Available' },
  { name: 'Zoomlion Combine Harvester', kind: 'Harvester', area: 'Barkin Ladi, Jos South', rate: '75,000', rating: '4.9', image: 'photo-1500382017468-9049fed747ef', status: 'Available' },
  { name: 'Jacto Condor Boom Sprayer', kind: 'Boom sprayer', area: 'Jos South, Vom', rate: '18,000', rating: '4.7', image: 'photo-1472396961693-142e6e269027', status: 'Paused' },
  { name: 'Baldan 4-Row Disc Planter', kind: 'Planter', area: 'Rayfield, Jos South', rate: '30,000', rating: '5.0', image: 'photo-1464226184884-fa280b87c399', status: 'Available' },
  { name: 'Landini Orchard Tractor', kind: 'Tractor', area: 'Barkin Ladi, Plateau', rate: '38,000', rating: '4.8', image: 'photo-1523742815057-83e057fedb22', status: 'Available' },
  { name: 'Fieldking Rotavator', kind: 'Tiller', area: 'Mangu, Plateau', rate: '22,000', rating: '4.9', image: 'photo-1500382017468-9049fed747ef', status: 'Available' },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const SITE_TURNSTILE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const SITE_ACCESS_REQUIRED = import.meta.env.PROD || Boolean(SITE_TURNSTILE_KEY);

function nigerianLocalNumber(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('234')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

function nigerianPhoneValue(value) {
  const local = nigerianLocalNumber(value);
  return local ? `+234${local}` : '';
}

function NigerianPhoneField({ icon: Icon, label, value, onChange, trailing, required = false, autoComplete = 'tel', autoFocus = false }) {
  const local = nigerianLocalNumber(value);
  return <label className="field nigerian-phone-field"><span className="field-label">{label}<small>10 digits</small></span><span className="field-control nigerian-phone-control"><Icon size={17}/><span className="phone-country-prefix" aria-label="Nigeria country code">+234</span><input type="tel" inputMode="numeric" autoComplete={autoComplete} autoFocus={autoFocus} value={local} onChange={event=>onChange(nigerianPhoneValue(event.target.value))} placeholder="801 234 5678" pattern="[0-9]{10}" minLength={10} maxLength={10} required={required} aria-label={`${label}, 10-digit Nigerian number`}/>{trailing}</span></label>;
}

async function authRequest(path, body, method = 'POST') {
  let response;
  try {
    const accessToken = sessionStorage.getItem('hadalink-site-access');
    const headers = {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { 'X-HadaLink-Site-Access': accessToken } : {}),
    };
    response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include',
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    console.error('HadaLink API request failed:', error);
    throw new Error('We couldn’t connect just now. Please try again in a moment.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status >= 500) {
      console.error('HadaLink API returned a server error:', response.status, payload.error || payload);
      throw new Error('We couldn’t complete that just now. Please try again in a moment.');
    }
    throw new Error(payload.error || 'The request could not be completed.');
  }
  return payload;
}

function SiteAccessGate({ siteKey, state, theme, onVerified, onRetry }) {
  const widgetRef = React.useRef(null);
  const widgetIdRef = React.useRef(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  React.useEffect(() => {
    if (state !== 'required' || !siteKey) return undefined;
    let cancelled = false;
    let script = document.querySelector('script[data-cloudflare-turnstile]');
    const renderWidget = () => {
      if (cancelled || !window.turnstile || !widgetRef.current) return;
      widgetRef.current.replaceChildren();
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        action: 'site-access',
        theme,
        callback: async token => {
          setBusy(true);
          setMessage('');
          try {
            const response = await fetch(`${API_BASE}/auth/site-access/verify`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ turnstileToken: token }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.data?.accessToken) throw new Error(payload.error || 'Verification could not be completed.');
            sessionStorage.setItem('hadalink-site-access', payload.data.accessToken);
            onVerified();
          } catch (error) {
            setMessage(error.message || 'Verification could not be completed. Try again.');
            if (widgetIdRef.current !== null) window.turnstile?.reset(widgetIdRef.current);
          } finally { setBusy(false); }
        },
        'expired-callback': () => setMessage('The check expired. Please complete it again.'),
        'error-callback': () => setMessage('Could not load the bot check. Check your connection and retry.'),
      });
    };
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.cloudflareTurnstile = 'true';
      document.head.appendChild(script);
    }
    if (window.turnstile) renderWidget();
    else script.addEventListener('load', renderWidget);
    return () => {
      cancelled = true;
      script?.removeEventListener('load', renderWidget);
      if (widgetIdRef.current !== null) window.turnstile?.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [state, siteKey, theme, onVerified]);

  return <main className="site-access-screen"><section className="site-access-card">
    <span className="site-access-brand"><img src="/hadalink-mark.png" alt=""/></span>
    {state === 'checking' ? <><h1>Checking access</h1><p>Verifying this browser’s HadaLink access pass…</p></> : state === 'config-error' ? <><h1>Security check unavailable</h1><p>This production build did not receive HadaLink’s Turnstile site key. In Vercel, add <strong>VITE_TURNSTILE_SITE_KEY</strong> to the Production environment, then create a new deployment.</p><button className="button button-ghost" onClick={onRetry}>Check again</button></> : state === 'error' ? <><h1>Could not verify access</h1><p>We couldn’t reach the security service. Check your connection, then try again.</p><button className="button button-primary" onClick={onRetry}>Try again</button></> : <><span className="site-access-eyebrow">HADALINK SECURITY</span><h1>Verify you’re human</h1><p>Complete this quick security check to continue to HadaLink.</p><div className="site-access-widget" ref={widgetRef}/>{busy&&<span className="site-access-status" role="status">Checking your verification…</span>}{message&&<span className="site-access-status" role="status">{message}</span>}</>}
  </section></main>;
}


function mapEquipmentRecord(record) {
  const status = ({ available: 'Available', paused: 'Paused', draft: 'Draft', booked: 'Booked' })[record.status] || 'Available';
  const area = [record.location?.lga, record.location?.area].filter(Boolean).join(', ');
  return { id: record._id, _id: record._id, name: record.name, kind: record.category, area, provider: typeof record.provider === 'object' ? (record.provider?.profile?.businessName || record.provider?.name) : record.providerName,
    rate: Number(record.rate?.amount || 0).toLocaleString('en-NG'), description: record.description || '',
    terms: record.description || '', services: record.services || [],
    pickupAddress: record.location?.pickupAddress || '', coordinates: record.location?.coordinates || null,
    operatorAvailable: record.operatorArrangement !== 'not-included', images: record.images || [],
    imageUrl: record.images?.[0]?.url || '', rating: 'New', status };
}

function mapBookingRecord(record) {
  const status = ({ pending: 'Pending', accepted: 'Accepted', declined: 'Declined', completed: 'Completed', cancelled: 'Cancelled' })[record.status] || 'Pending';
  const date = record.requestedDate ? new Date(record.requestedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const transportStatus = ({ not_requested: 'Not requested', requested: 'Requested', accepted: 'Accepted', scheduled: 'Scheduled', picked_up: 'Picked up', in_transit: 'In transit', delivered: 'Delivered', cancelled: 'Cancelled', unfulfilled: 'Unfulfilled' })[record.transport?.status] || 'Not requested';
  return { id: record._id, farmer: record.farmer?.name || '', farmerEmail: record.farmer?.email || '', farmerPhone: record.farmer?.profile?.phone || '', provider: record.provider?.profile?.businessName || record.provider?.name || '', logisticsProvider: record.transport?.provider?.profile?.businessName || record.transport?.provider?.name || '', place: record.location || '', service: record.service || '', machine: record.equipment?.name || '', machineKind: record.equipment?.category || '', machineArea: [record.equipment?.location?.lga, record.equipment?.location?.area].filter(Boolean).join(', '), pickupAddress: record.equipment?.location?.pickupAddress || '', machineCoordinates: record.equipment?.location?.coordinates || null, liveLocation: record.transport?.liveLocation || null, hectares: `${record.hectares || 0} ha`, amount: `₦${Number(record.quotedAmount || 0).toLocaleString('en-NG')}`, amountValue: Number(record.quotedAmount || 0), paymentStatus: record.payment?.status || 'unpaid', payoutStatus: record.payment?.payoutStatus || '', commissionRate: Number(record.payment?.commissionRate || 0), commissionKobo: Number(record.payment?.commissionKobo || 0), providerAmountKobo: Number(record.payment?.providerAmountKobo || 0), transportRequested: record.transport?.requested === true, transportFee: Number(record.transport?.fee || 0), transportStatus, transportStatusKey: record.transport?.status || 'not_requested', transportJobId: record._id, transportRequirements: record.transport?.requirements || '', deliveryNote: record.transport?.deliveryNote || '', date, requestedDate: record.requestedDate || '', completedAt: record.completedAt || '', status, equipmentId: record.equipment?._id, note: record.note || '', operator: record.equipment?.operatorArrangement === 'not-included' ? 'Equipment only' : 'Operator by arrangement', rating: record.review?.rating, review: record.review?.text || '' };
}

function captureCurrentLocation() {
  if (!navigator.geolocation) return Promise.reject(new Error('This device does not support location sharing.'));
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
    position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
    error => reject(new Error(error.code === 1 ? 'Allow location access in your browser, or enter the pickup address manually.' : 'Could not get your location. Enter the pickup address manually or try again.')),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
  ));
}

function ImageCarousel({ images = [], name, className = '' }) {
  const [index, setIndex] = useState(0);
  const touchStart = React.useRef(null);
  React.useEffect(() => setIndex(current => Math.min(current, Math.max(images.length - 1, 0))), [images.length]);
  if (!images.length) return <div className={`${className} real-image-empty`}><Tractor size={32}/><span>Provider photo not added</span></div>;
  const move = direction => setIndex(value => (value + direction + images.length) % images.length);
  return <div className={`image-carousel ${className}`} onTouchStart={event=>{touchStart.current=event.touches[0]?.clientX}} onTouchEnd={event=>{if(touchStart.current===null)return;const delta=event.changedTouches[0]?.clientX-touchStart.current;if(Math.abs(delta)>35)move(delta<0?1:-1);touchStart.current=null}}>
    <img src={images[index].url} alt={`${name}, photo ${index+1} of ${images.length}`} loading="lazy" draggable="false"/>
    {images.length>1&&<><button type="button" className="image-carousel-arrow previous" aria-label="Previous machinery photo" onClick={event=>{event.stopPropagation();move(-1)}}><ChevronLeft size={17}/></button><button type="button" className="image-carousel-arrow next" aria-label="Next machinery photo" onClick={event=>{event.stopPropagation();move(1)}}><ChevronRight size={17}/></button><span className="image-carousel-count">{index+1} / {images.length}</span><div className="image-carousel-dots" aria-label="Choose photo">{images.map((photo,dot)=><button key={`${photo.publicId||photo.url}-${dot}`} type="button" aria-label={`Show photo ${dot+1}`} aria-current={dot===index?'true':undefined} onClick={event=>{event.stopPropagation();setIndex(dot)}}/>)}</div></>}
  </div>;
}


async function uploadCloudinaryImage(file, purpose) {
  const { data: signed } = await authRequest('/auth/cloudinary/signature', { purpose });
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signed.apiKey);
  form.append('timestamp', String(signed.timestamp));
  form.append('folder', signed.folder);
  form.append('public_id', signed.publicId);
  form.append('signature', signed.signature);
  let response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, { method: 'POST', body: form });
  } catch {
    throw new Error('Image upload could not connect. Check your connection and try again.');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.secure_url || !result.public_id) {
    console.error('Cloudinary image upload failed:', result.error?.message || response.status);
    throw new Error('Image upload failed. Please choose another image and try again.');
  }
  return { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height };
}

function machineImageSrc(machine) {
  if (machine?.imageUrl) return machine.imageUrl;
  if (machine?.images?.[0]?.url) return machine.images[0].url;
  return '';
}

function requiredProfileSteps(user) {
  const profile = user?.profile || {};
  const steps = [
    { field: 'phone', label: 'Phone number', title: 'What phone number can we reach you on?', description: 'We use this to coordinate bookings and important account updates.', placeholder: '+234 800 000 0000', icon: MapPin, type: 'tel' },
    { field: 'whatsapp', label: 'WhatsApp number', title: 'What number do you use on WhatsApp?', description: 'This helps farmers and providers coordinate locally.', placeholder: '+234 800 000 0000', icon: MessageCircle, type: 'tel' },
  ];
  if (['provider','logistics'].includes(user?.role)) steps.push({ field: 'businessName', label: user.role === 'logistics' ? 'Company or provider name' : 'Business or fleet name', title: user.role === 'logistics' ? 'What is your transport business called?' : 'What should farmers call your business?', description: user.role === 'logistics' ? 'Use your company name or the name customers know.' : 'Use your business name or the name of your equipment fleet.', placeholder: 'Business or fleet name', icon: Wrench, type: 'text' });
  if (user?.role === 'logistics') steps.push({ field: 'contactName', label: 'Contact person', title: 'Who should farmers contact?', description: 'Add the person coordinating your transport jobs.', placeholder: 'Contact person name', icon: User, type: 'text' });
  steps.push({ field: 'primaryArea', label: user?.role === 'provider' ? 'Primary depot or operating area' : user?.role === 'logistics' ? 'Primary operating area' : 'Farm location', title: user?.role === 'provider' ? 'Where is your main depot?' : user?.role === 'logistics' ? 'Where does your transport service operate?' : 'Where is your farm located?', description: 'Share the Plateau area you operate in so we can show relevant local information.', placeholder: 'Town, district or LGA', icon: MapPin, type: 'text' });
  if (user?.role === 'logistics') {
    steps.push({ field: 'transportLoads', label: 'Loads you transport', title: 'What types of loads do you carry?', description: 'List machinery or load types separated by commas.', placeholder: 'Tractors, harvesters, heavy equipment', icon: Truck, type: 'text' });
    steps.push({ field: 'transportCapacity', label: 'Transport capacity', title: 'What is your carrying capacity?', description: 'Give a weight, dimension or practical capacity description.', placeholder: 'e.g. up to 10 tonnes', icon: Route, type: 'text' });
    steps.push({ field: 'vehicleDetails', label: 'Vehicle details', title: 'What vehicles will handle jobs?', description: 'Add vehicle types and useful details such as flatbed or low-bed.', placeholder: 'Vehicle type and details', icon: Truck, type: 'text' });
  }
  return steps.filter(step => !String(profile[step.field] || '').trim());
}

function verificationNotices(user) {
  if (!user) return [];
  const profile = user.profile || {};
  return [
    user.emailVerified !== true && { title: 'Email address needs verification', detail: 'Your account email is not marked as verified.' },
    !String(profile.phone || '').trim() && { title: 'Phone number not added yet', detail: 'Add a phone number to complete your profile.' },
    !String(profile.whatsapp || '').trim() && { title: 'WhatsApp number not added yet', detail: 'Add a WhatsApp number to complete your profile.' },
  ].filter(Boolean);
}

const navItems = [
  { id: 'Dashboard', icon: Home }, { id: 'My Machinery', icon: Tractor }, { id: 'Add Machinery', icon: Plus }, { id: 'Requests', icon: MessageCircle }, { id: 'Calendar', icon: CalendarDays }, { id: 'Analytics', icon: Gauge }, { id: 'Earnings', icon: Wallet }, { id: 'Reviews', icon: Star }, { id: 'Settings', icon: Settings },
];
const titles = { Dashboard: 'Welcome back', 'My Machinery': 'My Machinery', 'Add Machinery': 'Add Machinery', 'Edit Machinery': 'Edit Machinery', Requests: 'Booking Requests', Calendar: 'Fleet Calendar & Schedule', Analytics: 'Analytics & Growth', Earnings: 'Transaction Records & Commission', Reviews: 'Farmer Reviews & Ratings', Settings: 'Account & Fleet Settings' };
const farmerNav = [
  { id: 'Dashboard', icon: Home },
  { id: 'Find Machinery', icon: Search },
  { id: 'My bookings', icon: CalendarDays },
  { id: 'Track machinery', icon: MapPin },
  { id: 'Settings', icon: Settings },
];
const logisticsNav = [
  { id: 'Dashboard', icon: Home }, { id: 'Requests', icon: ClipboardList },
  { id: 'My Jobs', icon: Truck }, { id: 'Settings', icon: User },
];
const providerQuickNav = [
  { id: 'Dashboard', icon: Home },
  { id: 'My Machinery', icon: Tractor },
  { id: 'Requests', icon: MessageCircle },
  { id: 'Calendar', icon: CalendarDays },
];
const providerMoreNav = [
  { id: 'Add Machinery', icon: Plus },
  { id: 'Analytics', icon: Gauge },
  { id: 'Earnings', icon: Wallet },
  { id: 'Reviews', icon: Star },
  { id: 'Settings', icon: Settings },
];
function money(x) { return `₦${x}` }

function downloadStatement(bookings) {
  const columns = ['Booking ID', 'Date', 'Machine', 'Service', 'Farmer', 'Area', 'Hectares', 'Booking value', 'Status'];
  const safeCell = value => {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const rows = bookings.filter(item => item.status === 'Completed').map(item => [item.id, item.date, item.machine, item.service, item.farmer, item.place, item.hectares, item.amountValue, item.status]);
  const csv = `\uFEFF${[columns, ...rows].map(row => row.map(safeCell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `hadalink-completed-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function closePopup(setOpen, event, afterClose) {
  event?.stopPropagation?.();
  const layer = event?.currentTarget?.closest?.('[class*="backdrop"]');
  if (!layer || layer.classList.contains('popup-closing')) return;
  layer.classList.add('popup-closing');
  window.setTimeout(() => {
    setOpen(false);
    afterClose?.();
  }, 190);
}


function getWeekBounds(weekOffset = 0) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() - end.getDay() - weekOffset * 7 + 6);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function getWeekRange(weekOffset) {
  const { start, end } = getWeekBounds(weekOffset);
  const format = date => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${format(start)}–${format(end)} ${end.getFullYear()}`;
}

function getWeekData(weekOffset, bookings = []) {
  const { start } = getWeekBounds(weekOffset);
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const sameDay = bookings.filter(item => {
      const requested = new Date(item.requestedDate);
      return item.requestedDate && requested.getFullYear() === date.getFullYear() && requested.getMonth() === date.getMonth() && requested.getDate() === date.getDate();
    });
    return { day, jobs: sameDay.length, income: sameDay.reduce((sum, item) => sum + (item.amountValue || 0), 0) };
  });
}

function WeekNavigator({ weekOffset, setWeekOffset }) {
  return <div className="week-navigator" aria-label="Choose analytics week">
    <button className="icon-button" aria-label="Previous week" onClick={() => setWeekOffset(value => value + 1)}><ChevronLeft size={16}/></button>
    <strong>{weekOffset === 0 ? 'This week' : `Week of ${getWeekRange(weekOffset)}`}</strong>
    <button className="icon-button" aria-label="Next week" disabled={weekOffset === 0} onClick={() => setWeekOffset(value => Math.max(0, value - 1))}><ChevronRight size={16}/></button>
    {weekOffset > 0 && <button className="button button-ghost button-small" onClick={() => setWeekOffset(0)}>This week</button>}
  </div>;
}

const emptyPinDigits = () => Array(6).fill('');
const pinDigitsToString = digits => digits.join('');

function PinCodeField({ label, value, onChange, masked = true, autoFocus = false, disabled = false }) {
  const [visible, setVisible] = useState(!masked);
  const inputs = React.useRef([]);
  function writeDigits(start, raw) {
    const digits = String(raw || '').replace(/\D/g, '').slice(0, 6 - start);
    if (!digits) return;
    const next = [...value];
    digits.split('').forEach((digit, offset) => { next[start + offset] = digit; });
    onChange(next);
    inputs.current[Math.min(5, start + digits.length)]?.focus();
  }
  function editDigit(index, raw) {
    const digits = String(raw || '').replace(/\D/g, '');
    if (!digits) {
      const next = [...value];
      next[index] = '';
      onChange(next);
      return;
    }
    writeDigits(index, digits);
  }
  function onKeyDown(index, event) {
    if (event.key === 'Backspace' && !value[index] && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); inputs.current[index - 1]?.focus(); }
    if (event.key === 'ArrowRight' && index < 5) { event.preventDefault(); inputs.current[index + 1]?.focus(); }
  }
  return <div className="pin-code-field"><span className="field-label">{label}</span><div className="pin-code-control"><div className="pin-code-boxes" role="group" aria-label={label}>{value.map((digit, index)=><input key={index} ref={node=>{inputs.current[index]=node}} type={masked&&!visible?'password':'text'} inputMode="numeric" pattern="[0-9]" maxLength={1} autoComplete="off" aria-label={`${label}, digit ${index+1} of 6`} value={digit} onChange={event=>editDigit(index,event.target.value)} onKeyDown={event=>onKeyDown(index,event)} onPaste={event=>{event.preventDefault();writeDigits(index,event.clipboardData.getData('text'))}} onFocus={event=>event.currentTarget.select()} autoFocus={autoFocus&&index===0} disabled={disabled} required/>)}</div>{masked&&<button type="button" className="pin-visibility-toggle" aria-label={visible?`Hide ${label.toLowerCase()}`:`Show ${label.toLowerCase()}`} aria-pressed={visible} onClick={()=>setVisible(value=>!value)}>{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button>}</div></div>;
}

function ActionPinDialog({ request, onUserUpdated, onFinish }) {
  const [pin, setPin] = useState(emptyPinDigits);
  const [confirmation, setConfirmation] = useState(emptyPinDigits);
  const [code, setCode] = useState(emptyPinDigits);
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      if (request.hasActionPin) {
        await authRequest('/auth/verify-action-pin', { pin: pinDigitsToString(pin) });
        onFinish(pinDigitsToString(pin));
      } else if (!codeSent) {
        await authRequest('/auth/action-pin/request-code', { pin: pinDigitsToString(pin), confirmation: pinDigitsToString(confirmation) });
        setCodeSent(true);
      } else {
        const { data } = await authRequest('/auth/action-pin', { pin: pinDigitsToString(pin), confirmation: pinDigitsToString(confirmation), code: pinDigitsToString(code) });
        onUserUpdated(data.user);
        onFinish(pinDigitsToString(pin));
      }
    } catch (requestError) { setError(requestError.message || 'The action PIN could not be confirmed.'); }
    finally { setBusy(false); }
  }
  const cancel = () => onFinish(null);
  return createPortal(<div className="action-pin-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)cancel()}}><section className="action-pin-dialog" role="dialog" aria-modal="true" aria-labelledby="action-pin-title"><header><span className="action-pin-icon"><LockKeyhole size={18}/></span><button type="button" aria-label="Cancel protected action" onClick={cancel}><X size={17}/></button></header><span className="eyebrow">{request.role?.toUpperCase()} ACTION PIN</span><h2 id="action-pin-title">{request.hasActionPin?'Enter your action PIN':codeSent?'Verify your email':'Create your action PIN'}</h2><p>{request.hasActionPin?`Enter your PIN to ${request.action}.`:codeSent?`Enter the six-digit code sent to ${request.email} to save your PIN and continue.`:`Create a six-digit PIN for your ${request.role} account before you ${request.action}. We’ll email a code to ${request.email} before saving it.`}</p><form onSubmit={submit}>{request.hasActionPin?<PinCodeField label="ACTION PIN" value={pin} onChange={setPin} autoFocus/>:codeSent?<PinCodeField label="EMAIL VERIFICATION CODE" value={code} onChange={setCode} masked={false} autoFocus/>:<><PinCodeField label="CREATE SIX-DIGIT PIN" value={pin} onChange={setPin} autoFocus/><PinCodeField label="CONFIRM PIN" value={confirmation} onChange={setConfirmation}/></>}{error&&<div className="auth-error" role="alert">{error}</div>}<div className="action-pin-actions"><button type="button" className="button button-ghost" onClick={cancel}>Cancel</button><button className="button button-primary" disabled={busy}>{busy?(request.hasActionPin?'Checking…':codeSent?'Saving…':'Sending code…'):(request.hasActionPin?'Confirm action':codeSent?'Verify & continue':'Email code & continue')} <ArrowRight size={14}/></button></div></form></section></div>,document.body);
}

function App() {
  const [page, setPage] = useState(() => { const path=location.pathname.split('/').filter(Boolean); return path[0]==='app' ? (path[1]==='machinery'&&path[2]==='edit'?'Edit Machinery':({machinery:'My Machinery',add:'Add Machinery',requests:'Requests',jobs:'My Jobs',calendar:'Calendar',analytics:'Analytics',earnings:'Earnings',reviews:'Reviews',settings:'Settings',find:'Find Machinery',bookings:'My bookings',tracking:'Track machinery'}[path[1]]||'Dashboard')) : ({about:'About',login:'login',register:'register',forgot:'forgot'}[path[0]]||'landing'); });
  const [activeRequest, setActiveRequest] = useState('All');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [notice, setNotice] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [machinesState, setMachinesState] = useState([]);
  const [machinesLoading, setMachinesLoading] = useState(true);
  const [machinesError, setMachinesError] = useState('');
  const [providerListings, setProviderListings] = useState([]);
  const [providerListingsLoading, setProviderListingsLoading] = useState(false);
  const [providerListingsError, setProviderListingsError] = useState('');
  const authBootstrapInFlight = React.useRef(false);
  const paymentReturnHandled = React.useRef(false);
  const providerBookingSnapshot = React.useRef(null);
  const [requestsState, setRequestsState] = useState([]);
  const [transportRequests, setTransportRequests] = useState([]);
  const [transportJobs, setTransportJobs] = useState([]);
  const [transportLoading, setTransportLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');
  const [editingMachine, setEditingMachine] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [siteAccess, setSiteAccess] = useState(() => SITE_ACCESS_REQUIRED ? 'checking' : 'passed');
  const [siteAccessRetry, setSiteAccessRetry] = useState(0);
  const markSiteAccessVerified = React.useCallback(() => setSiteAccess('passed'), []);
  const retrySiteAccess = React.useCallback(() => {
    sessionStorage.removeItem('hadalink-site-access');
    setSiteAccess('checking');
    setSiteAccessRetry(value => value + 1);
  }, []);
  const [actionPinRequest, setActionPinRequest] = useState(null);
  const [onboardingRequired, setOnboardingRequired] = useState(null);
  const [signupRole, setSignupRole] = useState(() => ['Provider','Logistics'].includes(localStorage.getItem('hadalink-role')) ? localStorage.getItem('hadalink-role') : 'Farmer');
  const [themePreference, setThemePreference] = useState(() => {
    const stored = localStorage.getItem('hadalink-theme-preference');
    if (['light', 'dark', 'system'].includes(stored)) return stored;
    if (localStorage.getItem('hadalink-theme-default-v2') !== '1') {
      localStorage.setItem('hadalink-theme-default-v2', '1');
      localStorage.setItem('hadalink-theme', 'light');
      return 'light';
    }
    return localStorage.getItem('hadalink-theme') === 'dark' ? 'dark' : 'light';
  });
  const [theme, setTheme] = useState(() => {
    const preference = localStorage.getItem('hadalink-theme-preference') || (localStorage.getItem('hadalink-theme-default-v2') === '1' ? localStorage.getItem('hadalink-theme') : 'light') || 'light';
    return preference === 'system' ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : preference;
  });
  const isFarmer = signupRole === 'Farmer';
  const isLogistics = signupRole === 'Logistics';
  const quickNavItems = isFarmer ? farmerNav : isLogistics ? logisticsNav : providerQuickNav;
  async function chooseThemePreference(preference) {
    if (!['light', 'dark', 'system'].includes(preference)) return;
    setThemePreference(preference);
    localStorage.setItem('hadalink-theme-preference', preference);
    if (!currentUser) return;
    try {
      const { data } = await authRequest('/auth/theme', { themePreference: preference }, 'PATCH');
      setCurrentUser(data.user);
    } catch (error) {
      throw new Error(`Theme changed on this device but could not be saved to your account. ${error.message || ''}`.trim());
    }
  }
  const toggleTheme = () => { void chooseThemePreference(theme === 'dark' ? 'light' : 'dark').catch(error => flash(error.message)); };
  const publicPages = ['landing', 'About', 'login', 'register', 'forgot'];
  function requestActionPin(action) {
    return new Promise(resolve => setActionPinRequest({ hasActionPin: currentUser?.hasActionPin === true, role: currentUser?.role, email: currentUser?.email, action, resolve }));
  }
  React.useEffect(() => {
    if (!SITE_ACCESS_REQUIRED) { setSiteAccess('passed'); return undefined; }
    if (!SITE_TURNSTILE_KEY) { setSiteAccess('config-error'); return undefined; }
    const accessToken = sessionStorage.getItem('hadalink-site-access');
    if (!accessToken) { setSiteAccess('required'); return undefined; }
    let active = true;
    fetch(`${API_BASE}/auth/site-access/status`, {
      credentials: 'include',
      headers: { 'X-HadaLink-Site-Access': accessToken },
    }).then(response => {
      if (!active) return;
      if (response.ok) setSiteAccess('passed');
      else { sessionStorage.removeItem('hadalink-site-access'); setSiteAccess('required'); }
    }).catch(() => { if (active) setSiteAccess('error'); });
    return () => { active = false; };
  }, [siteAccessRetry]);
  React.useEffect(() => {
    if (siteAccess !== 'passed' || publicPages.includes(page) || currentUser || authBootstrapInFlight.current) return undefined;
    authBootstrapInFlight.current = true;
    authRequest('/auth/me', undefined, 'GET')
      .then(({ data }) => {
        if (!data?.user) throw new Error('Not signed in');
        setCurrentUser(data.user);
        setOnboardingRequired(requiredProfileSteps(data.user).length > 0);
        const role = data.user.role === 'provider' ? 'Provider' : data.user.role === 'logistics' ? 'Logistics' : 'Farmer';
        localStorage.setItem('hadalink-role', role);
        setSignupRole(role);
        authRequest('/equipment', undefined, 'GET')
          .then(({ data: items }) => { if (Array.isArray(items)) setMachinesState(items.map(mapEquipmentRecord)); })
          .catch(error => { console.error('Could not load published equipment:', error); setMachinesError(error.message || 'Published equipment could not be loaded.'); })
          .finally(() => setMachinesLoading(false));
      })
      .catch(() => {
        setOnboardingRequired(false);
        history.replaceState({ page: 'login' }, '', '/login');
        setPage('login');
      })
      .finally(() => { authBootstrapInFlight.current = false; });
    return undefined;
  }, [page, currentUser, siteAccess]);
  React.useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'logistics') return;
    setBookingsLoading(true);
    setBookingsError('');
    authRequest('/bookings', undefined, 'GET')
      .then(({ data }) => { if (Array.isArray(data)) setRequestsState(data.map(mapBookingRecord)); })
      .catch(error => { console.error('Could not load bookings:', error); setBookingsError(error.message || 'Bookings could not be loaded.'); })
      .finally(() => setBookingsLoading(false));
  }, [currentUser, page]);
  React.useEffect(() => {
    if (currentUser?.role !== 'provider') return undefined;
    let active = true;
    let initialized = false;
    const refreshProviderBookings = async () => {
      try {
        const {data} = await authRequest('/bookings', undefined, 'GET');
        if (!active || !Array.isArray(data)) return;
        const next = new Map(data.map(item => [String(item._id), item]));
        const previous = providerBookingSnapshot.current;
        if (initialized && previous) {
          const newRequest = data.find(item => !previous.has(String(item._id)) && item.status === 'pending');
          const newlyPaid = data.find(item => previous.has(String(item._id)) && previous.get(String(item._id))?.payment?.status !== 'paid' && item.payment?.status === 'paid');
          const payoutReady = data.find(item => previous.get(String(item._id))?.payment?.payoutStatus !== 'release_pending' && item.payment?.payoutStatus === 'release_pending');
          if (newRequest) {
            flash(`New booking request: ${newRequest.equipment?.name || 'your equipment'} from ${newRequest.farmer?.name || 'a farmer'}.`);
            setNotificationsOpen(true);
          } else if (payoutReady) {
            flash(`Delivery confirmed for ${payoutReady.equipment?.name || 'your booking'}. The provider payout is ready for release by HadaLink.`);
            setNotificationsOpen(true);
          } else if (newlyPaid) {
            flash(`Payment received for ${newlyPaid.equipment?.name || 'your equipment'}; provider payout is held until delivery confirmation.`);
            setNotificationsOpen(true);
          }
        }
        providerBookingSnapshot.current = next;
        initialized = true;
        setRequestsState(data.map(mapBookingRecord));
      } catch (error) { if (active) console.error('Could not refresh provider notifications:', error); }
    };
    refreshProviderBookings();
    const timer = window.setInterval(refreshProviderBookings, 7000);
    return () => { active = false; window.clearInterval(timer); };
  }, [currentUser?._id, currentUser?.role]);
  React.useEffect(() => {
    if (paymentReturnHandled.current || currentUser?.role !== 'farmer' || page !== 'My bookings') return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    if (!reference) return;
    paymentReturnHandled.current = true;
    authRequest(`/payments/verify?reference=${encodeURIComponent(reference)}`, undefined, 'GET')
      .then(async ({data}) => {
        if (data?.status !== 'paid') throw new Error('Paystack has not confirmed payment yet. Refresh your bookings in a moment.');
        const refreshed = await authRequest('/bookings', undefined, 'GET');
        if (Array.isArray(refreshed.data)) setRequestsState(refreshed.data.map(mapBookingRecord));
        setNotice('Payment confirmed. The provider payout will be released after delivery confirmation.');
      })
      .catch(error => setNotice(error.message || 'Payment could not be verified.'))
      .finally(() => {
        params.delete('reference'); params.delete('trxref'); params.delete('status');
        const query = params.toString();
        history.replaceState(history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
      });
  }, [currentUser, page]);
  React.useEffect(() => {
    if (currentUser?.role !== 'farmer' || page !== 'Track machinery' || !requestsState.some(item => item.transportStatusKey === 'in_transit')) return undefined;
    let active = true;
    const refresh = () => authRequest('/bookings', undefined, 'GET').then(({data}) => {
      if (active && Array.isArray(data)) setRequestsState(data.map(mapBookingRecord));
    }).catch(error => console.error('Could not refresh live transport tracking:', error));
    const timer = window.setInterval(refresh, 12000);
    return () => { active = false; window.clearInterval(timer); };
  }, [currentUser, page, requestsState.some(item => item.transportStatusKey === 'in_transit')]);
  React.useEffect(() => {
    if (currentUser?.role !== 'logistics') return;
    let active = true;
    setTransportLoading(true);
    Promise.all([authRequest('/transport/requests', undefined, 'GET'), authRequest('/transport/jobs', undefined, 'GET')])
      .then(([available, assigned]) => { if (active) { setTransportRequests((available.data || []).map(mapBookingRecord)); setTransportJobs((assigned.data || []).map(mapBookingRecord)); } })
      .catch(error => { if (active) flash(error.message || 'Transport jobs could not be loaded.'); })
      .finally(() => { if (active) setTransportLoading(false); });
    return () => { active = false; };
  }, [currentUser, page]);
  React.useEffect(() => {
    if (!['Dashboard','My Machinery','Edit Machinery','Calendar','Analytics'].includes(page) || currentUser?.role !== 'provider') return undefined;
    let active = true;
    setProviderListingsLoading(true);
    setProviderListingsError('');
    authRequest('/equipment/mine', undefined, 'GET')
      .then(({ data }) => { if (active) { const items = Array.isArray(data) ? data.map(mapEquipmentRecord) : []; setProviderListings(items); if (page === 'Edit Machinery') { const id = location.pathname.split('/').pop(); setEditingMachine(items.find(item => item.id === id) || null); } } })
      .catch(error => { if (active) { const message = error.message || 'Your listings could not be loaded.'; setProviderListingsError(message); flash(message); } })
      .finally(() => { if (active) setProviderListingsLoading(false); });
    return () => { active = false; };
  }, [page, currentUser]);
  React.useEffect(() => {
    const providerPages = ['My Machinery','Add Machinery','Edit Machinery','Calendar','Earnings','Reviews'];
    const logisticsPages = ['Dashboard','Requests','My Jobs','Settings'];
    if ((signupRole === 'Farmer' && providerPages.includes(page)) || (signupRole === 'Logistics' && !logisticsPages.includes(page)) || (signupRole === 'Provider' && ['Find Machinery','My bookings','Track machinery','My Jobs'].includes(page))) {
      history.replaceState({page:'Dashboard'},'','/app/dashboard');
      setPage('Dashboard');
    }
  }, [page, signupRole]);
  React.useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = themePreference === 'system' ? (media.matches ? 'dark' : 'light') : themePreference;
      setTheme(resolved);
      document.documentElement.dataset.theme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#06150e' : '#f3f7f3');
      localStorage.setItem('hadalink-theme', resolved);
      localStorage.setItem('hadalink-theme-preference', themePreference);
    };
    apply();
    if (themePreference !== 'system') return undefined;
    media.addEventListener?.('change', apply);
    return () => media.removeEventListener?.('change', apply);
  }, [themePreference]);
  React.useEffect(() => {
    if (!currentUser) return;
    if (['light', 'dark', 'system'].includes(currentUser.themePreference)) {
      setThemePreference(currentUser.themePreference);
      return;
    }
    void chooseThemePreference(themePreference).catch(error => console.warn(error.message));
  }, [currentUser?.id]);
  function go(p, payload) { if (p === 'Edit Machinery') setEditingMachine(payload || providerListings.find(item=>item.id===location.pathname.split('/').pop()) || null); if (['Farmer', 'Provider', 'Logistics'].includes(payload)) { setSignupRole(payload); localStorage.setItem('hadalink-role', payload); } setPage(p); setNotice(''); setMobileNav(false); setMobileMoreOpen(false); const route=p==='landing'?'/':p==='About'?'/about':p==='login'?'/login':p==='register'?'/register':p==='forgot'?'/forgot-password':`/app/${({'Dashboard':'dashboard','Find Machinery':'find','My bookings':'bookings','Track machinery':'tracking','My Machinery':'machinery','Add Machinery':'add','Edit Machinery':`machinery/edit/${payload?._id||payload?.id||''}`,'Requests':'requests','My Jobs':'jobs','Calendar':'calendar','Analytics':'analytics','Earnings':'earnings','Reviews':'reviews','Settings':'settings'}[p]||'dashboard')}`; history.pushState({page:p},'',route); window.scrollTo(0,0); }
  React.useEffect(()=>{const f=()=>{const p=location.pathname.split('/').filter(Boolean);setPage(p[0]==='app'?(p[1]==='machinery'&&p[2]==='edit'?'Edit Machinery':({machinery:'My Machinery',add:'Add Machinery',requests:'Requests',jobs:'My Jobs',calendar:'Calendar',analytics:'Analytics',earnings:'Earnings',reviews:'Reviews',settings:'Settings',find:'Find Machinery',bookings:'My bookings',tracking:'Track machinery'}[p[1]]||'Dashboard')):({about:'About',login:'login',register:'register',forgot:'forgot'}[p[0]]||'landing'))};window.addEventListener('popstate',f);return()=>window.removeEventListener('popstate',f)},[]);
  React.useEffect(()=>{
    if(page!=='register') return;
    const layout=document.querySelector('.auth-register.auth-layout');
    if(!layout) return;
    const viewport=window.visualViewport;
    const syncViewport=()=>{
      const height=Math.round(viewport?.height||window.innerHeight);
      layout.style.setProperty('--auth-visible-height',`${height}px`);
      layout.toggleAttribute('data-short-viewport',window.matchMedia('(max-width: 540px)').matches&&height<=720);
    };
    syncViewport();
    viewport?.addEventListener('resize',syncViewport);
    viewport?.addEventListener('scroll',syncViewport);
    window.addEventListener('resize',syncViewport);
    window.addEventListener('orientationchange',syncViewport);
    return()=>{
      viewport?.removeEventListener('resize',syncViewport);
      viewport?.removeEventListener('scroll',syncViewport);
      window.removeEventListener('resize',syncViewport);
      window.removeEventListener('orientationchange',syncViewport);
      layout.style.removeProperty('--auth-visible-height');
      layout.removeAttribute('data-short-viewport');
    };
  },[page]);
  function flash(text){setNotice(text);window.clearTimeout(window.__hadalinkToast);window.__hadalinkToast=window.setTimeout(()=>setNotice(''),3200)}
  function logout() {
    setAccountMenuOpen(false);
    setMobileNav(false);
    setCurrentUser(null);
    setOnboardingRequired(false);
    go('login');
    void authRequest('/auth/logout', {}).catch(() => { /* The local route has already exited if the session has expired. */ });
  }
  const accountName = currentUser?.name?.trim() || currentUser?.profile?.contactName?.trim() || currentUser?.email || (isFarmer ? 'Farmer account' : isLogistics ? 'Logistics account' : 'Provider account');
  const accountInitials = accountName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const accountAvatar = currentUser?.profile?.avatarUrl;
  const pendingVerificationNotices = verificationNotices(currentUser);
  const transportNotices = (isFarmer ? requestsState.filter(item => item.transportRequested && !['Delivered','Cancelled','Unfulfilled'].includes(item.transportStatus)).map(item => ({ title: `${item.machine || 'Machinery'} transport: ${item.transportStatus.toLowerCase()}`, detail: item.logisticsProvider ? `Assigned to ${item.logisticsProvider}.` : 'We’ll update you when a logistics provider accepts.' })) : isLogistics ? transportJobs.filter(item => !['Delivered','Cancelled','Unfulfilled'].includes(item.transportStatus)).map(item => ({ title: `${item.machine || 'Transport'} · ${item.transportStatus}`, detail: `${item.place}${item.farmer ? ` · ${item.farmer}` : ''}` })) : []);
  const marketplaceNotices = isFarmer
    ? requestsState.filter(item => item.paymentStatus === 'paid').map(item => ({ title: `Payment received · ${item.machine || 'booking'}`, detail: `HadaLink’s 10% service fee is ₦${(item.commissionKobo / 100).toLocaleString('en-NG')}. The provider payout will be released after delivery is confirmed.` }))
    : currentUser?.role === 'provider'
      ? requestsState.filter(item => item.status === 'Pending' || item.paymentStatus === 'paid').map(item => item.status === 'Pending'
        ? ({ title: `New booking request · ${item.machine || 'equipment'}`, detail: `${item.farmer || 'A farmer'} · ${item.service} · ${item.place}` })
        : ({ title: `${item.payoutStatus === 'release_pending' ? 'Delivery confirmed · payout ready' : 'Payment received · payout held'} · ${item.machine || 'booking'}`, detail: `Total ₦${(item.amountValue + (item.transportRequested ? item.transportFee : 0)).toLocaleString('en-NG')} · HadaLink service fee 10% (₦${(item.commissionKobo / 100).toLocaleString('en-NG')}) · your payout ₦${(item.providerAmountKobo / 100).toLocaleString('en-NG')}. ${item.payoutStatus === 'release_pending' ? 'HadaLink will arrange the payout.' : 'Your payout will be released after delivery is confirmed.'}` }))
      : [];
  const notices = [...pendingVerificationNotices, ...marketplaceNotices, ...transportNotices];
  const userLink=(p,label)=> <button className="text-link" onClick={()=>go(p)}>{label}</button>;
  React.useEffect(() => {
    if (!notificationsOpen) return undefined;
    const closeOnEscape = event => { if (event.key === 'Escape') setNotificationsOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [notificationsOpen]);
  if (SITE_ACCESS_REQUIRED && siteAccess !== 'passed') return <SiteAccessGate siteKey={SITE_TURNSTILE_KEY} state={siteAccess} theme={theme} onVerified={markSiteAccessVerified} onRetry={retrySiteAccess}/>;
  if (['login','register','forgot'].includes(page)) return <AuthPage page={page} go={go} initialRole={signupRole} theme={theme} toggleTheme={toggleTheme}/>;
  if(page==='landing') return <Landing go={go} theme={theme} toggleTheme={toggleTheme}/>
  if(page==='About') return <AboutPage go={go} theme={theme} toggleTheme={toggleTheme}/>
  if (onboardingRequired === null) return <main className="profile-onboarding-loading" aria-live="polite"><span className="brand-icon"><img src="/hadalink-mark.png" alt="" /></span><p>Loading your workspace…</p></main>;
  if (onboardingRequired) return <ProfileOnboarding user={currentUser} onUserUpdated={setCurrentUser} onComplete={user => { setCurrentUser(user); setOnboardingRequired(false); setNotificationsOpen(verificationNotices(user).length > 0); go('Dashboard'); }} onLogout={logout}/>;
  const current = isLogistics ? ({Dashboard:'Home',Requests:'Transport requests','My Jobs':'My transport jobs',Settings:'Profile'}[page]||'Home') : isFarmer && page === 'Dashboard' ? `${titles.Dashboard}, ${currentUser?.name?.trim().split(/\s+/)[0] || 'there'}` : isFarmer && page === 'Find Machinery' ? 'Find machinery for your farm' : isFarmer && page === 'My bookings' ? 'My bookings' : isFarmer && page === 'Track machinery' ? 'Track machinery' : page === 'Dashboard' ? `${titles.Dashboard}, ${currentUser?.name?.trim().split(/\s+/)[0] || 'there'}` : titles[page] || titles.Dashboard;
  async function refreshTransport() {
    setTransportLoading(true);
    try { const [available,assigned]=await Promise.all([authRequest('/transport/requests',undefined,'GET'),authRequest('/transport/jobs',undefined,'GET')]); setTransportRequests((available.data||[]).map(mapBookingRecord)); setTransportJobs((assigned.data||[]).map(mapBookingRecord)); }
    catch(error) { flash(error.message||'Transport requests could not be refreshed.'); }
    finally { setTransportLoading(false); }
  }
  async function decideTransport(job, decision, actionPin) {
    const {data}=await authRequest(`/transport/${job.id}/decision`,{decision,...(actionPin?{actionPin}:{})},'PATCH');
    const saved=mapBookingRecord(data);
    setTransportRequests(previous=>previous.filter(item=>item.id!==job.id));
    if(decision==='accept')setTransportJobs(previous=>[saved,...previous.filter(item=>item.id!==job.id)]);
  }
  async function updateTransportStatus(job, status, deliveryNote) {
    const {data}=await authRequest(`/transport/${job.id}/status`,{status:job.transportStatusKey,deliveryNote},'PATCH');
    const saved=mapBookingRecord(data);
    setTransportJobs(previous=>previous.map(item=>item.id===job.id?saved:item));
  }
  return <div className="portal"><aside className={`sidebar ${mobileNav?'sidebar-open':''}`}><button className="brand" onClick={()=>go('Dashboard')}><span className="brand-icon"><img src="/hadalink-mark.png" alt="" /></span><span className="brand-text">Hada<span>Link</span><small>AGRI-RENTALS</small></span></button><span className="sidebar-caption">{isFarmer ? 'FARMER WORKSPACE' : isLogistics ? 'LOGISTICS PROVIDER WORKSPACE' : 'PROVIDER WORKSPACE'}</span><nav className="side-nav">{(isFarmer ? farmerNav : isLogistics ? logisticsNav : navItems).map(({id,icon:Icon})=><button key={id} onClick={()=>go(id)} className={`nav-item ${page===id?'active':''}`}><Icon size={17}/><span>{isLogistics&&id==='Dashboard'?'Home':isLogistics&&id==='Settings'?'Profile':id==='Dashboard'?'Dashboard':id}</span>{id==='Requests'&&(isLogistics?transportRequests.length:requestsState.filter(request=>request.status==='Pending').length)>0&&<span className="nav-count">{isLogistics?transportRequests.length:requestsState.filter(request=>request.status==='Pending').length}</span>}{id==='Add Machinery'&&<span className="nav-add"><Plus size={13}/></span>}</button>)}</nav><div className="sidebar-tools" aria-label="Quick settings"><button className="sidebar-tool" aria-label="Notifications" onClick={()=>setNotificationsOpen(true)}><Bell size={16}/><span>Notifications</span></button><button className="sidebar-tool" onClick={toggleTheme}><span className="sidebar-tool-icon">{theme==='dark'?<Sun size={16}/>:<Moon size={16}/>}</span><span>{theme==='dark'?'Light mode':'Dark mode'}</span></button></div><div className="side-help"><div className="help-icon"><CircleHelp size={17}/></div><strong>Need a hand?</strong><span>Our local team is here for you.</span></div><button className="logout" onClick={logout}><LogOut size={16}/> Log out</button></aside>{mobileNav&&<button aria-label="Close menu" className="mobile-backdrop" onClick={event=>closePopup(setMobileNav,event)}/>}     <div className="portal-main"><header className="topbar"><button type="button" className="mobile-menu" aria-label={mobileNav?'Close navigation menu':'Open navigation menu'} aria-expanded={mobileNav} onClick={()=>setMobileNav(open=>!open)}>{mobileNav?<X size={19}/>:<Menu size={19}/>}</button><label className="global-search"><Search size={16}/><input aria-label="Search machinery and requests" placeholder={isFarmer?'Search machinery or locations…':'Search machinery or requests…'} value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label="Clear search" onClick={()=>setSearch('')}><X size={14}/></button>}</label><div className="notification-wrap"><button className="icon-button notification" aria-label={`Notifications${notices.length ? `, ${notices.length} items need attention` : ''}`} aria-expanded={notificationsOpen} onClick={()=>setNotificationsOpen(open => !open)}><Bell size={17}/>{notices.length > 0 && <i/>}</button></div><button className="icon-button notification desktop-notification" aria-label={`Notifications${notices.length ? `, ${notices.length} items need attention` : ''}`} onClick={()=>setNotificationsOpen(true)}><Bell size={16}/>{notices.length > 0 && <i/>}</button><ThemeToggle theme={theme} onToggle={toggleTheme}/><div className={`account-menu ${accountMenuOpen?'open':''}`}><button className="account-trigger" aria-label={`Account menu for ${accountName}`} aria-expanded={accountMenuOpen} onClick={()=>setAccountMenuOpen(open=>!open)}><span className="account-name">{accountName}</span><span className="avatar-logo">{accountAvatar?<img src={accountAvatar} alt="" referrerPolicy="no-referrer"/>:<span className="avatar-initials">{accountInitials}</span>}</span><ChevronDown size={14}/></button>{accountMenuOpen&&<button className="account-modal-backdrop" aria-label="Dismiss account menu" onClick={event=>closePopup(setAccountMenuOpen,event)}><span className="account-dropdown" onClick={event=>event.stopPropagation()}><span className="account-dropdown-identity"><span className="avatar-logo">{accountAvatar?<img src={accountAvatar} alt="" referrerPolicy="no-referrer"/>:<span className="avatar-initials">{accountInitials}</span>}</span><span><strong>{accountName}</strong><small>{currentUser?.email || ''}</small></span></span><span className="account-theme-toggle" onClick={()=>toggleTheme()}>{theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}Switch to {theme==='dark'?'light':'dark'} mode</span><span role="button" tabIndex={0} onClick={()=>logout()}><LogOut size={15}/>Log out</span></span></button>}</div></header>
    {!isLogistics&&<div className="mobile-quick-nav" aria-label="Quick navigation">{quickNavItems.map(({id,icon:Icon})=><button key={id} className={`mobile-quick-nav-item ${page===id?'active':''}`} onClick={()=>go(id)}><Icon size={16}/><span>{id}</span></button>)}</div>}{!isFarmer&&!isLogistics&&mobileMoreOpen&&<><button className="floating-more-backdrop" aria-label="Close more navigation" onClick={event=>closePopup(setMobileMoreOpen,event)}/><nav className="floating-more-menu" aria-label="More provider pages">{providerMoreNav.map(({id,icon:Icon})=><button key={id} className={page===id?'active':''} onClick={()=>go(id)}><Icon size={16}/><span>{id}</span></button>)}</nav></>}<nav className={`floating-nav ${!isFarmer?'provider-floating-nav':''}`} aria-label="Main navigation">{(isFarmer?farmerNav:isLogistics?logisticsNav:providerQuickNav).map(({id,icon:Icon})=><button key={id} aria-label={id} title={id} className={`floating-nav-item ${page===id?'active':''}`} onClick={()=>go(id)}><Icon size={18}/><span>{isLogistics?({'Dashboard':'Home','Settings':'Profile'}[id]||id):isFarmer?({'Find Machinery':'Find','My bookings':'Bookings','Track machinery':'Track'}[id]||id):id==='My Machinery'?'Machines':id}</span></button>)}{!isFarmer&&!isLogistics&&<button aria-label="More navigation" title="More" className={`floating-nav-item floating-more-trigger ${mobileMoreOpen||providerMoreNav.some(item=>item.id===page)?'active':''}`} aria-expanded={mobileMoreOpen} onClick={()=>setMobileMoreOpen(open=>!open)}><Menu size={18}/><span>More</span></button>}</nav>
    <main className="workspace"><div className="page-heading"><div><div className="eyebrow">{isFarmer ? 'FARMER WORKSPACE · PLATEAU STATE' : isLogistics ? <>LOGISTICS PROVIDER · PLATEAU STATE</> : <><span/> {page==='Dashboard'?'PLATEAU CENTRAL HUB · JOS':page==='Add Machinery'?`LISTING MANAGEMENT · ${currentUser?.name?.trim() || 'YOUR PROVIDER ACCOUNT'}`:page==='Settings'?'PROVIDER ADMINISTRATION':`PROVIDER WORKSPACE · PLATEAU STATE`}</>}</div><h1>{current}</h1><p>{isFarmer && page === 'Dashboard' ? 'Your farm activity and equipment requests at a glance.' : isFarmer && page === 'Find Machinery' ? 'Browse equipment listed by local providers and choose what your farm needs.' : isLogistics ? ({Dashboard:'Your requests, assigned jobs and delivery updates at a glance.',Requests:'Review transport assignments and the fixed HadaLink fee before accepting.', 'My Jobs':'Update accepted transport jobs as they move from pickup to delivery.',Settings:'Manage your business details, capacity and operating areas.'}[page] || 'Manage your transport jobs.') : ({Dashboard:'Here’s an overview of your machinery and farm bookings.','My bookings':'Review provider responses and booking history.','Track machinery':'Follow booking progress and provider confirmations.', 'My Machinery':'Manage, update, and track equipment across Plateau State.', 'Add Machinery':'List equipment and mechanization services for farmers to discover and request.',Requests:'Review rental requests and coordinate your next dispatch.',Calendar:'See your bookings, machinery availability, and field schedule.',Earnings:'Review completed bookings and indicative commission records.',Reviews:'Review feedback linked to completed bookings.',Settings:'Manage your profile, operating areas, and settlement preferences.',Analytics:'Understand fleet activity and rental growth separately from payouts.','Edit Machinery':'Update the details for this equipment listing.'}[page])}</p></div><div className="heading-actions">{!isFarmer&&!isLogistics&&page==='Dashboard'&&<span className="available-pill"><span/> {providerListingsLoading?'Loading fleet':`${providerListings.filter(item=>item.status==='Available').length} listings available`}</span>}{!isFarmer&&!isLogistics&&page==='My Machinery'&&<span className="available-pill"><span/> {providerListingsLoading?'Loading listings':`${providerListings.filter(item=>item.status==='Available').length} available`}</span>}{!isFarmer&&!isLogistics&&page==='My Machinery'&&<button className="button button-primary" onClick={()=>go('Add Machinery')}><Plus size={15}/> Add machinery</button>}{!isFarmer&&!isLogistics&&page==='Dashboard'&&<button className="button button-primary" onClick={()=>go('Add Machinery')}><Plus size={15}/> Add machinery</button>}{!isFarmer&&!isLogistics&&page==='Add Machinery'&&<button className="button button-ghost" onClick={()=>go('My Machinery')}><ArrowLeft size={15}/> Back to My Machinery</button>}{!isFarmer&&!isLogistics&&page==='Earnings'&&<button className="button button-ghost" onClick={()=>downloadStatement(requestsState)}><Download size={15}/> Download CSV statement</button>}</div></div>
    {notice&&<div className="toast"><CheckCircle2 size={17}/>{notice}<button aria-label="Dismiss" onClick={()=>setNotice('')}><X size={15}/></button></div>}
    {notificationsOpen&&createPortal(<div className="notification-backdrop" role="presentation" onClick={event=>closePopup(setNotificationsOpen,event)}><section className="notification-popup" role="dialog" aria-modal="true" aria-labelledby="notification-title" onClick={event=>event.stopPropagation()}><header><strong id="notification-title">Notifications</strong><button type="button" aria-label="Close notifications" onClick={event=>closePopup(setNotificationsOpen,event)}><X size={17}/></button></header>{notices.length ? <><p className="notification-intro">{pendingVerificationNotices.length ? 'A few account details still need attention.' : currentUser?.role === 'provider' ? 'Booking requests and payment updates from your equipment listings.' : isFarmer ? 'Your booking payment and delivery updates.' : 'Your latest transport updates.'}</p><div className="verification-notice-list">{notices.map((item,index)=><article className="verification-notice" key={`${item.title}-${index}`}><span><ShieldCheck size={17}/></span><div><strong>{item.title}</strong><small>{item.detail}</small></div></article>)}</div>{pendingVerificationNotices.length>0&&<small className="notification-footnote">These reminders will stay here until missing details are added or your email is verified.</small>}</> : <><span className="notification-empty-icon"><Bell size={20}/></span><p>You’re all caught up.</p><small>New account updates will appear here.</small></>}</section></div>,document.body)}
    {actionPinRequest&&<ActionPinDialog request={actionPinRequest} onUserUpdated={setCurrentUser} onFinish={pin=>{actionPinRequest.resolve(pin);setActionPinRequest(null)}}/>}
    {page==='Dashboard'&&(isFarmer ? <FarmerHome machinesState={machinesState} requestsState={requestsState} go={go} user={currentUser}/> : !isLogistics&&<Dashboard go={go} machinesState={providerListings} requestsState={requestsState} flash={flash} loading={bookingsLoading||providerListingsLoading} error={bookingsError||providerListingsError}/ >)}
    {isLogistics&&<LogisticsWorkspace page={page} user={currentUser} requests={transportRequests} jobs={transportJobs} loading={transportLoading} onRefresh={refreshTransport} onDecision={decideTransport} onStatus={updateTransportStatus} onUserUpdated={setCurrentUser} requestActionPin={requestActionPin} flash={flash} go={go}/>}
    {page==='Find Machinery'&&isFarmer&&<FarmerDashboard machinesState={machinesState} requestsState={requestsState} setRequestsState={setRequestsState} loading={machinesLoading} error={machinesError} search={search} requestActionPin={requestActionPin}/>}

    {isFarmer&&page==='My bookings'&&<FarmerBookings requestsState={requestsState} setRequestsState={setRequestsState} loading={bookingsLoading} error={bookingsError} go={go} requestActionPin={requestActionPin}/>}
    {isFarmer&&page==='Track machinery'&&<FarmerTracking requestsState={requestsState} go={go}/>}
    {page==='My Machinery'&&<Machinery machinesState={providerListings} loading={providerListingsLoading} setMachinesState={setProviderListings} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} go={go} flash={flash}/>}
    {page==='Add Machinery'&&<AddMachine flash={flash} go={go} setProviderListings={setProviderListings} user={currentUser} requestActionPin={requestActionPin}/>}{page==='Edit Machinery'&&<EditMachine machine={editingMachine} setMachinesState={setProviderListings} go={go} flash={flash}/>}
    {!isLogistics&&page==='Requests'&&<Requests requestsState={requestsState} setRequestsState={setRequestsState} setProviderListings={setProviderListings} activeRequest={activeRequest} setActiveRequest={setActiveRequest} search={search} flash={flash} requestActionPin={requestActionPin}/>}
    {page==='Calendar'&&<CalendarPage month={month} setMonth={setMonth} year={calendarYear} setYear={setCalendarYear} requestsState={requestsState} machinesState={providerListings}/>}
    {page==='Analytics'&&<Analytics machinesState={isFarmer?machinesState:providerListings} requestsState={requestsState}/>}{page==='Earnings'&&<Earnings requestsState={requestsState}/>}
    {page==='Reviews'&&<Reviews requestsState={requestsState}/>}
    {page==='Settings'&&<ThemePreferenceSettings preference={themePreference} onChange={chooseThemePreference}/>}
    {!isLogistics&&page==='Settings'&&<SettingsPage flash={flash} currentUser={currentUser} onUserUpdated={setCurrentUser}/>}
    <footer className="workspace-footer"><span>© {new Date().getFullYear()} HadaLink · Supporting Plateau State agriculture</span><span><ShieldCheck size={13}/> Bookings coordinated locally <span className="footer-dot">·</span> Jos, Nigeria</span></footer></main></div></div>;
}

function ThemeToggle({ theme, onToggle }) { return <button type="button" className="theme-toggle" onClick={onToggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}<span>{theme === 'dark' ? 'Light' : 'Dark'}</span></button> }

function ThemePreferenceSettings({ preference, onChange }) {
  const [message, setMessage] = useState('');
  async function save(event) {
    const next = event.target.value;
    setMessage('Saving preference…');
    try {
      await onChange(next);
      setMessage('Theme preference saved to your account.');
    } catch (error) {
      setMessage(error.message || 'Theme preference could not be saved.');
    }
  }
  const description = preference === 'system'
    ? 'HadaLink follows the light or dark appearance selected on this device.'
    : `HadaLink uses ${preference} mode on all devices where you sign in.`;
  return <section className="panel appearance-settings"><div className="appearance-copy"><span className="appearance-icon">{preference === 'system' ? <Monitor size={17}/> : preference === 'dark' ? <Moon size={17}/> : <Sun size={17}/>}</span><div><h2>Appearance</h2><p>{description}</p></div></div><label className="appearance-choice"><span>Theme preference</span><select value={preference} onChange={save} aria-label="Theme preference"><option value="light">Light</option><option value="dark">Dark</option><option value="system">Use device theme</option></select></label>{message&&<small className="appearance-status" role="status">{message}</small>}</section>;
}

function PublicNav({ go, theme, toggleTheme, about = false }) {
  const [menuOpen,setMenuOpen]=useState(false);
  const closeMenu=()=>setMenuOpen(false);
  React.useEffect(()=>{
    if(!menuOpen)return undefined;
    const handleKeyDown=event=>{if(event.key==='Escape')closeMenu();};
    document.addEventListener('keydown',handleKeyDown);
    return()=>document.removeEventListener('keydown',handleKeyDown);
  },[menuOpen]);
  return <>
    <nav className={`landing-nav ${about?'about-nav':''}`}>
      <button className="brand" onClick={()=>{closeMenu();go('landing')}}><span className="brand-icon"><img src="/hadalink-mark.png" alt=""/></span><span className="brand-text">Hada<span>Link</span><small>AGRI-RENTALS</small></span></button>
      <div className="landing-links">{about?<><button className="landing-nav-link" onClick={()=>go('landing')}>Home</button><a href="#about-mission">Our mission</a><a href="#about-values">What we do</a></>:<><a href="#how">How it works</a><a href="#equipment">Equipment</a><a href="#stories">Farmers</a><button className="landing-nav-link" onClick={()=>go('About')}>About HadaLink</button></>}</div>
      <div className="landing-nav-actions"><ThemeToggle theme={theme} onToggle={toggleTheme}/><button className="button button-ghost" onClick={()=>go('login')}>Log in</button><button className="button button-primary" onClick={()=>go('register')}>Get started <ArrowRight size={15}/></button></div>
      <button className={`public-menu-toggle ${menuOpen?'is-open':''}`} type="button" aria-label={menuOpen?'Close navigation menu':'Open navigation menu'} aria-expanded={menuOpen} aria-controls="public-mobile-menu" onClick={()=>setMenuOpen(open=>!open)}><span className="public-menu-icon"><i/><i/></span><span>{menuOpen?'Close':'Menu'}</span></button>
    </nav>
    {menuOpen&&<><button className="public-menu-backdrop" aria-label="Dismiss mobile menu" onClick={closeMenu}/><section className="public-mobile-menu" id="public-mobile-menu" aria-label="Mobile navigation">
      <span className="public-menu-eyebrow">{about?'EXPLORE HADALINK':'YOUR NEXT FIELD JOB STARTS HERE'}</span>
      <div className="public-menu-links">{about?<><button onClick={()=>{closeMenu();go('landing')}}><span>01</span>Home<ArrowRight size={17}/></button><a href="#about-mission" onClick={closeMenu}><span>02</span>Our mission<ArrowRight size={17}/></a><a href="#about-values" onClick={closeMenu}><span>03</span>What we do<ArrowRight size={17}/></a></>:<><a href="#how" onClick={closeMenu}><span>01</span>How it works<ArrowRight size={17}/></a><a href="#equipment" onClick={closeMenu}><span>02</span>Explore equipment<ArrowRight size={17}/></a><a href="#stories" onClick={closeMenu}><span>03</span>Farmer stories<ArrowRight size={17}/></a><button onClick={()=>{closeMenu();go('About')}}><span>04</span>About HadaLink<ArrowRight size={17}/></button></>}</div>
      <div className="public-menu-actions"><ThemeToggle theme={theme} onToggle={toggleTheme}/><button className="button button-ghost" onClick={()=>{closeMenu();go('login')}}>Log in</button><button className="button button-primary" onClick={()=>{closeMenu();go('register')}}>Get started <ArrowRight size={15}/></button></div>
      <div className="public-menu-foot"><img src="/hadalink-mark.png" alt=""/> Local connections for Plateau agriculture.</div>
    </section></>}
  </>;
}

function AboutPage({ go, theme, toggleTheme }) { return <div className="landing about-page"><PublicNav go={go} theme={theme} toggleTheme={toggleTheme} about/><main><section className="about-hero"><img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85" alt="Farmland in Plateau State"/><div className="about-hero-overlay"/><div className="about-hero-copy"><span className="eyebrow"><span/> ABOUT HADALINK · PLATEAU STATE</span><h1>Local connections<br/>help farms <span>grow.</span></h1><p>HadaLink brings farmers and agricultural equipment providers closer together, making it easier to find the right machinery for the work ahead.</p><button className="button button-harvest button-large" onClick={() => go('register')}>Join the network <ArrowRight size={16}/></button></div></section><section className="landing-section about-mission" id="about-mission"><div><span className="eyebrow"><span/> OUR MISSION</span><h2>Make useful farm equipment easier to find and share.</h2></div><p>We are building a local-first rental platform for farmers who need seasonal access to machinery and providers who want to put their equipment to work. HadaLink helps people discover options, compare listing details, and connect directly to plan a rental.</p></section><section className="landing-section about-values" id="about-values"><article><MapPin size={21}/><h3>Local by design</h3><p>Start with providers and farming communities across Plateau State.</p></article><article><ShieldCheck size={21}/><h3>Clear information</h3><p>See machine type, operating area, availability, and rates in one listing.</p></article><article><MessageCircle size={21}/><h3>Direct coordination</h3><p>Farmers and providers can discuss timing and service details together.</p></article></section><section className="landing-cta"><span className="eyebrow"><span/> GROWING TOGETHER</span><h2>Let’s make the next season easier.</h2><p>Find equipment nearby or list your machinery for local farmers.</p><button className="button button-harvest button-large" onClick={() => go('register')}>Get started <ArrowRight size={16}/></button></section></main><footer className="landing-footer"><div className="footer-main"><div className="footer-brand"><button className="brand" onClick={() => go('landing')}><span className="brand-icon"><img src="/hadalink-mark.png" alt="" /></span><span className="brand-text">Hada<span>Link</span><small>AGRI-RENTALS</small></span></button><p>Local connections for Plateau agriculture.</p></div><div className="footer-links"><strong>Explore</strong><button onClick={() => go('landing')}>Home</button><a href="#about-mission">Our mission</a></div><div className="footer-links"><strong>Get started</strong><button onClick={() => go('register')}>Farmer account</button><button onClick={() => go('register','Provider')}>Provider account</button></div><div className="footer-join" /></div><div className="footer-bottom"><span>© 2026 HadaLink · Plateau State, Nigeria</span><span><ShieldCheck size={13}/> Built around local connections</span></div></footer></div> }

function Landing({ go, theme, toggleTheme }) {
  const equipment = machines;
  const benefits = [
    { title: 'Find equipment nearby', text: 'Explore machinery from providers serving Jos and surrounding farming communities.' },
    { title: 'Request and coordinate', text: 'Share your preferred date, field location and service so providers can confirm the details.' },
    { title: 'Rent for the work ahead', text: 'Find equipment for the jobs you need done without purchasing every machine yourself.' },
  ];

  const faqs = [
    ['How do I book equipment?', 'Compare local listings, choose a machine and service, then send a request with your preferred date, field location and farm size. The provider confirms availability and final terms.'],
    ['Are the machines located in Plateau State?', 'The listings focus on local providers and operating areas around Jos and nearby Plateau communities. Confirm the machine’s current location with its owner.'],
    ['Can I list my own equipment?', 'Yes. Create an account as a provider to start sharing your machinery with farmers looking for local rental options.'],
    ['Who operates the machinery?', 'Ask each provider whether an operator is included and confirm transport, fuel, and other service details before booking.'],
  ];

  return <div className="landing">
    <PublicNav go={go} theme={theme} toggleTheme={toggleTheme}/>
    <main>
      <section className="hero">
        <img className="hero-image" src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1440&q=75" srcSet="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=720&q=75 720w, https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=75 1200w, https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1920&q=75 1920w" sizes="100vw" fetchPriority="high" alt="A farmer walking through a field at sunset" />
        <div className="hero-overlay" />
        <div className="hero-content"><span className="hero-badge"><span /> EQUIPMENT LISTINGS · PLATEAU STATE</span><h1><span className="hero-title-line">The right machine.</span><span className="hero-title-line">Right when <span className="hero-title-accent">you need it.</span></span></h1><p>Find and compare provider-listed equipment around Jos. Send a request with your date, location and service; the provider confirms availability and final terms.</p><div className="hero-actions"><button className="button button-harvest button-large" onClick={() => go('register', 'Farmer')}>Find machinery <ArrowRight size={18} /></button><button className="button button-glass button-large" onClick={() => go('register', 'Provider')}><Tractor size={17} /> List your equipment</button></div><div className="hero-proof"><div className="proof-avatars"><span>MU</span><span>DG</span><span>BP</span><span>+</span></div><span><strong>Built for farmers in Plateau.</strong><br />Connecting local farms, one booking at a time.</span></div></div>
        <div className="hero-side-note"><ShieldCheck size={15} /><span>Local providers. Clear listing details.<br /><strong>Made for your field.</strong></span></div><a href="#how" className="scroll-indicator">SCROLL TO EXPLORE <ArrowDown size={13} /></a>
      </section>
      <section className="stats-strip"><div><strong>Plateau</strong><span>Our home and our first hub</span></div><div><strong>Local listings</strong><span>Equipment offered by providers</span></div><div><strong>Direct</strong><span>Talk to the people working your field</span></div><div><strong>On demand</strong><span>Tools for the season ahead</span></div></section>
      <section className="landing-section how-section" id="how"><div className="section-heading"><div><span className="eyebrow"><span /> SIMPLE FROM THE FIRST STEP</span><h2>Good farming starts<br />with the <span>right tools.</span></h2></div><p>Growing your farm shouldn’t mean spending more on machines you only need for a season. Find what’s nearby and arrange the work directly.</p></div><div className="how-grid"><article className="how-card"><span className="how-num">01</span><div className="how-icon"><Search size={20} /></div><h3>Find the right machine</h3><p>Browse farm equipment near you, with clear pricing and local details.</p></article><article className="how-card"><span className="how-num">02</span><div className="how-icon"><MessageCircle size={20} /></div><h3>Talk to a local owner</h3><p>Ask about dates, operators, and the right machine for your land.</p></article><article className="how-card"><span className="how-num">03</span><div className="how-icon"><Sprout size={20} /></div><h3>Get out in your field</h3><p>Agree the details and get farming when the timing matters.</p></article></div></section>
      <section className="landing-section userflow-section"><div className="section-heading"><div><span className="eyebrow"><span /> THREE WAYS TO GET STARTED</span><h2>Choose your path.</h2></div><p>Find equipment for your farm, list machinery, or take on local transport jobs.</p></div><div className="userflow-grid"><article className="userflow-card"><span className="userflow-label">FOR FARMERS</span><h3>Find equipment for your farm</h3><div className="userflow-steps"><span>Browse</span><ArrowRight size={14}/><span>Compare</span><ArrowRight size={14}/><span>Contact owner</span><ArrowRight size={14}/><span>Book</span></div><button className="button button-harvest" onClick={() => go('register', 'Farmer')}>Find machinery <ArrowRight size={14}/></button></article><article className="userflow-card"><span className="userflow-label">FOR EQUIPMENT PROVIDERS</span><h3>Put your equipment to work</h3><div className="userflow-steps"><span>Register</span><ArrowRight size={14}/><span>List machine</span><ArrowRight size={14}/><span>Review requests</span><ArrowRight size={14}/><span>Track jobs</span></div><button className="button button-primary" onClick={() => go('register', 'Provider')}>List equipment <ArrowRight size={14}/></button></article><article className="userflow-card"><span className="userflow-label">FOR LOGISTICS PROVIDERS</span><h3>Put your transport service to work</h3><div className="userflow-steps"><span>Get requests</span><ArrowRight size={14}/><span>Accept jobs</span><ArrowRight size={14}/><span>Update delivery</span></div><button className="button button-primary" onClick={() => go('register', 'Logistics')}>Offer transport <ArrowRight size={14}/></button></article></div></section>
      <section id="equipment" className="landing-equipment"><div className="section-heading"><div><span className="eyebrow"><span /> EQUIPMENT THAT GETS THE JOB DONE</span><h2>Ready for the <span>next season.</span></h2></div><button className="button button-ghost" onClick={() => go('register')}>Browse all equipment <ArrowRight size={15} /></button></div><div className="equipment-marquee" aria-label="Available farm equipment"><div className="equipment-marquee-track">{[0, 1].map(copy => <div className="equipment-marquee-group" key={copy} aria-hidden={copy === 1}>{equipment.map((m) => <article className="landing-machine" key={`${copy}-${m.name}`}><div className="landing-machine-photo"><img src={`https://images.unsplash.com/${m.image}?auto=format&fit=crop&w=700&q=80`} alt={copy === 0 ? m.name : undefined} loading="lazy" /><span className="machine-availability"><span /> {m.status}</span></div><div className="landing-machine-info"><span>{m.kind} <span>· {m.area}</span></span><h3>{m.name}</h3><strong>₦{m.rate}<small> / hectare</small></strong></div></article>)}</div>)}</div></div><div className="equipment-marquee-footer"><span>Showing <strong>{equipment.length} types of equipment</strong> for Plateau farmers</span><span><i /> Pause the motion by hovering over the cards</span></div></section>
      <section className="landing-section coverage-section" id="coverage"><div className="coverage-copy"><span className="eyebrow"><span /> ROOTED IN THE PLATEAU COMMUNITY</span><h2>Local equipment.<br /><span>Closer to your farm.</span></h2><p>Explore machinery from providers serving Jos and surrounding farming communities. Availability and delivery areas vary by listing, so confirm the details directly with each owner.</p><button className="button button-ghost" onClick={() => go('register')}>Explore local listings <ArrowRight size={15} /></button></div><div className="coverage-areas"><h3>Explore our first service areas</h3>{['Jos South', 'Barkin Ladi', 'Mangu', 'Riyom', 'Jos North'].map((area) => <span key={area}><MapPin size={15} />{area}<ArrowRight size={13} /></span>)}</div></section>
      <section className="landing-section stories-section" id="stories"><div className="section-heading"><div><span className="eyebrow"><span /> BUILT AROUND LOCAL NEEDS</span><h2>Good tools make<br />hard work easier.</h2></div><p>HadaLink helps farmers and equipment owners connect around the practical details of getting work done.</p></div><div className="stories-grid">{benefits.map((benefit, index) => <article className="story-card" key={benefit.title}><span className="benefit-number">0{index + 1}</span><h3>{benefit.title}</h3><p>{benefit.text}</p></article>)}</div></section>
      <section className="landing-section faq-section" id="faq"><div className="section-heading"><div><span className="eyebrow"><span /> GOOD TO KNOW</span><h2>Questions from<br />the field.</h2></div><p>Every rental is arranged with the local equipment owner, so confirm pricing, availability, transport, and operator details before work begins.</p></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>
      <section id="join" className="landing-cta"><div className="cta-icon"><Leaf size={22} /></div><span className="eyebrow"><span /> GOOD THINGS GROW TOGETHER</span><h2>Your next season starts<br />with one <span>good connection.</span></h2><p>Compare nearby listings, or help farmers find your equipment and mechanization services.</p><button className="button button-harvest button-large" onClick={() => go('register')}>Get started with HadaLink <ArrowRight size={17} /></button></section>
    </main>
    <footer className="landing-footer"><div className="footer-main"><div className="footer-brand"><button className="brand" onClick={() => go('landing')}><span className="brand-icon"><img src="/hadalink-mark.png" alt="" /></span><span className="brand-text">Hada<span>Link</span><small>AGRI-RENTALS</small></span></button><p>Connecting Plateau farmers with the equipment and local providers that help work move forward.</p><span className="footer-location"><MapPin size={13} /> Plateau State, Nigeria</span></div><div className="footer-links"><strong>Explore</strong><a href="#how">How it works</a><a href="#equipment">Machinery</a><a href="#coverage">Service areas</a><a href="#stories">Farmer stories</a></div><div className="footer-links"><strong>Help & info</strong><a href="#faq">Frequently asked questions</a><button onClick={() => go('About')}>About HadaLink</button><button onClick={() => go('login')}>Provider portal</button></div><div className="footer-join"><strong>Join the local network</strong><p>Find equipment, list machinery, or accept transport jobs with local farmers.</p><button className="button button-primary" onClick={() => go('register', 'Logistics')}>Join as a logistics provider <ArrowRight size={14} /></button><button className="button button-ghost" onClick={() => go('register')}>Get started <ArrowRight size={14} /></button></div></div><div className="footer-bottom"><span>© 2026 HadaLink · Supporting Plateau State agriculture</span><span><ShieldCheck size={13} /> Built around local connections</span></div></footer>
  </div>;
}

function AuthPage({ page, go, initialRole = 'Farmer', theme, toggleTheme }) {
  const [role, setRole] = useState(initialRole);
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [clipboardNotice, setClipboardNotice] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [stage, setStage] = useState('details');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const googleButtonRef = React.useRef(null);
  const googleCallbackRef = React.useRef(null);
  const turnstileRef = React.useRef(null);
  const turnstileWidgetRef = React.useRef(null);
  // The site-wide access check already passed; don't challenge the same visitor twice on auth forms.
  const turnstileSiteKey = null;
  const register = page === 'register';
  const forgot = page === 'forgot';
  const verificationStage = register && stage === 'verify';
  const resetStage = forgot && stage === 'reset';
  const title = register ? verificationStage ? 'Check your email' : 'Create account' : forgot ? resetStage ? 'Choose a new password' : 'Reset password' : 'Welcome back';
  const description = register
    ? verificationStage ? `Enter the six-digit code we sent to ${email}.` : 'Join HadaLink to find or share farm equipment.'
    : forgot ? resetStage ? `Enter the code sent to ${email} and choose a new password.` : 'Enter your email and we’ll send a reset code.'
      : 'Log in to your account.';

  const completeSignIn = (accountRole = register ? role : initialRole) => go('Dashboard', accountRole);

  React.useEffect(() => {
    if (!turnstileSiteKey || !turnstileRef.current) return undefined;
    let cancelled = false;
    let widgetId;
    const renderWidget = () => {
      if (cancelled || !window.turnstile || !turnstileRef.current) return;
      turnstileRef.current.replaceChildren();
      widgetId = window.turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey,
        action: 'auth',
        theme: theme === 'dark' ? 'dark' : 'light',
        callback: token => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => setTurnstileToken(''),
      });
      turnstileWidgetRef.current = widgetId;
    };
    let script = document.querySelector('script[data-cloudflare-turnstile]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.cloudflareTurnstile = 'true';
      document.head.appendChild(script);
    }
    if (window.turnstile) renderWidget();
    else script.addEventListener('load', renderWidget);
    return () => {
      cancelled = true;
      script?.removeEventListener('load', renderWidget);
      if (widgetId !== undefined) window.turnstile?.remove(widgetId);
      turnstileWidgetRef.current = null;
      setTurnstileToken('');
    };
  }, [turnstileSiteKey, page, verificationStage, resetStage, theme]);

  async function submitAccount(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (turnstileSiteKey && !turnstileToken) throw new Error('Complete the security check first.');
      const security = turnstileSiteKey ? { turnstileToken } : {};
      if (register && !verificationStage) {
        if (password !== confirmPassword) throw new Error('Your passwords do not match.');
        await authRequest('/auth/register', { name, email, password, role: role.toLowerCase(), ...security });
        setTurnstileToken('');
        setStage('verify');
      } else if (verificationStage) {
        await authRequest('/auth/verify-email', { email, code, ...security });
        completeSignIn();
      } else if (forgot && !resetStage) {
        await authRequest('/auth/forgot-password', { email, ...security });
        setTurnstileToken('');
        setStage('reset');
      } else if (resetStage) {
        await authRequest('/auth/reset-password', { email, code, password, ...security });
        go('login');
      } else {
        const {data} = await authRequest('/auth/login', { email, password, ...security });
        completeSignIn(data?.user?.role === 'logistics' ? 'Logistics' : data?.user?.role === 'provider' ? 'Provider' : 'Farmer');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      if (turnstileSiteKey) {
        setTurnstileToken('');
        if (turnstileWidgetRef.current !== null) window.turnstile?.reset(turnstileWidgetRef.current);
      }
      setBusy(false);
    }
  }

  async function continueWithGoogle(credential) {
    if (!credential) {
      setError(import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Google sign-in did not return a credential.' : 'Google sign-in is not configured yet.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (turnstileSiteKey && !turnstileToken) throw new Error('Complete the security check first.');
      await authRequest('/auth/google', { credential, role: role.toLowerCase(), ...(turnstileSiteKey ? { turnstileToken } : {}) });
      completeSignIn();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      if (turnstileSiteKey) {
        setTurnstileToken('');
        if (turnstileWidgetRef.current !== null) window.turnstile?.reset(turnstileWidgetRef.current);
      }
      setBusy(false);
    }
  }

  googleCallbackRef.current = continueWithGoogle;
  React.useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return undefined;

    let cancelled = false;
    const mountGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: response => googleCallbackRef.current?.(response.credential),
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: theme === 'dark' ? 'filled_black' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: Math.min(360, Math.max(240, googleButtonRef.current.clientWidth)),
      });
    };

    if (window.google?.accounts?.id) {
      mountGoogleButton();
    } else {
      let script = document.querySelector('script[data-google-identity]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentity = 'true';
        document.head.appendChild(script);
      }
      script.addEventListener('load', mountGoogleButton);
    }

    return () => {
      cancelled = true;
      document.querySelector('script[data-google-identity]')?.removeEventListener('load', mountGoogleButton);
    };
  }, [theme, role]);

  async function resendCode() {
    setBusy(true);
    setError('');
    try {
      if (turnstileSiteKey && !turnstileToken) throw new Error('Complete the security check first.');
      const security = turnstileSiteKey ? { turnstileToken } : {};
      if (register) await authRequest('/auth/register', { name, email, password, role: role.toLowerCase(), ...security });
      else await authRequest('/auth/forgot-password', { email, ...security });
      setTurnstileToken('');
      if (turnstileWidgetRef.current !== null) window.turnstile?.reset(turnstileWidgetRef.current);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      if (turnstileSiteKey) {
        setTurnstileToken('');
        if (turnstileWidgetRef.current !== null) window.turnstile?.reset(turnstileWidgetRef.current);
      }
      setBusy(false);
    }
  }

  async function pasteCodeFromClipboard() {
    setClipboardNotice('');
    try {
      if (!navigator.clipboard?.readText) throw new Error('Clipboard access is unavailable.');
      const clipboardText = await navigator.clipboard.readText();
      const match = clipboardText.match(/(?:^|\D)(\d{6})(?!\d)/);
      if (!match) throw new Error('No six-digit code was found in the clipboard.');
      setCode(match[1]);
    } catch (clipboardError) {
      setClipboardNotice(clipboardError.message === 'No six-digit code was found in the clipboard.'
        ? clipboardError.message
        : 'Allow clipboard access, or paste the code into the field manually.');
    }
  }

  return <main className={`auth-layout ${register ? 'auth-register' : ''}`}><section className="auth-form-side"><header className="auth-header"><button className="auth-back" aria-label="Back to home" onClick={() => go('landing')}><ArrowLeft size={17} /></button><button className="brand" onClick={() => go('landing')}><span className="brand-icon"><img src="/hadalink-mark.png" alt="" /></span><span className="brand-text">Hada<span>Link</span><small>AGRI-RENTALS</small></span></button><ThemeToggle theme={theme} onToggle={toggleTheme}/></header><div className="auth-content"><h1>{title}</h1><p className="auth-description">{description}</p>{register && !verificationStage && <div className="role-picker">{['Farmer', 'Provider', 'Logistics'].map((r) => <button key={r} type="button" className={`role-option ${role === r ? 'selected' : ''}`} aria-pressed={role === r} onClick={() => setRole(r)}><span className="role-icon">{r === 'Farmer' ? <Tractor size={17} /> : r === 'Provider' ? <Wrench size={17} /> : <Truck size={17} />}</span><span><strong>{r === 'Logistics' ? 'Logistics provider' : r}</strong></span>{role === r && <CheckCircle2 size={16} />}</button>)}</div>}<form className="auth-fields" onSubmit={submitAccount}>
    {register && !verificationStage && <Field icon={User} label="FULL NAME" placeholder="Enter your full name" value={name} onChange={event => setName(event.target.value)} required />}
    {(!verificationStage && !resetStage) && <Field icon={Mail} label="EMAIL ADDRESS" type="email" placeholder={page === 'login' ? 'you@example.com' : 'Enter your email'} value={email} onChange={event => setEmail(event.target.value)} required />}
    {(verificationStage || resetStage) && <><Field icon={ShieldCheck} label="EMAIL CODE" inputMode="numeric" autoComplete="one-time-code" placeholder="Enter the 6-digit code" value={code} onChange={event => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setClipboardNotice(''); }} required /><button type="button" className="auth-paste-code" onClick={pasteCodeFromClipboard}><ClipboardPaste size={14}/> Paste code from email</button>{clipboardNotice&&<small className="auth-clipboard-notice" role="status">{clipboardNotice}</small>}</>}
    {(!forgot && !verificationStage || resetStage) && (
      <>
        <Field icon={LockKeyhole} label={resetStage ? 'NEW PASSWORD' : 'PASSWORD'} type={show ? 'text' : 'password'} autoComplete={page === 'login' ? 'current-password' : 'new-password'} placeholder={resetStage ? 'Choose a new password' : 'Enter your password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={page === 'login' ? 1 : 12} maxLength={72} trailing={!resetStage && <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(value => !value)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
        {(register && !verificationStage || resetStage) && <small className="password-policy">Use at least 12 characters. A memorable phrase works well; avoid common passwords (maximum 72 bytes).</small>}
      </>
    )}
    {register && !verificationStage && <Field icon={LockKeyhole} label="CONFIRM PASSWORD" type="password" autoComplete="new-password" placeholder="Confirm your password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required minLength={12} maxLength={72} />}
    {turnstileSiteKey&&<div className="turnstile-wrap"><div ref={turnstileRef}/><small>Protected by Cloudflare Turnstile.</small></div>}
    {page === 'login' && <div className="auth-options"><label className="remember"><input type="checkbox" /> Remember me</label><button type="button" className="text-link" onClick={() => { setStage('email'); setError(''); go('forgot'); }}>Forgot password?</button></div>}
    {error && <div className="auth-error" role="alert">{error}</div>}
    <button className={`button ${page === 'login' ? 'button-harvest' : 'button-auth'} auth-submit`} type="submit" disabled={busy}>{busy ? 'Please wait…' : verificationStage ? 'Verify email' : resetStage ? 'Update password' : forgot ? 'Send reset code' : register ? 'Create account' : 'Log in'} {!busy && <ArrowRight size={17} />}</button>
    {(verificationStage || resetStage) && <button type="button" className="text-link auth-resend" onClick={resendCode} disabled={busy}>{busy ? 'Sending…' : 'Send a new code'}</button>}
    {!forgot && !verificationStage && <><div className="auth-divider"><span />OR<span /></div><div className="social-row">{import.meta.env.VITE_GOOGLE_CLIENT_ID ? <div className="google-button-slot" ref={googleButtonRef} /> : <button className="google-fallback" type="button" onClick={() => setError('Google sign-in is not configured yet.')}><span className="google-mark">G</span> Continue with Google</button>}</div></>}
  </form>{forgot && <div className="reset-note"><ShieldCheck size={17} /><span>We’ll send a secure one-time code to the email associated with your account.</span></div>}</div><footer className="auth-footer">{register ? <>Have an account? <button className="text-link" onClick={() => go('login')}>Log in</button></> : forgot ? <>Remember your password? <button className="text-link" onClick={() => go('login')}>Log in</button></> : <>New to HadaLink? <button className="text-link" onClick={() => go('register')}>Create account <ArrowRight size={13} /></button></>}</footer></section><aside className="auth-image-side"><img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85" alt="Farmland in Plateau State" /><div className="auth-image-overlay" /><article className="auth-quote"><Leaf size={19} /><h2>“The right machine, right when you need it.”</h2><p>Reliable tractors and farm equipment, connected locally.</p></article></aside></main>;
}
function ProfileOnboarding({ user, onUserUpdated, onComplete, onLogout }) {
  const steps = requiredProfileSteps(user);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const step = steps[0];
  const totalSteps = user?.role === 'provider' ? 4 : user?.role === 'logistics' ? 8 : 3;
  const displayStep = totalSteps - steps.length + 1;
  if (!step) return null;
  const Icon = step.icon;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const profileValue = step.type === 'tel' ? nigerianPhoneValue(value) : ['serviceAreas','transportLoads'].includes(step.field) ? value.split(',').map(item=>item.trim()).filter(Boolean) : value.trim();
      const result = await authRequest('/auth/profile', { [step.field]: profileValue }, 'PATCH');
      const updated = result.data.user;
      onUserUpdated(updated);
      const nextSteps = requiredProfileSteps(updated);
      if (!nextSteps.length) onComplete(updated);
      else {
        setValue('');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  return <main className="profile-onboarding"><section className="profile-onboarding-card"><header className="profile-onboarding-header"><span className="brand-icon"><img src="/hadalink-mark.png" alt="HadaLink" /></span><button type="button" className="button button-ghost button-small" onClick={onLogout}><LogOut size={14}/> Log out</button></header><div className="onboarding-progress-label"><span>COMPLETE YOUR PROFILE</span><span>STEP {displayStep} OF {totalSteps}</span></div><div className="onboarding-progress-track"><span style={{ width: `${(displayStep / totalSteps) * 100}%` }}/></div><span className="onboarding-step-icon"><Icon size={22}/></span><span className="eyebrow">{user?.role === 'provider' ? 'PROVIDER SETUP' : user?.role === 'logistics' ? 'LOGISTICS PROVIDER SETUP' : 'FARMER SETUP'}</span><h1>{step.title}</h1><p className="onboarding-description">{step.description}</p><form onSubmit={submit}>{step.type === 'tel' ? <NigerianPhoneField icon={Icon} label={step.label.toUpperCase()} value={value} onChange={setValue} required autoFocus/> : <Field icon={Icon} label={step.label.toUpperCase()} type={step.type} autoComplete="organization" placeholder={step.placeholder} value={value} onChange={event => setValue(event.target.value)} required minLength={2} maxLength={step.field === 'primaryArea' ? 120 : 240} autoFocus/>}{error && <div className="auth-error" role="alert">{error}</div>}<div className="onboarding-actions"><button type="submit" className="button button-primary onboarding-continue" disabled={busy}>{busy ? 'Saving…' : steps.length === 1 ? 'Finish setup' : 'Next'} {!busy && <ArrowRight size={15}/>}</button></div></form><div className="onboarding-verification-note"><ShieldCheck size={16}/><span>Phone and WhatsApp are marked complete once you provide each number. Number verification codes are not available yet.</span></div></section></main>;
}

function Field({ icon: Icon, label, trailing, ...props }) { return <label className="field"><span className="field-label">{label}</span><span className="field-control"><Icon size={17} /><input {...props} />{trailing}</span></label> }

function Metric({ label, value, detail, icon: Icon, tone = 'green' }) { return <article className={`metric-card metric-${tone}`}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={18} /></span></div><strong>{value}</strong><span className="metric-detail">{detail}</span></article> }
function PanelHead({ title, subtitle, action, children }) { return <div className="panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action || children}</div> }

const transportNext = { Accepted: ['scheduled','Schedule pickup'], Scheduled: ['picked_up','Mark picked up'], 'Picked up': ['in_transit','Start transit'], 'In transit': ['delivered','Record delivery'] };
function LogisticsWorkspace({ page, user, requests, jobs, loading, onRefresh, onDecision, onStatus, onUserUpdated, requestActionPin, flash, go }) {
  const [busyId, setBusyId] = useState('');
  const [deliveryNote, setDeliveryNote] = useState({});
  const [profile, setProfile] = useState({ businessName:user?.profile?.businessName||'', contactName:user?.profile?.contactName||'', phone:nigerianPhoneValue(user?.profile?.phone), primaryArea:user?.profile?.primaryArea||'', serviceAreas:(user?.profile?.serviceAreas||[]).join(', '), transportLoads:(user?.profile?.transportLoads||[]).join(', '), transportCapacity:user?.profile?.transportCapacity||'', vehicleDetails:user?.profile?.vehicleDetails||'' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState('');
  const activeTripKey = jobs.filter(job=>job.transportStatusKey==='in_transit').map(job=>job.id).join(',');
  React.useEffect(()=>{
    if(!activeTripKey)return undefined;
    if(!navigator.geolocation){flash('This device does not support live location sharing.');return undefined;}
    const watches=[];
    for(const jobId of activeTripKey.split(',')){
      let lastSent=0;
      const watch=navigator.geolocation.watchPosition(position=>{
        const now=Date.now();
        if(now-lastSent<10000)return;
        lastSent=now;
        authRequest(`/transport/${jobId}/location`,{latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy||0},'PATCH').catch(error=>console.error('Could not share transport location:',error));
      },error=>{if(error.code===1)flash('Allow location access to share your live position with the farmer during delivery.');},{enableHighAccuracy:true,maximumAge:5000,timeout:20000});
      watches.push(watch);
    }
    return ()=>watches.forEach(watch=>navigator.geolocation.clearWatch(watch));
  },[activeTripKey]);
  const counts = { new:requests.length, accepted:jobs.filter(job=>['Accepted','Scheduled'].includes(job.transportStatus)).length, active:jobs.filter(job=>['Picked up','In transit'].includes(job.transportStatus)).length, completed:jobs.filter(job=>job.transportStatus==='Delivered').length };
  async function decision(job, action) {
    setBusyId(job.id);
    try {
      const actionPin = action === 'accept' ? await requestActionPin('accept this delivery job') : null;
      if (action === 'accept' && !actionPin) return;
      await onDecision(job,action,actionPin);
      flash(action==='accept'?'Transport job accepted. It is now in My Jobs.':'Request declined and released for other providers.');
    }
    catch(error) { flash(error.message||'Could not update that request.'); }
    finally { setBusyId(''); }
  }
  async function advance(job) {
    const next=transportNext[job.transportStatus]; if(!next)return;
    setBusyId(job.id);
    try { await onStatus(job,next[0],deliveryNote[job.id]||''); flash(next[0]==='delivered'?'Delivery recorded. The farmer can now see it in their booking.':`Job updated: ${next[1].toLowerCase()}.`); }
    catch(error) { flash(error.message||'Could not update this job.'); }
    finally { setBusyId(''); }
  }
  async function saveProfile(event) {
    event.preventDefault(); setProfileSaving(true); setProfileSaved('');
    try {
      const payload={...profile,phone:nigerianPhoneValue(profile.phone),serviceAreas:profile.serviceAreas.split(',').map(item=>item.trim()).filter(Boolean),transportLoads:profile.transportLoads.split(',').map(item=>item.trim()).filter(Boolean)};
      const {data}=await authRequest('/auth/profile',payload,'PATCH');
      onUserUpdated(data.user);
      setProfile({...profile,...data.user.profile,serviceAreas:(data.user.profile.serviceAreas||[]).join(', '),transportLoads:(data.user.profile.transportLoads||[]).join(', ')});
      setProfileSaved('Profile saved.');
    } catch(error) { setProfileSaved(error.message||'Profile could not be saved.'); }
    finally { setProfileSaving(false); }
  }
  const RequestCard=({job,assigned=false})=><article className="panel transport-card" key={job.id}><header className="transport-card-head"><div><span className="transport-ref">BOOKING {job.id.slice(-8).toUpperCase()}</span><h3>{job.machine||'Machinery transport'}</h3><p>{job.machineKind}{job.machineArea?` · Pickup near ${job.machineArea}`:''}</p></div><span className={`table-status table-${job.transportStatusKey}`}><i/>{job.transportStatus}</span></header><div className="transport-card-grid"><div><small>Pickup{assigned?' address':''}</small><strong>{assigned?(job.pickupAddress||job.machineArea||'Address not provided'):(job.machineArea||'Area shown after matching')}</strong></div><div><small>Delivery / farm</small><strong>{job.place}</strong></div><div><small>Transport date</small><strong>{job.date}</strong></div><div><small>Agreed transport fee</small><strong className="transport-fee">₦{job.transportFee.toLocaleString('en-NG')}</strong></div><div><small>Farmer</small><strong>{job.farmer||'HadaLink farmer'}</strong></div>{assigned&&<div><small>Contact</small><strong>{job.farmerPhone||job.farmerEmail||'Contact details not provided'}</strong></div>}</div>
    {job.transportRequirements&&<p className="transport-note"><strong>Transport instructions</strong>{job.transportRequirements}</p>}{job.note&&<p className="transport-note"><strong>Booking instructions</strong>{job.note}</p>}{job.deliveryNote&&<p className="transport-note"><strong>Delivery note</strong>{job.deliveryNote}</p>}
    {assigned&&job.transportStatus==='In transit'&&<p className="transport-location-notice"><MapPin size={14}/> Live location sharing is active while this page stays open and location access is allowed.</p>}
    {!assigned?<div className="transport-card-actions"><button className="button button-ghost" disabled={busyId===job.id} onClick={()=>decision(job,'decline')}>Decline</button><button className="button button-primary" disabled={busyId===job.id} onClick={()=>decision(job,'accept')}>{busyId===job.id?'Saving…':'Accept job'} <ArrowRight size={14}/></button></div>:<div className="transport-card-actions transport-job-actions">{job.transportStatus==='In transit'&&<textarea aria-label="Delivery completion note" value={deliveryNote[job.id]??job.deliveryNote} maxLength={1000} rows="2" placeholder="Delivery note (optional)" onChange={event=>setDeliveryNote(value=>({...value,[job.id]:event.target.value}))}/>}<span className="transport-updated">Updated {job.transportStatus.toLowerCase()}</span>{transportNext[job.transportStatus]&&<button className="button button-primary" disabled={busyId===job.id} onClick={()=>advance(job)}>{busyId===job.id?'Saving…':transportNext[job.transportStatus][1]} <ArrowRight size={14}/></button>}</div>}</article>;
  if(page==='Settings') return <div className="view-stack logistics-profile-page"><section className="panel logistics-profile-card"><PanelHead title="Transport business profile" subtitle="The details farmers and HadaLink use to match transport requests."/><form className="logistics-profile-form" onSubmit={saveProfile}><Field icon={Wrench} label="COMPANY / PROVIDER NAME" value={profile.businessName} required maxLength={140} onChange={event=>setProfile({...profile,businessName:event.target.value})}/><Field icon={User} label="CONTACT PERSON" value={profile.contactName} required maxLength={120} onChange={event=>setProfile({...profile,contactName:event.target.value})}/><Field icon={Mail} label="EMAIL ADDRESS" type="email" value={user?.email||''} readOnly/><NigerianPhoneField icon={MessageCircle} label="PHONE NUMBER" value={profile.phone} required onChange={phone=>setProfile({...profile,phone})}/><Field icon={MapPin} label="PRIMARY OPERATING AREA" value={profile.primaryArea} required maxLength={120} onChange={event=>setProfile({...profile,primaryArea:event.target.value})}/><label className="field"><span className="field-label">OTHER SERVICE AREAS</span><textarea value={profile.serviceAreas} rows="2" placeholder="Jos South, Barkin Ladi" onChange={event=>setProfile({...profile,serviceAreas:event.target.value})}/></label><label className="field"><span className="field-label">LOADS / MACHINERY TYPES</span><textarea value={profile.transportLoads} rows="2" placeholder="Tractors, harvesters, heavy equipment" onChange={event=>setProfile({...profile,transportLoads:event.target.value})}/></label><Field icon={Route} label="TRANSPORT CAPACITY" value={profile.transportCapacity} maxLength={160} placeholder="e.g. up to 10 tonnes" onChange={event=>setProfile({...profile,transportCapacity:event.target.value})}/><label className="field"><span className="field-label">VEHICLES</span><textarea value={profile.vehicleDetails} rows="2" placeholder="Vehicle type, flatbed / low-bed details" onChange={event=>setProfile({...profile,vehicleDetails:event.target.value})}/></label><div className="logistics-verification"><ShieldCheck size={16}/><span>Account verification is managed by HadaLink.</span><strong>Pending review</strong></div><div className="settings-actions"><button className="button button-primary" disabled={profileSaving}>{profileSaving?'Saving…':'Save profile'} <Check size={14}/></button></div>{profileSaved&&<p role="status" className="settings-help">{profileSaved}</p>}</form></section><ActionPinSettings user={user} onUserUpdated={onUserUpdated}/></div>;
  if(page==='Requests') return <div className="view-stack logistics-requests-page"><PanelHead title="Transport requests" subtitle="Review pickup, delivery, schedule and HadaLink’s fixed fee before accepting." action={<button className="button button-ghost button-small" onClick={onRefresh}><ArrowDown size={14}/> Refresh</button>}/>{loading?<div className="panel empty-state">Loading available transport requests…</div>:requests.length?<div className="transport-list">{requests.map(job=><RequestCard key={job.id} job={job}/>)}</div>:<div className="panel empty-state"><Truck size={21}/><strong>No matching transport requests</strong><span>New requests in your operating areas will appear here when farmers select HadaLink transport.</span></div>}</div>;
  if(page==='My Jobs') return <div className="view-stack logistics-jobs-page"><PanelHead title="My transport jobs" subtitle="Move each accepted job through scheduled pickup, collection, transit and delivery." action={<button className="button button-ghost button-small" onClick={onRefresh}><ArrowDown size={14}/> Refresh</button>}/>{loading?<div className="panel empty-state">Loading your jobs…</div>:jobs.length?<div className="transport-list">{jobs.map(job=><RequestCard key={job.id} job={job} assigned/>)}</div>:<div className="panel empty-state"><Truck size={21}/><strong>No transport jobs yet</strong><span>Accepted assignments will be listed here.</span></div>}</div>;
  const recent=jobs.slice(0,4);
  return <div className="view-stack logistics-dashboard"><section className="logistics-welcome panel"><span className="eyebrow">LOGISTICS PROVIDER · PLATEAU STATE</span><h2>Transport jobs, clearly managed.</h2><p>Review matching requests, accept jobs at HadaLink’s fixed fee, and keep farmers informed through delivery.</p><button className="button button-primary" onClick={()=>go('Requests')}>View requests <ArrowRight size={14}/></button></section><section className="metric-grid logistics-metrics"><Metric label="NEW REQUESTS" value={String(counts.new)} detail={<><ClipboardList size={13}/> In your service areas</>} icon={ClipboardList}/><Metric label="ACCEPTED / SCHEDULED" value={String(counts.accepted)} detail={<><CalendarDays size={13}/> Awaiting pickup</>} icon={CalendarDays} tone="orange"/><Metric label="ACTIVE DELIVERIES" value={String(counts.active)} detail={<><Truck size={13}/> Picked up or in transit</>} icon={Truck} tone="blue"/><Metric label="COMPLETED JOBS" value={String(counts.completed)} detail={<><CheckCircle2 size={13}/> Delivery recorded</>} icon={CheckCircle2}/></section><section className="panel transport-list-section"><PanelHead title="Recent job updates" subtitle="Status changes from your assigned transport jobs." action={<button className="button button-ghost button-small" onClick={()=>go('My Jobs')}>My jobs <ArrowRight size={13}/></button>}/>{recent.length?<div className="transport-list">{recent.map(job=><article className="transport-update-row" key={job.id}><span className="tracking-icon"><Truck size={16}/></span><div><strong>{job.machine}</strong><small>{job.place} · {job.transportStatus}</small></div><span className="transport-fee">₦{job.transportFee.toLocaleString('en-NG')}</span></article>)}</div>:<div className="empty-state">Job updates will appear here after you accept a request.</div>}</section><section className="panel logistics-shortcut"><div><h3>Keep your service areas current</h3><p>Request matching uses your profile's operating areas and the machinery pickup / farm location.</p></div><button className="button button-ghost" onClick={()=>go('Settings')}>Edit profile <ArrowRight size={13}/></button></section></div>;
}

function Dashboard({ go, machinesState, requestsState, flash, loading = false, error = '' }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const chart = getWeekData(weekOffset, requestsState);
  const totalBookings = chart.reduce((sum, day) => sum + day.jobs, 0);
  const busiestDay = Math.max(0, ...chart.map(day => day.jobs));
  const completedRequests = requestsState.filter(request => request.status === 'Completed');
  const ratings = completedRequests.filter(request => request.rating).map(request => request.rating);
  const averageRating = ratings.length ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : '—';
  return <div className="view-stack">{error&&<div className="toast" role="alert">{error}</div>}
    <section className="metric-grid">
      <Metric label="NEW REQUESTS" value={loading ? '—' : String(requestsState.filter(request => request.status === 'Pending').length)} detail={<><MessageCircle size={13}/> Awaiting your response</>} icon={MessageCircle}/>
      <Metric label="ACTIVE LISTINGS" value={loading ? '—' : String(machinesState.filter(machine => machine.status === 'Available').length)} detail={<><CheckCircle2 size={13}/> Available to request</>} icon={Tractor} tone="orange"/>
      <Metric label="COMPLETED JOBS" value={loading ? '—' : String(completedRequests.length)} detail={<><CheckCircle2 size={13}/> Transaction records</>} icon={CheckCircle2} tone="blue"/>
      <Metric label="TOTAL REQUEST VALUE" value={loading ? '—' : `₦${requestsState.reduce((sum, request) => sum + (request.amountValue || 0), 0).toLocaleString('en-NG')}`} detail={<><Banknote size={13}/> Saved booking quotes</>} icon={Banknote} tone="orange"/>
    </section>
    <div className="analytics-week-bar"><WeekNavigator weekOffset={weekOffset} setWeekOffset={setWeekOffset}/></div>
    <div className="dashboard-grid">
      <section className="panel chart-panel">
        <PanelHead title="Booking activity" subtitle={`Booking requests · ${getWeekRange(weekOffset)}`}/>
        {loading ? <div className="empty-state">Loading booking activity…</div> : totalBookings ? <><div className="chart-holder"><Suspense fallback={<span className="chart-loading" aria-hidden="true"/>}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart} margin={{top:10,right:7,left:-28,bottom:0}}>
          <defs><linearGradient id="bookingWeekGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#19cb87" stopOpacity={.24}/><stop offset="100%" stopColor="#19cb87" stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid stroke="rgba(164,194,172,.075)" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#798e80',fontSize:11}} dy={8}/><Tooltip contentStyle={{background:'#10281d',border:'1px solid #254333',borderRadius:10,fontSize:12}}/><Area type="monotone" dataKey="jobs" stroke="#24d18c" fill="url(#bookingWeekGradient)" strokeWidth={2} name="Booking requests"/>
        </AreaChart></ResponsiveContainer></Suspense></div><div className="booking-week-summary"><span>{totalBookings} booking requests this week</span><span>{busiestDay} on the busiest day</span></div></> : <div className="empty-state"><CalendarDays size={20}/><strong>No booking activity for this week</strong><span>Requests will appear here when farmers book equipment.</span></div>}
      </section>
      <section className="panel rating-panel"><PanelHead title="Farmer ratings" subtitle="Ratings left after completed bookings."/><div className="rating-ring"><div><strong>{averageRating}</strong><span>{ratings.length ? 'OUT OF 5' : 'NO REVIEWS YET'}</span></div></div><div className="rating-footer"><span><Star size={14} fill="currentColor"/> {ratings.length ? `${ratings.length} recorded reviews` : 'Complete a booking to collect feedback'}</span><strong>{completedRequests.length} completed jobs</strong></div></section>
    </div>
    <section className="panel weekly-panel"><PanelHead title={`Machinery hired · ${getWeekRange(weekOffset)}`} subtitle="Booking requests by requested date." action={<span className="stat-inline">{loading ? '—' : totalBookings}<small>bookings this week</small></span>}/>{totalBookings>0&&!loading?<div className="weekly-chart"><Suspense fallback={<span className="chart-loading" aria-hidden="true"/>}><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{top:9,right:8,left:-28,bottom:0}}><CartesianGrid stroke="rgba(164,194,172,.075)" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#798e80',fontSize:11}} dy={8}/><Tooltip contentStyle={{background:'#10281d',border:'1px solid #254333',borderRadius:10,fontSize:12}}/><Bar dataKey="jobs" name="Bookings" radius={[5,5,0,0]} maxBarSize={34}>{chart.map(day=><Cell key={day.day} fill={day.jobs===busiestDay?'#f2aa32':'#13ae77'}/>)}</Bar></BarChart></ResponsiveContainer></Suspense></div>:<div className="empty-state">{loading?'Loading bookings…':'No bookings to chart for this week.'}</div>}</section>
    <section className="quick-glance"><PanelHead title="Your machinery" subtitle="Manage the equipment listed in your local fleet." action={<button className="button button-ghost button-small" onClick={()=>go('My Machinery')}>View all <ArrowRight size={13}/></button>}/><div className="glance-grid">{machinesState.slice(0,3).map(machine=><MachineCard key={machine.id} machine={machine} compact onClick={()=>go('My Machinery')}/>)}</div>{!loading&&machinesState.length===0&&<div className="empty-state"><Tractor size={20}/><strong>No published listings yet</strong><span>Published equipment will appear here.</span></div>}</section>
    <section className="panel table-panel"><PanelHead title="Recent requests" subtitle="The latest bookings from farmers near you." action={<button className="button button-ghost button-small" onClick={()=>go('Requests')}>All requests <ArrowRight size={13}/></button>}/><RequestTable requestsState={requestsState.slice(0,4)} compactMobile/></section>
  </div>;
}
function FarmerHome({ machinesState, requestsState, go, user }) {
  const pending=requestsState.filter(item=>item.status==='Pending').length;
  const active=requestsState.filter(item=>['Pending','Accepted'].includes(item.status)).length;
  return <div className="view-stack farmer-home">
    <section className="farmer-intro farmer-home-hero panel">
      <div>
        <span className="eyebrow">FARMER WORKSPACE · PLATEAU STATE</span>
        <h2>Find the right equipment for the work ahead.</h2>
        <p>Browse local machinery, request the dates you need, and keep your bookings in one place.</p>
        <div className="farmer-home-actions">
          <button className="button button-primary" onClick={()=>go('Find Machinery')}><Search size={15}/> Find machinery <ArrowRight size={14}/></button>
          <button className="button button-ghost" onClick={()=>go('My bookings')}>My bookings <ArrowRight size={14}/></button>
        </div>
      </div>
    </section>
    <section className="metric-grid farmer-home-metrics">
      <Metric label="AVAILABLE LISTINGS" value={String(machinesState.filter(item=>item.status==='Available').length)} detail={<><Tractor size={13}/> Equipment near you</>} icon={Tractor}/>
      <Metric label="ACTIVE REQUESTS" value={String(active)} detail={<><MapPin size={13}/> Follow booking progress</>} icon={MapPin} tone="blue"/>
      <Metric label="WAITING FOR PROVIDER" value={String(pending)} detail={<><Clock3 size={13}/> Requests awaiting response</>} icon={Clock3} tone="orange"/>
    </section>
    <section className="panel farmer-home-bookings">
      <PanelHead title="Recent bookings" subtitle={user?.name?`Requests made from ${user.name.split(/\s+/)[0]}’s account.`:'Your latest equipment requests.'} action={<button className="button button-ghost button-small" onClick={()=>go('My bookings')}>View bookings <ArrowRight size={13}/></button>}/>
      {requestsState.length ? <div className="farmer-request-list">{requestsState.slice(0,3).map(request=><article className="farmer-request-row" key={request.id}><div><strong>{request.machine}</strong><span>{request.service} · {request.place} · {request.date}</span></div><span className={`table-status table-${request.status.toLowerCase()}`}><i/>{request.status}</span></article>)}</div> : <div className="empty-state"><CalendarDays size={20}/><strong>Your booking activity will appear here</strong><span>Start by browsing equipment available in your area.</span></div>}
    </section>
  </div>;
}

function FarmerDashboard({ machinesState, requestsState, setRequestsState, loading = false, error = '', requestActionPin }) {
  const [transportFee, setTransportFee] = useState(null);
  const [transportPricingReady, setTransportPricingReady] = useState(false);
  const [useHadalinkTransport, setUseHadalinkTransport] = useState(false);
  const [transportRequirements, setTransportRequirements] = useState('');
  React.useEffect(() => { authRequest('/transport/pricing', undefined, 'GET').then(({data})=>setTransportFee(Number.isSafeInteger(data?.fee)&&data.fee>0?data.fee:null)).catch(()=>setTransportFee(null)).finally(()=>setTransportPricingReady(true)); }, []);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const availableMachines = machinesState.filter(machine => machine.status === 'Available');
  const [category, setCategory] = useState('All equipment');
  const [areaSearch, setAreaSearch] = useState('');
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [detailMachine, setDetailMachine] = useState(null);
  const [compareMachines, setCompareMachines] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [form, setForm] = useState({service:'Ploughing',date:'',place:'',hectares:'',operator:'with'});
  const [message, setMessage] = useState('');
  const [reviewing, setReviewing] = useState('');
  const [review, setReview] = useState({rating:'5',text:''});
  const farmerRequests = requestsState;
  const categories = ['All equipment', ...new Set(availableMachines.map(machine => machine.kind))];
  const visibleMachines = availableMachines.filter(machine => (category === 'All equipment' || machine.kind === category) && `${machine.area} ${machine.name}`.toLowerCase().includes(areaSearch.toLowerCase()));
  const rate = selectedMachine ? Number(selectedMachine.rate.replace(/,/g,'')) : 0;
  const hectares = Number(form.hectares) || 0;
  const estimate = rate * hectares;
  const operatorAvailable = selectedMachine?.operatorAvailable !== false;
  function updateForm(event) { setForm(previous => ({...previous,[event.target.name]:event.target.value})); }
  async function submitBooking(event) {
    event.preventDefault();
    if (!selectedMachine) return;
    if (form.operator === 'without' && !event.currentTarget.elements.qualifiedOperator.checked) {
      setMessage('Confirm that you have a qualified operator before requesting equipment-only access.');
      return;
    }
    try {
      const actionPin = await requestActionPin('send this booking request');
      if (!actionPin) return;
      const { data } = await authRequest('/bookings', { equipment: selectedMachine._id || selectedMachine.id, service: form.service, requestedDate: form.date, location: form.place, hectares: Number(form.hectares), note: form.operator === 'without' ? 'Farmer will provide a qualified operator.' : 'Please confirm operator availability and final terms.', useHadalinkTransport, transportRequirements, actionPin });
      const saved = mapBookingRecord(data);
      setRequestsState(previous => [saved, ...previous]);
      setMessage(`Request ${saved.id.slice(-6)} sent. It is pending provider confirmation.`);
      setSelectedMachine(null);
      setUseHadalinkTransport(false);
      setTransportRequirements('');
      setForm(previous => ({...previous,date:'',place:'',hectares:'',service:previous.service,operator:'with'}));
    } catch (error) { setMessage(error.message || 'Your booking request could not be sent.'); }
  }
  function submitReview(event, requestId) {
    event.preventDefault();
    setRequestsState(previous => previous.map(request => request.id === requestId ? {...request,rating:Number(review.rating),review:review.text.trim()} : request));
    setReviewing('');
    setReview({rating:'5',text:''});
  }
  return <div className="view-stack">
    <section className="farmer-intro panel"><div><span className="eyebrow">DISCOVER · COMPARE · REQUEST</span><h2>Find the right equipment for your farm</h2><p>Compare local listings, confirm the terms, then send a request for your preferred date and field location. Providers confirm availability and final terms.</p></div><div className="farmer-intro-note"><ShieldCheck size={17}/><span>Your request is saved to your account. Agree final payment terms directly with the provider.</span></div></section>
    {message && <div className="toast" role="status">{message}<button aria-label="Dismiss message" onClick={()=>setMessage('')}><X size={15}/></button></div>}
    <section className="panel farmer-listings"><PanelHead title="Equipment and services near you" subtitle={loading?'Loading published listings…':`${visibleMachines.length} available listings · compare provider, location, rate and operator options.`}/>{error&&<div className="empty-state" role="alert">{error}</div>}<div className="farmer-filter-rail"><button className="farmer-filter-trigger" onClick={()=>setFiltersOpen(true)}><Filter size={15}/><span>Filter listings</span>{(category!=='All equipment'||areaSearch)&&<i/>}<ChevronDown size={15}/></button></div>{filtersOpen&&createPortal(<div className="farmer-filter-backdrop" role="presentation" onClick={event=>closePopup(setFiltersOpen,event)}><section className="farmer-filter-popup" role="dialog" aria-modal="true" aria-labelledby="farmer-filter-title" onClick={event=>event.stopPropagation()}><header><div><span>REFINE RESULTS</span><h2 id="farmer-filter-title">Find your equipment</h2></div><button type="button" aria-label="Close filters" onClick={event=>closePopup(setFiltersOpen,event)}><X size={18}/></button></header><div className="farmer-filter-fields"><label className="field"><span className="field-label">EQUIPMENT TYPE</span><span className="field-control"><Filter size={15}/><select aria-label="Filter by equipment type" value={category} onChange={event=>setCategory(event.target.value)}>{categories.map(item=><option key={item}>{item}</option>)}</select></span></label><label className="field"><span className="field-label">AREA OR MACHINE</span><span className="field-control"><Search size={15}/><input aria-label="Search area or equipment" value={areaSearch} onChange={event=>setAreaSearch(event.target.value)} placeholder="Search Plateau State"/></span></label></div><footer><button type="button" className="button button-ghost" onClick={()=>{setCategory('All equipment');setAreaSearch('')}}>Clear all</button><button type="button" className="button button-primary" onClick={event=>closePopup(setFiltersOpen,event)}>Show {visibleMachines.length} results</button></footer></section></div>,document.body)}
      <div className="farmer-machine-grid">{visibleMachines.map(machine=><article className="farmer-machine-card" key={machine.name} role="button" tabIndex={0} aria-label={`View details for ${machine.name}`} onClick={()=>setDetailMachine(machine)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setDetailMachine(machine)}}}>
        <ImageCarousel images={machine.images||[]} name={machine.name} className="farmer-machine-gallery"/>
        <div className="farmer-machine-copy"><span>{machine.kind} · {machine.area}</span><h3>{machine.name}</h3><strong>₦{machine.rate}<small> / hectare</small></strong><p>Provider: {machine.provider || 'Local equipment provider'}</p><p>{machine.operatorAvailable === false ? 'Equipment only · bring a qualified operator' : 'Ask about operator availability and service terms'}</p><p>{machine.terms || 'Confirm transport, fuel, timing and machine condition with the provider.'}</p><div className="farmer-listing-actions"><span className="button button-ghost button-small">View details <ArrowRight size={13}/></span></div></div>
      </article>)}</div>
      {!loading&&!error&&visibleMachines.length===0 && <div className="empty-state"><Search size={20}/><strong>No matching listings</strong><span>Try a different equipment type or area.</span></div>}
    </section>
    {detailMachine&&createPortal(<div className="farmer-detail-backdrop" role="presentation" onClick={()=>setDetailMachine(null)}><section className="farmer-detail-popup" role="dialog" aria-modal="true" aria-labelledby="farmer-detail-title" onClick={event=>event.stopPropagation()}><header><span>LISTING DETAILS</span><button aria-label="Close listing details" onClick={()=>setDetailMachine(null)}><X size={17}/></button></header><ImageCarousel images={detailMachine.images||[]} name={detailMachine.name} className="farmer-detail-image"/><div className="farmer-detail-content"><span className="farmer-detail-kicker">{detailMachine.kind} · {detailMachine.area}</span><h2 id="farmer-detail-title">{detailMachine.name}</h2><strong className="farmer-detail-rate">₦{detailMachine.rate}<small> / hectare</small></strong><dl><div><dt>Provider</dt><dd>{detailMachine.provider||'Local equipment provider'}</dd></div><div><dt>Operator</dt><dd>{detailMachine.operatorAvailable===false?'Equipment only; bring a qualified operator':'Availability to be confirmed with provider'}</dd></div><div><dt>Services</dt><dd>{detailMachine.services?.length?detailMachine.services.join(', '):'Confirm available services with provider'}</dd></div><div><dt>Terms</dt><dd>{detailMachine.terms||'Confirm transport, fuel, timing and machine condition with the provider.'}</dd></div></dl><div className="farmer-detail-actions"><button className="button button-ghost" onClick={()=>{setCompareMachines(previous=>{const next=previous.some(item=>item.name===detailMachine.name)?previous:[...previous,detailMachine].slice(-2);if(next.length===2)setCompareOpen(true);return next})}}><SlidersHorizontal size={15}/>{compareMachines.some(item=>item.name===detailMachine.name)?'Added to compare':'Compare'}</button><button className="button button-primary" onClick={()=>{setSelectedMachine(detailMachine);setForm(previous=>({...previous,service:detailMachine.services?.[0]||previous.service,operator:detailMachine.operatorAvailable===false?'without':'with'}));setDetailMachine(null)}}><MessageCircle size={15}/> Request</button></div>{compareMachines.length===1&&<small className="farmer-compare-hint">Choose another listing and compare it side by side.</small>}</div></section></div>,document.body)}
    {compareOpen&&compareMachines.length===2&&createPortal(<div className="farmer-detail-backdrop" role="presentation" onClick={event=>closePopup(setCompareOpen,event)}><section className="farmer-compare-popup" role="dialog" aria-modal="true" aria-labelledby="farmer-compare-title" onClick={event=>event.stopPropagation()}><header><div><span>SIDE-BY-SIDE</span><h2 id="farmer-compare-title">Compare listings</h2></div><button aria-label="Close comparison" onClick={event=>closePopup(setCompareOpen,event)}><X size={17}/></button></header><div className="farmer-compare-grid">{compareMachines.map(machine=><article key={machine.name}>{machineImageSrc(machine)?<img src={machineImageSrc(machine)} alt=""/>:<div className="real-image-empty"><Tractor size={26}/><span>Photo not added</span></div>}<h3>{machine.name}</h3><strong>₦{machine.rate}<small> / hectare</small></strong><p>{machine.kind} · {machine.area}</p><p>{machine.services?.length?machine.services.join(', '):'Services to confirm'}</p><button className="button button-primary" onClick={()=>{setSelectedMachine(machine);setForm(previous=>({...previous,service:machine.services?.[0]||previous.service,operator:machine.operatorAvailable===false?'without':'with'}));setCompareOpen(false)}}>Request this equipment</button></article>)}</div><footer><button className="button button-ghost" onClick={()=>{setCompareMachines([]);setCompareOpen(false)}}>Clear comparison</button></footer></section></div>,document.body)}
    {selectedMachine && createPortal(<div className="farmer-booking-backdrop" role="presentation" onClick={()=>setSelectedMachine(null)}><section className="farmer-booking-dialog" role="dialog" aria-modal="true" aria-labelledby="farmer-booking-title" onClick={event=>event.stopPropagation()}><header className="farmer-booking-dialog-header"><div><span>BOOKING REQUEST</span><h2 id="farmer-booking-title">Request {selectedMachine.name}</h2><p>{selectedMachine.area}</p></div><button className="icon-button" aria-label="Close booking form" onClick={()=>setSelectedMachine(null)}><X size={17}/></button></header><div className="farmer-terms-note"><strong>Before you request:</strong> the provider must confirm availability, machine condition and final rental terms. Sending this request does not confirm the rental.</div><form className="farmer-booking-form" onSubmit={submitBooking}>
      <section className="transport-choice"><div><strong>Transport for this machinery</strong><small>Rental and transport are separate. You can arrange your own transport.</small></div>{transportFee!==null ? <label><input type="checkbox" checked={useHadalinkTransport} onChange={event=>setUseHadalinkTransport(event.target.checked)}/><span>Request HadaLink transport</span><b>₦{transportFee.toLocaleString('en-NG')}</b></label> : <p>{transportPricingReady?'HadaLink transport pricing is not set up yet. Please arrange your own transport.':'Checking transport availability…'}</p>}{useHadalinkTransport&&<textarea value={transportRequirements} onChange={event=>setTransportRequirements(event.target.value)} maxLength={1000} rows="2" placeholder="Transport instructions or access details (optional)"/>}</section>
      <label className="field"><span className="field-label">SERVICE NEEDED</span><span className="field-control"><Tractor size={15}/><select name="service" value={form.service} onChange={updateForm}>{(selectedMachine.services?.length ? selectedMachine.services : ['Ploughing','Harrowing','Planting','Harvesting','Spraying','Land preparation','Other']).map(service=><option key={service}>{service}</option>)}</select></span></label>
      <label className="field"><span className="field-label">PREFERRED DATE</span><span className="field-control"><CalendarDays size={15}/><input required type="date" name="date" min={new Date().toISOString().slice(0,10)} value={form.date} onChange={updateForm}/></span></label>
      <label className="field"><span className="field-label">FARM / FIELD LOCATION</span><span className="field-control"><MapPin size={15}/><input required name="place" value={form.place} onChange={updateForm} placeholder="Village, LGA, Plateau State"/></span></label>
      <label className="field"><span className="field-label">FARM SIZE (HECTARES)</span><span className="field-control"><Gauge size={15}/><input required min="0.1" step="0.1" type="number" name="hectares" value={form.hectares} onChange={updateForm} placeholder="e.g. 5"/></span></label>
      <label className="field"><span className="field-label">OPERATOR ARRANGEMENT</span><span className="field-control"><Users size={15}/><select name="operator" value={form.operator} onChange={updateForm}><option value="with" disabled={!operatorAvailable}>Equipment + provider operator{!operatorAvailable?' (not listed)':''}</option><option value="without">Equipment only</option></select></span></label>
      {form.operator==='without' && <label className="farmer-operator-confirm"><input type="checkbox" name="qualifiedOperator" required/> I have a qualified operator for this equipment.</label>}
      {estimate>0 && <div className="farmer-estimate"><span>Estimated equipment rate</span><strong>₦{estimate.toLocaleString('en-NG')}</strong><small>Final rental terms are confirmed directly with the equipment provider.</small>{useHadalinkTransport&&transportFee!==null&&<><span>Fixed HadaLink transport fee</span><strong>₦{transportFee.toLocaleString('en-NG')}</strong><span>Estimated total</span><strong>₦{(estimate+transportFee).toLocaleString('en-NG')}</strong></>}</div>}
      <button className="button button-primary" type="submit"><MessageCircle size={14}/> Send request to provider</button>
    </form></section></div>,document.body)}
  </div>;
}
function FarmerBookings({ requestsState, setRequestsState, loading, error, go, requestActionPin }) {
  const [reviewing, setReviewing] = useState('');
  const [rating, setRating] = useState('5');
  const [reviewText, setReviewText] = useState('');
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState('');
  const [message, setMessage] = useState('');
  async function startPayment(request) {
    setPaying(request.id); setMessage('');
    try {
      const actionPin = await requestActionPin('pay for this accepted booking');
      if (!actionPin) return;
      const {data} = await authRequest(`/payments/bookings/${request.id}/initialize`, {actionPin});
      if (!data?.authorizationUrl || !data.authorizationUrl.startsWith('https://checkout.paystack.com/')) throw new Error('Paystack did not return a valid secure checkout link.');
      window.location.assign(data.authorizationUrl);
    } catch (requestError) { setMessage(requestError.message || 'Could not start Paystack checkout.'); }
    finally { setPaying(''); }
  }
  async function submitReview(event, request) {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      const {data} = await authRequest(`/bookings/${request.id}/review`, {rating:Number(rating),text:reviewText.trim()});
      const saved=mapBookingRecord(data);
      setRequestsState(previous=>previous.map(item=>item.id===request.id?saved:item));
      setReviewing(''); setReviewText(''); setRating('5'); setMessage('Your review has been saved.');
    } catch (requestError) { setMessage(requestError.message || 'Your review could not be saved.'); }
    finally { setSaving(false); }
  }
  if(loading)return <div className="panel empty-state" aria-live="polite">Loading your bookings…</div>;
  if(error)return <div className="panel empty-state" role="alert">{error}</div>;
  return <section className="panel farmer-bookings-page"><PanelHead title="Your bookings" subtitle="Every request and provider update, in one place." action={<button className="button button-primary button-small" onClick={()=>go('Find Machinery')}><Search size={14}/> Find machinery</button>}/>{message&&<p className="settings-help" role="status">{message}</p>}{requestsState.length ? <div className="farmer-request-list">{requestsState.map(request=><article className="farmer-request-row" key={request.id}><div><strong>{request.machine}</strong><span>{request.service} · {request.place} · {request.date}</span><small>{request.hectares} · {request.amount}{request.transportRequested?` + ₦${request.transportFee.toLocaleString('en-NG')} transport`:''}</small><small>{request.status==='Completed'?'Booking completed.':request.status==='Accepted'&&request.paymentStatus==='paid'?'Payment received. HadaLink’s 10% service fee is recorded. The provider payout will be released after delivery is confirmed.':request.status==='Accepted'?'Accepted by the provider. A 10% HadaLink service fee applies to successful payments.':request.status==='Declined'?'The provider declined this request.':`Request ${request.id} · waiting for provider response.`}</small>{request.transportRequested&&<div className="farmer-transport-status"><Truck size={14}/><span><strong>HadaLink transport</strong><small>{request.transportStatus}{request.logisticsProvider?` · ${request.logisticsProvider}`:request.transportStatus==='Requested'?' · Waiting for a provider':''}</small>{request.deliveryNote&&<small>Delivery note: {request.deliveryNote}</small>}</span><b>₦{request.transportFee.toLocaleString('en-NG')}</b></div>}</div><div className="farmer-request-actions"><span className={`table-status table-${request.status.toLowerCase()}`}><i/>{request.status}</span>{request.status==='Accepted'&&request.paymentStatus==='paid'&&<span className="review-saved">Paid</span>}{request.status==='Accepted'&&request.paymentStatus!=='paid'&&<button type="button" className="button button-primary button-small" disabled={paying===request.id} onClick={()=>startPayment(request)}><CreditCard size={14}/>{paying===request.id?'Opening checkout…':'Pay securely'}</button>}{request.status==='Completed'&&request.rating?<span className="review-saved">Review saved · {request.rating}/5</span>:request.status==='Completed'&&<button type="button" className="button button-ghost button-small" onClick={()=>{setReviewing(reviewing===request.id?'':request.id);setMessage('')}}>{reviewing===request.id?'Cancel review':'Leave a review'}</button>}</div>{reviewing===request.id&&<form className="farmer-review-form" onSubmit={event=>submitReview(event,request)}><label className="field"><span className="field-label">YOUR RATING</span><span className="field-control"><Star size={15}/><select value={rating} onChange={event=>setRating(event.target.value)}>{[5,4,3,2,1].map(value=><option value={value} key={value}>{value} star{value===1?'':'s'}</option>)}</select></span></label><label className="field"><span className="field-label">YOUR REVIEW</span><textarea required minLength={3} maxLength={2000} value={reviewText} onChange={event=>setReviewText(event.target.value)} placeholder="Share how the booking went." rows="2"/></label><button className="button button-primary" disabled={saving}>{saving?'Saving…':'Submit review'}</button></form>}</article>)}</div> : <div className="empty-state"><CalendarDays size={20}/><strong>No bookings yet</strong><span>When you request equipment, the provider’s response will appear here.</span><button className="button button-primary button-small" onClick={()=>go('Find Machinery')}>Browse equipment <ArrowRight size={13}/></button></div>}</section>;
}
function FarmerTracking({ requestsState, go }) {
  const active = requestsState.filter(request=>['Pending','Accepted'].includes(request.status) || (request.transportRequested && !['Delivered','Cancelled','Unfulfilled'].includes(request.transportStatus)));
  const transportSteps = ['Requested','Accepted','Scheduled','Picked up','In transit','Delivered'];
  return <div className="view-stack"><section className="farmer-tracking-intro panel"><span className="tracking-icon"><MapPin size={20}/></span><div><span className="eyebrow">BOOKING STATUS</span><h2>Follow your equipment and transport</h2><p>Check provider responses and follow an active HadaLink delivery on the map.</p></div></section>{active.length ? <div className="farmer-tracking-list">{active.map(request=>{const transportIndex=transportSteps.indexOf(request.transportStatus);return <article className="panel farmer-tracking-card" key={request.id}><div className="farmer-tracking-head"><div><span className="table-id">{request.id}</span><h3>{request.machine}</h3><p>{request.service} · {request.place} · {request.date}</p></div><span className={`table-status table-${request.status.toLowerCase()}`}><i/>{request.status}</span></div><div className="tracking-steps"><div className="tracking-step complete"><i><Check size={12}/></i><span>Request sent</span></div><div className={`tracking-step ${request.status==='Accepted'?'complete':''}`}><i>{request.status==='Accepted'?<Check size={12}/>:<Clock3 size={12}/>}</i><span>{request.status==='Accepted'?'Provider confirmed':'Waiting for provider'}</span></div><div className="tracking-step"><i><Tractor size={12}/></i><span>Field work</span></div></div>{request.transportRequested&&<div className="farmer-transport-tracking"><div className="farmer-transport-tracking-head"><Truck size={16}/><strong>HadaLink transport</strong><span className={`table-status table-${request.transportStatusKey}`}><i/>{request.transportStatus}</span></div>{transportIndex>=0?<div className="transport-progress-steps">{transportSteps.map((step,index)=><span key={step} className={index<=transportIndex?'complete':''}><i>{index<transportIndex?<Check size={10}/>:index===transportIndex?<span/>:null}</i>{step}</span>)}</div>:<small>{request.transportStatus==='Unfulfilled'?'No logistics provider accepted this request.':`Transport status: ${request.transportStatus}`}</small>}{request.logisticsProvider&&<small>Provider: {request.logisticsProvider}</small>}{request.pickupAddress&&<small>Machine pickup: {request.pickupAddress}</small>}{request.liveLocation&&<a className="farmer-live-location-link" href={`https://www.openstreetmap.org/?mlat=${request.liveLocation.latitude}&mlon=${request.liveLocation.longitude}#map=16/${request.liveLocation.latitude}/${request.liveLocation.longitude}`} target="_blank" rel="noreferrer"><MapPin size={14}/> View live location · updated {new Date(request.liveLocation.updatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</a>}{request.deliveryNote&&<small>Delivery note: {request.deliveryNote}</small>}</div>}<p className="tracking-disclaimer">Live location is shared only during active delivery when the logistics provider allows location access.</p></article>})}</div> : <section className="panel empty-state"><MapPin size={20}/><strong>No active requests to track</strong><span>Pending, confirmed, and active transport requests will appear here.</span><button className="button button-primary button-small" onClick={()=>go('My bookings')}>View my bookings</button></section>}</div>;
}
function MachineCard({ machine, compact = false, onClick, actions }) {
  return <article className={`machine-card ${machine.id&&onClick?'machine-card-openable':''} ${compact?'machine-card-compact':''}`} role={machine.id&&onClick?'button':undefined} tabIndex={machine.id&&onClick?0:undefined} onClick={machine.id&&onClick?onClick:undefined} onKeyDown={machine.id&&onClick?event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onClick()}}:undefined}><div className="machine-photo">{machineImageSrc(machine)?<img src={machineImageSrc(machine)} alt={machine.name} loading="lazy"/>:<div className="real-image-empty"><Tractor size={30}/><span>Provider photo not added</span></div>}<span className={`machine-status status-${machine.status.toLowerCase()}`}><i/>{machine.status}</span><span className="machine-kind">{machine.kind}</span></div><div className="machine-body"><div className="machine-title-line"><h3>{machine.name}</h3><Tractor size={16}/></div><p className="machine-location"><MapPin size={13}/>{machine.area}</p>{!compact&&<p className="machine-description">{machine.description||'Review provider terms and confirm availability before requesting.'}</p>}<div className="machine-stats"><span><Users size={13}/>{machine.operatorAvailable===false?'Equipment only':'Operator by arrangement'}</span><span><CheckCircle2 size={13}/>Provider listing</span></div><div className="machine-rate"><span><strong>₦{machine.rate}</strong><small> / hectare</small></span>{!compact&&<button className="button button-ghost button-small" onClick={event=>{event.stopPropagation();onClick?.()}}>Edit details</button>}</div>{actions}</div></article>;
}
function Machinery({ machinesState, setMachinesState, filter, setFilter, search, setSearch, go, flash, loading = false }) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mutatingId, setMutatingId] = useState('');
  async function removeListing(machine) {
    if (!window.confirm(`Permanently remove “${machine.name}” from your listings? This cannot be undone.`)) return;
    setMutatingId(machine.id);
    try { await authRequest(`/equipment/${machine.id}`, undefined, 'DELETE'); setMachinesState(previous=>previous.filter(item=>item.id!==machine.id)); flash('Listing removed.'); }
    catch(error) { flash(error.message || 'Listing could not be removed.'); }
    finally { setMutatingId(''); }
  }
  const categories = ['All', 'Tractor', 'Planter', 'Harvester', 'Sprayer', 'Tiller', 'Mechanization service'];
  const listed = machinesState.filter(machine => (filter === 'All' || machine.kind.toLowerCase().includes(filter.toLowerCase())) && `${machine.name} ${machine.kind} ${machine.area}`.toLowerCase().includes(search.toLowerCase()));
  const countFor = category => category === 'All' ? machinesState.length : machinesState.filter(machine => machine.kind.toLowerCase().includes(category.toLowerCase())).length;
  return <div className="view-stack">{loading&&<div className="panel empty-state" aria-live="polite">Loading your published listings…</div>}<div className="filter-bar machinery-filter-bar"><button className="category-filter machinery-category-trigger" type="button" aria-label="Choose equipment category" aria-expanded={categoryOpen} onClick={()=>setCategoryOpen(true)}><Filter size={15}/><strong>{filter==='All'?'All categories':filter}</strong><ChevronDown size={14}/></button><span className="filter-result-count">{listed.length} {listed.length===1?'listing':'listings'}</span>{(filter!=='All'||search)&&<button className="button button-ghost button-small" onClick={() => { setFilter('All'); setSearch('') }}><X size={14}/> Clear filters</button>}</div>{categoryOpen&&createPortal(<div className="machinery-category-backdrop" role="presentation" onClick={event=>closePopup(setCategoryOpen,event)}><section className="machinery-category-popup" role="dialog" aria-modal="true" aria-labelledby="machinery-category-title" onClick={event=>event.stopPropagation()}><header><div><span>REFINE LISTINGS</span><h2 id="machinery-category-title">Equipment category</h2></div><button type="button" aria-label="Close category picker" onClick={event=>closePopup(setCategoryOpen,event)}><X size={18}/></button></header><div className="machinery-category-options">{categories.map(category=><button key={category} className={filter===category?'selected':''} onClick={()=>{setFilter(category);setCategoryOpen(false)}}><span>{category==='All'?'All categories':category}</span><small>{countFor(category)}</small>{filter===category&&<Check size={16}/>}</button>)}</div><footer><span>{listed.length} matching listings</span><button className="button button-ghost button-small" onClick={event=>closePopup(setCategoryOpen,event)}>Done</button></footer></section></div>,document.body)}<div className="machine-grid">{listed.map(machine => <MachineCard key={machine.id||machine.name} machine={machine} onClick={() => go('Edit Machinery', machine)} actions={<div className="machine-actions"><button className="button button-ghost button-small" onClick={event => {event.stopPropagation();go('Edit Machinery', machine)}}><Wrench size={13}/> Edit listing</button><button className="icon-button danger-button" disabled={mutatingId===machine.id||machine.status==='Booked'} aria-label={`Remove ${machine.name}`} onClick={event => {event.stopPropagation();removeListing(machine)}}><X size={14}/></button></div>}/>)}</div>{listed.length === 0 && <div className="panel empty-state"><Tractor size={22}/><strong>{machinesState.length ? 'No machines match your filters' : 'No listings yet'}</strong><span>{machinesState.length ? 'Try another model, category, or coverage area.' : 'Add your first machine to make it visible to local farmers.'}</span>{machinesState.length ? <button className="button button-ghost button-small" onClick={() => { setFilter('All'); setSearch('') }}>Clear filters</button> : <button className="button button-primary button-small" onClick={()=>go('Add Machinery')}><Plus size={14}/> Add your first machine</button>}</div>}{machinesState.length > 0 && (
      <button className="add-machine-tile" onClick={() => go('Add Machinery')}>
        <span><Plus size={26}/></span><strong>List another machine</strong>
        <p>Reach local farmers looking for their next rental.</p>
        <span className="button button-primary">Add equipment <ArrowRight size={14}/></span>
      </button>
    )}
    {machinesState.length > 0 && (
      <div className="cooperative-banner"><ShieldCheck size={19}/><span><strong>Local provider network</strong><small>Keep your listing details current so local farmers can compare options.</small></span><span className="verification-pill"><CheckCircle2 size={12}/> LISTED</span></div>
    )}</div>;
}

function EquipmentCategoryPicker({ value, onChange, label = 'MACHINE CATEGORY' }) {
  const [open, setOpen] = useState(false);
  const options = ['Tractor','Planter','Harvester','Boom sprayer','Tiller','Mechanization service','Other'];
  return <><label className="field"><span className="field-label">{label}</span><span className="field-control category-picker-control"><Tractor size={16}/><button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}>{value || 'Choose a category'}</button><ChevronDown size={14}/></span></label>{open&&createPortal(<div className="machinery-category-backdrop" role="presentation" onClick={event=>closePopup(setOpen,event)}><section className="machinery-category-popup" role="dialog" aria-modal="true" aria-labelledby="equipment-category-title" onClick={event=>event.stopPropagation()}><header><div><span>LISTING DETAILS</span><h2 id="equipment-category-title">Choose equipment category</h2></div><button type="button" aria-label="Close category picker" onClick={event=>closePopup(setOpen,event)}><X size={18}/></button></header><div className="machinery-category-options">{options.map(option=><button type="button" key={option} className={value===option?'selected':''} onClick={()=>{onChange(option);setOpen(false)}}><span>{option}</span>{value===option&&<Check size={16}/>}</button>)}</div><footer><span>Choose the closest match for your listing.</span><button type="button" className="button button-ghost button-small" onClick={event=>closePopup(setOpen,event)}>Done</button></footer></section></div>,document.body)}</>;
}

function AddMachine({ flash, go, setProviderListings, user, requestActionPin }) {
  const [form,setForm]=useState({name:'',category:'',rate:'',area:user?.profile?.primaryArea||'',pickupAddress:'',coordinates:null,description:'',operatorAvailable:true});
  const [publishing,setPublishing]=useState(false);
  const [locating,setLocating]=useState(false);
  const [services,setServices]=useState([]);
  const [photos,setPhotos]=useState([]);
  const [uploadingPhotos,setUploadingPhotos]=useState(false);
  const [photoError,setPhotoError]=useState('');
  const serviceOptions=['Ploughing','Harrowing','Ridging','Planting','Spraying','Harvesting'];
  function updateService(service,checked){setServices(previous=>checked?[...previous,service]:previous.filter(item=>item!==service));}
  async function submit(event){
    event.preventDefault();
    if (publishing) return;
    if(!form.name.trim()){flash('Add your machine’s name before publishing.');return;}
    if(!services.length){flash('Choose at least one service farmers can request.');return;}
    if(!form.rate.trim() || Number(form.rate.replace(/[₦,\s]/g,'')) <= 0){flash('Enter a valid rental rate.');return;}
    if(!form.area.trim()){flash('Enter the main operating area for this machine.');return;}
    if(form.pickupAddress.trim().length<5){flash('Enter the exact pickup address for this machine.');return;}
    if(uploadingPhotos){flash('Wait for the selected photos to finish uploading.');return;}
    const actionPin = await requestActionPin('publish this machinery listing');
    if (!actionPin) return;
    setPublishing(true);
    try {
      const { data } = await authRequest('/equipment', {
        name: form.name.trim(), category: form.category, rate: form.rate.trim(), area: form.area.trim(), pickupAddress: form.pickupAddress.trim(), coordinates: form.coordinates,
        description: form.description.trim(), services, operatorAvailable: form.operatorAvailable,
        actionPin,
        images: photos.map(({url,publicId,width,height})=>({url,publicId,width,height})),
      });
      const machine = mapEquipmentRecord(data);
      setProviderListings(previous=>[machine,...previous.filter(item=>item._id!==machine._id)]);
      flash(`${machine.name} is published and saved to your account.`);
      go('My Machinery');
    } catch (error) {
      flash(error.message || 'Your listing could not be published. Please try again.');
    } finally { setPublishing(false); }
  }
  async function useCurrentLocation(){setLocating(true);try{const coordinates=await captureCurrentLocation();setForm(previous=>({...previous,coordinates}));}catch(error){flash(error.message);}finally{setLocating(false);}}

  return <form className="panel listing-form" onSubmit={submit}><div className="listing-notice"><ShieldCheck size={16}/><span>Clear service, price, location and operator details help farmers compare listings.</span><small>Provider listing</small></div><div className="listing-columns"><section className="listing-photos"><PanelHead title="Machine photos" subtitle="Upload up to 6 equipment photos."/><label className="upload-box"><Upload size={22}/><strong>{uploadingPhotos?'Uploading photos…':'Choose equipment photos'}</strong><span>JPG, PNG or WebP · up to 8 MB each. Stored securely with Cloudinary.</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploadingPhotos||photos.length>=6} onChange={async event=>{const selected=Array.from(event.target.files||[]).slice(0,6-photos.length);event.target.value='';if(!selected.length)return;setPhotoError('');for(const file of selected){if(file.size>8*1024*1024){setPhotoError(`${file.name} is larger than 8 MB.`);return;}if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setPhotoError(`${file.name} is not a supported image.`);return;}}setUploadingPhotos(true);try{const uploaded=[];for(const file of selected)uploaded.push({...await uploadCloudinaryImage(file,'equipment'),name:file.name});setPhotos(previous=>[...previous,...uploaded].slice(0,6));}catch(error){setPhotoError(error.message||'Photo upload failed.');}finally{setUploadingPhotos(false);}}}/></label>{photoError&&<p className="upload-error" role="alert">{photoError}</p>}{photos.length>0&&<div className="uploaded-photos">{photos.map((photo,index)=><span key={`${photo.publicId}-${index}`}><img src={photo.url} alt=""/><span>{photo.name}</span><button type="button" aria-label={`Remove ${photo.name}`} onClick={()=>setPhotos(previous=>previous.filter((_,itemIndex)=>itemIndex!==index))}><X size={13}/></button><Check size={13}/></span>)}</div>}<div className="photography-tip"><Camera size={17}/><span><strong>Help farmers compare options</strong><br/>Show the overall machine, its condition and attachments.</span></div><div className="listing-strength"><span>LISTING DETAILS <strong>{services.length?`${services.length} services`:''}</strong></span><div><i/></div><small>Keep availability and rental terms up to date.</small></div></section><section className="listing-details"><PanelHead title="Equipment & service details" subtitle="Set clear terms for farmers to compare."/><EquipmentCategoryPicker value={form.category} onChange={category=>setForm(previous=>({...previous,category}))}/><Field icon={Wrench} label="MACHINE MODEL & NAME" placeholder="e.g. Massey Ferguson 375 4WD" value={form.name} onChange={event=>setForm(previous=>({...previous,name:event.target.value}))} required/><div className="listing-service-label"><span className="field-label">SERVICES AVAILABLE</span><span>Choose all that apply</span></div><div className="service-options">{serviceOptions.map(service=><label key={service}><input type="checkbox" checked={services.includes(service)} onChange={event=>updateService(service,event.target.checked)}/><span><Check size={12}/></span>{service}</label>)}</div><div className="inline-fields"><Field icon={Banknote} label="RATE PER HECTARE (₦)" placeholder="e.g. 45,000" value={form.rate} onChange={event=>setForm(previous=>({...previous,rate:event.target.value}))} required/><Field icon={MapPin} label="OPERATING AREA (PUBLIC)" placeholder="e.g. Jos South, Bukuru" value={form.area} onChange={event=>setForm(previous=>({...previous,area:event.target.value}))} required/></div><label className="field"><span className="field-label">EXACT MACHINE PICKUP ADDRESS (PRIVATE UNTIL BOOKING ACCEPTED)</span><span className="field-control"><MapPin size={16}/><input required minLength={5} maxLength={240} value={form.pickupAddress} onChange={event=>setForm(previous=>({...previous,pickupAddress:event.target.value}))} placeholder="Street, village, landmark and LGA" /></span></label><div className="listing-location-action"><button type="button" className="button button-ghost button-small" disabled={locating} onClick={useCurrentLocation}><MapPin size={13}/>{locating?'Getting location…':'Capture current device location'}</button><small>{form.coordinates?`GPS saved (${form.coordinates.latitude.toFixed(5)}, ${form.coordinates.longitude.toFixed(5)}). Exact address stays private until booking acceptance.`:'GPS is optional; enter the pickup address above. Your browser will ask permission before sharing coordinates.'}</small></div><label className="availability-control"><input type="checkbox" checked={form.operatorAvailable} onChange={event=>setForm(previous=>({...previous,operatorAvailable:event.target.checked}))}/><span className="availability-check"><Check size={12}/></span><span><strong>Provider operator can be requested</strong><small>Farmers choosing equipment-only access must bring a qualified operator.</small></span></label><label className="field"><span className="field-label">TERMS FOR FARMERS</span><textarea value={form.description} onChange={event=>setForm(previous=>({...previous,description:event.target.value}))} placeholder="Describe transport, fuel, timing and other terms farmers should confirm." rows="4"/></label></section></div><div className="listing-footer"><span><ShieldCheck size={15}/> Exact pickup details are shown only after a booking is accepted.</span><button className="button button-primary" type="submit" disabled={publishing||uploadingPhotos}>{publishing?'Publishing…':'Publish listing'} <ArrowRight size={15}/></button></div></form>;
}
function EditMachine({ machine, setMachinesState, go, flash }) {
  const serviceOptions=['Ploughing','Harrowing','Ridging','Planting','Spraying','Harvesting'];
  const [form,setForm]=useState(()=>({name:machine?.name||'',category:machine?.kind||'Tractor',rate:machine?.rate||'',area:machine?.area||'',pickupAddress:machine?.pickupAddress||'',coordinates:machine?.coordinates||null,terms:machine?.terms||machine?.description||'',operatorAvailable:machine?.operatorAvailable!==false,services:machine?.services||[],images:machine?.images||[]}));
  const [saving,setSaving]=useState(false);
  const [locating,setLocating]=useState(false);
  const [uploadingPhotos,setUploadingPhotos]=useState(false);
  const [photoError,setPhotoError]=useState('');
  React.useEffect(()=>{if(machine)setForm({name:machine.name||'',category:machine.kind||'Tractor',rate:machine.rate||'',area:machine.area||'',pickupAddress:machine.pickupAddress||'',coordinates:machine.coordinates||null,terms:machine.terms||machine.description||'',operatorAvailable:machine.operatorAvailable!==false,services:machine.services||[],images:machine.images||[]});},[machine?.id]);
  function updateService(service,checked){setForm(previous=>({...previous,services:checked?[...previous.services,service]:previous.services.filter(item=>item!==service)}));}
  async function addPhotos(event){const files=Array.from(event.target.files||[]).slice(0,Math.max(0,6-form.images.length));event.target.value='';if(!files.length)return;for(const file of files){if(file.size>8*1024*1024){setPhotoError(`${file.name} is larger than 8 MB.`);return;}if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setPhotoError(`${file.name} is not a supported image.`);return;}}setPhotoError('');setUploadingPhotos(true);try{const uploaded=[];for(const file of files)uploaded.push({...await uploadCloudinaryImage(file,'equipment'),name:file.name});setForm(previous=>({...previous,images:[...previous.images,...uploaded].slice(0,6)}));}catch(error){setPhotoError(error.message||'Photo upload failed.');}finally{setUploadingPhotos(false);}}
  async function save(event){event.preventDefault();if(!machine?._id){flash('This listing is still loading. Please try again.');return;}if(!form.services.length){flash('Choose at least one service farmers can request.');return;}if(form.pickupAddress.trim().length<5){flash('Enter the exact machine pickup address.');return;}setSaving(true);try{const {data}=await authRequest(`/equipment/${machine._id}`,{name:form.name.trim(),category:form.category,rate:form.rate,area:form.area,pickupAddress:form.pickupAddress.trim(),coordinates:form.coordinates,description:form.terms,operatorAvailable:form.operatorAvailable,services:form.services,images:form.images},'PATCH');const saved=mapEquipmentRecord(data);setMachinesState(previous=>previous.map(item=>item.id===saved.id?saved:item));flash('Listing details and photos saved.');go('My Machinery');}catch(error){flash(error.message||'The listing could not be updated.');}finally{setSaving(false);}}
  async function useCurrentLocation(){setLocating(true);try{const coordinates=await captureCurrentLocation();setForm(previous=>({...previous,coordinates}));}catch(error){flash(error.message);}finally{setLocating(false);}}
  if(!machine)return <div className="panel empty-state"><Tractor size={20}/><strong>Loading your listing</strong><span>Your saved machinery details are being retrieved.</span><button className="button button-ghost button-small" onClick={()=>go('My Machinery')}>Back to my machinery</button></div>;
  return <form className="panel edit-machine-form" onSubmit={save}><PanelHead title="Edit equipment details" subtitle="Keep the service and rental terms farmers see up to date."/><section className="edit-machine-photos"><div><strong>Equipment photos</strong><small>Use clear photos of this exact machine. Up to 6 images, 8 MB each.</small></div><div className="edit-machine-photo-grid">{form.images.map((photo,index)=><figure key={`${photo.publicId||photo.url}-${index}`}><img src={photo.url} alt={`Equipment photo ${index+1}`}/><button type="button" aria-label={`Remove equipment photo ${index+1}`} onClick={()=>setForm(previous=>({...previous,images:previous.images.filter((_,photoIndex)=>photoIndex!==index)}))}><X size={14}/></button></figure>)}{form.images.length<6&&<label className="edit-machine-photo-add"><Upload size={18}/><span>{uploadingPhotos?'Uploading…':'Add photos'}</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploadingPhotos} onChange={addPhotos}/></label>}</div>{photoError&&<p className="upload-error" role="alert">{photoError}</p>}</section><div className="edit-machine-fields"><Field icon={Wrench} label="MACHINE NAME" value={form.name} onChange={event=>setForm(previous=>({...previous,name:event.target.value}))} required/><EquipmentCategoryPicker label="CATEGORY" value={form.category} onChange={category=>setForm(previous=>({...previous,category}))}/><Field icon={Banknote} label="RATE PER HECTARE (₦)" value={form.rate} onChange={event=>setForm(previous=>({...previous,rate:event.target.value}))} required/><Field icon={MapPin} label="OPERATING AREA" value={form.area} onChange={event=>setForm(previous=>({...previous,area:event.target.value}))} required/><label className="field"><span className="field-label">EXACT MACHINE PICKUP ADDRESS (PRIVATE UNTIL BOOKING ACCEPTED)</span><span className="field-control"><MapPin size={16}/><input required minLength={5} maxLength={240} value={form.pickupAddress} onChange={event=>setForm(previous=>({...previous,pickupAddress:event.target.value}))} placeholder="Street, village, landmark and LGA" /></span></label><div className="listing-location-action"><button type="button" className="button button-ghost button-small" disabled={locating} onClick={useCurrentLocation}><MapPin size={13}/>{locating?'Getting location…':'Capture current device location'}</button><small>{form.coordinates?`GPS saved (${form.coordinates.latitude.toFixed(5)}, ${form.coordinates.longitude.toFixed(5)}).`:'GPS is optional; use the exact address if location permission is unavailable.'}</small></div><div className="listing-service-label"><span className="field-label">SERVICES AVAILABLE</span><span>Choose all that apply</span></div><div className="service-options">{serviceOptions.map(service=><label key={service}><input type="checkbox" checked={form.services.includes(service)} onChange={event=>updateService(service,event.target.checked)}/><span><Check size={12}/></span>{service}</label>)}</div><label className="availability-control"><input type="checkbox" checked={form.operatorAvailable} onChange={event=>setForm(previous=>({...previous,operatorAvailable:event.target.checked}))}/><span className="availability-check"><Check size={12}/></span><span><strong>Provider operator can be requested</strong><small>Equipment-only requests require a qualified operator from the farmer.</small></span></label><label className="field edit-terms-field"><span className="field-label">TERMS FOR FARMERS</span><textarea rows="4" value={form.terms} onChange={event=>setForm(previous=>({...previous,terms:event.target.value}))} placeholder="Transport, fuel, timing and other terms to confirm."/></label></div><div className="settings-actions"><button type="button" className="button button-ghost" onClick={()=>go('My Machinery')}>Cancel</button><button className="button button-primary" type="submit" disabled={saving||uploadingPhotos}><Check size={14}/> {saving?'Saving…':uploadingPhotos?'Uploading photos…':'Save listing'}</button></div></form>;
}
function Requests({ requestsState, setRequestsState, setProviderListings, activeRequest, setActiveRequest, search, flash, requestActionPin }) {
  const tabs = ['All','Pending','Accepted','Completed','Declined'];
  const list = requestsState.filter(request => (activeRequest === 'All' || request.status === activeRequest) && `${request.farmer} ${request.place} ${request.machine} ${request.service}`.toLowerCase().includes(search.toLowerCase()));
  const totalValue = requestsState.reduce((sum, request) => sum + Number(String(request.amount).replace(/[^\d]/g,'')), 0);
  async function update(id, status) {
    try {
      const actionPin = status === 'Accepted' ? await requestActionPin('accept this machinery booking') : null;
      if (status === 'Accepted' && !actionPin) return;
      const { data } = await authRequest(`/bookings/${id}/status`, { status: status.toLowerCase(), ...(actionPin ? { actionPin } : {}) }, 'PATCH');
      const saved = mapBookingRecord(data);
      setRequestsState(previous => previous.map(request => request.id === id ? {...request,...saved} : request));
      if (saved.equipmentId && (status === 'accepted' || status === 'completed')) {
        setProviderListings(previous => previous.map(machine => machine.id === saved.equipmentId ? { ...machine, status: status === 'accepted' ? 'Booked' : 'Available' } : machine));
      }
      flash(`Booking ${id.slice(-6)} ${status.toLowerCase()}.`);
    } catch (error) { flash(error.message || 'Booking status could not be updated.'); }
  }
  return <div className="view-stack"><section className="metric-grid request-metrics">
    <Metric label="AWAITING YOUR RESPONSE" value={String(requestsState.filter(request => request.status === 'Pending').length)} detail={<><Clock3 size={13}/>Requests needing a decision</>} icon={Clock3} tone="orange"/>
    <Metric label="BOOKINGS IN PROGRESS" value={String(requestsState.filter(request => request.status === 'Accepted').length)} detail={<><CheckCircle2 size={13}/>Provider-confirmed requests</>} icon={Tractor}/>
    <Metric label="TOTAL REQUEST VALUE" value={`₦${totalValue.toLocaleString('en-NG')}`} detail={<><Banknote size={13}/>Saved booking quotes</>} icon={Banknote} tone="blue"/>
  </section><section className="panel table-panel"><PanelHead title="Manage booking requests" subtitle="Confirm dates, location, operator arrangements and final terms with each farmer."/><div className="request-tabs">{tabs.map(tab=><button key={tab} onClick={()=>setActiveRequest(tab)} className={activeRequest===tab?'selected':''}>{tab}<span>{tab==='All'?requestsState.length:requestsState.filter(request=>request.status===tab).length}</span></button>)}</div><RequestTable requestsState={list} onStatus={update}/></section></div>;
}
function RequestTable({ requestsState, onStatus, compactMobile = false }) {
  const renderActions = request => request.status==='Pending' ? <><button className="button button-primary button-tiny" onClick={()=>onStatus(request.id,'Accepted')}><Check size={12}/> Confirm</button><button className="button button-ghost button-tiny" onClick={()=>onStatus(request.id,'Declined')}>Decline</button></> : request.status==='Accepted' ? <button className="button button-ghost button-tiny" onClick={()=>onStatus(request.id,'Completed')}>Record completion <CheckCircle2 size={11}/></button> : <span>{request.status==='Completed'?'Transaction recorded':'No further action'}</span>;
  return <div className={`table-scroll ${compactMobile?'request-table-mobile-cards':''} ${onStatus?'request-table-actions':''}`}><table className="data-table"><thead><tr><th>REQUEST</th><th>FARMER</th><th>MACHINE & SERVICE</th><th>AREA</th><th>DATE & SIZE</th><th>BOOKING VALUE</th><th>STATUS</th>{onStatus&&<th>ACTIONS</th>}</tr></thead><tbody>{requestsState.map(request=><tr key={request.id}><td><span className="table-id">{request.id}</span></td><td><strong>{request.farmer}</strong><small><MapPin size={11}/>{request.place}</small></td><td><span>{request.service}</span><small>{request.machine}{request.operator&&` · ${request.operator}`}</small></td><td>{request.place.replace(' LGA','')}</td><td><span>{request.date}</span><small>{request.hectares}</small></td><td><strong className="table-amount">{request.amount}</strong></td><td><span className={`table-status table-${request.status.toLowerCase()}`}><i/>{request.status}</span></td>{onStatus&&<td><div className="table-actions">{renderActions(request)}</div></td>}</tr>)}</tbody></table>{onStatus&&<div className="request-cards-mobile">{requestsState.map(request=><article className="request-mobile-card" key={request.id}><header><span className="table-id">{request.id}</span><span className={`table-status table-${request.status.toLowerCase()}`}><i/>{request.status}</span></header><div className="request-mobile-farmer"><strong>{request.farmer}</strong><span><MapPin size={12}/>{request.place}</span></div><div className="request-mobile-machine"><span>{request.service}</span><small>{request.machine}{request.operator&&` · ${request.operator}`}</small></div><div className="request-mobile-meta"><span><small>DATE · SIZE</small>{request.date} · {request.hectares}</span><strong className="table-amount">{request.amount}</strong></div><div className="request-mobile-actions">{renderActions(request)}</div></article>)}</div>}{requestsState.length===0&&<div className="empty-state"><Search size={20}/><strong>No bookings found</strong><span>Try another status or search term.</span></div>}</div>;
}
function CalendarPage({ month, setMonth, year, setYear, requestsState, machinesState }) {
  const [selected, setSelected] = useState(() => new Date().getDate());
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const mname = new Date(year, month).toLocaleString('en', { month: 'long', year: 'numeric' });
  const bookingsByDay = requestsState.reduce((groups, request) => {
    if (!request.requestedDate) return groups;
    const date = new Date(request.requestedDate);
    if (date.getFullYear() !== year || date.getMonth() !== month) return groups;
    (groups[date.getDate()] ||= []).push(request);
    return groups;
  }, {});
  const selectedBookings = bookingsByDay[selected] || [];
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(<div key={`p${i}`} className="calendar-cell out-month"><span>{new Date(year, month, 0).getDate() - first + i + 1}</span></div>);
  for (let day = 1; day <= days; day++) {
    const dayBookings = bookingsByDay[day] || [];
    cells.push(<button key={day} className={`calendar-cell ${year===new Date().getFullYear()&&month===new Date().getMonth()&&day===new Date().getDate()?'today':''} ${selected===day?'day-selected':''}`} onClick={()=>setSelected(day)}><span>{day}</span>{dayBookings.slice(0,2).map(item=><span key={item.id} className={`calendar-event ${item.status==='Accepted'?'event-good':item.status==='Pending'?'event-warning':'event-neutral'}`}>{item.machine || item.service}</span>)}{dayBookings.length>2&&<span className="calendar-event">+{dayBookings.length-2} more</span>}</button>);
  }
  while (cells.length % 7) cells.push(<div key={`n${cells.length}`} className="calendar-cell out-month"><span>{cells.length - (first + days) + 1}</span></div>);
  return <div className="view-stack"><section className="calendar-toolbar"><div className="calendar-month"><button className="icon-button" aria-label="Previous month" onClick={()=>{if(month===0){setMonth(11);setYear(value=>value-1)}else setMonth(value=>value-1);setSelected(1)}}><ChevronLeft size={16}/></button><strong>{mname}</strong><button className="icon-button" aria-label="Next month" onClick={()=>{if(month===11){setMonth(0);setYear(value=>value+1)}else setMonth(value=>value+1);setSelected(1)}}><ChevronRight size={16}/></button></div><span>{requestsState.length} booking records</span></section><section className="availability-legend"><strong>BOOKING STATUS</strong><span><i className="legend-green"/> Provider accepted</span><span><i className="legend-amber"/> Awaiting response</span><span><i className="legend-blue"/> Other booking status</span></section><div className="calendar-layout"><section className="panel calendar-panel"><div className="weekday-grid">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=><span key={day}>{day}</span>)}</div><div className="calendar-grid">{cells}</div></section><aside className="calendar-aside"><section className="panel dispatch-panel"><span className="eyebrow"><span/> SELECTED DATE</span><h2>{new Date(year,month,selected).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</h2><div className="dispatch-card"><CalendarDays size={17}/><span><strong>{selectedBookings.length?`${selectedBookings.length} booking${selectedBookings.length===1?'':'s'}`:'No bookings on this date'}</strong><small>{selectedBookings.length?'Records for this requested date.':'Bookings with this date will appear here.'}</small></span></div>{selectedBookings.length?selectedBookings.map(item=><div className="availability-machine" key={item.id}><span className={`fleet-dot fleet-${item.status==='Accepted'?'green':item.status==='Pending'?'amber':'green'}`}/><span>{item.machine || item.service}</span><small>{item.status}</small></div>):<p className="empty-state">No booking records for the selected date.</p>}</section><section className="panel depot-panel"><Tractor size={17}/><strong>Your fleet</strong><p>{machinesState.length?`${machinesState.length} published listing${machinesState.length===1?'':'s'} in your account.`:'No published listings yet.'}</p>{machinesState.slice(0,4).map(machine=><div className="availability-machine" key={machine.id}><span className={`fleet-dot ${machine.status==='Available'?'fleet-green':'fleet-amber'}`}/><span>{machine.name}</span><small>{machine.status}</small></div>)}</section></aside></div></div>;
}
function Analytics({ machinesState, requestsState }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const data = getWeekData(weekOffset, requestsState);
  const totalBookings = data.reduce((sum, day) => sum + day.jobs, 0);
  const totalIncome = data.reduce((sum, day) => sum + day.income, 0);
  const averageValue = totalBookings ? Math.round(totalIncome / totalBookings) : 0;
  const activeListings = machinesState.filter(machine => machine.status === 'Available').length;
  const completedJobs = requestsState.filter(request => request.status === 'Completed').length;
  return <div className="view-stack"><div className="analytics-week-bar"><WeekNavigator weekOffset={weekOffset} setWeekOffset={setWeekOffset}/></div><div className="metric-grid">
    <Metric label="BOOKING REQUESTS" value={String(totalBookings)} detail={<><CalendarDays size={13}/>{getWeekRange(weekOffset)}</>} icon={CalendarDays}/>
    <Metric label="ACTIVE LISTINGS" value={String(activeListings)} detail={<><Tractor size={13}/>Available to request</>} icon={Tractor} tone="blue"/>
    <Metric label="COMPLETED JOBS" value={String(completedJobs)} detail={<><CheckCircle2 size={13}/>Recorded transactions</>} icon={CheckCircle2} tone="orange"/>
    <Metric label="AVG. BOOKING VALUE" value={totalBookings?`₦${averageValue.toLocaleString('en-NG')}`:'—'} detail={<><BarChart3 size={13}/>Requested booking values</>} icon={Banknote}/>
  </div><div className="analytics-grid">
    <section className="panel analytics-chart"><PanelHead title="Booking activity" subtitle={`Requests by requested date · ${getWeekRange(weekOffset)}`}/>{totalBookings?<><div className="earnings-chart-inner"><Suspense fallback={<span className="chart-loading" aria-hidden="true"/>}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:12,right:10,left:-20,bottom:0}}><defs><linearGradient id="analyticsJobs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c98a" stopOpacity={.25}/><stop offset="100%" stopColor="#22c98a" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="rgba(164,194,172,.09)" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#86988c',fontSize:12}}/><Tooltip contentStyle={{background:'#10281d',border:'1px solid #254333',borderRadius:10,fontSize:12}}/><Area type="monotone" dataKey="jobs" name="Booking requests" stroke="#24d18c" fill="url(#analyticsJobs)" strokeWidth={2}/></AreaChart></ResponsiveContainer></Suspense></div><p className="analytics-week-total">{totalBookings} booking requests · {getWeekRange(weekOffset)}</p></>:<div className="empty-state"><CalendarDays size={20}/><strong>No booking activity this week</strong><span>Requests will appear here as they are made.</span></div>}</section>
    <section className="panel analytics-chart"><PanelHead title="Requested booking value" subtitle={`Sum of booking quotes · ${getWeekRange(weekOffset)}`}/>{totalBookings?<><div className="earnings-chart-inner"><Suspense fallback={<span className="chart-loading" aria-hidden="true"/>}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{top:12,right:10,left:-20,bottom:0}}><CartesianGrid stroke="rgba(164,194,172,.09)" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#86988c',fontSize:12}}/><Tooltip contentStyle={{background:'#10281d',border:'1px solid #254333',borderRadius:10,fontSize:12}} formatter={value=>[`₦${Number(value).toLocaleString('en-NG')}`,'Quoted value']}/><Bar dataKey="income" name="Quoted value" fill="#efa812" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></Suspense></div><p className="analytics-week-total">₦{totalIncome.toLocaleString('en-NG')} in requested booking quotes</p></>:<div className="empty-state"><Banknote size={20}/><strong>No booking values to show</strong><span>Booking quotes will be summarized here.</span></div>}</section>
  </div><p className="analytics-note"><ShieldCheck size={15}/> Booking value reflects the quote saved when a request was created. Final terms and payment are coordinated directly; no payment is collected in HadaLink.</p></div>;
}
function Earnings({ requestsState }) {
  const completed = requestsState.filter(request => request.status === 'Completed');
  const gross = completed.reduce((sum, request) => sum + Number(String(request.amount).replace(/[^\d]/g,'')), 0);
  const proposedCommission = Math.round(gross * .05);
  return <div className="view-stack">
    <div className="analytics-note"><Wallet size={15}/> Payments are coordinated directly between farmers and providers in this MVP. No escrow, payout or payment processing is connected. The proposed HadaLink commission is 5%; no fee is collected here.</div>
    <div className="metric-grid"><Metric label="COMPLETED BOOKING VALUE" value={`₦${gross.toLocaleString('en-NG')}`} detail={<><CheckCircle2 size={13}/> From recorded completed jobs</>} icon={Banknote}/><Metric label="PROPOSED 5% COMMISSION" value={`₦${proposedCommission.toLocaleString('en-NG')}`} detail={<><Wallet size={13}/> Estimate only · not collected</>} icon={Wallet} tone="orange"/><Metric label="COMPLETED TRANSACTIONS" value={String(completed.length)} detail={<><CheckCircle2 size={13}/> Booking records retained</>} icon={CheckCircle2} tone="blue"/></div>
    <section className="panel table-panel"><PanelHead title="Completed booking records" subtitle="Transaction details from requests marked complete. Confirm payment arrangements directly with the other party."/><div className="table-scroll"><table className="data-table"><thead><tr><th>DATE</th><th>MACHINE / SERVICE</th><th>FARMER</th><th>BOOKING VALUE</th><th>PAYMENT ARRANGEMENT</th></tr></thead><tbody>{completed.map(request=><tr key={request.id}><td>{request.date}</td><td><span>{request.machine}</span><small>{request.service}</small></td><td><strong>{request.farmer}</strong></td><td><strong className="table-amount">{request.amount}</strong></td><td><span>{request.paymentStatus || 'Coordinate directly'}</span></td></tr>)}</tbody></table>{completed.length===0&&<div className="empty-state"><Banknote size={20}/><strong>No completed transaction records yet</strong><span>When a provider marks a booking complete, its record will appear here.</span></div>}</div></section>
  </div>;
}
function Reviews({ requestsState }) {
  const records = requestsState.filter(request => request.review && Number.isFinite(request.rating));
  const completed = requestsState.filter(request => request.status === 'Completed');
  const average = records.length ? (records.reduce((sum, request) => sum + request.rating, 0) / records.length).toFixed(1) : '—';
  const byMachine = Object.values(records.reduce((groups, request) => {
    const group = groups[request.machine] || (groups[request.machine] = {machine:request.machine,count:0,total:0});
    group.count += 1;
    group.total += request.rating;
    return groups;
  }, {}));
  return <div className="view-stack"><div className="metric-grid">
    <Metric label="AVERAGE REVIEW" value={average} detail={<><Star size={13} fill="currentColor"/>{records.length} recorded reviews</>} icon={Star}/>
    <Metric label="COMPLETED BOOKINGS" value={String(completed.length)} detail={<><CheckCircle2 size={13}/>Eligible for farmer feedback</>} icon={CheckCircle2} tone="blue"/>
    <Metric label="REVIEWS TO COLLECT" value={String(completed.length-records.length)} detail={<><MessageCircle size={13}/>Ask after a completed job</>} icon={MessageCircle} tone="orange"/>
  </div><div className="reviews-layout"><section className="review-list">{records.length ? records.map(request=><article className="panel review-card" key={request.id}><div className="review-header"><span className="review-avatar">{request.farmer.split(' ').map(part=>part[0]).join('')}</span><span className="review-person"><strong>{request.farmer}</strong><small><MapPin size={12}/>{request.place} · hired {request.machine}</small></span><span className="review-stars"><span>{'★'.repeat(request.rating)}{'☆'.repeat(5-request.rating)}</span><small>{request.date}</small></span></div><span className="review-verified"><CheckCircle2 size={13}/> COMPLETED BOOKING RECORD</span><blockquote>“{request.review}”</blockquote><div className="review-footer"><span>Feedback shared after the recorded booking.</span>{request.farmerEmail ? <a className="button button-ghost button-small" href={`mailto:${encodeURIComponent(request.farmerEmail)}?subject=${encodeURIComponent(`HadaLink booking ${request.id}`)}`}><Mail size={13}/> Email farmer</a> : <span className="review-contact-unavailable">Farmer email unavailable</span>}</div></article>) : <div className="panel empty-state"><Star size={20}/><strong>No farmer reviews recorded yet</strong><span>Completed bookings can receive feedback from the farmer dashboard.</span></div>}</section><aside className="view-stack"><section className="panel equipment-reviews"><PanelHead title="Equipment ratings" subtitle="Calculated from reviews linked to completed bookings."/>{byMachine.length ? byMachine.map(group=><div className="equipment-review" key={group.machine}><span>{group.machine}</span><strong>{(group.total/group.count).toFixed(1)} <Star size={12} fill="currentColor"/></strong><small>{group.count} recorded {group.count===1?'review':'reviews'}</small></div>) : <p className="empty-state">Ratings appear here when completed bookings receive reviews.</p>}</section><section className="panel guarantee-panel"><ShieldCheck size={23}/><h3>Trust through clear records</h3><p>Provider details, agreed terms, completed booking records and farmer reviews help people make informed decisions. A listing is not a physical equipment inspection or a guarantee of availability.</p></section></aside></div></div>;
}
function ActionPinSettings({ user, onUserUpdated }) {
  const [currentPin, setCurrentPin] = useState(emptyPinDigits);
  const [pin, setPin] = useState(emptyPinDigits);
  const [confirmation, setConfirmation] = useState(emptyPinDigits);
  const [code, setCode] = useState(emptyPinDigits);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  function resetEmailCode() { setCodeSent(false); setCode(emptyPinDigits()); setMessage(''); }
  async function requestEmailCode() {
    setBusy(true); setMessage('');
    try {
      await authRequest('/auth/action-pin/request-code', {
        ...(user?.hasActionPin ? { currentPin: pinDigitsToString(currentPin) } : {}),
        pin: pinDigitsToString(pin), confirmation: pinDigitsToString(confirmation),
      });
      setCodeSent(true);
      setVerificationOpen(true);
      setMessage('');
    } catch (error) { setMessage(error.message || 'The verification code could not be sent.'); }
    finally { setBusy(false); }
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const { data } = await authRequest('/auth/action-pin', {
        ...(user?.hasActionPin ? { currentPin: pinDigitsToString(currentPin) } : {}),
        pin: pinDigitsToString(pin), confirmation: pinDigitsToString(confirmation), code: pinDigitsToString(code),
      });
      onUserUpdated(data.user);
      setCurrentPin(emptyPinDigits()); setPin(emptyPinDigits()); setConfirmation(emptyPinDigits()); setCode(emptyPinDigits()); setCodeSent(false); setVerificationOpen(false);
      setMessage(user?.hasActionPin ? 'Verified — your PIN has been changed.' : 'Verified — your PIN is set.');
    } catch (error) { setMessage(error.message || 'The action PIN could not be saved.'); }
    finally { setBusy(false); }
  }
  function changePin(setter, value) { setter(value); resetEmailCode(); }
  return <>
    <section className="panel action-pin-settings"><PanelHead title="Role action PIN" subtitle={`A private six-digit PIN for protected ${user?.role || 'account'} actions.`}/><form className="action-pin-settings-form" onSubmit={event=>{event.preventDefault();requestEmailCode()}}>{user?.hasActionPin&&<PinCodeField label="CURRENT ACTION PIN" value={currentPin} onChange={value=>changePin(setCurrentPin,value)} autoFocus/>}<PinCodeField label={user?.hasActionPin?'NEW SIX-DIGIT PIN':'CREATE SIX-DIGIT PIN'} value={pin} onChange={value=>changePin(setPin,value)} autoFocus={!user?.hasActionPin}/><PinCodeField label="CONFIRM PIN" value={confirmation} onChange={value=>changePin(setConfirmation,value)}/><small>This six-digit PIN protects actions for your role. We’ll send a one-time code to {user?.email || 'your account email'} before saving a new or changed PIN.</small><div className="settings-actions"><button type="submit" className="button button-primary" disabled={busy}>{busy?'Sending code…':'Save and verify'} <Check size={14}/></button></div>{message&&<p className="settings-help" role="status">{message}</p>}</form></section>
    {verificationOpen&&createPortal(<div className="action-pin-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setVerificationOpen(false)}}><section className="action-pin-dialog pin-verification-dialog" role="dialog" aria-modal="true" aria-labelledby="pin-verification-title"><header><span className="action-pin-icon"><ShieldCheck size={18}/></span><button type="button" aria-label="Close verification" onClick={()=>setVerificationOpen(false)}><X size={17}/></button></header><span className="eyebrow">CONFIRM VERIFICATION</span><h2 id="pin-verification-title">Verify your email</h2><p>A six-digit code has been sent to <strong>{user?.email || 'your account email'}</strong>. Enter it below to verify and save your PIN.</p><form onSubmit={save}><PinCodeField label="6-DIGIT VERIFICATION CODE" value={code} onChange={setCode} masked={false} autoFocus/>{message&&<div className="auth-error" role="alert">{message}</div>}<div className="pin-verification-links"><span>Didn’t receive it?</span><button type="button" className="text-link" onClick={requestEmailCode} disabled={busy}>{busy?'Sending…':'Send a new code'}</button></div><div className="action-pin-actions"><button type="button" className="button button-ghost" onClick={()=>setVerificationOpen(false)}>Cancel</button><button className="button button-primary" disabled={busy}>{busy?'Verifying…':'Verify and save PIN'} <Check size={14}/></button></div></form></section></div>,document.body)}
  </>;
}

function SettingsPage({ currentUser, onUserUpdated }) {
  const [tab, setTab] = useState('Profile');
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const profile = currentUser?.profile || {};
  const [profileForm, setProfileForm] = useState({ phone: nigerianPhoneValue(profile.phone), whatsapp: nigerianPhoneValue(profile.whatsapp), businessName: profile.businessName || '', primaryArea: profile.primaryArea || '', serviceAreas: (profile.serviceAreas?.length ? profile.serviceAreas : profile.primaryArea ? [profile.primaryArea] : []).join(', ') });
  React.useEffect(() => setProfileForm({ phone: nigerianPhoneValue(profile.phone), whatsapp: nigerianPhoneValue(profile.whatsapp), businessName: profile.businessName || '', primaryArea: profile.primaryArea || '', serviceAreas: (profile.serviceAreas?.length ? profile.serviceAreas : profile.primaryArea ? [profile.primaryArea] : []).join(', ') }), [currentUser]);
  const areas = profile.serviceAreas?.length ? profile.serviceAreas : profile.primaryArea ? [profile.primaryArea] : [];
  const status = value => <span className={`phone-status ${String(value || '').trim() ? 'verified' : ''}`}>{String(value || '').trim() ? 'Completed' : 'Not added yet'}</span>;
  function change(field, value) { setProfileForm(previous => ({ ...previous, [field]: value })); setSaveMessage(''); }
  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true); setSaveMessage('');
    try {
      const updates = tab === 'Coverage'
        ? { primaryArea: profileForm.serviceAreas.split(',').map(area => area.trim()).filter(Boolean)[0] || profileForm.primaryArea, serviceAreas: profileForm.serviceAreas.split(',').map(area => area.trim()).filter(Boolean) }
        : { phone: nigerianPhoneValue(profileForm.phone), whatsapp: nigerianPhoneValue(profileForm.whatsapp), ...(currentUser?.role === 'provider' ? { businessName: profileForm.businessName } : {}) };
      const { data } = await authRequest('/auth/profile', updates, 'PATCH');
      onUserUpdated(data.user);
      setSaveMessage('Your changes have been saved.');
    } catch (error) { setSaveMessage(error.message || 'Your profile could not be saved.'); }
    finally { setSaving(false); }
  }
  async function changeAvatar(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setAvatarError('Choose a JPG, PNG or WebP image.'); return; }
    if (file.size > 8 * 1024 * 1024) { setAvatarError('Choose an image smaller than 8 MB.'); return; }
    setAvatarBusy(true); setAvatarError('');
    try { const uploaded = await uploadCloudinaryImage(file, 'avatar'); const { data } = await authRequest('/auth/profile/avatar', { avatarUrl: uploaded.url, publicId: uploaded.publicId }, 'PATCH'); onUserUpdated(data.user); }
    catch (error) { setAvatarError(error.message || 'Profile photo could not be updated.'); }
    finally { setAvatarBusy(false); }
  }
  const initials = (currentUser?.name || 'HadaLink').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const setTabAndReset = value => { setTab(value); setSaveMessage(''); setProfileForm({ phone: nigerianPhoneValue(profile.phone), whatsapp: nigerianPhoneValue(profile.whatsapp), businessName: profile.businessName || '', primaryArea: profile.primaryArea || '', serviceAreas: areas.join(', ') }); };
  return <div className="view-stack"><div className="settings-tabs">{['Profile', 'Coverage', 'Payment coordination'].map((item, index) => <button type="button" key={item} className={tab === item ? 'selected' : ''} onClick={() => setTabAndReset(item)}>{[<User size={14} />, <MapPin size={14} />, <Banknote size={14} />][index]}{item}</button>)}</div><div className="settings-grid"><section className="panel settings-card"><PanelHead title={tab === 'Profile' ? 'Your profile' : tab === 'Coverage' ? 'Operating area & coverage' : 'Payment coordination'} subtitle={tab === 'Profile' ? 'Update the contact details associated with your account.' : tab === 'Coverage' ? 'Tell nearby farmers where you operate.' : 'Marketplace pilot settings and local booking coordination.'} />{tab === 'Profile' && <div className="profile-photo-editor"><span className="profile-photo-preview">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="Profile"/> : initials}</span><div><strong>Profile photo</strong><small>Shown in your account menu. JPG, PNG or WebP, up to 8 MB.</small>{avatarError&&<small className="upload-error" role="alert">{avatarError}</small>}</div><label className="button button-ghost button-small">{avatarBusy ? 'Uploading…' : profile.avatarUrl ? 'Change photo' : 'Add photo'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={avatarBusy} onChange={changeAvatar}/></label></div>}{tab === 'Payment coordination' ? <div className="settings-note"><Wallet size={16}/> Payment processing and stored bank details are not connected. Agree payment arrangements directly with the other party.</div> : <form className="settings-fields" onSubmit={saveProfile}>{tab === 'Profile' ? <><Field icon={User} label="FULL NAME" value={currentUser?.name || ''} readOnly placeholder="Name not available"/>{currentUser?.role === 'provider' && <Field icon={Wrench} label="BUSINESS OR FLEET NAME" value={profileForm.businessName} onChange={event=>change('businessName',event.target.value)} required maxLength={140}/>}<Field icon={Mail} label="EMAIL ADDRESS" type="email" value={currentUser?.email || ''} readOnly/><NigerianPhoneField icon={MapPin} label="PHONE NUMBER" value={profileForm.phone} onChange={value=>change('phone',value)} required trailing={status(profile.phone)}/><NigerianPhoneField icon={MessageCircle} label="WHATSAPP NUMBER" value={profileForm.whatsapp} onChange={value=>change('whatsapp',value)} required trailing={status(profile.whatsapp)}/><p className="settings-help">Phone and WhatsApp are marked complete once a number is provided. Number verification is not available yet.</p></> : <><Field icon={MapPin} label="SERVICE AREAS" value={profileForm.serviceAreas} onChange={event=>change('serviceAreas',event.target.value)} placeholder="Jos South, Barkin Ladi"/><small className="settings-help">Separate areas with commas. Add up to 10 towns or LGAs.</small></>}<div className="settings-actions"><button type="button" className="button button-ghost" onClick={()=>setTabAndReset(tab)}>Discard changes</button><button className="button button-primary" type="submit" disabled={saving}>{saving?'Saving…':'Save changes'} <Check size={14}/></button></div>{saveMessage&&<p className="settings-help" role="status">{saveMessage}</p>}</form>}</section><aside className="view-stack"><section className="panel profile-summary"><span className="eyebrow">ACCOUNT</span><div className="profile-account-row"><span className="profile-check"><BadgeCheck size={24}/></span><h3>{currentUser?.name || 'Your account'}</h3></div><p>Your profile details are shown here as currently saved to your HadaLink account.</p><div><ShieldCheck size={14}/>{profile.phone ? 'Phone number completed' : 'Phone number not added yet'}</div><div><ShieldCheck size={14}/>{profile.whatsapp ? 'WhatsApp number completed' : 'WhatsApp number not added yet'}</div></section><section className="panel coverage-card"><PanelHead title="Your coverage"/><div className="area-tags">{areas.length ? areas.map(area=><span key={area}><MapPin size={11}/>{area}</span>) : <span>No areas added yet</span>}</div><p>Operating areas will appear here when they have been added to your profile.</p><button className="button button-ghost button-small" onClick={()=>setTabAndReset('Coverage')}><MapPin size={13}/> Edit coverage</button></section></aside></div><ActionPinSettings user={currentUser} onUserUpdated={onUserUpdated}/></div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);

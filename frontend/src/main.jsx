import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowRight, Bell, CalendarDays, Check, CheckCircle2, ChevronDown, CircleHelp, Download, Home, LogOut, Menu, MessageCircle, Plus, Search, Settings, ShieldCheck, Sprout, Tractor, Wallet, X, ArrowDown, ArrowUpRight, BadgeCheck, Banknote, BarChart3, Camera, ChevronLeft, ChevronRight, Clock3, CreditCard, Eye, EyeOff, Filter, Gauge, Globe2, Image, Leaf, LockKeyhole, Mail, MapPin, SlidersHorizontal, Star, TrendingUp, Upload, User, Users, Wrench, Sun, Moon } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import './styles.css';

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
const requests = [
  { id: 'HL-8042', farmer: 'Danladi Gyang', place: 'Barkin Ladi LGA', service: 'Ploughing', machine: 'Massey Ferguson 375', hectares: '8.5 ha', amount: '₦382,500', date: '28 Oct 2026', status: 'Pending' },
  { id: 'HL-8039', farmer: 'Bitrus Pam', place: 'Mangu LGA', service: 'Harrowing & levelling', machine: 'Massey Ferguson 375', hectares: '12.0 ha', amount: '₦480,000', date: '30 Oct 2026', status: 'Pending' },
  { id: 'HL-8015', farmer: 'Ngozi Okafor', place: 'Jos South, Vom', service: 'Planting', machine: 'Baldan 4-Row Planter', hectares: '5.0 ha', amount: '₦150,000', date: '25 Oct 2026', status: 'Accepted' },
  { id: 'HL-7988', farmer: 'Ezekiel Chollom', place: 'Riyom LGA', service: 'Spraying', machine: 'Jacto Condor 600L', hectares: '15.0 ha', amount: '₦225,000', date: '22 Oct 2026', status: 'Completed' },
];
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

async function authRequest(path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
const navItems = [
  { id: 'Dashboard', icon: Home }, { id: 'My Machinery', icon: Tractor }, { id: 'Add Machinery', icon: Plus }, { id: 'Requests', icon: MessageCircle }, { id: 'Calendar', icon: CalendarDays }, { id: 'Analytics', icon: Gauge }, { id: 'Earnings', icon: Wallet }, { id: 'Reviews', icon: Star }, { id: 'Settings', icon: Settings },
];
const titles = { Dashboard: 'Welcome back, Musa', 'My Machinery': 'My Machinery', 'Add Machinery': 'Add Machinery', 'Edit Machinery': 'Edit Machinery', Requests: 'Booking Requests', Calendar: 'Fleet Calendar & Schedule', Analytics: 'Analytics & Growth', Earnings: 'Transaction Records & Commission', Reviews: 'Farmer Reviews & Ratings', Settings: 'Account & Fleet Settings' };
const mobileQuickNav = [
  { id: 'Dashboard', icon: Home },
  { id: 'Requests', icon: MessageCircle },
  { id: 'Analytics', icon: Gauge },
  { id: 'Settings', icon: Settings },
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

function readStoredArray(key, fallback) {
  const saved = localStorage.getItem(key);
  if (saved === null) return fallback;
  const value = JSON.parse(saved);
  if (!Array.isArray(value)) throw new Error(`Saved ${key} data must be an array.`);
  return value;
}

function getWeekData(weekOffset) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const baseJobs = [4, 6, 5, 8, 7, 10, 8];
  const baseIncome = [195, 240, 215, 365, 310, 440, 385];
  return days.map((day, index) => {
    const variation = weekOffset === 0 ? 0 : ((weekOffset * 7 + index * 3) % 5) - 2;
    return {
      day,
      jobs: Math.max(0, baseJobs[index] + variation),
      income: Math.max(0, baseIncome[index] + variation * 18),
    };
  });
}

function getWeekRange(weekOffset) {
  const end = new Date(2026, 10, 1 - weekOffset * 7, 12);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  const format = date => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${format(start)}–${format(end)} ${end.getFullYear()}`;
}

function WeekNavigator({ weekOffset, setWeekOffset }) {
  return <div className="week-navigator" aria-label="Choose analytics week">
    <button className="icon-button" aria-label="Previous week" onClick={() => setWeekOffset(value => value + 1)}><ChevronLeft size={16}/></button>
    <strong>{weekOffset === 0 ? 'This week' : `Week of ${getWeekRange(weekOffset)}`}</strong>
    <button className="icon-button" aria-label="Next week" disabled={weekOffset === 0} onClick={() => setWeekOffset(value => Math.max(0, value - 1))}><ChevronRight size={16}/></button>
    {weekOffset > 0 && <button className="button button-ghost button-small" onClick={() => setWeekOffset(0)}>This week</button>}
  </div>;
}

function App() {
  const [page, setPage] = useState(() => { const path=location.pathname.split('/').filter(Boolean); return path[0]==='app' ? (path[1]==='machinery'&&path[2]==='edit'?'Edit Machinery':({machinery:'My Machinery',add:'Add Machinery',requests:'Requests',calendar:'Calendar',analytics:'Analytics',earnings:'Earnings',reviews:'Reviews',settings:'Settings'}[path[1]]||'Dashboard')) : ({about:'About',login:'login',register:'register',forgot:'forgot'}[path[0]]||'landing'); });
  const [activeRequest, setActiveRequest] = useState('All');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [notice, setNotice] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [month, setMonth] = useState(9);
  const [machinesState, setMachinesState] = useState(() => readStoredArray('hadalink-machines', machines));
  const [requestsState, setRequestsState] = useState(() => readStoredArray('hadalink-requests', requests));
  const [editingMachine, setEditingMachine] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [signupRole, setSignupRole] = useState(() => localStorage.getItem('hadalink-role') === 'Provider' ? 'Provider' : 'Farmer');
  const [theme, setTheme] = useState(() => localStorage.getItem('hadalink-theme') || 'dark');
  const isFarmer = signupRole === 'Farmer';
  const quickNavItems = mobileQuickNav;
  const toggleTheme = () => setTheme(value => value === 'dark' ? 'light' : 'dark');
  const publicPages = ['landing', 'About', 'login', 'register', 'forgot'];
  React.useEffect(() => {
    if (publicPages.includes(page)) return undefined;
    let active = true;
    fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
      .then(response => {
        if (!response.ok) throw new Error('Not signed in');
        return response.json();
      })
      .then(({ data }) => {
        if (!active || !data?.user) return;
        setCurrentUser(data.user);
        if (localStorage.getItem('hadalink-phone-reminder-pending') === '1') {
          localStorage.removeItem('hadalink-phone-reminder-pending');
          setNotificationsOpen(true);
        }
        const role = data.user.role === 'provider' ? 'Provider' : 'Farmer';
        localStorage.setItem('hadalink-role', role);
        setSignupRole(role);
      })
      .catch(() => {
        if (!active) return;
        history.replaceState({ page: 'login' }, '', '/login');
        setPage('login');
      });
    return () => { active = false; };
  }, [page]);
  React.useEffect(() => { localStorage.setItem('hadalink-machines', JSON.stringify(machinesState)); }, [machinesState]);
  React.useEffect(() => { localStorage.setItem('hadalink-requests', JSON.stringify(requestsState)); }, [requestsState]);
  React.useEffect(() => {
    const providerPages = ['My Machinery','Add Machinery','Edit Machinery','Calendar','Earnings','Reviews'];
    if (signupRole === 'Farmer' && providerPages.includes(page)) {
      history.replaceState({page:'Dashboard'},'','/app/dashboard');
      setPage('Dashboard');
    }
  }, [page, signupRole]);
  React.useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('hadalink-theme', theme); }, [theme]);
  function go(p, payload) { if (p === 'Edit Machinery') setEditingMachine(payload || machinesState[0]); if (['Farmer', 'Provider'].includes(payload)) { setSignupRole(payload); localStorage.setItem('hadalink-role', payload); } setPage(p); setNotice(''); setMobileNav(false); setMobileMoreOpen(false); const route=p==='landing'?'/':p==='About'?'/about':p==='login'?'/login':p==='register'?'/register':p==='forgot'?'/forgot-password':`/app/${({'Dashboard':'dashboard','My Machinery':'machinery','Add Machinery':'add','Edit Machinery':'machinery/edit','Requests':'requests','Calendar':'calendar','Analytics':'analytics','Earnings':'earnings','Reviews':'reviews','Settings':'settings'}[p]||'dashboard')}`; history.pushState({page:p},'',route); window.scrollTo(0,0); }
  React.useEffect(()=>{const f=()=>{const p=location.pathname.split('/').filter(Boolean);setPage(p[0]==='app'?(p[1]==='machinery'&&p[2]==='edit'?'Edit Machinery':({machinery:'My Machinery',add:'Add Machinery',requests:'Requests',calendar:'Calendar',analytics:'Analytics',earnings:'Earnings',reviews:'Reviews',settings:'Settings'}[p[1]]||'Dashboard')):({about:'About',login:'login',register:'register',forgot:'forgot'}[p[0]]||'landing'))};window.addEventListener('popstate',f);return()=>window.removeEventListener('popstate',f)},[]);
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
  async function logout() {
    try { await authRequest('/auth/logout', {}); } catch { /* The local route still exits if the session has expired. */ }
    setCurrentUser(null);
    go('login');
  }
  const accountName = currentUser?.name?.trim() || (isFarmer ? 'Farmer account' : 'Provider account');
  const accountInitials = accountName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const accountAvatar = currentUser?.profile?.avatarUrl;
  const userLink=(p,label)=> <button className="text-link" onClick={()=>go(p)}>{label}</button>;
  React.useEffect(() => {
    if (!notificationsOpen) return undefined;
    const closeOnEscape = event => { if (event.key === 'Escape') setNotificationsOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [notificationsOpen]);
  if (['login','register','forgot'].includes(page)) return <AuthPage page={page} go={go} initialRole={signupRole} theme={theme} toggleTheme={toggleTheme}/>;
  if(page==='landing') return <Landing go={go} theme={theme} toggleTheme={toggleTheme}/>
  if(page==='About') return <AboutPage go={go} theme={theme} toggleTheme={toggleTheme}/>
  const current = isFarmer && page === 'Dashboard' ? 'Find machinery for your farm' : titles[page] || titles.Dashboard;
  return <div className="portal"><aside className={`sidebar ${mobileNav?'sidebar-open':''}`}><button className="brand" onClick={()=>go('Dashboard')}><span className="brand-icon"><img src="/hadalink-mark.png" alt="" /></span><span className="brand-text">Hada<span>Link</span><small>AGRI-RENTALS</small></span></button><span className="sidebar-caption">{isFarmer ? 'FARMER WORKSPACE' : 'PROVIDER WORKSPACE'}</span><nav className="side-nav">{(isFarmer ? navItems.slice(0, 1) : navItems).map(({id,icon:Icon})=><button key={id} onClick={()=>go(id)} className={`nav-item ${page===id?'active':''}`}><Icon size={17}/><span>{id==='Dashboard'?'Dashboard':id}</span>{id==='Requests'&&<span className="nav-count">3</span>}{id==='Add Machinery'&&<span className="nav-add"><Plus size={13}/></span>}</button>)}</nav><div className="sidebar-tools" aria-label="Quick settings"><button className="sidebar-tool" aria-label="Notifications" onClick={()=>setNotificationsOpen(true)}><Bell size={16}/><span>Notifications</span></button><button className="sidebar-tool" onClick={toggleTheme}><span className="sidebar-tool-icon">{theme==='dark'?<Sun size={16}/>:<Moon size={16}/>}</span><span>{theme==='dark'?'Light mode':'Dark mode'}</span></button></div><div className="side-help"><div className="help-icon"><CircleHelp size={17}/></div><strong>Need a hand?</strong><span>Our local team is here for you.</span></div><button className="logout" onClick={()=>setLogoutConfirmOpen(true)}><LogOut size={16}/> Log out</button></aside>{mobileNav&&<button aria-label="Close menu" className="mobile-backdrop" onClick={event=>closePopup(setMobileNav,event)}/>}     <div className="portal-main"><header className="topbar"><label className="global-search"><Search size={16}/><input aria-label="Search machinery and requests" placeholder="Search machinery or requests…" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label="Clear search" onClick={()=>setSearch('')}><X size={14}/></button>}</label><div className="notification-wrap"><button className="icon-button notification" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={()=>setNotificationsOpen(open => !open)}><Bell size={17}/><i/></button></div><button className="icon-button notification desktop-notification" aria-label="Notifications" onClick={()=>setNotificationsOpen(true)}><Bell size={16}/><i/></button><ThemeToggle theme={theme} onToggle={toggleTheme}/><div className={`account-menu ${accountMenuOpen?'open':''}`}><button className="account-trigger" aria-label={`Account menu for ${accountName}`} aria-expanded={accountMenuOpen} onClick={()=>setAccountMenuOpen(open=>!open)}><span className="account-name">{accountName}</span><span className="avatar-logo">{accountAvatar?<img src={accountAvatar} alt="" referrerPolicy="no-referrer"/>:<span className="avatar-initials">{accountInitials}</span>}</span><ChevronDown size={14}/></button>{accountMenuOpen&&<button className="account-modal-backdrop" aria-label="Dismiss account menu" onClick={event=>closePopup(setAccountMenuOpen,event)}><span className="account-dropdown" onClick={event=>event.stopPropagation()}><span className="account-dropdown-identity"><span className="avatar-logo">{accountAvatar?<img src={accountAvatar} alt="" referrerPolicy="no-referrer"/>:<span className="avatar-initials">{accountInitials}</span>}</span><span><strong>{accountName}</strong><small>{currentUser?.email || ''}</small></span></span><span className="account-theme-toggle" onClick={()=>toggleTheme()}>{theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}Switch to {theme==='dark'?'light':'dark'} mode</span><span role="button" tabIndex={0} onClick={()=>{setAccountMenuOpen(false);logout()}}><LogOut size={15}/>Log out</span></span></button>}</div></header>
    <div className="mobile-quick-nav" aria-label="Quick navigation">{quickNavItems.map(({id,icon:Icon})=><button key={id} className={`mobile-quick-nav-item ${page===id?'active':''}`} onClick={()=>go(id)}><Icon size={16}/><span>{id}</span></button>)}</div>{!isFarmer&&mobileMoreOpen&&<><button className="floating-more-backdrop" aria-label="Close more navigation" onClick={event=>closePopup(setMobileMoreOpen,event)}/><nav className="floating-more-menu" aria-label="More provider pages">{providerMoreNav.map(({id,icon:Icon})=><button key={id} className={page===id?'active':''} onClick={()=>go(id)}><Icon size={16}/><span>{id}</span></button>)}</nav></>}<nav className={`floating-nav ${!isFarmer?'provider-floating-nav':''}`} aria-label="Main navigation">{(isFarmer?mobileQuickNav:providerQuickNav).map(({id,icon:Icon})=><button key={id} aria-label={id} title={id} className={`floating-nav-item ${page===id?'active':''}`} onClick={()=>go(id)}><Icon size={18}/><span>{id==='My Machinery'?'Machines':id}</span></button>)}{!isFarmer&&<button aria-label="More navigation" title="More" className={`floating-nav-item floating-more-trigger ${mobileMoreOpen||providerMoreNav.some(item=>item.id===page)?'active':''}`} aria-expanded={mobileMoreOpen} onClick={()=>setMobileMoreOpen(open=>!open)}><Menu size={18}/><span>More</span></button>}</nav>
    <main className="workspace"><div className="page-heading"><div><div className="eyebrow">{isFarmer ? 'FARMER WORKSPACE · PLATEAU STATE' : <><span/> {page==='Dashboard'?'PLATEAU CENTRAL HUB · JOS':page==='Add Machinery'?'LISTING MANAGEMENT · MUSA IBRAHIM':page==='Settings'?'PROVIDER ADMINISTRATION · ID: HDL-8821-JS':`PROVIDER WORKSPACE · PLATEAU STATE`}</>}</div><h1>{current}</h1><p>{isFarmer && page === 'Dashboard' ? 'Browse equipment listed by local providers and choose what your farm needs.' : ({Dashboard:'Here’s an overview of your machinery and farm bookings.', 'My Machinery':'Manage, update, and track equipment across Plateau State.', 'Add Machinery':'List equipment and mechanization services for farmers to discover and request.',Requests:'Review rental requests and coordinate your next dispatch.',Calendar:'See your bookings, machinery availability, and field schedule.',Earnings:'Review completed bookings and indicative commission records.',Reviews:'Review feedback linked to completed bookings.',Settings:'Manage your profile, operating areas, and settlement preferences.',Analytics:'Understand fleet activity and rental growth separately from payouts.','Edit Machinery':'Update the details for this equipment listing.'}[page])}</p></div><div className="heading-actions">{!isFarmer&&page==='Dashboard'&&<span className="available-pill"><span/> Fleet online</span>}{!isFarmer&&page==='My Machinery'&&<span className="available-pill"><span/> 4 machines online</span>}{!isFarmer&&page==='My Machinery'&&<button className="button button-primary" onClick={()=>go('Add Machinery')}><Plus size={15}/> Add machinery</button>}{!isFarmer&&page==='Dashboard'&&<button className="button button-primary" onClick={()=>go('Add Machinery')}><Plus size={15}/> Add machinery</button>}{!isFarmer&&page==='Add Machinery'&&<button className="button button-ghost" onClick={()=>go('My Machinery')}><ArrowLeft size={15}/> Back to My Machinery</button>}{!isFarmer&&page==='Earnings'&&<button className="button button-ghost" onClick={()=>flash('Your statement is ready to download.')}><Download size={15}/> Download statement</button>}</div></div>
    {notice&&<div className="toast"><CheckCircle2 size={17}/>{notice}<button aria-label="Dismiss" onClick={()=>setNotice('')}><X size={15}/></button></div>}
    {notificationsOpen&&createPortal(<div className="notification-backdrop" role="presentation" onClick={event=>closePopup(setNotificationsOpen,event)}><section className="notification-popup" role="dialog" aria-modal="true" aria-labelledby="notification-title" onClick={event=>event.stopPropagation()}><header><strong id="notification-title">Notifications</strong><button type="button" aria-label="Close notifications" onClick={event=>closePopup(setNotificationsOpen,event)}><X size={17}/></button></header>{currentUser?.profile?.phoneVerified!==true&&<><span className="notification-empty-icon"><ShieldCheck size={20}/></span><p>Phone number not verified</p><small>{currentUser?.profile?.phone ? 'Your phone number still needs verification.' : 'No phone number has been added yet. Add and verify one in your profile settings.'}</small></>}{currentUser?.profile?.phoneVerified===true&&<><span className="notification-empty-icon"><Bell size={20}/></span><p>You’re all caught up.</p><small>New booking updates will appear here.</small></>}</section></div>,document.body)}
    {logoutConfirmOpen&&createPortal(<div className="logout-confirm-backdrop" role="presentation" onClick={event=>closePopup(setLogoutConfirmOpen,event)}><section className="logout-confirm" role="alertdialog" aria-modal="true" aria-labelledby="logout-confirm-title" onClick={event=>event.stopPropagation()}><header><span className="logout-confirm-icon"><LogOut size={18}/></span><button aria-label="Close logout confirmation" onClick={event=>closePopup(setLogoutConfirmOpen,event)}><X size={17}/></button></header><h2 id="logout-confirm-title">Are you sure you want to log out?</h2><p>You’ll need to sign in again to access your workspace.</p><div className="logout-confirm-actions"><button className="button button-ghost" onClick={event=>closePopup(setLogoutConfirmOpen,event)}>Cancel</button><button className="logout-confirm-action" onClick={event=>closePopup(setLogoutConfirmOpen,event,()=>logout())}>Yes, I’m sure, log out</button></div></section></div>,document.body)}
    {page==='Dashboard'&&(isFarmer ? <FarmerDashboard machinesState={machinesState} requestsState={requestsState} setRequestsState={setRequestsState}/> : <Dashboard go={go} machinesState={machinesState} requestsState={requestsState} flash={flash}/ >)}
    {page==='My Machinery'&&<Machinery machinesState={machinesState} setMachinesState={setMachinesState} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} go={go} flash={flash}/>}
    {page==='Add Machinery'&&<AddMachine flash={flash} go={go} setMachinesState={setMachinesState}/>}{page==='Edit Machinery'&&<EditMachine machine={editingMachine||machinesState[0]} setMachinesState={setMachinesState} go={go} flash={flash}/>}
    {page==='Requests'&&<Requests requestsState={requestsState} setRequestsState={setRequestsState} activeRequest={activeRequest} setActiveRequest={setActiveRequest} search={search} flash={flash}/>}
    {page==='Calendar'&&<CalendarPage month={month} setMonth={setMonth} flash={flash}/>}
    {page==='Analytics'&&<Analytics machinesState={machinesState} requestsState={requestsState}/>}{page==='Earnings'&&<Earnings requestsState={requestsState}/>}
    {page==='Reviews'&&<Reviews requestsState={requestsState} flash={flash}/>}
    {page==='Settings'&&<SettingsPage flash={flash} currentUser={currentUser}/>}
    <footer className="workspace-footer"><span>© 2026 HadaLink · Supporting Plateau State agriculture</span><span><ShieldCheck size={13}/> Bookings coordinated locally <span className="footer-dot">·</span> Jos, Nigeria</span></footer></main></div></div>;
}

function ThemeToggle({ theme, onToggle }) { return <button type="button" className="theme-toggle" onClick={onToggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}<span>{theme === 'dark' ? 'Light' : 'Dark'}</span></button> }

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
        <img className="hero-image" src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2200&q=85" alt="A farmer walking through a field at sunset" />
        <div className="hero-overlay" />
        <div className="hero-content"><span className="hero-badge"><span /> EQUIPMENT LISTINGS · PLATEAU STATE</span><h1><span className="hero-title-line">The right machine.</span><span className="hero-title-line">Right when <span className="hero-title-accent">you need it.</span></span></h1><p>Find and compare provider-listed equipment around Jos. Send a request with your date, location and service; the provider confirms availability and final terms.</p><div className="hero-actions"><button className="button button-harvest button-large" onClick={() => go('register', 'Farmer')}>Find machinery <ArrowRight size={18} /></button><button className="button button-glass button-large" onClick={() => go('register', 'Provider')}><Tractor size={17} /> List your equipment</button></div><div className="hero-proof"><div className="proof-avatars"><span>MU</span><span>DG</span><span>BP</span><span>+</span></div><span><strong>Built for farmers in Plateau.</strong><br />Connecting local farms, one booking at a time.</span></div></div>
        <div className="hero-side-note"><ShieldCheck size={15} /><span>Local providers. Clear listing details.<br /><strong>Made for your field.</strong></span></div><a href="#how" className="scroll-indicator">SCROLL TO EXPLORE <ArrowDown size={13} /></a>
      </section>
      <section className="stats-strip"><div><strong>Plateau</strong><span>Our home and our first hub</span></div><div><strong>Local listings</strong><span>Equipment offered by providers</span></div><div><strong>Direct</strong><span>Talk to the people working your field</span></div><div><strong>On demand</strong><span>Tools for the season ahead</span></div></section>
      <section className="landing-section how-section" id="how"><div className="section-heading"><div><span className="eyebrow"><span /> SIMPLE FROM THE FIRST STEP</span><h2>Good farming starts<br />with the <span>right tools.</span></h2></div><p>Growing your farm shouldn’t mean spending more on machines you only need for a season. Find what’s nearby and arrange the work directly.</p></div><div className="how-grid"><article className="how-card"><span className="how-num">01</span><div className="how-icon"><Search size={20} /></div><h3>Find the right machine</h3><p>Browse farm equipment near you, with clear pricing and local details.</p></article><article className="how-card"><span className="how-num">02</span><div className="how-icon"><MessageCircle size={20} /></div><h3>Talk to a local owner</h3><p>Ask about dates, operators, and the right machine for your land.</p></article><article className="how-card"><span className="how-num">03</span><div className="how-icon"><Sprout size={20} /></div><h3>Get out in your field</h3><p>Agree the details and get farming when the timing matters.</p></article></div></section>
      <section className="landing-section userflow-section"><div className="section-heading"><div><span className="eyebrow"><span /> TWO SIMPLE WAYS TO GET STARTED</span><h2>Choose your path.</h2></div><p>Farmers find equipment for a job. Providers share machinery and manage incoming requests.</p></div><div className="userflow-grid"><article className="userflow-card"><span className="userflow-label">FOR FARMERS</span><h3>Find equipment for your farm</h3><div className="userflow-steps"><span>Browse</span><ArrowRight size={14}/><span>Compare</span><ArrowRight size={14}/><span>Contact owner</span><ArrowRight size={14}/><span>Book</span></div><button className="button button-harvest" onClick={() => go('register', 'Farmer')}>Find machinery <ArrowRight size={14}/></button></article><article className="userflow-card"><span className="userflow-label">FOR PROVIDERS</span><h3>Put your equipment to work</h3><div className="userflow-steps"><span>Register</span><ArrowRight size={14}/><span>List machine</span><ArrowRight size={14}/><span>Review requests</span><ArrowRight size={14}/><span>Track jobs</span></div><button className="button button-primary" onClick={() => go('register', 'Provider')}>List equipment <ArrowRight size={14}/></button></article></div></section>
      <section id="equipment" className="landing-equipment"><div className="section-heading"><div><span className="eyebrow"><span /> EQUIPMENT THAT GETS THE JOB DONE</span><h2>Ready for the <span>next season.</span></h2></div><button className="button button-ghost" onClick={() => go('register')}>Browse all equipment <ArrowRight size={15} /></button></div><div className="equipment-marquee" aria-label="Available farm equipment"><div className="equipment-marquee-track">{[0, 1].map(copy => <div className="equipment-marquee-group" key={copy} aria-hidden={copy === 1}>{equipment.map((m) => <article className="landing-machine" key={`${copy}-${m.name}`}><div className="landing-machine-photo"><img src={`https://images.unsplash.com/${m.image}?auto=format&fit=crop&w=700&q=80`} alt={copy === 0 ? m.name : undefined} loading="lazy" /><span className="machine-availability"><span /> {m.status}</span></div><div className="landing-machine-info"><span>{m.kind} <span>· {m.area}</span></span><h3>{m.name}</h3><strong>₦{m.rate}<small> / hectare</small></strong></div></article>)}</div>)}</div></div><div className="equipment-marquee-footer"><span>Showing <strong>{equipment.length} types of equipment</strong> for Plateau farmers</span><span><i /> Pause the motion by hovering over the cards</span></div></section>
      <section className="landing-section coverage-section" id="coverage"><div className="coverage-copy"><span className="eyebrow"><span /> ROOTED IN THE PLATEAU COMMUNITY</span><h2>Local equipment.<br /><span>Closer to your farm.</span></h2><p>Explore machinery from providers serving Jos and surrounding farming communities. Availability and delivery areas vary by listing, so confirm the details directly with each owner.</p><button className="button button-ghost" onClick={() => go('register')}>Explore local listings <ArrowRight size={15} /></button></div><div className="coverage-areas"><h3>Explore our first service areas</h3>{['Jos South', 'Barkin Ladi', 'Mangu', 'Riyom', 'Jos North'].map((area) => <span key={area}><MapPin size={15} />{area}<ArrowRight size={13} /></span>)}</div></section>
      <section className="landing-section stories-section" id="stories"><div className="section-heading"><div><span className="eyebrow"><span /> BUILT AROUND LOCAL NEEDS</span><h2>Good tools make<br />hard work easier.</h2></div><p>HadaLink helps farmers and equipment owners connect around the practical details of getting work done.</p></div><div className="stories-grid">{benefits.map((benefit, index) => <article className="story-card" key={benefit.title}><span className="benefit-number">0{index + 1}</span><h3>{benefit.title}</h3><p>{benefit.text}</p></article>)}</div></section>
      <section className="landing-section faq-section" id="faq"><div className="section-heading"><div><span className="eyebrow"><span /> GOOD TO KNOW</span><h2>Questions from<br />the field.</h2></div><p>Every rental is arranged with the local equipment owner, so confirm pricing, availability, transport, and operator details before work begins.</p></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>
      <section id="join" className="landing-cta"><div className="cta-icon"><Leaf size={22} /></div><span className="eyebrow"><span /> GOOD THINGS GROW TOGETHER</span><h2>Your next season starts<br />with one <span>good connection.</span></h2><p>Compare nearby listings, or help farmers find your equipment and mechanization services.</p><button className="button button-harvest button-large" onClick={() => go('register')}>Get started with HadaLink <ArrowRight size={17} /></button></section>
    </main>
    <footer className="landing-footer"><div className="footer-main"><div className="footer-brand"><button className="brand" onClick={() => go('landing')}><span className="brand-icon"><img src="/hadalink-mark.png" alt="" /></span><span className="brand-text">Hada<span>Link</span><small>AGRI-RENTALS</small></span></button><p>Connecting Plateau farmers with the equipment and local providers that help work move forward.</p><span className="footer-location"><MapPin size={13} /> Plateau State, Nigeria</span></div><div className="footer-links"><strong>Explore</strong><a href="#how">How it works</a><a href="#equipment">Machinery</a><a href="#coverage">Service areas</a><a href="#stories">Farmer stories</a></div><div className="footer-links"><strong>Help & info</strong><a href="#faq">Frequently asked questions</a><button onClick={() => go('About')}>About HadaLink</button><button onClick={() => go('login')}>Provider portal</button></div><div className="footer-join"><strong>Join the local network</strong><p>Find equipment for your farm or share your machinery with local farmers.</p><button className="button button-primary" onClick={() => go('register')}>Get started <ArrowRight size={14} /></button></div></div><div className="footer-bottom"><span>© 2026 HadaLink · Supporting Plateau State agriculture</span><span><ShieldCheck size={13} /> Built around local connections</span></div></footer>
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
  const [stage, setStage] = useState('details');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const googleButtonRef = React.useRef(null);
  const googleCallbackRef = React.useRef(null);
  const register = page === 'register';
  const forgot = page === 'forgot';
  const verificationStage = register && stage === 'verify';
  const resetStage = forgot && stage === 'reset';
  const title = register ? verificationStage ? 'Check your email' : 'Create account' : forgot ? resetStage ? 'Choose a new password' : 'Reset password' : 'Welcome back';
  const description = register
    ? verificationStage ? `Enter the six-digit code we sent to ${email}.` : 'Join HadaLink to find or share farm equipment.'
    : forgot ? resetStage ? `Enter the code sent to ${email} and choose a new password.` : 'Enter your email and we’ll send a reset code.'
      : 'Log in to your account.';

  const completeSignIn = ({ newAccount = false } = {}) => {
    if (newAccount) localStorage.setItem('hadalink-phone-reminder-pending', '1');
    go('Dashboard', register ? role : initialRole);
  };

  async function submitAccount(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (register && !verificationStage) {
        if (password !== confirmPassword) throw new Error('Your passwords do not match.');
        await authRequest('/auth/register', { name, email, password, role: role.toLowerCase() });
        setStage('verify');
      } else if (verificationStage) {
        await authRequest('/auth/verify-email', { email, code });
        completeSignIn({ newAccount: true });
      } else if (forgot && !resetStage) {
        await authRequest('/auth/forgot-password', { email });
        setStage('reset');
      } else if (resetStage) {
        await authRequest('/auth/reset-password', { email, code, password });
        go('login');
      } else {
        await authRequest('/auth/login', { email, password });
        completeSignIn();
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
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
      const result = await authRequest('/auth/google', { credential, role: role.toLowerCase() });
      completeSignIn({ newAccount: result.data?.created === true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
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
      if (register) await authRequest('/auth/register', { name, email, password, role: role.toLowerCase() });
      else await authRequest('/auth/forgot-password', { email });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return <main className={`auth-layout ${register ? 'auth-register' : ''}`}><section className="auth-form-side"><header className="auth-header"><button className="auth-back" aria-label="Back to home" onClick={() => go('landing')}><ArrowLeft size={17} /></button><button className="brand" onClick={() => go('landing')}><span className="brand-icon"><img src="/hadalink-mark.png" alt="" /></span><span className="brand-text">Hada<span>Link</span><small>AGRI-RENTALS</small></span></button><ThemeToggle theme={theme} onToggle={toggleTheme}/></header><div className="auth-content"><h1>{title}</h1><p className="auth-description">{description}</p>{register && !verificationStage && <div className="role-picker">{['Farmer', 'Provider'].map((r) => <button key={r} type="button" className={`role-option ${role === r ? 'selected' : ''}`} aria-pressed={role === r} onClick={() => setRole(r)}><span className="role-icon">{r === 'Farmer' ? <Tractor size={17} /> : <Wrench size={17} />}</span><span><strong>{r}</strong></span>{role === r && <CheckCircle2 size={16} />}</button>)}</div>}<form className="auth-fields" onSubmit={submitAccount}>
    {register && !verificationStage && <Field icon={User} label="FULL NAME" placeholder="Enter your full name" value={name} onChange={event => setName(event.target.value)} required />}
    {(!verificationStage && !resetStage) && <Field icon={Mail} label="EMAIL ADDRESS" type="email" placeholder={page === 'login' ? 'you@example.com' : 'Enter your email'} value={email} onChange={event => setEmail(event.target.value)} required />}
    {(verificationStage || resetStage) && <Field icon={ShieldCheck} label="EMAIL CODE" inputMode="numeric" autoComplete="one-time-code" placeholder="Enter the 6-digit code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required />}
    {(!forgot && !verificationStage || resetStage) && <Field icon={LockKeyhole} label={resetStage ? 'NEW PASSWORD' : 'PASSWORD'} type={show ? 'text' : 'password'} placeholder={resetStage ? 'Choose a new password' : 'Enter your password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={8} trailing={!resetStage && <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(value => !value)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />}
    {register && !verificationStage && <Field icon={LockKeyhole} label="CONFIRM PASSWORD" type="password" placeholder="Confirm your password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required minLength={8} />}
    {page === 'login' && <div className="auth-options"><label className="remember"><input type="checkbox" /> Remember me</label><button type="button" className="text-link" onClick={() => { setStage('email'); setError(''); go('forgot'); }}>Forgot password?</button></div>}
    {error && <div className="auth-error" role="alert">{error}</div>}
    <button className={`button ${page === 'login' ? 'button-harvest' : 'button-auth'} auth-submit`} type="submit" disabled={busy}>{busy ? 'Please wait…' : verificationStage ? 'Verify email' : resetStage ? 'Update password' : forgot ? 'Send reset code' : register ? 'Create account' : 'Log in'} {!busy && <ArrowRight size={17} />}</button>
    {(verificationStage || resetStage) && <button type="button" className="text-link auth-resend" onClick={resendCode} disabled={busy}>{busy ? 'Sending…' : 'Send a new code'}</button>}
    {!forgot && !verificationStage && <><div className="auth-divider"><span />OR<span /></div><div className="social-row">{import.meta.env.VITE_GOOGLE_CLIENT_ID ? <div className="google-button-slot" ref={googleButtonRef} /> : <button className="google-fallback" type="button" onClick={() => setError('Google sign-in is not configured yet.')}><span className="google-mark">G</span> Continue with Google</button>}</div></>}
  </form>{forgot && <div className="reset-note"><ShieldCheck size={17} /><span>We’ll send a secure one-time code to the email associated with your account.</span></div>}</div><footer className="auth-footer">{register ? <>Have an account? <button className="text-link" onClick={() => go('login')}>Log in</button></> : forgot ? <>Remember your password? <button className="text-link" onClick={() => go('login')}>Log in</button></> : <>New to HadaLink? <button className="text-link" onClick={() => go('register')}>Create account <ArrowRight size={13} /></button></>}</footer></section><aside className="auth-image-side"><img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85" alt="Farmland in Plateau State" /><div className="auth-image-overlay" /><article className="auth-quote"><Leaf size={19} /><h2>“The right machine, right when you need it.”</h2><p>Reliable tractors and farm equipment, connected locally.</p></article></aside></main>;
}
function Field({ icon: Icon, label, trailing, ...props }) { return <label className="field"><span className="field-label">{label}</span><span className="field-control"><Icon size={17} /><input {...props} />{trailing}</span></label> }

function Metric({ label, value, detail, icon: Icon, tone = 'green' }) { return <article className={`metric-card metric-${tone}`}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={18} /></span></div><strong>{value}</strong><span className="metric-detail">{detail}</span></article> }
function PanelHead({ title, subtitle, action, children }) { return <div className="panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action || children}</div> }

function Dashboard({ go, machinesState, requestsState, flash }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const chart = getWeekData(weekOffset);
  const totalBookings = chart.reduce((sum, day) => sum + day.jobs, 0);
  const busiestDay = Math.max(...chart.map(day => day.jobs));
  const completedRequests = requestsState.filter(request => request.status === 'Completed');
  const ratings = completedRequests.filter(request => request.rating).map(request => request.rating);
  const averageRating = ratings.length ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : '—';
  return <div className="view-stack">
    <section className="metric-grid">
      <Metric label="NEW REQUESTS" value={String(requestsState.filter(request => request.status === 'Pending').length)} detail={<><MessageCircle size={13}/> Awaiting your response</>} icon={MessageCircle}/>
      <Metric label="ACTIVE LISTINGS" value={String(machinesState.filter(machine => machine.status === 'Available').length)} detail={<><CheckCircle2 size={13}/> Available to request</>} icon={Tractor} tone="orange"/>
      <Metric label="COMPLETED JOBS" value={String(completedRequests.length)} detail={<><CheckCircle2 size={13}/> Transaction records</>} icon={CheckCircle2} tone="blue"/>
      <Metric label="COMMISSION MODEL" value="5%" detail={<><Wallet size={13}/> Proposed · not collected here</>} icon={Wallet} tone="orange"/>
    </section>
    <div className="analytics-week-bar"><WeekNavigator weekOffset={weekOffset} setWeekOffset={setWeekOffset}/></div>
    <div className="dashboard-grid">
      <section className="panel chart-panel">
        <PanelHead title="Booking activity" subtitle={`Illustrative demo snapshot · ${getWeekRange(weekOffset)}`}/>
        <div className="chart-holder"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart} margin={{top:10,right:7,left:-28,bottom:0}}>
          <defs><linearGradient id="bookingWeekGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#19cb87" stopOpacity={.24}/><stop offset="100%" stopColor="#19cb87" stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid stroke="rgba(164,194,172,.075)" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#798e80',fontSize:11}} dy={8}/><Tooltip contentStyle={{background:'#10281d',border:'1px solid #254333',borderRadius:10,fontSize:12}}/><Area type="monotone" dataKey="jobs" stroke="#24d18c" fill="url(#bookingWeekGradient)" strokeWidth={2} name="Booking requests"/>
        </AreaChart></ResponsiveContainer></div>
        <div className="booking-week-summary"><span>{totalBookings} booking requests in this week</span><span>{busiestDay} on the busiest day</span></div>
      </section>
      <section className="panel rating-panel"><PanelHead title="Farmer ratings" subtitle="Ratings left after completed bookings."/><div className="rating-ring"><div><strong>{averageRating}</strong><span>{ratings.length ? 'OUT OF 5' : 'NO REVIEWS YET'}</span></div></div><div className="rating-footer"><span><Star size={14} fill="currentColor"/> {ratings.length ? `${ratings.length} recorded reviews` : 'Complete a booking to collect feedback'}</span><strong>{completedRequests.length} completed jobs</strong></div></section>
    </div>
    <section className="panel weekly-panel"><PanelHead title={`Machinery hired · ${getWeekRange(weekOffset)}`} subtitle="Illustrative demo booking snapshot." action={<span className="stat-inline">{totalBookings}<small>bookings this week</small></span>}/><div className="weekly-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{top:9,right:8,left:-28,bottom:0}}><CartesianGrid stroke="rgba(164,194,172,.075)" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#798e80',fontSize:11}} dy={8}/><Tooltip contentStyle={{background:'#10281d',border:'1px solid #254333',borderRadius:10,fontSize:12}}/><Bar dataKey="jobs" name="Bookings" radius={[5,5,0,0]} maxBarSize={34}>{chart.map((day,index)=><Cell key={day.day} fill={day.jobs===busiestDay?'#f2aa32':'#13ae77'}/>)}</Bar></BarChart></ResponsiveContainer></div></section>
    <section className="quick-glance"><PanelHead title="Your machinery" subtitle="Manage the equipment listed in your local fleet." action={<button className="button button-ghost button-small" onClick={()=>go('My Machinery')}>View all <ArrowRight size={13}/></button>}/><div className="glance-grid">{machinesState.slice(0,3).map(machine=><MachineCard key={machine.name} machine={machine} compact onClick={()=>go('My Machinery')}/>)}</div></section>
    <section className="panel table-panel"><PanelHead title="Recent requests" subtitle="The latest bookings from farmers near you." action={<button className="button button-ghost button-small" onClick={()=>go('Requests')}>All requests <ArrowRight size={13}/></button>}/><RequestTable requestsState={requestsState.slice(0,4)} compactMobile/></section>
  </div>;
}
function FarmerDashboard({ machinesState, requestsState, setRequestsState }) {
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
  const farmerRequests = requestsState.filter(request => request.farmer === 'Farm account');
  const categories = ['All equipment', ...new Set(availableMachines.map(machine => machine.kind))];
  const visibleMachines = availableMachines.filter(machine => (category === 'All equipment' || machine.kind === category) && `${machine.area} ${machine.name}`.toLowerCase().includes(areaSearch.toLowerCase()));
  const rate = selectedMachine ? Number(selectedMachine.rate.replace(/,/g,'')) : 0;
  const hectares = Number(form.hectares) || 0;
  const estimate = rate * hectares;
  const operatorAvailable = selectedMachine?.operatorAvailable !== false;
  function updateForm(event) { setForm(previous => ({...previous,[event.target.name]:event.target.value})); }
  function submitBooking(event) {
    event.preventDefault();
    if (!selectedMachine) return;
    if (form.operator === 'without' && !event.currentTarget.elements.qualifiedOperator.checked) {
      setMessage('Confirm that you have a qualified operator before requesting equipment-only access.');
      return;
    }
    const id = `HL-${String(Date.now()).slice(-6)}`;
    const date = new Date(`${form.date}T12:00:00`).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
    setRequestsState(previous => [{id,farmer:'Farm account',place:form.place,service:form.service,machine:selectedMachine.name,hectares:`${form.hectares} ha`,amount:`₦${estimate.toLocaleString('en-NG')}`,date,status:'Pending',operator:form.operator === 'with' ? 'Equipment + operator' : 'Equipment only',paymentStatus:'To be agreed directly'},...previous]);
    setMessage(`Request ${id} sent to ${selectedMachine.provider || 'the provider'}. It is pending confirmation; no payment was collected.`);
    setSelectedMachine(null);
    setForm(previous => ({...previous,date:'',place:'',hectares:'',service:previous.service,operator:'with'}));
  }
  function submitReview(event, requestId) {
    event.preventDefault();
    setRequestsState(previous => previous.map(request => request.id === requestId ? {...request,rating:Number(review.rating),review:review.text.trim()} : request));
    setReviewing('');
    setReview({rating:'5',text:''});
  }
  return <div className="view-stack">
    <section className="farmer-intro panel"><div><span className="eyebrow">DISCOVER · COMPARE · REQUEST</span><h2>Find the right equipment for your farm</h2><p>Compare local listings, confirm the terms, then send a request for your preferred date and field location. Providers confirm availability and final terms.</p></div><div className="farmer-intro-note"><ShieldCheck size={17}/><span>Availability and terms are confirmed with each provider. No payment is collected in this demo.</span></div></section>
    {message && <div className="toast" role="status">{message}<button aria-label="Dismiss message" onClick={()=>setMessage('')}><X size={15}/></button></div>}
    <section className="panel farmer-listings"><PanelHead title="Equipment and services near you" subtitle={`${visibleMachines.length} available listings · compare provider, location, rate and operator options.`}/><div className="farmer-filter-rail"><button className="farmer-filter-trigger" onClick={()=>setFiltersOpen(true)}><Filter size={15}/><span>Filter listings</span>{(category!=='All equipment'||areaSearch)&&<i/>}<ChevronDown size={15}/></button></div>{filtersOpen&&createPortal(<div className="farmer-filter-backdrop" role="presentation" onClick={event=>closePopup(setFiltersOpen,event)}><section className="farmer-filter-popup" role="dialog" aria-modal="true" aria-labelledby="farmer-filter-title" onClick={event=>event.stopPropagation()}><header><div><span>REFINE RESULTS</span><h2 id="farmer-filter-title">Find your equipment</h2></div><button type="button" aria-label="Close filters" onClick={event=>closePopup(setFiltersOpen,event)}><X size={18}/></button></header><div className="farmer-filter-fields"><label className="field"><span className="field-label">EQUIPMENT TYPE</span><span className="field-control"><Filter size={15}/><select aria-label="Filter by equipment type" value={category} onChange={event=>setCategory(event.target.value)}>{categories.map(item=><option key={item}>{item}</option>)}</select></span></label><label className="field"><span className="field-label">AREA OR MACHINE</span><span className="field-control"><Search size={15}/><input aria-label="Search area or equipment" value={areaSearch} onChange={event=>setAreaSearch(event.target.value)} placeholder="Search Plateau State"/></span></label></div><footer><button type="button" className="button button-ghost" onClick={()=>{setCategory('All equipment');setAreaSearch('')}}>Clear all</button><button type="button" className="button button-primary" onClick={event=>closePopup(setFiltersOpen,event)}>Show {visibleMachines.length} results</button></footer></section></div>,document.body)}
      <div className="farmer-machine-grid">{visibleMachines.map(machine=><article className="farmer-machine-card" key={machine.name} role="button" tabIndex={0} aria-label={`View details for ${machine.name}`} onClick={()=>setDetailMachine(machine)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setDetailMachine(machine)}}}>
        <img src={`https://images.unsplash.com/${machine.image}?auto=format&fit=crop&w=750&q=80`} alt={machine.name} loading="lazy"/>
        <div className="farmer-machine-copy"><span>{machine.kind} · {machine.area}</span><h3>{machine.name}</h3><strong>₦{machine.rate}<small> / hectare</small></strong><p>Provider: {machine.provider || 'Local equipment provider'}</p><p>{machine.operatorAvailable === false ? 'Equipment only · bring a qualified operator' : 'Ask about operator availability and service terms'}</p><p>{machine.terms || 'Confirm transport, fuel, timing and machine condition with the provider.'}</p><div className="farmer-listing-actions"><span className="button button-ghost button-small">View details <ArrowRight size={13}/></span></div></div>
      </article>)}</div>
      {visibleMachines.length===0 && <div className="empty-state"><Search size={20}/><strong>No matching listings</strong><span>Try a different equipment type or area.</span></div>}
    </section>
    {detailMachine&&createPortal(<div className="farmer-detail-backdrop" role="presentation" onClick={()=>setDetailMachine(null)}><section className="farmer-detail-popup" role="dialog" aria-modal="true" aria-labelledby="farmer-detail-title" onClick={event=>event.stopPropagation()}><header><span>LISTING DETAILS</span><button aria-label="Close listing details" onClick={()=>setDetailMachine(null)}><X size={17}/></button></header><img className="farmer-detail-image" src={`https://images.unsplash.com/${detailMachine.image}?auto=format&fit=crop&w=1000&q=85`} alt={detailMachine.name}/><div className="farmer-detail-content"><span className="farmer-detail-kicker">{detailMachine.kind} · {detailMachine.area}</span><h2 id="farmer-detail-title">{detailMachine.name}</h2><strong className="farmer-detail-rate">₦{detailMachine.rate}<small> / hectare</small></strong><dl><div><dt>Provider</dt><dd>{detailMachine.provider||'Local equipment provider'}</dd></div><div><dt>Operator</dt><dd>{detailMachine.operatorAvailable===false?'Equipment only; bring a qualified operator':'Availability to be confirmed with provider'}</dd></div><div><dt>Services</dt><dd>{detailMachine.services?.length?detailMachine.services.join(', '):'Confirm available services with provider'}</dd></div><div><dt>Terms</dt><dd>{detailMachine.terms||'Confirm transport, fuel, timing and machine condition with the provider.'}</dd></div></dl><div className="farmer-detail-actions"><button className="button button-ghost" onClick={()=>{setCompareMachines(previous=>{const next=previous.some(item=>item.name===detailMachine.name)?previous:[...previous,detailMachine].slice(-2);if(next.length===2)setCompareOpen(true);return next})}}><SlidersHorizontal size={15}/>{compareMachines.some(item=>item.name===detailMachine.name)?'Added to compare':'Compare'}</button><button className="button button-primary" onClick={()=>{setSelectedMachine(detailMachine);setForm(previous=>({...previous,service:detailMachine.services?.[0]||previous.service,operator:detailMachine.operatorAvailable===false?'without':'with'}));setDetailMachine(null)}}><MessageCircle size={15}/> Request</button></div>{compareMachines.length===1&&<small className="farmer-compare-hint">Choose another listing and compare it side by side.</small>}</div></section></div>,document.body)}
    {compareOpen&&compareMachines.length===2&&createPortal(<div className="farmer-detail-backdrop" role="presentation" onClick={event=>closePopup(setCompareOpen,event)}><section className="farmer-compare-popup" role="dialog" aria-modal="true" aria-labelledby="farmer-compare-title" onClick={event=>event.stopPropagation()}><header><div><span>SIDE-BY-SIDE</span><h2 id="farmer-compare-title">Compare listings</h2></div><button aria-label="Close comparison" onClick={event=>closePopup(setCompareOpen,event)}><X size={17}/></button></header><div className="farmer-compare-grid">{compareMachines.map(machine=><article key={machine.name}><img src={`https://images.unsplash.com/${machine.image}?auto=format&fit=crop&w=600&q=75`} alt=""/><h3>{machine.name}</h3><strong>₦{machine.rate}<small> / hectare</small></strong><p>{machine.kind} · {machine.area}</p><p>{machine.services?.length?machine.services.join(', '):'Services to confirm'}</p><button className="button button-primary" onClick={()=>{setSelectedMachine(machine);setForm(previous=>({...previous,service:machine.services?.[0]||previous.service,operator:machine.operatorAvailable===false?'without':'with'}));setCompareOpen(false)}}>Request this equipment</button></article>)}</div><footer><button className="button button-ghost" onClick={()=>{setCompareMachines([]);setCompareOpen(false)}}>Clear comparison</button></footer></section></div>,document.body)}
    {selectedMachine && <section className="panel farmer-booking-panel"><PanelHead title="Send a booking request" subtitle={`${selectedMachine.name} · ${selectedMachine.area}`} action={<button className="icon-button" aria-label="Close booking form" onClick={()=>setSelectedMachine(null)}><X size={15}/></button>}/><div className="farmer-terms-note"><strong>Before you request:</strong> confirm availability, transport, fuel, machine condition and final terms directly with the provider. This request is not a confirmed booking.</div><form className="farmer-booking-form" onSubmit={submitBooking}>
      <label className="field"><span className="field-label">SERVICE NEEDED</span><span className="field-control"><Tractor size={15}/><select name="service" value={form.service} onChange={updateForm}>{(selectedMachine.services?.length ? selectedMachine.services : ['Ploughing','Harrowing','Planting','Harvesting','Spraying','Land preparation','Other']).map(service=><option key={service}>{service}</option>)}</select></span></label>
      <label className="field"><span className="field-label">PREFERRED DATE</span><span className="field-control"><CalendarDays size={15}/><input required type="date" name="date" min={new Date().toISOString().slice(0,10)} value={form.date} onChange={updateForm}/></span></label>
      <label className="field"><span className="field-label">FARM / FIELD LOCATION</span><span className="field-control"><MapPin size={15}/><input required name="place" value={form.place} onChange={updateForm} placeholder="Village, LGA, Plateau State"/></span></label>
      <label className="field"><span className="field-label">FARM SIZE (HECTARES)</span><span className="field-control"><Gauge size={15}/><input required min="0.1" step="0.1" type="number" name="hectares" value={form.hectares} onChange={updateForm} placeholder="e.g. 5"/></span></label>
      <label className="field"><span className="field-label">OPERATOR ARRANGEMENT</span><span className="field-control"><Users size={15}/><select name="operator" value={form.operator} onChange={updateForm}><option value="with" disabled={!operatorAvailable}>Equipment + provider operator{!operatorAvailable?' (not listed)':''}</option><option value="without">Equipment only</option></select></span></label>
      {form.operator==='without' && <label className="farmer-operator-confirm"><input type="checkbox" name="qualifiedOperator" required/> I have a qualified operator for this equipment.</label>}
      {estimate>0 && <div className="farmer-estimate"><span>Illustrative rental estimate</span><strong>₦{estimate.toLocaleString('en-NG')}</strong><small>Proposed 5% platform commission: ₦{Math.round(estimate*.05).toLocaleString('en-NG')} · indicative only, no fee is collected in this demo.</small></div>}
      <button className="button button-primary" type="submit"><MessageCircle size={14}/> Send request to provider</button>
    </form></section>}
    <section className="panel farmer-requests"><PanelHead title="Your booking requests" subtitle="Track provider confirmations and completed transaction records."/>{farmerRequests.length ? <div className="farmer-request-list">{farmerRequests.map(request=><article className="farmer-request-row" key={request.id}><div><strong>{request.machine}</strong><span>{request.service} · {request.place} · {request.date}</span><small>{request.hectares} · {request.operator} · {request.amount}</small><small>{request.status==='Completed'?'Transaction recorded; agree payment directly with the provider.':request.status==='Accepted'?'Provider confirmed. Agree final terms and payment directly.':`Request ${request.id} · awaiting provider confirmation.`}</small></div><div className="farmer-request-actions"><span className={`table-status table-${request.status.toLowerCase()}`}><i/>{request.status}</span>{request.status==='Completed' && (request.review ? <span className="review-saved">Review saved · {request.rating}/5</span> : <button className="button button-ghost button-small" onClick={()=>setReviewing(request.id)}>Leave a review</button>)}</div>{reviewing===request.id && <form className="farmer-review-form" onSubmit={event=>submitReview(event,request.id)}><label className="field"><span className="field-label">YOUR RATING</span><span className="field-control"><Star size={15}/><select value={review.rating} onChange={event=>setReview(previous=>({...previous,rating:event.target.value}))}>{[5,4,3,2,1].map(value=><option key={value} value={value}>{value} / 5</option>)}</select></span></label><label className="field"><span className="field-label">REVIEW</span><span className="field-control"><MessageCircle size={15}/><input required value={review.text} onChange={event=>setReview(previous=>({...previous,text:event.target.value}))} placeholder="Share your experience"/></span></label><button className="button button-primary button-small" type="submit">Save review</button></form>}</article>)}</div> : <div className="empty-state"><CalendarDays size={20}/><strong>No booking requests yet</strong><span>Compare a listing and send your first request to a provider.</span></div>}</section>
  </div>;
}
function MachineCard({ machine, compact = false, onClick, actions }) {
  return <article className={`machine-card ${compact?'machine-card-compact':''}`}><div className="machine-photo"><img src={`https://images.unsplash.com/${machine.image}?auto=format&fit=crop&w=750&q=80`} alt={machine.name} loading="lazy"/><span className={`machine-status status-${machine.status.toLowerCase()}`}><i/>{machine.status}</span><span className="machine-kind">{machine.kind}</span></div><div className="machine-body"><div className="machine-title-line"><h3>{machine.name}</h3><Tractor size={16}/></div><p className="machine-location"><MapPin size={13}/>{machine.area}</p>{!compact&&<p className="machine-description">{machine.description||'Review provider terms and confirm availability before requesting.'}</p>}<div className="machine-stats"><span><Users size={13}/>{machine.operatorAvailable===false?'Equipment only':'Operator by arrangement'}</span><span><CheckCircle2 size={13}/>Provider listing</span></div><div className="machine-rate"><span><strong>₦{machine.rate}</strong><small> / hectare</small></span>{!compact&&<button className="button button-ghost button-small" onClick={onClick}>Manage</button>}</div>{actions}</div></article>;
}
function Machinery({ machinesState, setMachinesState, filter, setFilter, search, setSearch, go }) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categories = ['All', 'Tractor', 'Planter', 'Harvester', 'Sprayer', 'Tiller', 'Mechanization service'];
  const listed = machinesState.filter(machine => (filter === 'All' || machine.kind.toLowerCase().includes(filter.toLowerCase())) && `${machine.name} ${machine.kind} ${machine.area}`.toLowerCase().includes(search.toLowerCase()));
  const countFor = category => category === 'All' ? machinesState.length : machinesState.filter(machine => machine.kind.toLowerCase().includes(category.toLowerCase())).length;
  return <div className="view-stack"><div className="filter-bar machinery-filter-bar"><button className="category-filter machinery-category-trigger" type="button" aria-label="Choose equipment category" aria-expanded={categoryOpen} onClick={()=>setCategoryOpen(true)}><Filter size={15}/><strong>{filter==='All'?'All categories':filter}</strong><ChevronDown size={14}/></button><span className="filter-result-count">{listed.length} listings</span><button className="button button-ghost button-small" onClick={() => { setFilter('All'); setSearch('') }}><X size={14}/> Clear filters</button></div>{categoryOpen&&createPortal(<div className="machinery-category-backdrop" role="presentation" onClick={event=>closePopup(setCategoryOpen,event)}><section className="machinery-category-popup" role="dialog" aria-modal="true" aria-labelledby="machinery-category-title" onClick={event=>event.stopPropagation()}><header><div><span>REFINE LISTINGS</span><h2 id="machinery-category-title">Equipment category</h2></div><button type="button" aria-label="Close category picker" onClick={event=>closePopup(setCategoryOpen,event)}><X size={18}/></button></header><div className="machinery-category-options">{categories.map(category=><button key={category} className={filter===category?'selected':''} onClick={()=>{setFilter(category);setCategoryOpen(false)}}><span>{category==='All'?'All categories':category}</span><small>{countFor(category)}</small>{filter===category&&<Check size={16}/>}</button>)}</div><footer><span>{listed.length} matching listings</span><button className="button button-ghost button-small" onClick={event=>closePopup(setCategoryOpen,event)}>Done</button></footer></section></div>,document.body)}<div className="machine-grid">{listed.map(machine => <MachineCard key={machine.name} machine={machine} actions={<div className="machine-actions"><button className="button button-ghost button-small" onClick={() => go('Edit Machinery', machine)}><Wrench size={13}/> Edit listing</button><button className="button button-ghost button-small" onClick={() => setMachinesState(previous => previous.map(item => item.name === machine.name ? { ...item, status: item.status === 'Paused' ? 'Available' : 'Paused' } : item))}>{machine.status === 'Paused' ? '▶ Resume' : '⏸ Pause'}</button><button className="icon-button danger-button" aria-label={`Remove ${machine.name}`} onClick={() => setMachinesState(previous => previous.filter(item => item.name !== machine.name))}><X size={14}/></button></div>}/>)}</div>{listed.length === 0 && <div className="panel empty-state"><Search size={20}/><strong>No machines match your search</strong><span>Try another model, category, or coverage area.</span><button className="button button-ghost button-small" onClick={() => { setFilter('All'); setSearch('') }}>Clear filters</button></div>}<button className="add-machine-tile" onClick={() => go('Add Machinery')}><span><Plus size={26}/></span><strong>List another machine</strong><p>Reach local farmers looking for their next rental.</p><span className="button button-primary">Add equipment <ArrowRight size={14}/></span></button><div className="cooperative-banner"><ShieldCheck size={19}/><span><strong>Local provider network</strong><small>Keep your listing details current so local farmers can compare options.</small></span><span className="verification-pill"><CheckCircle2 size={12}/> LISTED</span></div></div>;
}

function EquipmentCategoryPicker({ value, onChange, label = 'MACHINE CATEGORY' }) {
  const [open, setOpen] = useState(false);
  const options = ['Tractor','Planter','Harvester','Boom sprayer','Tiller','Mechanization service','Other'];
  return <><label className="field"><span className="field-label">{label}</span><span className="field-control category-picker-control"><Tractor size={16}/><button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}>{value}</button><ChevronDown size={14}/></span></label>{open&&createPortal(<div className="machinery-category-backdrop" role="presentation" onClick={event=>closePopup(setOpen,event)}><section className="machinery-category-popup" role="dialog" aria-modal="true" aria-labelledby="equipment-category-title" onClick={event=>event.stopPropagation()}><header><div><span>LISTING DETAILS</span><h2 id="equipment-category-title">Choose equipment category</h2></div><button type="button" aria-label="Close category picker" onClick={event=>closePopup(setOpen,event)}><X size={18}/></button></header><div className="machinery-category-options">{options.map(option=><button type="button" key={option} className={value===option?'selected':''} onClick={()=>{onChange(option);setOpen(false)}}><span>{option}</span>{value===option&&<Check size={16}/>}</button>)}</div><footer><span>Choose the closest match for your listing.</span><button type="button" className="button button-ghost button-small" onClick={event=>closePopup(setOpen,event)}>Done</button></footer></section></div>,document.body)}</>;
}

function AddMachine({ flash, go, setMachinesState }) {
  const [form,setForm]=useState({name:'',category:'Tractor',rate:'',area:'Jos South, Bukuru',description:'',operatorAvailable:true});
  const [services,setServices]=useState(['Ploughing','Harrowing','Ridging']);
  const [photos,setPhotos]=useState([]);
  const serviceOptions=['Ploughing','Harrowing','Ridging','Planting','Spraying','Harvesting'];
  function updateService(service,checked){setServices(previous=>checked?[...previous,service]:previous.filter(item=>item!==service));}
  function submit(event){
    event.preventDefault();
    if(!form.name.trim()){flash('Add your machine’s name before publishing.');return;}
    if(services.length===0){flash('Choose at least one service farmers can request.');return;}
    const machine={...form,name:form.name.trim(),kind:form.category,rate:form.rate.trim(),area:form.area.trim(),services,terms:form.description.trim(),rating:'New',image:'photo-1592982537447-7440770cbfc9',status:'Available'};
    setMachinesState(previous=>[machine,...previous]);
    flash(`${machine.name} was added to your listings.`);
    go('My Machinery');
  }
  return <form className="panel listing-form" onSubmit={submit}><div className="listing-notice"><ShieldCheck size={16}/><span>Clear service, price, location and operator details help farmers compare listings.</span><small>Demo listing</small></div><div className="listing-columns"><section className="listing-photos"><PanelHead title="Machine photos" subtitle="Select up to 6 local preview images."/><label className="upload-box"><Upload size={22}/><strong>Choose photos to preview</strong><span>Selected photos are not uploaded or saved in this prototype.</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event=>setPhotos([...photos,...Array.from(event.target.files||[])].slice(0,6))}/></label>{photos.length>0&&<div className="uploaded-photos">{photos.map((photo,index)=><span key={`${photo.name}-${index}`}><Image size={13}/>{photo.name}<Check size={13}/></span>)}</div>}<div className="photography-tip"><Camera size={17}/><span><strong>Help farmers compare options</strong><br/>Show the overall machine, its condition and attachments.</span></div><div className="listing-strength"><span>LISTING DETAILS <strong>{services.length?`${services.length} services`:''}</strong></span><div><i/></div><small>Keep availability and rental terms up to date.</small></div></section><section className="listing-details"><PanelHead title="Equipment & service details" subtitle="Set clear terms for farmers to compare."/><EquipmentCategoryPicker value={form.category} onChange={category=>setForm(previous=>({...previous,category}))}/><Field icon={Wrench} label="MACHINE MODEL & NAME" placeholder="e.g. Massey Ferguson 375 4WD" value={form.name} onChange={event=>setForm(previous=>({...previous,name:event.target.value}))} required/><div className="listing-service-label"><span className="field-label">SERVICES AVAILABLE</span><span>Choose all that apply</span></div><div className="service-options">{serviceOptions.map(service=><label key={service}><input type="checkbox" checked={services.includes(service)} onChange={event=>updateService(service,event.target.checked)}/><span><Check size={12}/></span>{service}</label>)}</div><div className="inline-fields"><Field icon={Banknote} label="RATE PER HECTARE (₦)" placeholder="e.g. 45,000" value={form.rate} onChange={event=>setForm(previous=>({...previous,rate:event.target.value}))} required/><Field icon={MapPin} label="MAIN OPERATING AREA" placeholder="e.g. Jos South, Bukuru" value={form.area} onChange={event=>setForm(previous=>({...previous,area:event.target.value}))} required/></div><label className="availability-control"><input type="checkbox" checked={form.operatorAvailable} onChange={event=>setForm(previous=>({...previous,operatorAvailable:event.target.checked}))}/><span className="availability-check"><Check size={12}/></span><span><strong>Provider operator can be requested</strong><small>Farmers choosing equipment-only access must bring a qualified operator.</small></span></label><label className="field"><span className="field-label">TERMS FOR FARMERS</span><textarea value={form.description} onChange={event=>setForm(previous=>({...previous,description:event.target.value}))} placeholder="Describe transport, fuel, timing and other terms farmers should confirm." rows="4"/></label></section></div><div className="listing-footer"><span><ShieldCheck size={15}/> Farmers should confirm condition, availability and final terms with you.</span><button className="button button-primary" type="submit">Publish listing <ArrowRight size={15}/></button></div></form>;
}
function EditMachine({ machine, setMachinesState, go, flash }) {
  const serviceOptions=['Ploughing','Harrowing','Ridging','Planting','Spraying','Harvesting'];
  const [form,setForm]=useState(()=>({name:machine?.name||'',category:machine?.kind||'Tractor',rate:machine?.rate||'',area:machine?.area||'',terms:machine?.terms||machine?.description||'',operatorAvailable:machine?.operatorAvailable!==false,services:machine?.services||[]}));
  function updateService(service,checked){setForm(previous=>({...previous,services:checked?[...previous.services,service]:previous.services.filter(item=>item!==service)}));}
  function save(event){event.preventDefault();if(!form.services.length){flash('Choose at least one service farmers can request.');return;}setMachinesState(previous=>previous.map(item=>item.name===machine.name?{...item,name:form.name.trim(),kind:form.category,rate:form.rate,area:form.area,terms:form.terms,description:form.terms,operatorAvailable:form.operatorAvailable,services:form.services}:item));flash('Listing details updated.');go('My Machinery');}
  return <form className="panel edit-machine-form" onSubmit={save}><PanelHead title="Edit equipment details" subtitle="Keep the service and rental terms farmers see up to date."/><div className="edit-machine-fields"><Field icon={Wrench} label="MACHINE NAME" value={form.name} onChange={event=>setForm(previous=>({...previous,name:event.target.value}))} required/><EquipmentCategoryPicker label="CATEGORY" value={form.category} onChange={category=>setForm(previous=>({...previous,category}))}/><Field icon={Banknote} label="RATE PER HECTARE (₦)" value={form.rate} onChange={event=>setForm(previous=>({...previous,rate:event.target.value}))} required/><Field icon={MapPin} label="OPERATING AREA" value={form.area} onChange={event=>setForm(previous=>({...previous,area:event.target.value}))} required/><div className="listing-service-label"><span className="field-label">SERVICES AVAILABLE</span><span>Choose all that apply</span></div><div className="service-options">{serviceOptions.map(service=><label key={service}><input type="checkbox" checked={form.services.includes(service)} onChange={event=>updateService(service,event.target.checked)}/><span><Check size={12}/></span>{service}</label>)}</div><label className="availability-control"><input type="checkbox" checked={form.operatorAvailable} onChange={event=>setForm(previous=>({...previous,operatorAvailable:event.target.checked}))}/><span className="availability-check"><Check size={12}/></span><span><strong>Provider operator can be requested</strong><small>Equipment-only requests require a qualified operator from the farmer.</small></span></label><label className="field edit-terms-field"><span className="field-label">TERMS FOR FARMERS</span><textarea rows="4" value={form.terms} onChange={event=>setForm(previous=>({...previous,terms:event.target.value}))} placeholder="Transport, fuel, timing and other terms to confirm."/></label></div><div className="settings-actions"><button type="button" className="button button-ghost" onClick={()=>go('My Machinery')}>Cancel</button><button className="button button-primary" type="submit"><Check size={14}/> Save listing</button></div></form>;
}
function Requests({ requestsState, setRequestsState, activeRequest, setActiveRequest, search, flash }) {
  const tabs = ['All','Pending','Accepted','Completed','Declined'];
  const list = requestsState.filter(request => (activeRequest === 'All' || request.status === activeRequest) && `${request.farmer} ${request.place} ${request.machine} ${request.service}`.toLowerCase().includes(search.toLowerCase()));
  const totalValue = requestsState.reduce((sum, request) => sum + Number(String(request.amount).replace(/[^\d]/g,'')), 0);
  function update(id, status) {
    setRequestsState(previous => previous.map(request => request.id === id ? {...request,status} : request));
    flash(`Booking ${id} ${status.toLowerCase()}.`);
  }
  return <div className="view-stack"><section className="metric-grid request-metrics">
    <Metric label="AWAITING YOUR RESPONSE" value={String(requestsState.filter(request => request.status === 'Pending').length)} detail={<><Clock3 size={13}/>Requests needing a decision</>} icon={Clock3} tone="orange"/>
    <Metric label="BOOKINGS IN PROGRESS" value={String(requestsState.filter(request => request.status === 'Accepted').length)} detail={<><CheckCircle2 size={13}/>Provider-confirmed requests</>} icon={Tractor}/>
    <Metric label="TOTAL REQUEST VALUE" value={`₦${totalValue.toLocaleString('en-NG')}`} detail={<><Banknote size={13}/>Indicative demo booking values</>} icon={Banknote} tone="blue"/>
  </section><section className="panel table-panel"><PanelHead title="Manage booking requests" subtitle="Confirm dates, location, operator arrangements and final terms with each farmer."/><div className="request-tabs">{tabs.map(tab=><button key={tab} onClick={()=>setActiveRequest(tab)} className={activeRequest===tab?'selected':''}>{tab}<span>{tab==='All'?requestsState.length:requestsState.filter(request=>request.status===tab).length}</span></button>)}</div><RequestTable requestsState={list} onStatus={update}/></section></div>;
}
function RequestTable({ requestsState, onStatus, compactMobile = false }) {
  const renderActions = request => request.status==='Pending' ? <><button className="button button-primary button-tiny" onClick={()=>onStatus(request.id,'Accepted')}><Check size={12}/> Confirm</button><button className="button button-ghost button-tiny" onClick={()=>onStatus(request.id,'Declined')}>Decline</button></> : request.status==='Accepted' ? <button className="button button-ghost button-tiny" onClick={()=>onStatus(request.id,'Completed')}>Record completion <CheckCircle2 size={11}/></button> : <span>{request.status==='Completed'?'Transaction recorded':'No further action'}</span>;
  return <div className={`table-scroll ${compactMobile?'request-table-mobile-cards':''} ${onStatus?'request-table-actions':''}`}><table className="data-table"><thead><tr><th>REQUEST</th><th>FARMER</th><th>MACHINE & SERVICE</th><th>AREA</th><th>DATE & SIZE</th><th>BOOKING VALUE</th><th>STATUS</th>{onStatus&&<th>ACTIONS</th>}</tr></thead><tbody>{requestsState.map(request=><tr key={request.id}><td><span className="table-id">{request.id}</span></td><td><strong>{request.farmer}</strong><small><MapPin size={11}/>{request.place}</small></td><td><span>{request.service}</span><small>{request.machine}{request.operator&&` · ${request.operator}`}</small></td><td>{request.place.replace(' LGA','')}</td><td><span>{request.date}</span><small>{request.hectares}</small></td><td><strong className="table-amount">{request.amount}</strong></td><td><span className={`table-status table-${request.status.toLowerCase()}`}><i/>{request.status}</span></td>{onStatus&&<td><div className="table-actions">{renderActions(request)}</div></td>}</tr>)}</tbody></table>{onStatus&&<div className="request-cards-mobile">{requestsState.map(request=><article className="request-mobile-card" key={request.id}><header><span className="table-id">{request.id}</span><span className={`table-status table-${request.status.toLowerCase()}`}><i/>{request.status}</span></header><div className="request-mobile-farmer"><strong>{request.farmer}</strong><span><MapPin size={12}/>{request.place}</span></div><div className="request-mobile-machine"><span>{request.service}</span><small>{request.machine}{request.operator&&` · ${request.operator}`}</small></div><div className="request-mobile-meta"><span><small>DATE · SIZE</small>{request.date} · {request.hectares}</span><strong className="table-amount">{request.amount}</strong></div><div className="request-mobile-actions">{renderActions(request)}</div></article>)}</div>}{requestsState.length===0&&<div className="empty-state"><Search size={20}/><strong>No bookings found</strong><span>Try another status or search term.</span></div>}</div>;
}
function CalendarPage({ month, setMonth, flash }) { const first = new Date(2026, month, 1).getDay(), days = new Date(2026, month + 1, 0).getDate(), mname = new Date(2026, month).toLocaleString('en', { month: 'long', year: 'numeric' }); const events = { 22: [['MF 375', 'warning']], 23: [['MF 375', 'warning']], 24: [['Massey Ferguson', 'good']], 25: [['Baldan planter', 'warning']], 28: [['Service & filter', 'neutral']], 29: [['MF 375 · field', 'warning']], 30: [['2 bookings', 'warning']] }; const [selected, setSelected] = useState(24); const cells = []; for (let i = 0; i < first; i++)cells.push(<div key={`p${i}`} className="calendar-cell out-month"><span>{new Date(2026, month, 0).getDate() - first + i + 1}</span></div>); for (let d = 1; d <= days; d++)cells.push(<button key={d} className={`calendar-cell ${d === 24 ? 'today' : ''} ${selected === d ? 'day-selected' : ''}`} onClick={() => setSelected(d)}><span>{d}</span>{(events[d] || []).map(([n, c]) => <span key={n} className={`calendar-event event-${c}`}>{n}</span>)}{d === 24 && <span className="calendar-dot" />}</button>); while (cells.length % 7) cells.push(<div key={`n${cells.length}`} className="calendar-cell out-month"><span>{cells.length - (first + days) + 1}</span></div>); return <div className="view-stack"><section className="calendar-toolbar"><div className="calendar-month"><button className="icon-button" aria-label="Previous month" onClick={() => setMonth((month + 11) % 12)}><ChevronLeft size={16} /></button><strong>{mname}</strong><button className="icon-button" aria-label="Next month" onClick={() => setMonth((month + 1) % 12)}><ChevronRight size={16} /></button></div><button className="button button-primary" onClick={() => flash('Choose a date on your calendar to manage fleet availability.')}><Plus size={15} /> Block dates</button></section><section className="availability-legend"><strong>STATUS KEY</strong><span><i className="legend-green" /> Available for booking</span><span><i className="legend-amber" /> Active booking / field work</span><span><i className="legend-blue" /> Scheduled maintenance</span></section><div className="calendar-layout"><section className="panel calendar-panel"><div className="weekday-grid">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d}>{d}</span>)}</div><div className="calendar-grid">{cells}</div></section><aside className="calendar-aside"><section className="panel dispatch-panel"><span className="eyebrow"><span /> SELECTED DATE</span><h2>October {selected}, 2026</h2><span className="dispatch-priority"><Clock3 size={13} /> FIELD OPERATIONS</span><div className="dispatch-card"><Tractor size={17} /><span><strong>{events[selected]?.length ? 'Scheduled booking' : 'Available for bookings'}</strong><small>{events[selected]?.[0]?.[0] || 'No bookings scheduled for this date.'}</small></span></div><h3>Fleet availability</h3>{['Massey Ferguson 375', 'New Holland 6010', 'John Deere 5075E'].map((x, i) => <div className="availability-machine" key={x}><span className={`fleet-dot fleet-${i === 1 ? 'amber' : 'green'}`} /><span>{x}</span><small>{i === 1 ? 'Booked' : 'Available'}</small></div>)}<button className="button button-ghost calendar-details" onClick={() => flash('Your fleet schedule is up to date.')}>View booking details <ArrowRight size={13} /></button></section><section className="panel depot-panel"><ShieldCheck size={17} /><strong>Bukuru depot</strong><span className="available-pill"><i /> Operational</span><p>Fleet maintenance checks are up to date.</p></section></aside></div></div> }

function Analytics({ machinesState, requestsState }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const data = getWeekData(weekOffset);
  const totalBookings = data.reduce((sum, day) => sum + day.jobs, 0);
  const totalIncome = data.reduce((sum, day) => sum + day.income, 0);
  const averageValue = totalBookings ? Math.round(totalIncome * 1000 / totalBookings) : 0;
  const activeListings = machinesState.filter(machine => machine.status === 'Available').length;
  const completedJobs = requestsState.filter(request => request.status === 'Completed').length;
  return <div className="view-stack"><div className="analytics-week-bar"><WeekNavigator weekOffset={weekOffset} setWeekOffset={setWeekOffset}/></div><div className="metric-grid">
    <Metric label="BOOKING REQUESTS" value={String(totalBookings)} detail={<><CalendarDays size={13}/>{getWeekRange(weekOffset)}</>} icon={CalendarDays}/>
    <Metric label="ACTIVE LISTINGS" value={String(activeListings)} detail={<><Tractor size={13}/>Available to request</>} icon={Tractor} tone="blue"/>
    <Metric label="COMPLETED JOBS" value={String(completedJobs)} detail={<><CheckCircle2 size={13}/>Recorded transactions</>} icon={CheckCircle2} tone="orange"/>
    <Metric label="AVG. BOOKING VALUE" value={`₦${averageValue.toLocaleString('en-NG')}`} detail={<><BarChart3 size={13}/>Illustrative estimate</>} icon={Banknote}/>
  </div><div className="analytics-grid">
    <section className="panel analytics-chart"><PanelHead title="Booking activity" subtitle={`Requests received · ${getWeekRange(weekOffset)}`}/><div className="earnings-chart-inner"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:12,right:10,left:-20,bottom:0}}><defs><linearGradient id="analyticsJobs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c98a" stopOpacity={.25}/><stop offset="100%" stopColor="#22c98a" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="rgba(164,194,172,.09)" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#86988c',fontSize:12}}/><Tooltip contentStyle={{background:'#10281d',border:'1px solid #254333',borderRadius:10,fontSize:12}}/><Area type="monotone" dataKey="jobs" name="Booking requests" stroke="#24d18c" fill="url(#analyticsJobs)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div><p className="analytics-week-total">{totalBookings} booking requests · {getWeekRange(weekOffset)}</p></section>
    <section className="panel analytics-chart"><PanelHead title="Indicative rental value" subtitle={`Daily estimate · ₦ thousands · ${getWeekRange(weekOffset)}`}/><div className="earnings-chart-inner"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{top:12,right:10,left:-20,bottom:0}}><CartesianGrid stroke="rgba(164,194,172,.09)" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#86988c',fontSize:12}}/><Tooltip contentStyle={{background:'#10281d',border:'1px solid #254333',borderRadius:10,fontSize:12}} formatter={value=>[`₦${value},000`,'Indicative rental value']}/><Bar dataKey="income" fill="#efa812" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div><p className="analytics-week-total">₦{(totalIncome*1000).toLocaleString('en-NG')} indicative value this week</p></section>
  </div><p className="analytics-note"><ShieldCheck size={15}/> Historic weeks are illustrative snapshots for this prototype. The 5% transaction commission is proposed; payments are not collected here.</p></div>;
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
function Reviews({ requestsState, flash }) {
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
  </div><div className="reviews-layout"><section className="review-list">{records.length ? records.map(request=><article className="panel review-card" key={request.id}><div className="review-header"><span className="review-avatar">{request.farmer.split(' ').map(part=>part[0]).join('')}</span><span className="review-person"><strong>{request.farmer}</strong><small><MapPin size={12}/>{request.place} · hired {request.machine}</small></span><span className="review-stars"><span>{'★'.repeat(request.rating)}{'☆'.repeat(5-request.rating)}</span><small>{request.date}</small></span></div><span className="review-verified"><CheckCircle2 size={13}/> COMPLETED BOOKING RECORD</span><blockquote>“{request.review}”</blockquote><div className="review-footer"><span>Feedback shared after the recorded booking.</span><button className="button button-ghost button-small" onClick={()=>flash('Follow up with the farmer directly; in-app messaging is not connected yet.')}><MessageCircle size={13}/> Follow up</button></div></article>) : <div className="panel empty-state"><Star size={20}/><strong>No farmer reviews recorded yet</strong><span>Completed bookings can receive feedback from the farmer dashboard.</span></div>}</section><aside className="view-stack"><section className="panel equipment-reviews"><PanelHead title="Equipment ratings" subtitle="Calculated from reviews linked to completed bookings."/>{byMachine.length ? byMachine.map(group=><div className="equipment-review" key={group.machine}><span>{group.machine}</span><strong>{(group.total/group.count).toFixed(1)} <Star size={12} fill="currentColor"/></strong><small>{group.count} recorded {group.count===1?'review':'reviews'}</small></div>) : <p className="empty-state">Ratings appear here when completed bookings receive reviews.</p>}</section><section className="panel guarantee-panel"><ShieldCheck size={23}/><h3>Trust through clear records</h3><p>Provider details, agreed terms, completed booking records and farmer reviews help people make informed decisions. A listing is not a physical equipment inspection or a guarantee of availability.</p></section></aside></div></div>;
}
function SettingsPage({ currentUser }) {
  const [tab, setTab] = useState('Profile');
  const profile = currentUser?.profile || {};
  const areas = profile.serviceAreas?.length ? profile.serviceAreas : profile.primaryArea ? [profile.primaryArea] : [];
  return <div className="view-stack"><div className="settings-tabs">{['Profile', 'Coverage', 'Payment coordination'].map((t, i) => <button key={t} className={tab === t ? 'selected' : ''} onClick={() => setTab(t)}>{[<User size={14} />, <MapPin size={14} />, <Banknote size={14} />][i]}{t}</button>)}</div><div className="settings-grid"><section className="panel settings-card"><PanelHead title={tab === 'Profile' ? 'Your profile' : tab === 'Coverage' ? 'Operating area & coverage' : 'Payment coordination'} subtitle={tab === 'Profile' ? 'Account details currently associated with your sign-in.' : 'Marketplace pilot settings and local booking coordination.'} /><div className="settings-fields">{tab !== 'Payment coordination' && <Field icon={User} label="FULL NAME" value={currentUser?.name || ''} readOnly placeholder="Name not available" />}{tab === 'Profile' && currentUser?.role === 'provider' && <Field icon={Wrench} label="BUSINESS OR FLEET NAME" value={profile.businessName || ''} readOnly placeholder="Not added yet" />}{tab === 'Coverage' && <Field icon={MapPin} label="PRIMARY DEPOT" value={profile.primaryArea || ''} readOnly placeholder="Not added yet" />}{tab === 'Payment coordination' && <div className="settings-note"><Wallet size={16}/> Payment processing and stored bank details are not connected. Agree payment arrangements directly with the other party.</div>}{tab !== 'Payment coordination' && <Field icon={Mail} label="EMAIL ADDRESS" type="email" value={currentUser?.email || ''} readOnly />}{tab === 'Profile' && <Field icon={MapPin} label="PHONE NUMBER" value={profile.phone || ''} readOnly placeholder="Not added yet" trailing={<span className={`phone-status ${profile.phoneVerified ? 'verified' : ''}`}>{profile.phoneVerified ? 'Verified' : 'Not verified'}</span>} />}</div>{tab === 'Profile' && <p className="settings-help">Phone verification is not set up yet. Your number will appear here after it has been added.</p>}</section><aside className="view-stack"><section className="panel profile-summary"><span className="profile-check"><BadgeCheck size={24} /></span><span className="eyebrow"><span /> ACCOUNT</span><h3>{currentUser?.name || 'Your account'}</h3><p>Your profile details are shown here as currently saved to your HadaLink account.</p><div><ShieldCheck size={14} />{profile.phoneVerified ? 'Phone number verified' : 'Phone number not verified'}</div></section><section className="panel coverage-card"><PanelHead title="Your coverage" /><div className="area-tags">{areas.length ? areas.map(area => <span key={area}><MapPin size={11} />{area}</span>) : <span>No areas added yet</span>}</div><p>Operating areas will appear here when they have been added to your profile.</p><button className="button button-ghost button-small" onClick={() => setTab('Coverage')}><MapPin size={13} /> View coverage</button></section></aside></div></div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);

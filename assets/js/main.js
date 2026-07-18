/*============================================================================
  ==================== ROBOLAND CORE CONFIGURATION & LOGIC ====================
  ============================================================================*/

/* ---------------- STORAGE & IN-MEMORY BACKEND ---------------- */
// Check for native sandbox storage API compatibility; fall back to session variables if unavailable
const hasStorage = (typeof window !== 'undefined') && !!window.storage;
const memoryRegistrations = [];

// Clean human-readable translation matrix for program metrics parsing
const INTEREST_LABELS = {
  foundation: 'Foundation Labs',
  challenges: 'Build Challenges',
  mentorship: 'Mentor Network',
  'school-partnership': 'School Partnership'
};

/**
 * Generates a collision-resistant unique registration entry identifier
 * Format pattern: reg_[timestamp]_[random-hex-hash]
 */
function makeId(){
  return 'reg_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
}

/**
 * Serializes and commits registration payloads to storage engines
 * Programmed to fallback seamlessly to in-memory stacks upon storage API rejection
 */
async function saveRegistration(record){
  const id = makeId();
  record.id = id;
  record.registeredAt = new Date().toISOString();
  
  if(hasStorage){
    try{
      await window.storage.set(id, JSON.stringify(record), true);
      return {ok:true, id, local:false};
    }catch(e){
      console.error('Registration storage failed, falling back to memory', e);
      memoryRegistrations.push(record);
      return {ok:true, id, local:true};
    }
  }
  memoryRegistrations.push(record);
  return {ok:true, id, local:true};
}

/**
 * Extracts, parses, and reverse-chronologically sorts all registration records
 */
async function fetchAllRegistrations(){
  if(hasStorage){
    try{
      const listResult = await window.storage.list('reg_', true);
      const keys = (listResult && listResult.keys) || [];
      const records = [];
      for(const k of keys){
        try{
          const r = await window.storage.get(k, true);
          if(r && r.value) records.push(JSON.parse(r.value));
        }catch(e){ /* Key vanished between array listing and retrieval; skip node safely */ }
      }
      records.sort((a,b)=> new Date(b.registeredAt) - new Date(a.registeredAt));
      return records;
    }catch(e){
      console.error('Registration list failed, using in-memory copy', e);
      return memoryRegistrations.slice().reverse();
    }
  }
  return memoryRegistrations.slice().reverse();
}

/* ----------------====================================---------------- */

/* ---------------- ANNOUNCEMENT BAR ---------------- */
// Handles structural dismissal operations for the dynamic top header layout block
const announce = document.getElementById('announce');
document.getElementById('announceClose').addEventListener('click', () => {
  announce.style.display = 'none';
});

/* ----------------====================================---------------- */

/* ---------------- MOBILE NAVIGATION MENU ---------------- */
// Toggle management hooks for responsive mobile menu drawer control loops
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');

navToggle.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});

// Auto-collapses the mobile navigation drawer contextually after selecting a section link
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ----------------====================================---------------- */

/* ---------------- INTERSECTION OBSERVER (SCROLL REVEAL) ---------------- */
// Evaluates viewport intercepts to trigger target CSS layout entry transformations smoothly
// Wrap in a window load checker to make sure the plugins are 100% loaded
  const revealEls = document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, {threshold:0.15});
  revealEls.forEach(el => io.observe(el));
} else {
  // Graceful fallback array mapping if the client's execution window drops standard API observers
  revealEls.forEach(el => el.classList.add('in-view'));
}



/* ----------------===================   ANIMATION FOR SPAN  =================---------------- */
window.addEventListener("load", () => {
    if (typeof gsap === "undefined") {
      console.error("GSAP engine failed to load via CDN.");
      return;
    }

    // Explicitly register the TextPlugin
    gsap.registerPlugin(TextPlugin);

    const phrases = [
      "one build at a time.",
      "one circuit at a time.",
      "one line of code at a time.",
      "one robot at a time."
    ];

    // Set clean, visible baseline states instantly
    gsap.set("#main-heading", { opacity: 0, y: 15 });
    gsap.set("#walk-text", { text: "" });

    // Master Timeline
    let tl = gsap.timeline();

    // Step A: Smoothly fade & slide up the primary title line
    tl.to("#main-heading", {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out"
    });

    // Step B: Build an infinite looping timeline for the typewriter
    let loopTl = gsap.timeline({ repeat: -1 });

    phrases.forEach((phrase) => {
      let wordTl = gsap.timeline({
        repeat: 1,
        yoyo: true,
        repeatDelay: 1.8 // Time the phrase stays fully typed out before erasing
      });

      wordTl.to("#walk-text", {
        duration: phrase.length * 0.05, // Typing speed scale
        text: { value: phrase, delimiter: "" },
        ease: "none"
      });

      loopTl.add(wordTl);
    });

    // Step C: Seamlessly attach the loop to fire immediately after the main line finishes
    tl.add(loopTl);
  });


  /* ----------------================ ANIMAITON FOR SUB HEADING ====================---------------- */
window.addEventListener("load", () => {
  if (typeof gsap === "undefined") return;

  // Make the text loop infinitely from left to right
  gsap.to("#tickerText", {
    xPercent: 50,          // Shifts the track horizontally to move left-to-right
    ease: "none",          // Crucial for a uniform, constant speed
    duration: 10,          // Speed controls: higher number = slower, lower = faster
    repeat: -1,            // Infinite loops
    modifiers: {
      xPercent: gsap.utils.unitize(x => parseFloat(x) % 50) // Creates the seamless wrapping reset point
    }
  });

  // Optional: Clean up code to handle the close button dismiss function
  const closeBtn = document.getElementById("announceClose");
  const announceBar = document.getElementById("announce");
  if (closeBtn && announceBar) {
    closeBtn.addEventListener("click", () => {
      gsap.to(announceBar, {
        height: 0,
        opacity: 0,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => announceBar.remove()
      });
    });
  }
});

/* ----------------====================================---------------- */

/* ---------------- HERO REAL-TIME COUNTER ANIMATION ---------------- */
/**
 * Drives smooth numeric counter tickers utilizing dynamic cubic easing algorithms
 */
function animateCount(el, target){
  const start = 0;
  const duration = 900;
  const startTime = performance.now();
  
  function step(now){
    const p = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1-p, 3); // Smooth cubic ease-out operation
    el.textContent = Math.round(start + (target - start) * eased);
    if(p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Repopulates and animations operational totals inside the primary landing card grid
async function refreshHeroStats(){
  const el = document.getElementById('statRegistered');
  try{
    const all = await fetchAllRegistrations();
    animateCount(el, all.length);
  }catch(e){
    el.textContent = '0';
  }
}

/* ----------------====================================---------------- */

/* ---------------- REGISTRATION FORM ENGINE ---------------- */
// Element mapping hooks representing input elements, state displays, and interactive labels
const form = document.getElementById('regForm');
const formWrap = document.getElementById('regFormWrap');
const successBox = document.getElementById('successBox');
const successName = document.getElementById('successName');
const submitBtn = document.getElementById('submitBtn');
const storageNote = document.getElementById('storageNote');

// Appends contextual warning banners if data isolation engines run locally within transient memory
if(!hasStorage){ storageNote.classList.add('show'); }

/**
 * Toggles structural presentation states and invalid markers based on parsing results
 */
function showError(id, show){
  const input = document.getElementById(id);
  const err = document.getElementById('err-' + id);
  if(input) input.classList.toggle('invalid', show);
  if(err) err.classList.toggle('show', show);
}

/**
 * Direct evaluation structure validating string properties against standard business logic and RegEx bounds
 */
function validate(){
  let valid = true;

  // Name check logic constraints
  const fullName = document.getElementById('fullName').value.trim();
  if(fullName.length < 2){ showError('fullName', true); valid = false; } else showError('fullName', false);

  // Bounds checker validating user parameters fall within logical standard operations
  const age = document.getElementById('age').value;
  if(!age || age < 5 || age > 99){ showError('age', true); valid = false; } else showError('age', false);

  // Email validation rule
  const email = document.getElementById('email').value.trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if(!emailOk){ showError('email', true); valid = false; } else showError('email', false);

  // Mobile routing sequence check - filters and tests standard 10-digit formats common inside India
  const phone = document.getElementById('phone').value.trim();
  const phoneOk = /^[6-9]\d{9}$/.test(phone.replace(/\D/g,''));
  if(!phoneOk){ showError('phone', true); valid = false; } else showError('phone', false);

  // City text check operations
  const city = document.getElementById('city').value.trim();
  if(city.length < 2){ showError('city', true); valid = false; } else showError('city', false);

  // Interest tracks dropdown input validation selector checks
  const interest = document.getElementById('interest').value;
  if(!interest){ showError('interest', true); valid = false; } else showError('interest', false);

  // Terms and conditions acceptance verification checks
  const terms = document.getElementById('terms').checked;
  document.getElementById('err-terms').classList.toggle('show', !terms);
  if(!terms) valid = false;

  return valid;
}

// Lifecycle interception execution monitoring primary user checkout pipelines
form.addEventListener('submit', async function(e){
  e.preventDefault();
  if(!validate()) return;

  // Freeze interface actions to protect ongoing transmission pipelines
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');

  const record = {
    fullName: document.getElementById('fullName').value.trim(),
    age: document.getElementById('age').value,
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    city: document.getElementById('city').value.trim(),
    interest: document.getElementById('interest').value
  };

  const result = await saveRegistration(record);

  // Relinquish UI freeze bindings immediately after asynchronous routines drop complete payloads
  submitBtn.disabled = false;
  submitBtn.classList.remove('loading');

  // String parsing method isolating target user first names for custom greeting renders
  const name = record.fullName.split(' ')[0];
  successName.textContent = `Welcome to Roboland, ${name}. We'll be in touch with next steps soon.`;

  formWrap.style.display = 'none';
  successBox.classList.add('show');

  refreshHeroStats();
});

// Resets internal form inputs, clean states, and removes residual warning boundaries cleanly
function resetForm(){
  form.reset();
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('show'));
  successBox.classList.remove('remove');
  successBox.classList.remove('show');
  formWrap.style.display = 'block';
}

/* ----------------====================================---------------- */

/* ---------------- OPERATIONAL ADMINISTRATIVE DASHBOARD ---------------- */
const adminOverlay = document.getElementById('adminOverlay');
const adminOpenLink = document.getElementById('adminOpenLink');
const adminClose = document.getElementById('adminClose');
const adminRefresh = document.getElementById('adminRefresh');
const adminExport = document.getElementById('adminExport');
const adminTbody = document.getElementById('adminTbody');
const adminEmpty = document.getElementById('adminEmpty');
const adminTotal = document.getElementById('adminTotal');
const adminCities = document.getElementById('adminCities');
const adminTopInterest = document.getElementById('adminTopInterest');

let lastLoaded = [];

/**
 * Sanitizes rendering payloads to neutralize malicious string formatting inputs
 */
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
}

/**
 * Normalizes system ISO string timestamps to readable formatting layouts matching regional contexts
 */
function formatTimestamp(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {day:'2-digit', month:'short', year:'numeric'}) +
      ' ' + d.toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit'});
  }catch(e){ return iso || '—'; }
}

/**
 * Renders database array layouts inside operational tracking dashboard modules
 * Dynamically updates primary tracking indicators (Total Signups, Unique Cities, Top Program Interests)
 */
async function loadAdminData(){
  adminTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#8b8f86;">Loading…</td></tr>';
  adminEmpty.style.display = 'none';
  const records = await fetchAllRegistrations();
  lastLoaded = records;

  // Process operational metric visualizations logic parameters
  adminTotal.textContent = records.length;
  const cities = new Set(records.map(r => (r.city||'').trim().toLowerCase()).filter(Boolean));
  adminCities.textContent = cities.size;

  // Compute exact density peaks across array components to extrapolate top category selections
  const counts = {};
  records.forEach(r => { if(r.interest) counts[r.interest] = (counts[r.interest]||0)+1; });
  let topKey = null, topVal = 0;
  Object.keys(counts).forEach(k => { if(counts[k] > topVal){ topVal = counts[k]; topKey = k; } });
  adminTopInterest.textContent = topKey ? (INTEREST_LABELS[topKey] || topKey) : '—';

  // Handle empty state tracking configurations when active databases hold no elements
  if(records.length === 0){
    adminTbody.innerHTML = '';
    adminEmpty.style.display = 'block';
    return;
  }

  // Iteratively map and append row cells dynamically parsed and protected via escaping algorithms
  adminTbody.innerHTML = records.map(r => `
    <tr>
      <td>${escapeHtml(r.fullName || '—')}</td>
      <td>${escapeHtml(r.age || '—')}</td>
      <td>${escapeHtml(r.email || '—')}</td>
      <td>${escapeHtml(r.phone || '—')}</td>
      <td>${escapeHtml(r.city || '—')}</td>
      <td>${escapeHtml(INTEREST_LABELS[r.interest] || r.interest || '—')}</td>
      <td>${escapeHtml(formatTimestamp(r.registeredAt))}</td>
    </tr>
  `).join('');
}

/**
 * Compiles in-memory data tables into downloadable dynamic stream objects formatted to valid CSV criteria
 */
function exportCsv(){
  if(!lastLoaded.length){ return; }
  const headers = ['Full name','Age','Email','Phone','City','Interest area','Registered at'];
  const rows = lastLoaded.map(r => [
    r.fullName, r.age, r.email, r.phone, r.city,
    INTEREST_LABELS[r.interest] || r.interest, r.registeredAt
  ]);
  
  // Format character arrays safely ensuring line returns map cleanly to sheet readers
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell==null?'':cell).replace(/"/g,'""')}"`).join(','))
    .join('\n');
    
  // Trigger dynamic virtual document element mapping mechanisms to initialize system save queries
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'roboland-registrations.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------------- ADMINISTRATIVE CONTROL PANEL EVENT HANDLERS ---------------- */
adminOpenLink.addEventListener('click', (e) => {
  e.preventDefault();
  adminOverlay.classList.add('open');
  loadAdminData();
});

adminClose.addEventListener('click', () => adminOverlay.classList.remove('open'));

adminOverlay.addEventListener('click', (e) => {
  if(e.target === adminOverlay) adminOverlay.classList.remove('open');
});

adminRefresh.addEventListener('click', loadAdminData);
adminExport.addEventListener('click', exportCsv);

/* ----------------====================================---------------- */

/* ---------------- RUN INITIALIZATION ---------------- */
// Mount runtime parameters to initialize landing assets upon parsing completions
refreshHeroStats();
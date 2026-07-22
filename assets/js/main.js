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
};/*============================================================================
  ==================== ROBOLAND CORE CONFIGURATION & LOGIC ====================
  ============================================================================*/

// --- Configuration ---
const INTEREST_LABELS = {
  foundation: 'Foundation Labs',
  challenges: 'Build Challenges',
  mentorship: 'Mentor Network',
  'school-partnership': 'School Partnership'
};

/* ---------------- BACKEND API INTERACTION ---------------- */
async function saveRegistration(record) {
  try {
    const response = await fetch('https://roboland-5xzc.onrender.com/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return { ok: true };
  } catch (e) {
    console.error('Registration API failed:', e);
    return { ok: false, error: e };
  }
}

async function fetchAllRegistrations() {
  const password = prompt("Enter Admin Password:");
  if (!password) return [];
  try {
    const response = await fetch('https://roboland-5xzc.onrender.com/registrations', {
      headers: { 'Authorization': password }
    });
    if (response.status === 401) { alert("Unauthorized access."); return []; }
    return await response.json();
  } catch (e) {
    console.error('Fetch registrations failed:', e);
    return [];
  }
}

/* ---------------- UI & ANIMATIONS ---------------- */
const announce = document.getElementById('announce');
if(announce) {
    const announceClose = document.getElementById('announceClose');
    if(announceClose) {
        announceClose.addEventListener('click', () => { announce.style.display = 'none'; });
    }
}

// Mobile Nav Toggle Logic
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
        const open = mobileMenu.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
}

// Scroll Reveal
const revealEls = document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('in-view'); io.unobserve(entry.target); } });
  }, {threshold:0.15});
  revealEls.forEach(el => io.observe(el));
} else { revealEls.forEach(el => el.classList.add('in-view')); }

// GSAP Animations
window.addEventListener("load", () => {
  if (typeof gsap === "undefined") return;
  if (typeof TextPlugin !== "undefined") gsap.registerPlugin(TextPlugin);
  
  // Typewriter
  const phrases = ["one build at a time.", "one circuit at a time.", "one line of code at a time.", "one robot at a time."];
  const mainHeading = document.getElementById("main-heading");
  const walkText = document.getElementById("walk-text");
  
  if (mainHeading) gsap.set(mainHeading, { opacity: 0, y: 15 });
  if (walkText) {
      gsap.set(walkText, { text: "" });
      let tl = gsap.timeline();
      if (mainHeading) tl.to(mainHeading, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
      let loopTl = gsap.timeline({ repeat: -1 });
      phrases.forEach((phrase) => {
        let wordTl = gsap.timeline({ repeat: 1, yoyo: true, repeatDelay: 1.8 });
        wordTl.to(walkText, { duration: phrase.length * 0.05, text: { value: phrase, delimiter: "" }, ease: "none" });
        loopTl.add(wordTl);
      });
      tl.add(loopTl);
  }

  // Ticker
  const tickerText = document.getElementById("tickerText");
  if (tickerText) {
      gsap.to(tickerText, { xPercent: 50, ease: "none", duration: 10, repeat: -1, modifiers: { xPercent: gsap.utils.unitize(x => parseFloat(x) % 50) } });
  }
});

/* ---------------- REGISTRATION FORM ENGINE ---------------- */
const form = document.getElementById('regForm');
const formWrap = document.getElementById('regFormWrap');
const successBox = document.getElementById('successBox');
const successName = document.getElementById('successName');
const submitBtn = document.getElementById('submitBtn');

function showError(id, show){
  const input = document.getElementById(id);
  const err = document.getElementById('err-' + id);
  if(input) input.classList.toggle('invalid', show);
  if(err) err.classList.toggle('show', show);
}

function validate(){
  let valid = true;
  const fullNameEl = document.getElementById('fullName');
  const interestEl = document.getElementById('interest');
  
  if(fullNameEl && fullNameEl.value.trim().length < 2) { showError('fullName', true); valid = false; } else { showError('fullName', false); }
  if(interestEl && !interestEl.value) { showError('interest', true); valid = false; } else { showError('interest', false); }
  return valid;
}

if (form) {
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      if(!validate()) return;
      if(submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('loading');
      }
      const record = {
        fullName: document.getElementById('fullName').value.trim(),
        age: document.getElementById('age').value,
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        city: document.getElementById('city').value.trim(),
        interest: document.getElementById('interest').value
      };
      const result = await saveRegistration(record);
      if(submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('loading');
      }
      if (result.ok) {
        if(successName) successName.textContent = `Welcome to Roboland, ${record.fullName.split(' ')[0]}.`;
        if(formWrap) formWrap.style.display = 'none';
        if(successBox) successBox.classList.add('show');
        refreshHeroStats();
      } else { alert("Error saving registration."); }
    });
}

/* ---------------- ADMIN DASHBOARD ---------------- */
const adminOverlay = document.getElementById('adminOverlay');
const adminOpenLink = document.getElementById('adminOpenLink');
const adminClose = document.getElementById('adminClose');
const adminTbody = document.getElementById('adminTbody');
const adminEmpty = document.getElementById('adminEmpty');
const adminTotal = document.getElementById('adminTotal');
const adminCities = document.getElementById('adminCities');
const adminTopInterest = document.getElementById('adminTopInterest');

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
}

function formatTimestamp(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }catch(e){ return iso || '—'; }
}

async function loadAdminData(){
  if(adminTbody) adminTbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Loading...</td></tr>';
  
  const records = await fetchAllRegistrations();
  
  if(adminTotal) adminTotal.textContent = records.length;
  
  const cities = new Set(records.map(r => (r.city || '').trim().toLowerCase()).filter(Boolean));
  if(adminCities) adminCities.textContent = cities.size;

  const counts = {};
  records.forEach(r => { if(r.interest) counts[r.interest] = (counts[r.interest]||0)+1; });
  let topKey = null, topVal = 0;
  Object.keys(counts).forEach(k => { if(counts[k] > topVal){ topVal = counts[k]; topKey = k; } });
  if(adminTopInterest) adminTopInterest.textContent = topKey ? (INTEREST_LABELS[topKey] || topKey) : '—';

  if(records.length === 0){
    if(adminTbody) adminTbody.innerHTML = '';
    if(adminEmpty) adminEmpty.style.display = 'block';
    return;
  }
  if(adminEmpty) adminEmpty.style.display = 'none';

  if(adminTbody) {
      adminTbody.innerHTML = records.map(r => `
        <tr>
          <td>${escapeHtml(r.fullName || '—')}</td>
          <td>${escapeHtml(r.age || '—')}</td>
          <td>${escapeHtml(r.email || '—')}</td>
          <td>${escapeHtml(r.phone || '—')}</td>
          <td>${escapeHtml(r.city || '—')}</td>
          <td>${escapeHtml(INTEREST_LABELS[r.interest] || r.interest || '—')}</td>
          <td>${escapeHtml(formatTimestamp(r.registeredAt))}</td>
          <td><button class="admin-btn" style="padding: 4px 8px;" onclick="deleteRegistration(${r.id})">Delete</button></td>
        </tr>
      `).join('');
  }
}

async function deleteRegistration(id) {
    if (!confirm("Are you sure you want to delete this registration?")) return;
    const password = prompt("Enter Admin Password:");
    if (!password) return;
    try {
        const response = await fetch(`https://roboland-5xzc.onrender.com/registrations/${id}`, {
            method: 'DELETE', headers: { 'Authorization': password }
        });
        if (response.status === 200) { 
            alert("Deleted successfully!"); 
            loadAdminData(); 
        } else {
            alert("Failed to delete. Incorrect password.");
        }
    } catch(e) {
        alert("Deletion network error.");
    }
}

if (adminOpenLink) {
    adminOpenLink.addEventListener('click', (e) => { 
        e.preventDefault(); 
        if(adminOverlay) adminOverlay.classList.add('open'); 
        loadAdminData(); 
    });
}
if (adminClose && adminOverlay) {
    adminClose.addEventListener('click', () => adminOverlay.classList.remove('open'));
}

/* ---------------- SWIPER INITIALIZATION ---------------- */
if (typeof Swiper !== 'undefined') {
    new Swiper('.projects__container', {
      autoplay: { delay: 1400, disableOnInteraction: false },
      loop: true,
      spaceBetween: 24,
      breakpoints: { 576: { slidesPerView: 2 }, 768: { slidesPerView: 3 } },
      pagination: { el: '.swiper-pagination', clickable: true },
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    });
}

// Program Descriptions
const interestSelect = document.getElementById('interest');
const descBox = document.getElementById('interestDescription');
const descriptions = {
    "foundation": "Beginner-friendly robotics and coding sessions.",
    "challenges": "Team-based competitions to solve real tasks.",
    "mentorship": "Direct access to engineers and career guidance.",
    "school-partnership": "Collaborate with us for school robotics labs."
};
if (interestSelect && descBox) {
    interestSelect.addEventListener('change', () => {
        descBox.innerText = descriptions[interestSelect.value] || "";
        descBox.style.display = descriptions[interestSelect.value] ? 'block' : 'none';
    });
}

// Init stats counter
function animateCount(el, target) {
  const start = 0;
  const duration = 900;
  const startTime = performance.now();
  
  function step(now) {
    const p = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

async function refreshHeroStats() {
  const el = document.getElementById('statRegistered');
  if (!el) return;
  
  try {
    const response = await fetch('https://roboland-5xzc.onrender.com/registrations/count');
    const data = await response.json();
    animateCount(el, data.count);
  } catch (e) {
    console.error("Could not fetch stats", e);
    el.textContent = '0';
  }
}

/* ---------------- MEMBER LOGIN & COURSE ACCESS ENGINE ---------------- */
const loginOverlay = document.getElementById('loginOverlay');
const navLoginLink = document.getElementById('navLoginLink');
const mobileLoginLink = document.getElementById('mobileLoginLink');
const loginClose = document.getElementById('loginClose');
const courseDashboard = document.getElementById('courseDashboard');
const userGreeting = document.getElementById('userGreeting');

if (navLoginLink) {
    navLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginOverlay?.classList.add('open');
    });
}

if (mobileLoginLink) {
    mobileLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginOverlay?.classList.add('open');
        if(mobileMenu) mobileMenu.classList.remove('open');
    });
}

if (loginClose) {
    loginClose.addEventListener('click', () => {
        loginOverlay?.classList.remove('open');
    });
}

if (loginOverlay) {
    loginOverlay.addEventListener('click', (e) => {
        if (e.target === loginOverlay) {
            loginOverlay.classList.remove('open');
        }
    });
}

async function handleMemberLogin() {
    const emailInput = document.getElementById('loginEmail');
    const errDiv = document.getElementById('err-login');
    if (!emailInput) return;
    
    const email = emailInput.value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (errDiv) {
            errDiv.textContent = "Please enter a valid email address.";
            errDiv.classList.add('show');
        }
        return;
    }
    errDiv?.classList.remove('show');

    try {
        const response = await fetch('https://roboland-5xzc.onrender.com/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            sessionStorage.setItem('roboland_user', data.fullName);
            loginOverlay?.classList.remove('open');
            showCourseDashboard(data.fullName);
        } else {
            if (errDiv) {
                errDiv.textContent = data.message || "Email not registered.";
                errDiv.classList.add('show');
            }
        }
    } catch (e) {
        console.error("Login request error:", e);
        if (errDiv) {
            errDiv.textContent = "Connection failed. Please try again.";
            errDiv.classList.add('show');
        }
    }
}

function showCourseDashboard(name) {
    if (userGreeting) userGreeting.textContent = `Welcome back, ${name}!`;
    if (courseDashboard) {
        courseDashboard.style.display = 'block';
        courseDashboard.scrollIntoView({ behavior: 'smooth' });
    }
}

function handleLogout() {
    sessionStorage.removeItem('roboland_user');
    if (courseDashboard) courseDashboard.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('DOMContentLoaded', () => {
    const savedUser = sessionStorage.getItem('roboland_user');
    if (savedUser) {
        showCourseDashboard(savedUser);
    }
});

refreshHeroStats();

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
// saveRegistration function
async function saveRegistration(record) {
  const response = await fetch('http://localhost:5000/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  return await response.json();
}

// Replace existing fetchAllRegistrations function To secure your dashboard
async function fetchAllRegistrations() {
  // Prompt the user for the password when they open the dashboard
  const password = prompt("Enter Admin Password:");
  
  if (!password) return []; // If they cancel, return empty list

  const response = await fetch('http://localhost:5000/registrations', {
    headers: { 'Authorization': password }
  });

  if (response.status === 401) {
    alert("Unauthorized access. Access Denied.");
    return [];
  }
  
  return await response.json();
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

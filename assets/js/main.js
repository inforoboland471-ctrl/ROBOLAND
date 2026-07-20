/*============================================================================
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
  const response = await fetch('https://roboland-5xzc.onrender.com/registrations', {
    headers: { 'Authorization': password }
  });
  if (response.status === 401) { alert("Unauthorized access."); return []; }
  return await response.json();
}

/* ---------------- UI & ANIMATIONS ---------------- */
const announce = document.getElementById('announce');
if(announce) {
    document.getElementById('announceClose').addEventListener('click', () => { announce.style.display = 'none'; });
}

// Mobile Nav
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
navToggle.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});

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
  gsap.registerPlugin(TextPlugin);
  
  // Typewriter
  const phrases = ["one build at a time.", "one circuit at a time.", "one line of code at a time.", "one robot at a time."];
  gsap.set("#main-heading", { opacity: 0, y: 15 });
  gsap.set("#walk-text", { text: "" });
  let tl = gsap.timeline();
  tl.to("#main-heading", { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
  let loopTl = gsap.timeline({ repeat: -1 });
  phrases.forEach((phrase) => {
    let wordTl = gsap.timeline({ repeat: 1, yoyo: true, repeatDelay: 1.8 });
    wordTl.to("#walk-text", { duration: phrase.length * 0.05, text: { value: phrase, delimiter: "" }, ease: "none" });
    loopTl.add(wordTl);
  });
  tl.add(loopTl);

  // Ticker
  gsap.to("#tickerText", { xPercent: 50, ease: "none", duration: 10, repeat: -1, modifiers: { xPercent: gsap.utils.unitize(x => parseFloat(x) % 50) } });
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
  if(document.getElementById('fullName').value.trim().length < 2) { showError('fullName', true); valid = false; } else showError('fullName', false);
  if(!document.getElementById('interest').value) { showError('interest', true); valid = false; } else showError('interest', false);
  return valid;
}

form.addEventListener('submit', async function(e){
  e.preventDefault();
  if(!validate()) return;
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
  submitBtn.disabled = false;
  submitBtn.classList.remove('loading');
  if (result.ok) {
    successName.textContent = `Welcome to Roboland, ${record.fullName.split(' ')[0]}.`;
    formWrap.style.display = 'none';
    successBox.classList.add('show');
    refreshHeroStats();
  } else { alert("Error saving registration."); }
});

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
  adminTbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Loading...</td></tr>';
  
  const records = await fetchAllRegistrations();
  
  // 1. Update the Total Registrations
  adminTotal.textContent = records.length;
  
  // 2. Update the Unique Cities count
  const cities = new Set(records.map(r => (r.city || '').trim().toLowerCase()).filter(Boolean));
  adminCities.textContent = cities.size;

  // 3. Calculate the Top Interest Area
  const counts = {};
  records.forEach(r => { if(r.interest) counts[r.interest] = (counts[r.interest]||0)+1; });
  let topKey = null, topVal = 0;
  Object.keys(counts).forEach(k => { if(counts[k] > topVal){ topVal = counts[k]; topKey = k; } });
  adminTopInterest.textContent = topKey ? (INTEREST_LABELS[topKey] || topKey) : '—';

  // 4. Render the Table or Empty State
  if(records.length === 0){
    adminTbody.innerHTML = '';
    if(adminEmpty) adminEmpty.style.display = 'block';
    return;
  }
  if(adminEmpty) adminEmpty.style.display = 'none';

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

async function deleteRegistration(id) {
    if (!confirm("Are you sure you want to delete this registration?")) return;
    const password = prompt("Enter Admin Password:");
    const response = await fetch(`https://roboland-5xzc.onrender.com/registrations/${id}`, {
        method: 'DELETE', headers: { 'Authorization': password }
    });
    if (response.status === 200) { 
        alert("Deleted successfully!"); 
        loadAdminData(); 
    } else {
        alert("Failed to delete. Incorrect password.");
    }
}

adminOpenLink.addEventListener('click', (e) => { 
    e.preventDefault(); 
    adminOverlay.classList.add('open'); 
    loadAdminData(); 
});
adminClose.addEventListener('click', () => adminOverlay.classList.remove('open'));

/* ---------------- SWIPER INITIALIZATION ---------------- */
const swiper = new Swiper('.projects__container', {
  autoplay: { delay: 1400, disableOnInteraction: false },
  loop: true,
  spaceBetween: 24,
  breakpoints: { 576: { slidesPerView: 2 }, 768: { slidesPerView: 3 } },
  pagination: { el: '.swiper-pagination', clickable: true },
  navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
});

// Program Descriptions
const interestSelect = document.getElementById('interest');
const descBox = document.getElementById('interestDescription');
const descriptions = {
    "foundation": "Beginner-friendly robotics and coding sessions.",
    "challenges": "Team-based competitions to solve real tasks.",
    "mentorship": "Direct access to engineers and career guidance.",
    "school-partnership": "Collaborate with us for school robotics labs."
};
if (interestSelect) {
    interestSelect.addEventListener('change', () => {
        descBox.innerText = descriptions[interestSelect.value] || "";
        descBox.style.display = descriptions[interestSelect.value] ? 'block' : 'none';
    });
}

// Init stats
function animateCount(el, target) {
  const start = 0;
  const duration = 900;
  const startTime = performance.now();
  
  function step(now) {
    const p = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // Cubic ease-out
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
const mobileMenu = document.getElementById('mobileMenu');
const courseDashboard = document.getElementById('courseDashboard');
const userGreeting = document.getElementById('userGreeting');

// Open/Close Login Modal triggers safely
if (navLoginLink) {
    navLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginOverlay?.classList.add('open');
    });
}

// Safely attach mobile listener only if the element actually exists
if (mobileLoginLink) {
    mobileLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginOverlay?.classList.add('open');
        mobileMenu?.classList.remove('open');
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

// Handle User Authentication Submission
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

// Auto-login check on page reload if session exists
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = sessionStorage.getItem('roboland_user');
    if (savedUser) {
        showCourseDashboard(savedUser);
    }
});

// Run this on page load
refreshHeroStats();

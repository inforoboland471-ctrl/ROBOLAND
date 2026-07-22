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

const descriptions = {
  "foundation": "Beginner-friendly robotics and coding sessions.",
  "challenges": "Team-based competitions to solve real tasks.",
  "mentorship": "Direct access to engineers and career guidance.",
  "school-partnership": "Collaborate with us for school robotics labs."
};

let lastLoaded = [];

/* ---------------- BACKEND API INTERACTION ---------------- */
async function saveRegistration(record) {
  try {
    const response = await fetch('https://roboland-5xzc.onrender.com/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
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
    if (response.status === 401) { alert("Unauthorized access. Access Denied."); return []; }
    return await response.json();
  } catch (e) {
    console.error('Fetch registrations failed:', e);
    return [];
  }
}

async function deleteRegistration(id) {
  if (!confirm("Are you sure you want to delete this registration?")) return;
  const password = prompt("Enter Admin Password:");
  if (!password) return;
  try {
    const response = await fetch(`https://roboland-5xzc.onrender.com/registrations/${id}`, {
      method: 'DELETE', 
      headers: { 'Authorization': password }
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

    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
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

// GSAP Animations & Typewriter
window.addEventListener("load", () => {
  if (typeof gsap === "undefined") return;
  if (typeof TextPlugin !== "undefined") gsap.registerPlugin(TextPlugin);
  
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
  const ageEl = document.getElementById('age');
  const emailEl = document.getElementById('email');
  const phoneEl = document.getElementById('phone');
  const cityEl = document.getElementById('city');
  const interestEl = document.getElementById('interest');
  const termsEl = document.getElementById('terms');
  
  if(fullNameEl && fullNameEl.value.trim().length < 2) { showError('fullName', true); valid = false; } else { showError('fullName', false); }
  if(ageEl && (!ageEl.value || ageEl.value < 5 || ageEl.value > 99)) { showError('age', true); valid = false; } else { showError('age', false); }
  if(emailEl && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) { showError('email', true); valid = false; } else { showError('email', false); }
  if(phoneEl && !/^[6-9]\d{9}$/.test(phoneEl.value.trim().replace(/\D/g,''))) { showError('phone', true); valid = false; } else { showError('phone', false); }
  if(cityEl && cityEl.value.trim().length < 2) { showError('city', true); valid = false; } else { showError('city', false); }
  if(interestEl && !interestEl.value) { showError('interest', true); valid = false; } else { showError('interest', false); }
  
  if(termsEl) {
    const errTerms = document.getElementById('err-terms');
    if(errTerms) errTerms.classList.toggle('show', !termsEl.checked);
    if(!termsEl.checked) valid = false;
  }

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
      if (result.ok || result.success) {
        if(successName) successName.textContent = `Welcome to Roboland, ${record.fullName.split(' ')[0]}. We'll be in touch with next steps soon.`;
        if(formWrap) formWrap.style.display = 'none';
        if(successBox) successBox.classList.add('show');
        refreshHeroStats();
      } else { alert("Error saving registration."); }
    });
}

function resetForm(){
  if(form) form.reset();
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('show'));
  if(successBox) successBox.classList.remove('show');
  if(formWrap) formWrap.style.display = 'block';
}

/* ---------------- PROGRAM DESCRIPTION DYNAMIC SELECT ---------------- */
const interestSelect = document.getElementById('interest');
const descBox = document.getElementById('interestDescription');
if (interestSelect && descBox) {
    interestSelect.addEventListener('change', () => {
        descBox.innerText = descriptions[interestSelect.value] || "";
        descBox.style.display = descriptions[interestSelect.value] ? 'block' : 'none';
    });
}

/* ---------------- ADMIN DASHBOARD ---------------- */
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

function escapeHtml(str){
  return String(str || '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
}

function formatTimestamp(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {day:'2-digit', month:'short', year:'numeric'}) + ' ' + d.toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit'});
  }catch(e){ return iso || '—'; }
}

async function loadAdminData(){
  if(adminTbody) adminTbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Loading...</td></tr>';
  if(adminEmpty) adminEmpty.style.display = 'none';
  
  const records = await fetchAllRegistrations();
  lastLoaded = records;
  
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
          <td><button class="admin-btn" style="padding: 4px 8px;" onclick="deleteRegistration('${r.id || r._id}')">Delete</button></td>
        </tr>
      `).join('');
  }
}

function exportCsv(){
  if(!lastLoaded.length){ return; }
  const headers = ['Full name','Age','Email','Phone','City','Interest area','Registered at'];
  const rows = lastLoaded.map(r => [
    r.fullName, r.age, r.email, r.phone, r.city,
    INTEREST_LABELS[r.interest] || r.interest, r.registeredAt
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell==null?'':cell).replace(/"/g,'""')}"`).join(','))
    .join('\n');
    
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
if (adminOverlay) {
    adminOverlay.addEventListener('click', (e) => {
        if(e.target === adminOverlay) adminOverlay.classList.remove('open');
    });
}
if (adminRefresh) adminRefresh.addEventListener('click', loadAdminData);
if (adminExport) adminExport.addEventListener('click', exportCsv);

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

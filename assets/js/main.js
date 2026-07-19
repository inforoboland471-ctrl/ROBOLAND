/*============================================================================
  ==================== ROBOLAND CORE CONFIGURATION & LOGIC ====================
  ============================================================================*/

/* ---------------- STORAGE & BACKEND ---------------- */
const INTEREST_LABELS = {
  foundation: 'Foundation Labs',
  challenges: 'Build Challenges',
  mentorship: 'Mentor Network',
  'school-partnership': 'School Partnership'
};

// --- Backend API Integration ---
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
  if (response.status === 401) { alert("Unauthorized."); return []; }
  return await response.json();
}

/* ---------------- UI & ANIMATIONS ---------------- */
const announce = document.getElementById('announce');
if(announce) {
    document.getElementById('announceClose').addEventListener('click', () => { announce.style.display = 'none'; });
}

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
}

// GSAP Animations
window.addEventListener("load", () => {
    if (typeof gsap !== "undefined") {
        gsap.registerPlugin(TextPlugin);
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
  const fields = ['fullName', 'age', 'email', 'phone', 'city', 'interest'];
  fields.forEach(id => {
      const el = document.getElementById(id);
      if(!el.value.trim()){ showError(id, true); valid = false; } else showError(id, false);
  });
  const terms = document.getElementById('terms').checked;
  document.getElementById('err-terms').classList.toggle('show', !terms);
  if(!terms) valid = false;
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
  } else { alert("Error saving registration."); }
});

/* ---------------- ADMIN DASHBOARD & SWIPER ---------------- */
// Admin logic remains the same...
// [Add your loadAdminData, deleteRegistration, and exportCsv functions here]

// Swiper Init
const swiper = new Swiper('.projects__container', {
  autoplay: { delay: 1400, disableOnInteraction: false },
  loop: true,
  spaceBetween: 24,
  breakpoints: { 576: { slidesPerView: 2 }, 768: { slidesPerView: 3 } },
  pagination: { el: '.swiper-pagination', clickable: true },
  navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
});

// Program Logic
const interestSelect = document.getElementById('interest');
const descBox = document.getElementById('interestDescription');
const descriptions = {
    "foundation": "Foundation Labs: Beginner-friendly robotics...",
    "challenges": "Build Challenges: Team-based competitions...",
    "mentorship": "Mentor Network: Direct access to engineers...",
    "school-partnership": "School Partnership: Collaborate with us..."
};
if (interestSelect) {
    interestSelect.addEventListener('change', () => {
        descBox.innerText = descriptions[interestSelect.value] || "";
        descBox.style.display = descriptions[interestSelect.value] ? 'block' : 'none';
    });
}

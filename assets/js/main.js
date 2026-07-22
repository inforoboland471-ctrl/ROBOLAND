/*============================================================================
 ==================== ROBOLAND CORE CONFIGURATION & LOGIC ====================
 ============================================================================*/

const API_URL = 'https://roboland-5xzc.onrender.com';
let currentAdminToken = null; // Temporarily stores admin password while dashboard is open

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
        const response = await fetch(`${API_URL}/registrations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
        const data = await response.json();
        return { ok: response.ok, data };
    } catch (e) {
        console.error('Registration API failed:', e);
        return { ok: false, data: { message: "Network connection failed. Please check your internet." } };
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
        entries.forEach(entry => { 
            if(entry.isIntersecting){ 
                entry.target.classList.add('in-view'); 
                io.unobserve(entry.target); 
            } 
        });
    }, {threshold:0.15});
    revealEls.forEach(el => io.observe(el));
} else { 
    revealEls.forEach(el => el.classList.add('in-view')); 
}

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

function showError(id, show) {
    const input = document.getElementById(id);
    const err = document.getElementById('err-' + id);
    if(input) input.classList.toggle('invalid', show);
    if(err) err.classList.toggle('show', show);
}

function validate() {
    let valid = true;
    const fields = {
        fullName: document.getElementById('fullName')?.value.trim(),
        age: parseInt(document.getElementById('age')?.value),
        email: document.getElementById('email')?.value.trim(),
        phone: document.getElementById('phone')?.value.trim(),
        city: document.getElementById('city')?.value.trim(),
        interest: document.getElementById('interest')?.value,
        terms: document.getElementById('terms')?.checked
    };
    
    if(!fields.fullName || fields.fullName.length < 2) { showError('fullName', true); valid = false; } else { showError('fullName', false); }
    if(isNaN(fields.age) || fields.age < 5 || fields.age > 99) { showError('age', true); valid = false; } else { showError('age', false); }
    if(!fields.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) { showError('email', true); valid = false; } else { showError('email', false); }
    if(!fields.phone || fields.phone.length < 10) { showError('phone', true); valid = false; } else { showError('phone', false); }
    if(!fields.city) { showError('city', true); valid = false; } else { showError('city', false); }
    if(!fields.interest) { showError('interest', true); valid = false; } else { showError('interest', false); }
    
    // Terms check
    const errTerms = document.getElementById('err-terms');
    if(!fields.terms) { 
        if(errTerms) errTerms.classList.add('show'); 
        valid = false; 
    } else { 
        if(errTerms) errTerms.classList.remove('show'); 
    }

    return valid;
}

if (form) {
    form.addEventListener('submit', async function(e){
        e.preventDefault();
        
        // Remove any previous general errors
        const existingGenErr = document.getElementById('general-error');
        if (existingGenErr) existingGenErr.remove();

        if(!validate()) return;
        
        if(submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
        }

        const record = {
            fullName: document.getElementById('fullName').value.trim(),
            age: parseInt(document.getElementById('age').value),
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
        } else { 
            // Display backend error message above the button
            const errorDiv = document.createElement('div');
            errorDiv.id = 'general-error';
            errorDiv.className = 'error-msg show';
            errorDiv.style.marginBottom = '15px';
            errorDiv.style.textAlign = 'center';
            errorDiv.textContent = result.data.message || "An error occurred while saving your registration.";
            submitBtn.parentNode.insertBefore(errorDiv, submitBtn);
        }
    });
}

function resetForm() {
    form.reset();
    if(formWrap) formWrap.style.display = 'block';
    if(successBox) successBox.classList.remove('show');
}

/* ---------------- ADMIN DASHBOARD ---------------- */
const adminOverlay = document.getElementById('adminOverlay');
const adminOpenLink = document.getElementById('adminOpenLink');
const adminClose = document.getElementById('adminClose');
const adminRefresh = document.getElementById('adminRefresh');
const adminExport = document.getElementById('adminExport');
const adminTbody = document.getElementById('adminTbody');
const adminEmpty = document.getElementById('adminEmpty');

let currentAdminData = []; 

function escapeHtml(str){
    return String(str || '').replace(/[&<>"']/g, ch => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[ch]));
}

function formatTimestamp(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    } catch(e) { 
        return iso;
    }
}

async function loadAdminData(forcePrompt = false) {
    if (!currentAdminToken || forcePrompt) {
        currentAdminToken = prompt("Enter Admin Password:");
    }
    
    if (!currentAdminToken) {
        adminOverlay?.classList.remove('open');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/registrations`, {
            headers: { 'Authorization': currentAdminToken }
        });

        if (response.status === 401) {
            alert("Unauthorized access. Incorrect password.");
            currentAdminToken = null; // Clear bad token
            adminOverlay?.classList.remove('open');
            return;
        }

        const records = await response.json();
        currentAdminData = records; // Save the data for exporting
        renderAdminTable(records);
    } catch (e) {
        alert("Failed to load registrations. Check network connection.");
    }
}

function renderAdminTable(records) {
    // Update Stats
    document.getElementById('adminTotal').textContent = records.length;
    
    const cities = new Set(records.map(r => r.city.toLowerCase()));
    document.getElementById('adminCities').textContent = cities.size;

    // Calculate top interest
    if (records.length > 0) {
        const interests = records.map(r => r.interest);
        const mostFrequent = interests.sort((a,b) =>
            interests.filter(v => v===a).length - interests.filter(v => v===b).length
        ).pop();
        document.getElementById('adminTopInterest').textContent = INTEREST_LABELS[mostFrequent] || mostFrequent;
    } else {
        document.getElementById('adminTopInterest').textContent = "—";
    }

    // Render Table
    if(records.length === 0){
        if(adminTbody) adminTbody.innerHTML = '';
        if(adminEmpty) adminEmpty.style.display = 'block';
        return;
    }
    
    if(adminEmpty) adminEmpty.style.display = 'none';
    if(adminTbody) {
        adminTbody.innerHTML = records.map(r => `
            <tr>
                <td>${escapeHtml(r.fullName)}</td>
                <td>${escapeHtml(r.age)}</td>
                <td>${escapeHtml(r.email)}</td>
                <td>${escapeHtml(r.phone)}</td>
                <td>${escapeHtml(r.city)}</td>
                <td>${escapeHtml(INTEREST_LABELS[r.interest] || r.interest)}</td>
                <td>${escapeHtml(formatTimestamp(r.registeredAt))}</td>
                <td><button class="admin-btn" style="padding: 4px 8px; color: #ff4d4d; border-color: #ff4d4d;" onclick="deleteRegistration(${r.id})">Delete</button></td>
            </tr>
        `).join('');
    }
}

async function deleteRegistration(id) {
    if (!confirm("Are you sure you want to delete this registration? This cannot be undone.")) return;
    
    if (!currentAdminToken) {
        currentAdminToken = prompt("Enter Admin Password:");
        if (!currentAdminToken) return;
    }

    try {
        const response = await fetch(`${API_URL}/registrations/${id}`, {
            method: 'DELETE', 
            headers: { 'Authorization': currentAdminToken }
        });
        
        if (response.status === 200) { 
            loadAdminData(); // Refresh table
        } else if (response.status === 401) {
            alert("Unauthorized. Incorrect password.");
            currentAdminToken = null;
        } else {
            alert("Failed to delete record.");
        }
    } catch(e) {
        alert("Network error while trying to delete.");
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
    adminClose.addEventListener('click', () => {
        adminOverlay.classList.remove('open');
        currentAdminToken = null; // Clear token on close for security
    });
}
if (adminRefresh) {
    adminRefresh.addEventListener('click', () => loadAdminData());
}

// CSV Export Function
function downloadCSV() {
    if (!currentAdminData || currentAdminData.length === 0) {
        alert("No data available to export.");
        return;
    }

    // 1. Create the CSV headers
    const headers = ["Name", "Age", "Email", "Phone", "City", "Interest Area", "Registration Date"];
    const csvRows = [headers.join(',')];

    // 2. Loop through the data and format each row
    for (const row of currentAdminData) {
        const values = [
            `"${(row.fullName || '').replace(/"/g, '""')}"`,
            row.age,
            `"${(row.email || '').replace(/"/g, '""')}"`,
            `"${(row.phone || '').replace(/"/g, '""')}"`,
            `"${(row.city || '').replace(/"/g, '""')}"`,
            `"${(INTEREST_LABELS[row.interest] || row.interest || '').replace(/"/g, '""')}"`,
            `"${formatTimestamp(row.registeredAt)}"`
        ];
        csvRows.push(values.join(','));
    }

    // 3. Create a Blob (file) from the CSV string
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    // 4. Create a hidden link and click it to trigger download
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Roboland_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Attach the function to the Export button
if (adminExport) {
    adminExport.addEventListener('click', downloadCSV);
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
if (interestSelect && descBox) {
    interestSelect.addEventListener('change', () => {
        descBox.innerText = INTEREST_LABELS[interestSelect.value] ? 
            {
                "foundation": "Beginner-friendly robotics and coding sessions.",
                "challenges": "Team-based competitions to solve real tasks.",
                "mentorship": "Direct access to engineers and career guidance.",
                "school-partnership": "Collaborate with us for school robotics labs."
            }[interestSelect.value] : "";
        descBox.style.display = descBox.innerText ? 'block' : 'none';
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
        const response = await fetch(`${API_URL}/registrations/count`);
        const data = await response.json();
        animateCount(el, data.count);
    } catch (e) {
        console.error("Could not fetch stats", e);
        el.textContent = '—';
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

async function handleMemberLogin() {
    const emailInput = document.getElementById('loginEmail');
    const errDiv = document.getElementById('err-login');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
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
    if(loginSubmitBtn) loginSubmitBtn.classList.add('loading');

    try {
        const response = await fetch(`${API_URL}/login`, {
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
            errDiv.textContent = "Connection failed. Please check your internet.";
            errDiv.classList.add('show');
        }
    } finally {
        if(loginSubmitBtn) loginSubmitBtn.classList.remove('loading');
    }
}

function showCourseDashboard(name) {
    if (userGreeting) userGreeting.textContent = `Welcome back, ${name.split(' ')[0]}!`;
    if (courseDashboard) {
        // Show the dashboard
        courseDashboard.style.display = 'block';
        
        // Hide the main hero section
        const heroSection = document.querySelector('.hero');
        if (heroSection) heroSection.style.display = 'none';

        // Scroll to the very top of the page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function handleLogout() {
    // Clear the session
    sessionStorage.removeItem('roboland_user');
    
    // Hide the dashboard
    if (courseDashboard) courseDashboard.style.display = 'none';
    
    // Bring the hero section back
    const heroSection = document.querySelector('.hero');
    if (heroSection) heroSection.style.display = 'block';
    
    // Scroll back to the top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('DOMContentLoaded', () => {
    const savedUser = sessionStorage.getItem('roboland_user');
    if (savedUser) {
        showCourseDashboard(savedUser);
    }
});

// Initial boot
refreshHeroStats();

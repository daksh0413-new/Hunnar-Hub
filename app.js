// ============================================================
// HUNNAR HOUSE — ATELIER CORE CONTROLLER
// ============================================================

// 1. SCROLL-REACTIVE HEADER
const topNav = document.getElementById("topNav");

window.addEventListener("scroll", () => {
  if (window.scrollY > 20) {
    topNav.classList.add("scrolled");
  } else {
    topNav.classList.remove("scrolled");
  }
});

// 2. SCROLL REVEAL OBSERVER
const revealElements = document.querySelectorAll(".scroll-reveal");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15
});

revealElements.forEach((el) => revealObserver.observe(el));

// 3. COUNTDOWN TIMER (Exactly 15 Days from today: Nov 2, 2026, 15:00:00 IST)
const launchDate = new Date("Nov 2, 2026 15:00:00").getTime();

const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");

function updateCountdown() {
  const now = new Date().getTime();
  const distance = launchDate - now;

  if (distance <= 0) {
    if (daysEl) daysEl.innerText = "00";
    if (hoursEl) hoursEl.innerText = "00";
    if (minutesEl) minutesEl.innerText = "00";
    if (secondsEl) secondsEl.innerText = "00";
    clearInterval(timerInterval);
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  if (daysEl) daysEl.innerText = String(days).padStart(2, "0");
  if (hoursEl) hoursEl.innerText = String(hours).padStart(2, "0");
  if (minutesEl) minutesEl.innerText = String(minutes).padStart(2, "0");
  if (secondsEl) secondsEl.innerText = String(seconds).padStart(2, "0");
}

updateCountdown();
const timerInterval = setInterval(updateCountdown, 1000);

// 4. EMAIL WAITLIST INTERACTION
const notifyForm = document.getElementById("notifyForm");
const emailInput = document.getElementById("emailInput");
const submitBtn = document.getElementById("submitBtn");
const feedback = document.getElementById("formFeedback");

if (notifyForm) {
  notifyForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!email) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subscribing...';
    feedback.className = "form-feedback";
    feedback.innerText = "";

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Notify Me';
      feedback.className = "form-feedback success";
      feedback.innerHTML = '<i class="fa-solid fa-check"></i> Thank you! You have been added to our opening list.';
      emailInput.value = "";
    }, 600);
  });
}

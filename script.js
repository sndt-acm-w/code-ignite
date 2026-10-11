/**
 * Code Ignite — ACM-W SNDT UMIT
 * script.js — Vanilla JavaScript
 *
 * Handles:
 *  1. Registration CTA
 *  2. Navbar hamburger menu
 *  3. Learn carousel (arrows, dots, drag, scroll-snap)
 *  4. Scroll-reveal (IntersectionObserver)
 *  5. Navbar close on link click (mobile)
 *  6. Smooth active states
 */

'use strict';

/* ============================================================
   CONFIG
   ============================================================ */

const GOOGLE_FORM_URL = "PASTE_GOOGLE_FORM_URL_HERE";

/* ============================================================
   1. REGISTRATION BUTTON
   ============================================================ */

const registerBtn = document.getElementById('register-btn');

if (registerBtn) {
  registerBtn.addEventListener('click', () => {
    if (GOOGLE_FORM_URL && GOOGLE_FORM_URL !== "PASTE_GOOGLE_FORM_URL_HERE") {
      window.open(GOOGLE_FORM_URL, '_blank', 'noopener noreferrer');
    } else {
      // Friendly placeholder behaviour — remove when real URL is pasted
      alert('Registration link coming soon! Stay tuned. ✦');
    }
  });
}

/* ============================================================
   2. NAVBAR HAMBURGER
   ============================================================ */

const hamburgerBtn  = document.getElementById('hamburger-btn');
const mobileMenu    = document.getElementById('mobile-menu');
const mobileLinks   = mobileMenu ? mobileMenu.querySelectorAll('.navbar__mobile-link') : [];

function toggleMobileMenu() {
  if (!hamburgerBtn || !mobileMenu) return;
  const isOpen = hamburgerBtn.classList.toggle('open');
  mobileMenu.classList.toggle('open', isOpen);
  hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
  mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeMobileMenu() {
  if (!hamburgerBtn || !mobileMenu) return;
  hamburgerBtn.classList.remove('open');
  mobileMenu.classList.remove('open');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

if (hamburgerBtn) {
  hamburgerBtn.addEventListener('click', toggleMobileMenu);
}

mobileLinks.forEach(link => {
  link.addEventListener('click', closeMobileMenu);
});

// Close mobile menu on outside click
document.addEventListener('click', (e) => {
  if (
    mobileMenu &&
    mobileMenu.classList.contains('open') &&
    !mobileMenu.contains(e.target) &&
    !hamburgerBtn.contains(e.target)
  ) {
    closeMobileMenu();
  }
});

// Close on resize to desktop
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    closeMobileMenu();
  }
});

/* ============================================================
   3. LEARN CAROUSEL
   ============================================================ */

(function initCarousel() {
  const carousel   = document.getElementById('learn-carousel');
  const cards      = document.getElementById('learn-cards');
  const prevBtn    = document.getElementById('carousel-prev');
  const nextBtn    = document.getElementById('carousel-next');
  const dotsWrap   = document.getElementById('carousel-dots');

  if (!carousel || !cards || !prevBtn || !nextBtn || !dotsWrap) return;

  const cardEls     = Array.from(cards.querySelectorAll('.learn__card'));
  const totalCards  = cardEls.length;

  // Determine visible cards based on viewport
  function getVisibleCount() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  let currentIndex = 0;

  // Build dots
  function buildDots() {
    dotsWrap.innerHTML = '';
    const steps = totalCards - getVisibleCount() + 1;
    for (let i = 0; i < steps; i++) {
      const btn = document.createElement('button');
      btn.className = 'learn__dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', `Go to card ${i + 1}`);
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => scrollToIndex(i));
      dotsWrap.appendChild(btn);
    }
  }

  function updateDots(index) {
    const dots = dotsWrap.querySelectorAll('.learn__dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
  }

  function scrollToIndex(index) {
    const visibleCount = getVisibleCount();
    const maxIndex = totalCards - visibleCount;
    currentIndex = Math.max(0, Math.min(index, maxIndex));

    const cardEl   = cardEls[currentIndex];
    const scrollLeft = cardEl.offsetLeft - cards.parentElement.offsetLeft - 4;

    carousel.scrollTo({ left: scrollLeft, behavior: 'smooth' });

    updateDots(currentIndex);
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;
  }

  prevBtn.addEventListener('click', () => scrollToIndex(currentIndex - 1));
  nextBtn.addEventListener('click', () => scrollToIndex(currentIndex + 1));

  // Track scroll to update index & dots
  let scrollTimeout;
  carousel.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const scrollLeft    = carousel.scrollLeft;
      const cardWidth     = cardEls[0].offsetWidth + 20; // gap: 20px
      const newIndex      = Math.round(scrollLeft / cardWidth);
      const visibleCount  = getVisibleCount();
      const maxIndex      = totalCards - visibleCount;

      currentIndex = Math.max(0, Math.min(newIndex, maxIndex));
      updateDots(currentIndex);
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex >= maxIndex;
    }, 80);
  });

  // Drag to scroll (mouse)
  let isDown     = false;
  let startX     = 0;
  let scrollStart = 0;

  carousel.addEventListener('mousedown', (e) => {
    isDown      = true;
    startX      = e.pageX - carousel.offsetLeft;
    scrollStart = carousel.scrollLeft;
    carousel.classList.add('dragging');
  });

  document.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    carousel.classList.remove('dragging');
    // Snap to nearest after drag
    const cardWidth    = cardEls[0].offsetWidth + 20;
    const newIndex     = Math.round(carousel.scrollLeft / cardWidth);
    scrollToIndex(newIndex);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x          = e.pageX - carousel.offsetLeft;
    const walk       = (x - startX) * 1.2;
    carousel.scrollLeft = scrollStart - walk;
  });

  // Keyboard navigation
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  scrollToIndex(currentIndex - 1);
    if (e.key === 'ArrowRight') scrollToIndex(currentIndex + 1);
  });

  // Re-init on resize
  window.addEventListener('resize', () => {
    buildDots();
    scrollToIndex(0);
  });

  // Initial build
  buildDots();
  prevBtn.disabled = true;
})();

/* ============================================================
   4. SCROLL REVEAL — IntersectionObserver
   ============================================================ */

(function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal, .reveal-left');

  if (!revealEls.length) return;

  // If reduced motion is preferred, just make everything visible
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealEls.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // animate once
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  revealEls.forEach(el => observer.observe(el));
})();

/* ============================================================
   5. NAVBAR — Active link highlight on scroll
   ============================================================ */

(function initNavHighlight() {
  const navLinks  = document.querySelectorAll('.navbar__link');
  const sections  = Array.from(navLinks)
    .map(link => {
      const href = link.getAttribute('href');
      return href ? document.querySelector(href) : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const isActive = link.getAttribute('href') === `#${id}`;
          link.style.background = isActive ? 'var(--ice-blue)' : '';
          link.style.color = isActive ? 'var(--navy-deep)' : '';
        });
      }
    });
  }, {
    threshold: 0.4
  });

  sections.forEach(section => observer.observe(section));
})();

/* ============================================================
   6. HERO — Stagger animation on load
   ============================================================ */

(function initHeroAnimation() {
  // All hero children that don't already have CSS animation-delay
  const heroContent = document.querySelector('.hero__content');
  if (!heroContent) return;

  // Already handled via CSS animation-delay on individual elements
  // Just ensure the section is visible
  heroContent.style.visibility = 'visible';
})();

/* ============================================================
   7. JOURNEY TICKETS — Stagger on scroll
   ============================================================ */

(function initTicketAnimation() {
  const tickets = document.querySelectorAll('.journey__ticket');

  if (!tickets.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'ticket-slide 0.5s ease both';
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  tickets.forEach((ticket, i) => {
    ticket.style.animationDelay = `${i * 0.12}s`;
    observer.observe(ticket);
  });
})();

/* ============================================================
   8. SMOOTH SCROLL for anchor links
   ============================================================ */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const targetId  = this.getAttribute('href');
    const target    = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();
    const navHeight = document.querySelector('.navbar')?.offsetHeight || 68;
    const top       = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;

    window.scrollTo({ top, behavior: 'smooth' });
  });
});

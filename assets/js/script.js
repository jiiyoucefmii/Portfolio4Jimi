'use strict';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis
const lenis = new Lenis({
  lerp: 0.1,
  duration: 1.2,
  smoothWheel: true
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Sync ScrollTrigger with Lenis
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.lagSmoothing(0);

// Global Scroll State Refresher
function refreshScrollState() {
  lenis.resize();
  ScrollTrigger.refresh();
}

window.addEventListener('load', refreshScrollState);

// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });



// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
  if (modalContainer) modalContainer.classList.toggle("active");
  if (overlay) overlay.classList.toggle("active");
}

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {

  testimonialsItem[i].addEventListener("click", function () {

    if (modalImg) {
      modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
      modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    }
    if (modalTitle) modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    if (modalText) modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;

    testimonialsModalFunc();

  });

}

// add click event to modal close button
if (modalCloseBtn) modalCloseBtn.addEventListener("click", testimonialsModalFunc);
if (overlay) overlay.addEventListener("click", testimonialsModalFunc);



// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select.addEventListener("click", function () {
  elementToggleFunc(this);

  if (this.classList.contains("active")) {
    wiggleDesignSystemsTab(mobileBeamTabs);
  }
});

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedValue);

  });
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {

  for (let i = 0; i < filterItems.length; i++) {

    if (selectedValue === "all") {
      filterItems[i].classList.add("active");
    } else if (selectedValue === filterItems[i].dataset.category) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }

  }

}

// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0];

for (let i = 0; i < filterBtn.length; i++) {

  filterBtn[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    filterFunc(selectedValue);

    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;

  });

}



// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {

    // check form validation
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }

  });
}



// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");
const desktopBeamTabs = document.querySelectorAll(".filter-list .beam-tab");
const mobileBeamTabs = document.querySelectorAll(".select-list .beam-tab");

const wiggleDesignSystemsTab = function (tabs) {
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove("is-wiggling");
    void tabs[i].offsetWidth;
    tabs[i].classList.add("is-wiggling");
  }
};

// Page lifecycle animation contexts
let aboutCtx, resumeCtx, portfolioMM, contactCtx;

function initAboutPage() {
  aboutCtx = gsap.context(() => {
    // Pin and scale-down hero text
    gsap.timeline({
      scrollTrigger: {
        trigger: ".hero-container",
        start: "top 15%",
        end: "+=60%",
        pin: true,
        anticipatePin: 1,
        scrub: 1,
        invalidateOnRefresh: true,
      }
    }).to(".about-text", {
      scale: 0.9,
      opacity: 0.7,
      ease: "power1.inOut"
    });

    // Stagger reveal service items
    gsap.from(".service-item", {
      opacity: 0,
      y: 40,
      stagger: 0.15,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".service-list",
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });
  }, document.querySelector('[data-page="about"]'));
}

function teardownAboutPage() {
  aboutCtx?.revert();
}

function initResumePage() {
  resumeCtx = gsap.context(() => {
    // Stagger reveal education and experience timeline items
    gsap.from(".timeline-item", {
      opacity: 0,
      y: 30,
      stagger: 0.1,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".timeline",
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });

    // Reveal progress bars
    gsap.from(".skills-item", {
      opacity: 0,
      y: 20,
      stagger: 0.08,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".skills-list",
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });
  }, document.querySelector('[data-page="resume"]'));
}

function teardownResumePage() {
  resumeCtx?.revert();
}

function initPortfolioPage() {
  portfolioMM = gsap.matchMedia();

  // Desktop horizontal scroll showcase
  portfolioMM.add("(min-width: 768px)", () => {
    const wrapper = document.querySelector(".horizontal-scroll-wrapper");
    const list = document.querySelector(".project-list");
    if (!wrapper || !list) return;

    const ctx = gsap.context(() => {
      gsap.to(list, {
        x: () => -(list.scrollWidth - wrapper.clientWidth),
        ease: "none",
        scrollTrigger: {
          trigger: wrapper,
          pin: true,
          anticipatePin: 1,
          scrub: 1,
          start: "top 12%",
          end: () => "+=" + (list.scrollWidth - wrapper.clientWidth),
          invalidateOnRefresh: true,
        }
      });
    });

    return () => ctx.revert();
  });

  // Mobile sequential reveal (no horizontal scroll-jacking)
  portfolioMM.add("(max-width: 767px)", () => {
    const ctx = gsap.context(() => {
      gsap.from(".project-item", {
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".project-list",
          start: "top 85%",
          toggleActions: "play none none none"
        }
      });
    });

    return () => ctx.revert();
  });
}

function teardownPortfolioPage() {
  portfolioMM?.revert();
}

function initContactPage() {
  contactCtx = gsap.context(() => {
    gsap.from(".mapbox", {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".mapbox",
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });

    gsap.from(".contact-form", {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".contact-form",
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });
  }, document.querySelector('[data-page="contact"]'));
}

function teardownContactPage() {
  contactCtx?.revert();
}

function initPage(pageId) {
  if (pageId === "about") initAboutPage();
  else if (pageId === "resume") initResumePage();
  else if (pageId === "portfolio") initPortfolioPage();
  else if (pageId === "contact") initContactPage();
}

function teardownPage(pageId) {
  if (pageId === "about") teardownAboutPage();
  else if (pageId === "resume") teardownResumePage();
  else if (pageId === "portfolio") teardownPortfolioPage();
  else if (pageId === "contact") teardownContactPage();
}

// Track current active page (matches HTML state where "about" is active)
let activePageId = "about";

// Add navigation click listener
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const targetPageId = this.innerHTML.toLowerCase().trim();

    if (targetPageId !== activePageId) {
      // 1. Tear down animations of the previous active page
      teardownPage(activePageId);

      // 2. Set the new active page ID
      activePageId = targetPageId;

      // 3. Toggle visibility classes
      for (let j = 0; j < pages.length; j++) {
        if (activePageId === pages[j].dataset.page) {
          pages[j].classList.add("active");
          navigationLinks[j].classList.add("active");
          window.scrollTo(0, 0);

          if (activePageId === "portfolio") {
            wiggleDesignSystemsTab(desktopBeamTabs);
          }
        } else {
          pages[j].classList.remove("active");
          navigationLinks[j].classList.remove("active");
        }
      }

      // 4. Initialize animations for the new active page
      initPage(activePageId);

      // 5. Refresh scroll and trigger positioning
      refreshScrollState();
    }
  });
}

// Initialize default active page on startup
window.addEventListener("DOMContentLoaded", () => {
  initPage(activePageId);
});
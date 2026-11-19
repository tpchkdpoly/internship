/* ==========================================================================
   Hailakandi Polytechnic – Internship Management Portal
   Training & Placement Cell
   ========================================================================== */

/* --------------------------------------------------------------------------
   PORTAL CONFIGURATION
   Edit ONLY these values to connect the portal to the official resources.
   Every button, link and the QR code read from here — nothing is hardcoded.
   -------------------------------------------------------------------------- */
const PORTAL_CONFIG = {
  instituteName: "Hailakandi Polytechnic",
  googleFormURL: "https://docs.google.com/forms/d/e/1FAIpQLSeEfbEyueF7Y8NQzuj-hBZPzfnhtbc5whECSl67Z-k8w_tDDQ/viewform?usp=dialog",                 // e.g. https://forms.gle/xxxxxxxx
  statusTrackerURL: "https://docs.google.com/spreadsheets/d/1U8AGyfILh10Iws_b7zn7mobNn-EEvdIg/edit?usp=sharing&ouid=100944956101147237890&rtpof=true&sd=true",   // read-only "Publish to web" link
  contactEmail: "tpohkdpoly@gmail.com",                   // e.g. tpo@institute.ac.in
  academicSession: "2026-2027"
};

/* --------------------------------------------------------------------------
   FUTURE INTEGRATION (n8n automation on VPS) — NOT ACTIVE
   - Keep this file free of API keys, webhook secrets or credentials.
   - When the n8n system is ready, point these endpoints to a server-side
     proxy / public webhook that performs its own validation.
   - Planned: automated application ID generation, email notifications and
     status updates. Until then Google Forms + Google Sheets are used.
   -------------------------------------------------------------------------- */
const FUTURE_INTEGRATION = {
  enabled: false,
  endpoints: {
    submitApplication: null,   // POST  → creates application, returns Application ID
    applicationStatus: null    // GET   → ?id=APPLICATION_ID, returns public-safe status
  }
};

/**
 * PortalAPI – thin service layer so a backend can be plugged in later
 * without touching the UI code. Currently every call is a no-op.
 */
const PortalAPI = (function () {
  function isEnabled() {
    return FUTURE_INTEGRATION.enabled && !!FUTURE_INTEGRATION.endpoints.applicationStatus;
  }

  // Placeholder for future status lookups via n8n. Intentionally unimplemented.
  async function getApplicationStatus(/* applicationId */) {
    throw new Error("Status API not enabled. Use the Google Sheets tracker.");
  }

  // Placeholder for future direct submissions via n8n. Intentionally unimplemented.
  async function submitApplication(/* payload */) {
    throw new Error("Submission API not enabled. Use the Google Form.");
  }

  return { isEnabled, getApplicationStatus, submitApplication };
})();

/* --------------------------------------------------------------------------
   HELPERS
   -------------------------------------------------------------------------- */

/** A URL counts as configured only if it is a real http(s) link (not a placeholder). */
function isConfiguredURL(value) {
  return typeof value === "string" && /^https?:\/\/\S+$/i.test(value.trim());
}

/** A very small email sanity check for the contact address. */
function isConfiguredEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Show a short notice using the Bootstrap toast. */
function showNotice(message) {
  const el = document.getElementById("portalToast");
  $("#portalToastText").text(message);
  if (window.bootstrap && el) {
    bootstrap.Toast.getOrCreateInstance(el, { delay: 4500 }).show();
  } else {
    alert(message);
  }
}

/* --------------------------------------------------------------------------
   1. CONFIG-DRIVEN LINKS (Google Form, Tracker, Contact)
   -------------------------------------------------------------------------- */
function initConfiguredLinks() {
  const formURL = PORTAL_CONFIG.googleFormURL;
  const trackerURL = PORTAL_CONFIG.statusTrackerURL;
  const email = PORTAL_CONFIG.contactEmail;

  // Academic session text
  $(".js-session").text(PORTAL_CONFIG.academicSession);

  // Google Form buttons
  $(".js-form-link").each(function () {
    if (isConfiguredURL(formURL)) {
      $(this).attr({ href: formURL, target: "_blank", rel: "noopener noreferrer" });
    } else {
      $(this).attr("href", "#submit").removeAttr("target").on("click", function (e) {
        e.preventDefault();
        showNotice("The online application form link will be available soon. Please contact the Training & Placement Cell.");
      });
    }
  });

  // Status tracker buttons
  $(".js-tracker-link").each(function () {
    if (isConfiguredURL(trackerURL)) {
      $(this).attr({ href: trackerURL, target: "_blank", rel: "noopener noreferrer" });
    } else {
      $(this).attr("href", "#track").removeAttr("target").on("click", function (e) {
        e.preventDefault();
        showNotice("The application status tracker will be available soon. Please contact the Training & Placement Cell.");
      });
    }
  });

  // Contact email + enquiry button
  if (isConfiguredEmail(email)) {
    const subject = encodeURIComponent("Internship Enquiry – " + PORTAL_CONFIG.instituteName);
    $(".js-contact-email").text(email);
    $(".js-enquiry-link").attr("href", "mailto:" + email + "?subject=" + subject);
  } else {
    $(".js-contact-email").text("tpo@hailakandipolytechnic.example");   // visible placeholder
    $(".js-enquiry-link").attr("href", "#contact").on("click", function (e) {
      e.preventDefault();
      showNotice("The official email address will be published soon. Please visit the Training & Placement Cell.");
    });
  }
}

/* --------------------------------------------------------------------------
   2. QR CODE (same URL as the application button)
   -------------------------------------------------------------------------- */
function initQRCode() {
  const $box = $("#formQR");
  const url = PORTAL_CONFIG.googleFormURL;
  $box.empty();

  if (!isConfiguredURL(url)) {
    $box.html(
      '<div class="qr-placeholder"><i class="fa-solid fa-qrcode"></i>' +
      "<span>QR code will appear here once the official form link is configured.</span></div>"
    );
    return;
  }

  if (typeof QRCode !== "undefined") {
    // Primary: qrcode.js library (works offline once loaded)
    new QRCode($box[0], {
      text: url,
      width: 200,
      height: 200,
      colorDark: "#0a1f3d",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
    $box.attr("title", "Scan to open the internship application form");
  } else {
    // Fallback: public QR image API
    const src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&color=0a1f3d&data=" + encodeURIComponent(url);
    $("<img>", { src: src, alt: "QR code for the internship application form", width: 200, height: 200 }).appendTo($box);
  }
}

/* --------------------------------------------------------------------------
   3. NAVIGATION – smooth scroll, mobile menu, sticky shadow, back-to-top
   -------------------------------------------------------------------------- */
function initNavigation() {
  const $nav = $("#mainNav");
  const $win = $(window);
  const $backToTop = $("#backToTop");

  $(document).on("click", 'a[href^="#"]', function (e) {
    const hash = $(this).attr("href");
    if (!hash || hash === "#") return;
    const $target = $(hash);
    if (!$target.length) return;

    e.preventDefault();
    const offset = $nav.outerHeight() - 1;
    const top = hash === "#home" ? 0 : $target.offset().top - offset;
    $("html, body").stop().animate({ scrollTop: top }, 650, "swing");
    if (history.replaceState) history.replaceState(null, "", hash);

    // Close the mobile menu after a selection
    const collapseEl = document.getElementById("navLinks");
    if (collapseEl && collapseEl.classList.contains("show") && window.bootstrap) {
      bootstrap.Collapse.getOrCreateInstance(collapseEl).hide();
    }
  });

  function onScroll() {
    const y = $win.scrollTop();
    $nav.toggleClass("scrolled", y > 10);
    $backToTop.toggleClass("show", y > 600);
  }
  $win.on("scroll", onScroll);
  onScroll();

  $backToTop.on("click", function () {
    $("html, body").stop().animate({ scrollTop: 0 }, 600);
  });
}

/* --------------------------------------------------------------------------
   4. ENTRANCE ANIMATIONS
   -------------------------------------------------------------------------- */
function initRevealAnimations() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in-view"); });
    return;
  }
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  items.forEach(function (el) { observer.observe(el); });
}

/* --------------------------------------------------------------------------
   5. WORKFLOW TIMELINE – expandable stage cards
   -------------------------------------------------------------------------- */
function initTimeline() {
  function setOpen($item, open) {
    $item.toggleClass("open", open);
    $item.find(".tl-toggle")
      .attr("aria-expanded", open)
      .contents().first()[0].textContent = open ? "Hide details " : "View details ";
    const $details = $item.find(".tl-details");
    open ? $details.stop(true, true).slideDown(260) : $details.stop(true, true).slideUp(220);
  }

  $(".tl-toggle").on("click", function () {
    const $item = $(this).closest(".tl-item");
    setOpen($item, !$item.hasClass("open"));
    syncToggleAll();
  });

  const $toggleAll = $("#toggleAllStages");
  function syncToggleAll() {
    const allOpen = $(".tl-item").length === $(".tl-item.open").length;
    $toggleAll.data("open", allOpen).html(
      allOpen
        ? '<i class="fa-solid fa-down-left-and-up-right-to-center me-2"></i>Collapse all'
        : '<i class="fa-solid fa-up-right-and-down-left-from-center me-2"></i>Expand all'
    );
  }

  $toggleAll.on("click", function () {
    const openAll = !$toggleAll.data("open");
    $(".tl-item").each(function () { setOpen($(this), openAll); });
    syncToggleAll();
  });
}

/* --------------------------------------------------------------------------
   6. DOCUMENTATION CHECKLIST – progress + localStorage
   (Personal reference only; not an official status tracker.)
   -------------------------------------------------------------------------- */
const CHECKLIST_STORAGE_KEY = "hp_internship_checklist_" + PORTAL_CONFIG.academicSession;

function loadChecklistState() {
  try {
    return JSON.parse(localStorage.getItem(CHECKLIST_STORAGE_KEY)) || {};
  } catch (err) {
    return {};
  }
}

function saveChecklistState(state) {
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    /* Storage unavailable (private mode etc.) – progress just won't persist. */
  }
}

function updateChecklistProgress() {
  const $checks = $(".js-check");
  const total = $checks.length;
  const done = $checks.filter(":checked").length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  $("#checkCount").text(done);
  $("#checkTotal").text(total);
  $("#checkPercent").text(percent + "%");
  $("#checkBar").css("width", percent + "%");
  $("#checkProgress").attr("aria-valuenow", percent);

  $checks.each(function () {
    $(this).closest(".check-row").toggleClass("is-done", this.checked);
  });

  const $msg = $("#checkMessage");
  if (done === 0) {
    $msg.removeClass("done").text("Start ticking items as you complete them. Your progress is saved on this device.");
  } else if (done < total) {
    $msg.removeClass("done").text((total - done) + " item" + (total - done === 1 ? "" : "s") + " remaining. Keep going!");
  } else {
    $msg.addClass("done").text("All items ticked. Coordinate with the TPO Office and your department before commencing your internship.");
  }
}

function initChecklist() {
  const state = loadChecklistState();

  $(".js-check").each(function () {
    this.checked = !!state[$(this).data("key")];
  });
  updateChecklistProgress();

  $(".js-check").on("change", function () {
    const current = loadChecklistState();
    current[$(this).data("key")] = this.checked;
    saveChecklistState(current);
    updateChecklistProgress();
  });

  $("#resetChecklist").on("click", function () {
    if (!confirm("Reset your checklist? All ticks will be cleared.")) return;
    $(".js-check").prop("checked", false);
    try { localStorage.removeItem(CHECKLIST_STORAGE_KEY); } catch (err) { /* ignore */ }
    updateChecklistProgress();
  });
}

/* --------------------------------------------------------------------------
   INIT
   -------------------------------------------------------------------------- */
$(function () {
  initConfiguredLinks();
  initQRCode();
  initNavigation();
  initRevealAnimations();
  initTimeline();
  initChecklist();
});

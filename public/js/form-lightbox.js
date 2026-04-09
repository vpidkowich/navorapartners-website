/**
 * Form Lightbox — replaces Tally embed across all pages.
 *
 * Dynamically injects the form HTML, initializes intl-tel-input,
 * captures UTM params, handles validation, and submits to /api/submit-form.
 *
 * On success, redirects to /lead-confirmed.
 */

(function () {
  'use strict';

  // ── Config ───────────────────────────────────────────────────────
  // Replace with your Turnstile site key from Cloudflare dashboard
  var TURNSTILE_SITE_KEY = '0x4AAAAAAC3KURli7VfZzOC7';

  var REVENUE_OPTIONS = [
    'Under $500K',
    '$500K \u2013 $1M',
    '$1M \u2013 $3M',
    '$3M \u2013 $5M',
    '$5M \u2013 $10M',
    '$10M \u2013 $25M',
    '$25M+',
  ];

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid'];

  // ── UTM capture ──────────────────────────────────────────────────

  function captureUtmParams() {
    var params = new URLSearchParams(window.location.search);
    UTM_KEYS.forEach(function (key) {
      var value = params.get(key);
      if (value) {
        sessionStorage.setItem('navora_' + key, value);
      }
    });
  }

  function getUtmParam(key) {
    var params = new URLSearchParams(window.location.search);
    return params.get(key) || sessionStorage.getItem('navora_' + key) || '';
  }

  // ── Build form HTML ──────────────────────────────────────────────

  function buildRevenueOptions() {
    var html = '<option value="">Select revenue range\u2026</option>';
    REVENUE_OPTIONS.forEach(function (opt) {
      html += '<option value="' + opt + '">' + opt + '</option>';
    });
    return html;
  }

  function buildFormHTML() {
    return (
      '<div class="form-lightbox" id="formLightbox">' +
      '<div class="form-lightbox__card">' +
      '<button class="form-lightbox__close" id="formClose" type="button" aria-label="Close form">&times;</button>' +
      '<h2 class="form-lightbox__title">Request Your Growth Strategy</h2>' +
      '<p class="form-lightbox__subtitle">Fill out the form below to speak with our team.</p>' +
      '<div class="form-lightbox__error-banner" id="formErrorBanner"></div>' +
      '<form id="growthForm" novalidate>' +
      '<div class="form-row">' +
      '<div class="form-field" id="field-firstName">' +
      '<label for="ff-firstName">First Name <span style="color:var(--color-orange)">*</span></label>' +
      '<input type="text" id="ff-firstName" name="first_name" required autocomplete="given-name" placeholder="John">' +
      '<span class="form-field__error">First name is required</span>' +
      '</div>' +
      '<div class="form-field" id="field-lastName">' +
      '<label for="ff-lastName">Last Name <span style="color:var(--color-orange)">*</span></label>' +
      '<input type="text" id="ff-lastName" name="last_name" required autocomplete="family-name" placeholder="Doe">' +
      '<span class="form-field__error">Last name is required</span>' +
      '</div>' +
      '</div>' +
      '<div class="form-field" id="field-email">' +
      '<label for="ff-email">Email <span style="color:var(--color-orange)">*</span></label>' +
      '<input type="email" id="ff-email" name="email" required autocomplete="email" placeholder="john@company.com">' +
      '<span class="form-field__error">Please enter a valid email address</span>' +
      '</div>' +
      '<div class="form-field" id="field-phone">' +
      '<label for="ff-phone">Phone <span style="color:var(--color-orange)">*</span></label>' +
      '<input type="tel" id="ff-phone" name="phone" autocomplete="tel">' +
      '<span class="form-field__error">Phone number is required</span>' +
      '</div>' +
      '<div class="form-field" id="field-revenue">' +
      '<label for="ff-revenue">Annual Revenue <span style="color:var(--color-orange)">*</span></label>' +
      '<select id="ff-revenue" name="revenue">' + buildRevenueOptions() + '</select>' +
      '<span class="form-field__error">Please select a revenue range</span>' +
      '</div>' +
      '<div class="form-field" id="field-website">' +
      '<label for="ff-website">Website URL <span style="color:var(--color-orange)">*</span></label>' +
      '<input type="url" id="ff-website" name="website_url" autocomplete="url" placeholder="https://yoursite.com">' +
      '<span class="form-field__error">Website URL is required (https://\u2026)</span>' +
      '</div>' +
      '<!-- Honeypot -->' +
      '<div style="position:absolute;left:-9999px;top:-9999px;" aria-hidden="true">' +
      '<input type="text" name="company_name" tabindex="-1" autocomplete="off">' +
      '</div>' +
      '<!-- Hidden fields -->' +
      '<input type="hidden" name="utm_source">' +
      '<input type="hidden" name="utm_medium">' +
      '<input type="hidden" name="utm_campaign">' +
      '<input type="hidden" name="utm_content">' +
      '<input type="hidden" name="utm_term">' +
      '<input type="hidden" name="gclid">' +
      '<input type="hidden" name="client_timezone">' +
      '<!-- Turnstile widget -->' +
      '<div id="turnstileWidget" class="cf-turnstile" data-sitekey="' + TURNSTILE_SITE_KEY + '" data-size="invisible" data-callback="onTurnstileCallback"></div>' +
      '<button type="submit" class="btn btn-gold-ghost btn-arrow form-lightbox__submit" id="formSubmitBtn">' +
      'Get Your Growth Strategy' +
      '</button>' +
      '<p class="form-lightbox__disclaimer">We\u2019ll never share your information. Unsubscribe anytime.</p>' +
      '</form>' +
      '</div>' +
      '</div>'
    );
  }

  // ── Inject form into page ────────────────────────────────────────

  function injectForm() {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = buildFormHTML();
    document.body.appendChild(wrapper.firstChild);
  }

  // ── Validation ───────────────────────────────────────────────────

  function setError(fieldId, show) {
    var field = document.getElementById(fieldId);
    if (!field) return;
    if (show) {
      field.classList.add('form-field--error');
    } else {
      field.classList.remove('form-field--error');
    }
  }

  function validateForm() {
    var valid = true;

    var firstName = document.getElementById('ff-firstName').value.trim();
    var lastName = document.getElementById('ff-lastName').value.trim();
    var email = document.getElementById('ff-email').value.trim();
    var phone = document.getElementById('ff-phone').value.trim();
    var website = document.getElementById('ff-website').value.trim();

    // First name
    if (!firstName) { setError('field-firstName', true); valid = false; }
    else { setError('field-firstName', false); }

    // Last name
    if (!lastName) { setError('field-lastName', true); valid = false; }
    else { setError('field-lastName', false); }

    // Email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('field-email', true); valid = false;
    } else {
      setError('field-email', false);
    }

    // Phone (required, must have enough digits)
    var phoneDigits = phone.replace(/\D/g, '');
    if (!phone || phoneDigits.length < 7) {
      setError('field-phone', true); valid = false;
    } else {
      setError('field-phone', false);
    }

    // Revenue (required)
    var revenue = document.getElementById('ff-revenue').value;
    if (!revenue) {
      setError('field-revenue', true); valid = false;
    } else {
      setError('field-revenue', false);
    }

    // Website (required, must be a valid URL)
    if (!website || !/^https?:\/\/.+\..+/.test(website)) {
      setError('field-website', true); valid = false;
    } else {
      setError('field-website', false);
    }

    return valid;
  }

  // ── Real-time validation (clear errors as user corrects) ─────────

  function initLiveValidation() {
    var firstName = document.getElementById('ff-firstName');
    var lastName = document.getElementById('ff-lastName');
    var email = document.getElementById('ff-email');
    var phone = document.getElementById('ff-phone');
    var website = document.getElementById('ff-website');

    if (firstName) firstName.addEventListener('input', function () {
      if (firstName.value.trim()) setError('field-firstName', false);
    });
    if (lastName) lastName.addEventListener('input', function () {
      if (lastName.value.trim()) setError('field-lastName', false);
    });
    if (email) email.addEventListener('input', function () {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) setError('field-email', false);
    });
    if (phone) phone.addEventListener('input', function () {
      var digits = phone.value.replace(/\D/g, '');
      if (digits.length >= 7) setError('field-phone', false);
    });
    var revenue = document.getElementById('ff-revenue');
    if (revenue) revenue.addEventListener('change', function () {
      if (revenue.value) setError('field-revenue', false);
    });
    if (website) website.addEventListener('input', function () {
      if (/^https?:\/\/.+\..+/.test(website.value.trim())) {
        setError('field-website', false);
      }
    });
  }

  // ── Submission ───────────────────────────────────────────────────

  var isSubmitting = false;

  function setLoadingState(loading) {
    var btn = document.getElementById('formSubmitBtn');
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = '<span class="form-lightbox__spinner"></span>Submitting\u2026';
    } else {
      btn.disabled = false;
      btn.innerHTML = 'Get Your Growth Strategy<span class="btn-arrow__icon">\u2192</span>';
    }
  }

  function showErrorBanner(message) {
    var banner = document.getElementById('formErrorBanner');
    if (!banner) return;
    banner.textContent = message;
    banner.classList.add('active');
  }

  function hideErrorBanner() {
    var banner = document.getElementById('formErrorBanner');
    if (!banner) return;
    banner.textContent = '';
    banner.classList.remove('active');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    hideErrorBanner();

    if (!validateForm()) {
      // Remove focus from all fields so orange error shows (not gold focus)
      if (document.activeElement) document.activeElement.blur();
      // Scroll first error field into view
      var firstError = document.querySelector('.form-field--error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    isSubmitting = true;
    setLoadingState(true);

    // Collect form data
    var data = {
      first_name: document.getElementById('ff-firstName').value.trim(),
      last_name: document.getElementById('ff-lastName').value.trim(),
      email: document.getElementById('ff-email').value.trim(),
      phone: window._itiInstance ? window._itiInstance.getNumber() : document.getElementById('ff-phone').value.trim(),
      revenue: document.getElementById('ff-revenue').value,
      website_url: document.getElementById('ff-website').value.trim(),
      company_name: document.querySelector('input[name="company_name"]').value,
      utm_source: getUtmParam('utm_source'),
      utm_medium: getUtmParam('utm_medium'),
      utm_campaign: getUtmParam('utm_campaign'),
      utm_content: getUtmParam('utm_content'),
      utm_term: getUtmParam('utm_term'),
      gclid: getUtmParam('gclid'),
      client_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    };

    // Get Turnstile token
    var turnstileResponse = '';
    if (typeof turnstile !== 'undefined') {
      turnstileResponse = turnstile.getResponse();
    }
    data.turnstile_token = turnstileResponse;

    fetch('/api/submit-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        return res.text().then(function (text) {
          try {
            return { ok: res.ok, data: JSON.parse(text) };
          } catch (e) {
            return { ok: false, data: { error: 'Unexpected server response' } };
          }
        });
      })
      .then(function (result) {
        if (result.ok && result.data.success) {
          // Fire analytics event
          if (typeof gtag === 'function') {
            gtag('event', 'form_submit', {
              event_category: 'lead',
              event_label: 'growth_strategy',
            });
          }
          // Redirect to confirmation page
          window.location.href = '/lead-confirmed';
        } else {
          var msg = (result.data && result.data.error) || 'Something went wrong. Please try again.';
          showErrorBanner(msg);
          setLoadingState(false);
          isSubmitting = false;
          // Reset Turnstile for retry
          if (typeof turnstile !== 'undefined') {
            turnstile.reset();
          }
        }
      })
      .catch(function () {
        showErrorBanner('Network error. Please check your connection and try again.');
        setLoadingState(false);
        isSubmitting = false;
        if (typeof turnstile !== 'undefined') {
          turnstile.reset();
        }
      });
  }

  // ── Lightbox open/close ──────────────────────────────────────────

  function openLightbox(e) {
    e.preventDefault();
    var lb = document.getElementById('formLightbox');
    if (!lb) return;

    // Populate hidden UTM fields
    UTM_KEYS.forEach(function (key) {
      var input = lb.querySelector('input[name="' + key + '"]');
      if (input) input.value = getUtmParam(key);
    });

    // Set timezone
    var tzInput = lb.querySelector('input[name="client_timezone"]');
    if (tzInput) tzInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone || '';

    lb.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus first input after animation
    setTimeout(function () {
      var first = document.getElementById('ff-firstName');
      if (first) first.focus();
    }, 100);
  }

  function closeLightbox() {
    var lb = document.getElementById('formLightbox');
    if (!lb) return;
    lb.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ── Initialize ───────────────────────────────────────────────────

  function init() {
    // Capture UTM params on every page load
    captureUtmParams();

    // Inject form HTML
    injectForm();

    // Initialize intl-tel-input
    var phoneInput = document.getElementById('ff-phone');
    var PREFERRED_COUNTRIES = ['us', 'ca', 'gb', 'ie', 'au', 'nz'];
    if (phoneInput && typeof intlTelInput === 'function') {
      window._itiInstance = intlTelInput(phoneInput, {
        initialCountry: 'us',
        countryOrder: PREFERRED_COUNTRIES,
        separateDialCode: true,
        countrySearch: true,
        searchPlaceholder: 'Search country\u2026',
        loadUtils: function () { return import('https://cdn.jsdelivr.net/npm/intl-tel-input@23/build/js/utils.js'); },
      });

      // Add divider after preferred countries in dropdown
      setTimeout(function () {
        var list = document.querySelector('.iti__country-list');
        if (list) {
          var items = list.querySelectorAll('.iti__country');
          if (items.length > PREFERRED_COUNTRIES.length) {
            var divider = document.createElement('li');
            divider.className = 'iti__divider';
            divider.setAttribute('aria-hidden', 'true');
            list.insertBefore(divider, items[PREFERRED_COUNTRIES.length]);
          }
        }
      }, 500);

      // Format phone number as user types: (201) 555-0123
      phoneInput.addEventListener('input', function () {
        var iti = window._itiInstance;
        if (!iti) return;
        var raw = phoneInput.value;

        // Auto-detect country if user types/pastes a + international number
        if (raw.indexOf('+') === 0) {
          iti.setNumber(raw);
          return;
        }

        // Format US/CA numbers as (XXX) XXX-XXXX
        var country = iti.getSelectedCountryData();
        if (country.iso2 !== 'us' && country.iso2 !== 'ca') return;

        var digits = raw.replace(/\D/g, '');
        var formatted = '';
        if (digits.length === 0) {
          formatted = '';
        } else if (digits.length <= 3) {
          formatted = '(' + digits;
        } else if (digits.length <= 6) {
          formatted = '(' + digits.slice(0, 3) + ') ' + digits.slice(3);
        } else {
          formatted = '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6, 10);
        }

        phoneInput.value = formatted;
      });
    }

    // Wire up form submit and live validation
    var form = document.getElementById('growthForm');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
    initLiveValidation();

    // Wire close button
    var closeBtn = document.getElementById('formClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeLightbox);
    }

    // Close on overlay click
    var lb = document.getElementById('formLightbox');
    if (lb) {
      lb.addEventListener('click', function (e) {
        if (e.target === lb) closeLightbox();
      });
    }

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });

    // Wire all "growth strategy" buttons/links (except the form's own submit button)
    document.querySelectorAll('a, button').forEach(function (el) {
      var text = el.textContent.toLowerCase();
      if (
        text.indexOf('growth strategy') > -1 &&
        !el.classList.contains('form-lightbox__close') &&
        !el.classList.contains('form-lightbox__submit') &&
        !el.classList.contains('no-tally') &&
        !el.classList.contains('no-form') &&
        el.type !== 'submit'
      ) {
        el.addEventListener('click', openLightbox);
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

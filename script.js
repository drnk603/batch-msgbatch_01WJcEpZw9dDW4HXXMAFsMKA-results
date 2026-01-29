(function() {
  'use strict';

  if (!window.__app) {
    window.__app = {};
  }

  var app = window.__app;

  if (app._initialized) {
    return;
  }

  var isReducedMotion = function() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  var debounce = function(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  };

  var throttle = function(func, limit) {
    var inThrottle;
    return function() {
      var args = arguments;
      var context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function() {
          inThrottle = false;
        }, limit);
      }
    };
  };

  function initBurgerMenu() {
    if (app._burgerInit) return;
    app._burgerInit = true;

    var toggle = document.querySelector('.c-nav__toggle, .navbar-toggler');
    var navCollapse = document.querySelector('.navbar-collapse, .collapse');
    var navLinks = document.querySelectorAll('.c-nav__link, .nav-link');

    if (!toggle || !navCollapse) return;

    var isOpen = false;

    var focusableElements = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function openMenu() {
      isOpen = true;
      navCollapse.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('u-no-scroll');
      trapFocus();
    }

    function closeMenu() {
      isOpen = false;
      navCollapse.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('u-no-scroll');
    }

    function trapFocus() {
      var focusable = navCollapse.querySelectorAll(focusableElements);
      if (focusable.length === 0) return;

      var firstFocusable = focusable[0];
      var lastFocusable = focusable[focusable.length - 1];

      function handleTab(e) {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }

      navCollapse.addEventListener('keydown', handleTab);
    }

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    });

    document.addEventListener('click', function(e) {
      if (isOpen && !navCollapse.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function() {
        if (isOpen) {
          closeMenu();
        }
      });
    }

    var resizeHandler = debounce(function() {
      if (window.innerWidth >= 768 && isOpen) {
        closeMenu();
      }
    }, 100);

    window.addEventListener('resize', resizeHandler, { passive: true });
  }

  function initAnchors() {
    if (app._anchorsInit) return;
    app._anchorsInit = true;

    var isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname.endsWith('/index.html');

    var links = document.querySelectorAll('a[href^="#"]');

    for (var i = 0; i < links.length; i++) {
      (function(link) {
        var href = link.getAttribute('href');

        if (href === '#' || href === '#!') {
          return;
        }

        if (!isHomePage && href.startsWith('#') && !href.includes('/#')) {
          var sectionId = href.substring(1);
          if (document.getElementById(sectionId)) {
            link.setAttribute('href', '/#' + sectionId);
          }
        }

        link.addEventListener('click', function(e) {
          var targetHref = this.getAttribute('href');

          if (targetHref === '#' || targetHref === '#!') {
            return;
          }

          if (targetHref.startsWith('#')) {
            var targetId = targetHref.substring(1);
            var targetElement = document.getElementById(targetId);

            if (targetElement) {
              e.preventDefault();

              var header = document.querySelector('.l-header, .navbar');
              var headerHeight = header ? header.offsetHeight : 72;

              var elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
              var offsetPosition = elementPosition - headerHeight;

              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              });
            }
          }
        });
      })(links[i]);
    }
  }

  function initScrollSpy() {
    if (app._scrollSpyInit) return;
    app._scrollSpyInit = true;

    var sections = document.querySelectorAll('section[id], div[id]');
    var navLinks = document.querySelectorAll('.c-nav__link[href^="#"], .nav-link[href^="#"]');

    if (sections.length === 0 || navLinks.length === 0) return;

    var header = document.querySelector('.l-header, .navbar');
    var headerHeight = header ? header.offsetHeight : 72;

    function updateActiveLink() {
      var scrollPosition = window.pageYOffset + headerHeight + 100;

      var currentSection = null;

      for (var i = 0; i < sections.length; i++) {
        var section = sections[i];
        var sectionTop = section.offsetTop;
        var sectionBottom = sectionTop + section.offsetHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          currentSection = section.getAttribute('id');
        }
      }

      for (var j = 0; j < navLinks.length; j++) {
        var link = navLinks[j];
        var href = link.getAttribute('href');
        
        if (href && href.startsWith('#')) {
          var targetId = href.substring(1);
          
          if (targetId === currentSection) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
          } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
          }
        }
      }
    }

    var scrollHandler = throttle(updateActiveLink, 100);
    window.addEventListener('scroll', scrollHandler, { passive: true });
    updateActiveLink();
  }

  function initActiveMenu() {
    if (app._activeMenuInit) return;
    app._activeMenuInit = true;

    var navLinks = document.querySelectorAll('.c-nav__link, .nav-link');
    var currentPath = window.location.pathname;

    if (currentPath.endsWith('/')) {
      currentPath = currentPath.slice(0, -1);
    }

    var isHomePage = currentPath === '' || currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/index.html');

    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      var linkPath = link.getAttribute('href');

      if (linkPath && linkPath.startsWith('#')) {
        continue;
      }

      link.removeAttribute('aria-current');
      link.classList.remove('active');

      if (linkPath) {
        var cleanLinkPath = linkPath;
        if (cleanLinkPath.endsWith('/')) {
          cleanLinkPath = cleanLinkPath.slice(0, -1);
        }

        var isLinkHome = cleanLinkPath === '/' || cleanLinkPath === '/index.html' || cleanLinkPath === 'index.html' || cleanLinkPath === '';

        if ((isHomePage && isLinkHome) || (!isLinkHome && currentPath.indexOf(cleanLinkPath) !== -1)) {
          link.setAttribute('aria-current', 'page');
          link.classList.add('active');
        }
      }
    }
  }

  function initImages() {
    if (app._imagesInit) return;
    app._imagesInit = true;

    var images = document.querySelectorAll('img');

    var placeholderSVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23e9ecef" width="400" height="300"/%3E%3Ctext fill="%236c757d" font-family="system-ui" font-size="18" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage not available%3C/text%3E%3C/svg%3E';

    for (var i = 0; i < images.length; i++) {
      var img = images[i];

      if (!img.hasAttribute('loading') && !img.classList.contains('c-logo__img') && !img.hasAttribute('data-critical')) {
        img.setAttribute('loading', 'lazy');
      }

      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      (function(image) {
        image.addEventListener('error', function() {
          this.src = placeholderSVG;
        });
      })(img);
    }
  }

  function initForms() {
    if (app._formsInit) return;
    app._formsInit = true;

    var forms = document.querySelectorAll('form, .c-form');

    var notificationContainer = document.createElement('div');
    notificationContainer.className = 'position-fixed top-0 end-0 p-3';
    notificationContainer.style.zIndex = '9999';
    document.body.appendChild(notificationContainer);

    app.notify = function(message, type) {
      type = type || 'info';
      var alertClass = 'alert-' + type;

      var alert = document.createElement('div');
      alert.className = 'alert ' + alertClass + ' alert-dismissible fade show';
      alert.setAttribute('role', 'alert');
      alert.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';

      notificationContainer.appendChild(alert);

      setTimeout(function() {
        alert.classList.remove('show');
        setTimeout(function() {
          if (notificationContainer.contains(alert)) {
            notificationContainer.removeChild(alert);
          }
        }, 150);
      }, 5000);
    };

    function validateEmail(email) {
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(email).toLowerCase());
    }

    function validatePhone(phone) {
      var re = /^[\+\d\s\(\)\-]{10,20}$/;
      return re.test(phone);
    }

    function validateName(name) {
      var re = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
      return re.test(name);
    }

    function validateMessage(message) {
      return message && message.length >= 10;
    }

    function showError(field, message) {
      var group = field.closest('.c-form__group, .mb-3');
      if (group) {
        group.classList.add('has-error');
        var errorEl = group.querySelector('.c-form__error');
        if (!errorEl) {
          errorEl = document.createElement('div');
          errorEl.className = 'c-form__error';
          field.parentNode.appendChild(errorEl);
        }
        errorEl.textContent = message;
      }
      field.setAttribute('aria-invalid', 'true');
    }

    function clearError(field) {
      var group = field.closest('.c-form__group, .mb-3');
      if (group) {
        group.classList.remove('has-error');
        var errorEl = group.querySelector('.c-form__error');
        if (errorEl) {
          errorEl.textContent = '';
        }
      }
      field.removeAttribute('aria-invalid');
    }

    for (var i = 0; i < forms.length; i++) {
      (function(form) {
        var honeypot = document.createElement('input');
        honeypot.setAttribute('type', 'text');
        honeypot.setAttribute('name', 'website');
        honeypot.setAttribute('tabindex', '-1');
        honeypot.setAttribute('autocomplete', 'off');
        honeypot.style.position = 'absolute';
        honeypot.style.left = '-9999px';
        honeypot.style.width = '1px';
        honeypot.style.height = '1px';
        honeypot.setAttribute('aria-hidden', 'true');
        form.appendChild(honeypot);

        var submitTime = Date.now();

        form.addEventListener('submit', function(event) {
          event.preventDefault();
          event.stopPropagation();

          var isValid = true;
          var firstInvalidField = null;

          if (honeypot.value !== '') {
            return;
          }

          var timeDiff = Date.now() - submitTime;
          if (timeDiff < 3000) {
            app.notify('Bitte warten Sie einen Moment vor dem Absenden.', 'warning');
            return;
          }

          var nameField = form.querySelector('#name, [name="name"]');
          if (nameField) {
            clearError(nameField);
            var nameValue = nameField.value.trim();
            if (!nameValue) {
              showError(nameField, 'Bitte geben Sie Ihren Namen ein.');
              isValid = false;
              if (!firstInvalidField) firstInvalidField = nameField;
            } else if (!validateName(nameValue)) {
              showError(nameField, 'Der Name enthält ungültige Zeichen.');
              isValid = false;
              if (!firstInvalidField) firstInvalidField = nameField;
            }
          }

          var emailField = form.querySelector('#email, [name="email"]');
          if (emailField) {
            clearError(emailField);
            var emailValue = emailField.value.trim();
            if (!emailValue) {
              showError(emailField, 'Bitte geben Sie Ihre E-Mail-Adresse ein.');
              isValid = false;
              if (!firstInvalidField) firstInvalidField = emailField;
            } else if (!validateEmail(emailValue)) {
              showError(emailField, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
              isValid = false;
              if (!firstInvalidField) firstInvalidField = emailField;
            }
          }

          var phoneField = form.querySelector('#phone, [name="phone"]');
          if (phoneField && phoneField.hasAttribute('required')) {
            clearError(phoneField);
            var phoneValue = phoneField.value.trim();
            if (phoneValue && !validatePhone(phoneValue)) {
              showError(phoneField, 'Bitte geben Sie eine gültige Telefonnummer ein.');
              isValid = false;
              if (!firstInvalidField) firstInvalidField = phoneField;
            }
          }

          var subjectField = form.querySelector('#subject, [name="subject"]');
          if (subjectField && subjectField.hasAttribute('required')) {
            clearError(subjectField);
            if (!subjectField.value.trim()) {
              showError(subjectField, 'Bitte geben Sie einen Betreff ein.');
              isValid = false;
              if (!firstInvalidField) firstInvalidField = subjectField;
            }
          }

          var messageField = form.querySelector('#message, [name="message"], textarea');
          if (messageField) {
            clearError(messageField);
            var messageValue = messageField.value.trim();
            if (!messageValue) {
              showError(messageField, 'Bitte geben Sie eine Nachricht ein.');
              isValid = false;
              if (!firstInvalidField) firstInvalidField = messageField;
            } else if (!validateMessage(messageValue)) {
              showError(messageField, 'Die Nachricht muss mindestens 10 Zeichen lang sein.');
              isValid = false;
              if (!firstInvalidField) firstInvalidField = messageField;
            }
          }

          var privacyField = form.querySelector('#privacy, [name="privacy"]');
          if (privacyField) {
            clearError(privacyField);
            if (!privacyField.checked) {
              showError(privacyField, 'Bitte akzeptieren Sie die Datenschutzerklärung.');
              isValid = false;
              if (!firstInvalidField) firstInvalidField = privacyField;
            }
          }

          if (!isValid) {
            app.notify('Bitte füllen Sie alle erforderlichen Felder korrekt aus.', 'danger');
            if (firstInvalidField) {
              firstInvalidField.focus();
            }
            return;
          }

          var submitBtn = form.querySelector('button[type="submit"]');
          var originalText = submitBtn ? submitBtn.innerHTML : '';

          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird gesendet...';
          }

          var formData = new FormData(form);
          var data = {};
          formData.forEach(function(value, key) {
            if (key !== 'website') {
              data[key] = value;
            }
          });

          setTimeout(function() {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalText;
            }

            app.notify('Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.', 'success');
            
            setTimeout(function() {
              window.location.href = 'thank_you.html';
            }, 1500);
          }, 1000);
        }, false);
      })(forms[i]);
    }
  }

  function initPortfolioFilter() {
    if (app._portfolioFilterInit) return;
    app._portfolioFilterInit = true;

    var filterButtons = document.querySelectorAll('.c-filter-btn');
    var portfolioItems = document.querySelectorAll('.c-portfolio-card');

    if (filterButtons.length === 0 || portfolioItems.length === 0) return;

    for (var i = 0; i < filterButtons.length; i++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          var filter = this.getAttribute('data-filter');

          for (var j = 0; j < filterButtons.length; j++) {
            filterButtons[j].classList.remove('is-active');
          }
          this.classList.add('is-active');

          for (var k = 0; k < portfolioItems.length; k++) {
            var item = portfolioItems[k];
            var itemCategory = item.getAttribute('data-category');

            if (filter === 'all' || itemCategory === filter) {
              item.style.display = 'block';
            } else {
              item.style.display = 'none';
            }
          }
        });
      })(filterButtons[i]);
    }
  }

  function initPortfolioModal() {
    if (app._portfolioModalInit) return;
    app._portfolioModalInit = true;

    var modal = document.getElementById('project-modal');
    var viewButtons = document.querySelectorAll('.c-portfolio-card__view-btn');
    var closeButtons = document.querySelectorAll('[data-close-modal]');

    if (!modal) return;

    var projectData = {
      'project-1': {
        title: 'Projekt 1',
        category: 'Detailing',
        description: 'Beschreibung für Projekt 1',
        image: 'assets/images/portfolio-1.jpg',
        specs: ['Spezifikation 1', 'Spezifikation 2', 'Spezifikation 3']
      }
    };

    function openModal(projectId) {
      var data = projectData[projectId];
      if (!data) return;

      modal.querySelector('.c-modal__title').textContent = data.title;
      modal.querySelector('.c-modal__category').textContent = data.category;
      modal.querySelector('.c-modal__description').textContent = data.description;
      modal.querySelector('.c-modal__image').src = data.image;

      var specsList = modal.querySelector('.c-modal__specs-list');
      specsList.innerHTML = '';
      for (var i = 0; i < data.specs.length; i++) {
        var li = document.createElement('li');
        li.textContent = data.specs[i];
        specsList.appendChild(li);
      }

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('u-no-scroll');
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('u-no-scroll');
    }

    for (var i = 0; i < viewButtons.length; i++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          var projectId = this.getAttribute('data-project');
          openModal(projectId);
        });
      })(viewButtons[i]);
    }

    for (var j = 0; j < closeButtons.length; j++) {
      closeButtons[j].addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  function initScrollToTop() {
    if (app._scrollToTopInit) return;
    app._scrollToTopInit = true;

    var btn = document.createElement('button');
    btn.className = 'c-scroll-to-top';
    btn.setAttribute('aria-label', 'Nach oben scrollen');
    btn.innerHTML = '↑';
    document.body.appendChild(btn);

    function toggleButton() {
      if (window.pageYOffset > 300) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
    }

    btn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    var scrollHandler = throttle(toggleButton, 100);
    window.addEventListener('scroll', scrollHandler, { passive: true });
    toggleButton();
  }

  function initCountUp() {
    if (app._countUpInit) return;
    app._countUpInit = true;

    var counters = document.querySelectorAll('[data-count]');
    if (counters.length === 0) return;

    function animateCounter(element) {
      var target = parseInt(element.getAttribute('data-count'), 10);
      var duration = parseInt(element.getAttribute('data-duration') || '2000', 10);
      var start = 0;
      var startTime = null;

      function updateCounter(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = timestamp - startTime;
        var percentage = Math.min(progress / duration, 1);
        var current = Math.floor(start + (target - start) * percentage);

        element.textContent = current.toLocaleString('de-DE');

        if (percentage < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = target.toLocaleString('de-DE');
        }
      }

      requestAnimationFrame(updateCounter);
    }

    var observer = new IntersectionObserver(function(entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          animateCounter(entries[i].target);
          observer.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.5 });

    for (var i = 0; i < counters.length; i++) {
      observer.observe(counters[i]);
    }
  }

  function initAccordion() {
    if (app._accordionInit) return;
    app._accordionInit = true;

    var accordionButtons = document.querySelectorAll('.accordion-button');

    for (var i = 0; i < accordionButtons.length; i++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          var target = this.getAttribute('data-bs-target');
          var collapse = document.querySelector(target);

          if (!collapse) return;

          var isExpanded = this.getAttribute('aria-expanded') === 'true';

          if (isExpanded) {
            this.setAttribute('aria-expanded', 'false');
            this.classList.add('collapsed');
            collapse.classList.remove('show');
          } else {
            this.setAttribute('aria-expanded', 'true');
            this.classList.remove('collapsed');
            collapse.classList.add('show');
          }
        });
      })(accordionButtons[i]);
    }
  }

  app.init = function() {
    if (app._initialized) return;

    initBurgerMenu();
    initAnchors();
    initScrollSpy();
    initActiveMenu();
    initImages();
    initForms();
    initPortfolioFilter();
    initPortfolioModal();
    initScrollToTop();
    initCountUp();
    initAccordion();

    app._initialized = true;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }

})();

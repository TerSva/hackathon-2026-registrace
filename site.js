const siteNav = document.getElementById('siteNav');
    function updateSiteNav() {
        if (siteNav) siteNav.classList.toggle('is-elevated', window.scrollY > 12);
    }
    updateSiteNav();
    window.addEventListener('scroll', updateSiteNav, { passive: true });

    const navToggle = document.querySelector('[data-nav-toggle]');
    const navLinks = document.getElementById('primaryNav');

    function setNavOpen(isOpen) {
        if (!siteNav || !navToggle) return;
        siteNav.classList.toggle('is-open', isOpen);
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    if (navToggle) {
        navToggle.addEventListener('click', function() {
            const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
            setNavOpen(!isOpen);
        });
    }

    if (navLinks) {
        navLinks.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() { setNavOpen(false); });
        });
    }

    const learningPanelLinks = document.querySelectorAll('[data-learning-panel]');
    let learningPanel = null;
    let lastLearningPanelTrigger = null;

    function ensureLearningPanel() {
        if (learningPanel) return learningPanel;

        learningPanel = document.createElement('div');
        learningPanel.className = 'learning-panel';
        learningPanel.hidden = true;
        learningPanel.innerHTML = [
            '<section class="learning-panel__dialog" role="dialog" aria-modal="true" aria-labelledby="learningPanelTitle">',
            '<span class="learning-panel__kicker">Učebnice PRAUT</span>',
            '<h2 id="learningPanelTitle">Učebnici teď připravujeme ve verzi 2.0.</h2>',
            '<p>V současné chvíli jsme učebnici uzavřeli, protože připravujeme verzi 2.0.</p>',
            '<p>Nová verze přinese 20 nových kapitol, lepší gamifikaci a porovnávání výsledků spolužáků ze stejné třídy, stejného ročníku, stejné školy i stejného klanu.</p>',
            '<p>Učitelům zároveň umožní lépe sledovat úspěchy i zádrhele jejich studentů.</p>',
            '<div class="learning-panel__actions">',
            '<button class="learning-panel__close" type="button" data-learning-panel-close>Rozumím</button>',
            '</div>',
            '</section>'
        ].join('');

        document.body.appendChild(learningPanel);
        learningPanel.addEventListener('click', function(event) {
            if (event.target === learningPanel || event.target.closest('[data-learning-panel-close]')) {
                closeLearningPanel();
            }
        });

        return learningPanel;
    }

    function openLearningPanel(trigger) {
        lastLearningPanelTrigger = trigger || null;
        const panel = ensureLearningPanel();
        panel.hidden = false;
        document.body.classList.add('learning-panel-open');
        const closeButton = panel.querySelector('[data-learning-panel-close]');
        if (closeButton) closeButton.focus();
    }

    function closeLearningPanel() {
        if (!learningPanel || learningPanel.hidden) return;
        learningPanel.hidden = true;
        document.body.classList.remove('learning-panel-open');
        if (lastLearningPanelTrigger) lastLearningPanelTrigger.focus();
    }

    learningPanelLinks.forEach(function(link) {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            openLearningPanel(link);
        });
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeLearningPanel();
            setNavOpen(false);
        }
    });

    const countdown = document.querySelector('[data-countdown]');
    const daysEl = countdown ? countdown.querySelector('[data-days]') : null;
    const hoursEl = countdown ? countdown.querySelector('[data-hours]') : null;
    const minutesEl = countdown ? countdown.querySelector('[data-minutes]') : null;

    function padTime(number) {
        return String(number).padStart(2, '0');
    }

    function tickCountdown() {
        if (!countdown || !daysEl || !hoursEl || !minutesEl) return;
        const target = new Date(countdown.dataset.countdown).getTime();
        const diff = Math.max(0, target - Date.now());
        const totalMinutes = Math.floor(diff / 60000);
        const days = Math.floor(totalMinutes / (60 * 24));
        const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
        const minutes = totalMinutes % 60;

        daysEl.textContent = String(days);
        hoursEl.textContent = padTime(hours);
        minutesEl.textContent = padTime(minutes);
    }

    tickCountdown();
    setInterval(tickCountdown, 30000);

    const revealItems = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12 });
        revealItems.forEach(function(item) { revealObserver.observe(item); });
    } else {
        revealItems.forEach(function(item) { item.classList.add('is-visible'); });
    }

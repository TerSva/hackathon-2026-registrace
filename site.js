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

    const partnerMailLinks = document.querySelectorAll('a[href^="mailto:svanda@praut.cz?subject=Partnerstv"]');
    const partnerMailFallback = {
        address: 'svanda@praut.cz',
        gmailUrl: 'https://mail.google.com/mail/?view=cm&fs=1&to=svanda%40praut.cz&su=Partnerstv%C3%AD%20AI%20%26%20Programming%20Hackathon%202026&body=Dobr%C3%BD%20den%2C%0A%0Am%C3%A1me%20z%C3%A1jem%20zapojit%20se%20jako%20partner%20AI%20%26%20Programming%20Hackathonu%202026.%0A%0AFirma%3A%0AKontakt%3A%0ATelefon%3A%0AMo%C5%BEn%C3%A1%20forma%20zapojen%C3%AD%3A%0A%0AD%C4%9Bkuji.'
    };
    let partnerMailTimer = null;
    let partnerMailDialog = null;

    function clearPartnerMailTimer() {
        if (!partnerMailTimer) return;
        window.clearTimeout(partnerMailTimer);
        partnerMailTimer = null;
    }

    function hidePartnerMailFallback() {
        if (!partnerMailDialog) return;
        partnerMailDialog.hidden = true;
        document.body.classList.remove('mailto-fallback-open');
    }

    function createPartnerMailFallback() {
        if (partnerMailDialog) return partnerMailDialog;

        partnerMailDialog = document.createElement('div');
        partnerMailDialog.className = 'mailto-fallback';
        partnerMailDialog.hidden = true;
        partnerMailDialog.setAttribute('role', 'dialog');
        partnerMailDialog.setAttribute('aria-modal', 'true');
        partnerMailDialog.setAttribute('aria-labelledby', 'mailtoFallbackTitle');
        partnerMailDialog.innerHTML = [
            '<div class="mailto-fallback-panel">',
            '  <p class="section-kicker">Kontakt pro firmy</p>',
            '  <h2 id="mailtoFallbackTitle">E-mailový klient se neotevřel?</h2>',
            '  <p>Pošli nám krátkou zprávu na <strong data-mailto-address></strong>, nebo otevři předvyplněný e-mail ve webovém Gmailu.</p>',
            '  <div class="mailto-fallback-actions">',
            '    <a class="btn btn-primary" data-mailto-gmail target="_blank" rel="noopener">Otevřít Gmail</a>',
            '    <button class="btn btn-secondary" type="button" data-mailto-copy>Zkopírovat e-mail</button>',
            '    <button class="mailto-fallback-close" type="button" data-mailto-close>Zavřít</button>',
            '  </div>',
            '</div>'
        ].join('');

        partnerMailDialog.querySelector('[data-mailto-address]').textContent = partnerMailFallback.address;
        partnerMailDialog.querySelector('[data-mailto-gmail]').href = partnerMailFallback.gmailUrl;

        partnerMailDialog.querySelector('[data-mailto-close]').addEventListener('click', hidePartnerMailFallback);
        partnerMailDialog.addEventListener('click', function(event) {
            if (event.target === partnerMailDialog) hidePartnerMailFallback();
        });

        partnerMailDialog.querySelector('[data-mailto-copy]').addEventListener('click', function(event) {
            const button = event.currentTarget;
            if (!navigator.clipboard) {
                window.prompt('Zkopíruj e-mailovou adresu:', partnerMailFallback.address);
                return;
            }

            navigator.clipboard.writeText(partnerMailFallback.address).then(function() {
                const originalText = button.textContent;
                button.textContent = 'E-mail zkopírován';
                window.setTimeout(function() { button.textContent = originalText; }, 1800);
            }).catch(function() {
                window.prompt('Zkopíruj e-mailovou adresu:', partnerMailFallback.address);
            });
        });

        document.body.appendChild(partnerMailDialog);
        return partnerMailDialog;
    }

    function showPartnerMailFallback() {
        const dialog = createPartnerMailFallback();
        dialog.hidden = false;
        document.body.classList.add('mailto-fallback-open');
        dialog.querySelector('[data-mailto-gmail]').focus();
    }

    partnerMailLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            clearPartnerMailTimer();
            partnerMailTimer = window.setTimeout(function() {
                if (document.visibilityState === 'visible' && document.hasFocus()) {
                    showPartnerMailFallback();
                }
            }, 1200);
        });
    });

    window.addEventListener('blur', clearPartnerMailTimer);
    window.addEventListener('pagehide', clearPartnerMailTimer);
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) clearPartnerMailTimer();
    });

    document.addEventListener('keydown', function(event) {
        if (event.key !== 'Escape') return;
        setNavOpen(false);
        hidePartnerMailFallback();
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

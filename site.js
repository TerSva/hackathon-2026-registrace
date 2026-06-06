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

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') setNavOpen(false);
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

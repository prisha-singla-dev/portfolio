// ---------- Boot sequence ----------
(function(){
  const boot = document.getElementById('boot');
  if (!boot) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function finishBoot(){
    document.body.classList.remove('booting');
    boot.classList.add('hide');
    document.querySelectorAll('.load-anim').forEach(el => el.classList.add('go'));
    setTimeout(() => { if (boot.parentNode) boot.parentNode.removeChild(boot); }, 550);
  }
  if (reduceMotion) {
    finishBoot();
  } else {
    window.addEventListener('load', () => setTimeout(finishBoot, 1300));
    setTimeout(finishBoot, 2600); // hard fallback so it never gets stuck
  }
})();

// ---------- Cursor spotlight ----------
(function(){
  const spotlight = document.getElementById('spotlight');
  if (!spotlight) return;
  let active = false;
  window.addEventListener('mousemove', (e) => {
    spotlight.style.left = e.clientX + 'px';
    spotlight.style.top = e.clientY + 'px';
    if (!active){ spotlight.classList.add('active'); active = true; }
  });
  window.addEventListener('mouseleave', () => { spotlight.classList.remove('active'); active = false; });
})();

// ---------- Live clock (IST) ----------
(function(){
  const clockEl = document.getElementById('live-clock');
  if (!clockEl) return;
  function tick(){
    const opts = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const t = new Intl.DateTimeFormat('en-GB', opts).format(new Date());
    clockEl.innerHTML = t + ' IST <span class="blink">▍</span>';
  }
  tick();
  setInterval(tick, 1000);
})();

// ---------- Count-up metrics ----------
(function(){
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const animate = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const dashEl = document.querySelector('.dash');
  if (!dashEl) { counters.forEach(animate); return; }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) { counters.forEach(animate); obs.disconnect(); } });
  }, { threshold: 0.4 });
  obs.observe(dashEl);
})();

// ---------- Reveal on scroll ----------
(function(){
  const els = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in'); obs.unobserve(entry.target); } });
  }, { threshold: 0.15 });
  els.forEach(el => obs.observe(el));
})();

// ---------- Graceful image fallback ----------
// Usage: <img data-fallback-parent onerror="imgFallback(this)">
function imgFallback(img){
  img.style.display = 'none';
  const parent = img.closest('[data-img-wrap]');
  if (parent) parent.classList.add('img-broken');
}

// ---------- Live GitHub stats (homepage only) ----------
(function(){
  const statsBox = document.getElementById('gh-live-stats');
  const langBox = document.getElementById('gh-live-langs');
  if (!statsBox && !langBox) return;

  const username = 'prisha-singla-dev';

  fetch(`https://api.github.com/users/${username}`)
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(user => {
      if (!statsBox) return;
      statsBox.innerHTML = `
        <div class="gh-stat-row"><span>Public repos</span><span class="n">${user.public_repos}</span></div>
        <div class="gh-stat-row"><span>Followers</span><span class="n">${user.followers}</span></div>
        <div class="gh-stat-row"><span>Following</span><span class="n">${user.following}</span></div>
        <div class="gh-stat-row"><span>Profile since</span><span class="n">${new Date(user.created_at).getFullYear()}</span></div>
      `;
    })
    .catch(() => { if (statsBox) statsBox.innerHTML = '<div class="gh-stat-row" style="border-top:none;">Live stats temporarily unavailable — <a href="https://github.com/prisha-singla-dev" style="color:var(--cobalt);" target="_blank" rel="noopener">view on GitHub ↗</a></div>'; });

  fetch(`https://api.github.com/users/${username}/repos?per_page=100`)
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(repos => {
      if (!langBox) return;
      const counts = {};
      let total = 0;
      repos.forEach(r => { if (r.language) { counts[r.language] = (counts[r.language]||0)+1; total++; } });
      const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,5);
      if (!sorted.length) { langBox.innerHTML = '<div class="gh-stat-row" style="border-top:none;">No language data yet.</div>'; return; }
      langBox.innerHTML = sorted.map(([lang,count]) => {
        const pct = Math.round((count/total)*100);
        return `<div class="lang-bar-row">
          <div class="lang-bar-label"><span>${lang}</span><span>${pct}%</span></div>
          <div class="lang-bar-track"><div class="lang-bar-fill" style="width:0%" data-width="${pct}%"></div></div>
        </div>`;
      }).join('');
      requestAnimationFrame(() => {
        setTimeout(() => {
          langBox.querySelectorAll('.lang-bar-fill').forEach(el => { el.style.width = el.getAttribute('data-width'); });
        }, 100);
      });
    })
    .catch(() => { if (langBox) langBox.innerHTML = '<div class="gh-stat-row" style="border-top:none;">Live data temporarily unavailable — <a href="https://github.com/prisha-singla-dev" style="color:var(--cobalt);" target="_blank" rel="noopener">view on GitHub ↗</a></div>'; });
})();

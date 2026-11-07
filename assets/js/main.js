// SPM Organics — menu, currency, cart and checkout (no server needed).
const shop = JSON.parse(document.getElementById('shop-data')?.textContent || '{}');
const catalog = shop.catalog || {};
const ordering = shop.ordering || {};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } },
};

/* ---------- Header + menu + reveal ---------- */
const header = $('[data-header]');
const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 10);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const toggle = $('.nav-toggle');
const links = $('.nav-links');
toggle?.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
links?.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') { links.classList.remove('open'); toggle.setAttribute('aria-expanded', false); }
});

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });
} else {
  $$('.reveal').forEach((el) => el.classList.add('in'));
}

/* ---------- Currency ---------- */
const inSriLanka = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Colombo'; } catch { return true; } })();
let currency = store.get('spm-currency', null) || (inSriLanka ? (ordering.default_currency || 'LKR') : 'USD');

const money = (lkr, usd) => (currency === 'USD'
  ? `$${Number(usd).toFixed(2)}`
  : `Rs ${Math.round(lkr).toLocaleString('en-US')}`);
const amount = (v) => (currency === 'USD' ? Number(v.usd) : Number(v.lkr));
const fmt = (n) => (currency === 'USD' ? `$${n.toFixed(2)}` : `Rs ${Math.round(n).toLocaleString('en-US')}`);

function renderPrices() {
  $$('.price[data-lkr]').forEach((el) => { el.textContent = money(el.dataset.lkr, el.dataset.usd); });
  $$('[data-currency]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.currency === currency));
}
$$('[data-currency]').forEach((b) => b.addEventListener('click', () => {
  currency = b.dataset.currency;
  store.set('spm-currency', currency);
  renderPrices(); renderCart(); updateBuyTotals();
}));

/* ---------- Cart ---------- */
let cart = store.get('spm-cart', []).filter((i) => catalog[i.id] && variantOf(i));

function variantOf(item) { return catalog[item.id]?.variants.find((v) => v.size === item.size); }
function saveCart() { store.set('spm-cart', cart); renderCart(); }
function addToCart(id, size, qty) {
  const line = cart.find((i) => i.id === id && i.size === size);
  if (line) line.qty = Math.min(99, line.qty + qty); else cart.push({ id, size, qty });
  saveCart();
  const badge = $('[data-cart-count]');
  badge?.classList.remove('bump'); void badge?.offsetWidth; badge?.classList.add('bump');
  toast(`Added ${qty} × ${catalog[id].name} (${size})`);
}
function setQty(index, qty) {
  if (qty < 1) cart.splice(index, 1); else cart[index].qty = Math.min(99, qty);
  saveCart();
}
const subtotal = () => cart.reduce((s, i) => s + amount(variantOf(i)) * i.qty, 0);
const count = () => cart.reduce((s, i) => s + i.qty, 0);

const packThumb = (color) => `<svg viewBox="0 0 60 72" aria-hidden="true"><path d="M10 8h40l2 56q0 4-4 4H12q-4 0-4-4z" fill="#d4b07b"/><rect x="9" y="4" width="42" height="6" rx="1" fill="#b78d58"/><rect x="16" y="20" width="28" height="34" rx="3" fill="#fbf8f2"/><rect x="16" y="20" width="28" height="3" fill="${color}"/><path d="M26 44c1-6 4-10 10-12-1 6-4 10-9 10" fill="none" stroke="#2a8a3e" stroke-width="2" stroke-linecap="round"/></svg>`;

function lineHTML(item, index) {
  const p = catalog[item.id]; const v = variantOf(item);
  return `<div class="line">
    <a class="line-thumb" href="${p.url}">${packThumb(p.color)}</a>
    <div>
      <a class="line-name" href="${p.url}">${p.name}</a>
      <div class="line-meta">${item.size} · ${money(v.lkr, v.usd)} each</div>
      <div class="line-controls">
        <div class="qty qty-sm">
          <button type="button" data-line-step="-1" data-index="${index}" aria-label="Decrease quantity">−</button>
          <input type="number" min="1" max="99" value="${item.qty}" data-line-qty data-index="${index}" aria-label="Quantity">
          <button type="button" data-line-step="1" data-index="${index}" aria-label="Increase quantity">+</button>
        </div>
        <button type="button" class="line-remove" data-line-remove data-index="${index}" aria-label="Remove ${p.name} ${item.size}"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
      </div>
    </div>
    <div class="line-price">${fmt(amount(v) * item.qty)}</div>
  </div>`;
}
const emptyHTML = `<div class="empty"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c1-6 5-11 15-14-1 9-5 14-12 14H5z"/><path d="M5 19c3-4 6-7 10-9"/></svg><p>Your cart is empty.</p><a class="btn btn-primary btn-sm" href="${(shop.cartUrl || '/cart/').replace(/cart\/$/, 'products/')}">Browse products</a></div>`;

function renderCart() {
  const n = count();
  const badge = $('[data-cart-count]');
  if (badge) { badge.textContent = n; badge.hidden = n === 0; }
  const list = $('[data-cart-list]');
  if (list) list.innerHTML = cart.length ? cart.map(lineHTML).join('') : emptyHTML;
  const foot = $('[data-cart-foot]');
  if (foot) foot.hidden = !cart.length;
  const sub = $('[data-cart-subtotal]');
  if (sub) sub.textContent = fmt(subtotal());
  renderCheckout();
}

document.addEventListener('click', (e) => {
  const step = e.target.closest('[data-line-step]');
  if (step) { const i = +step.dataset.index; setQty(i, cart[i].qty + +step.dataset.lineStep); return; }
  const rm = e.target.closest('[data-line-remove]');
  if (rm) { cart.splice(+rm.dataset.index, 1); saveCart(); }
});
document.addEventListener('change', (e) => {
  if (e.target.matches('[data-line-qty]')) setQty(+e.target.dataset.index, parseInt(e.target.value, 10) || 0);
});

/* Drawer */
const drawer = $('#cart-drawer');
const backdrop = $('.drawer-backdrop');
function openDrawer() {
  if (!drawer || $('[data-checkout]')) { window.location.href = shop.cartUrl; return; }
  backdrop.hidden = false;
  requestAnimationFrame(() => { backdrop.classList.add('open'); drawer.classList.add('open'); });
  drawer.setAttribute('aria-hidden', 'false');
  $('[data-cart-close]', drawer)?.focus();
}
function closeDrawer() {
  backdrop?.classList.remove('open'); drawer?.classList.remove('open');
  drawer?.setAttribute('aria-hidden', 'true');
  setTimeout(() => { if (backdrop) backdrop.hidden = true; }, 300);
}
$$('[data-cart-open]').forEach((b) => b.addEventListener('click', openDrawer));
$$('[data-cart-close]').forEach((b) => b.addEventListener('click', closeDrawer));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

/* Toast */
let toastTimer;
function toast(msg) {
  const t = $('[data-toast]'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- Buy boxes (product page + home feature) ---------- */
function updateBuyTotals() {
  $$('[data-buy]').forEach((form) => {
    const r = $('input[name=size]:checked', form);
    const q = Math.max(1, parseInt(form.qty.value, 10) || 1);
    const out = $('[data-buy-total] .price', form);
    if (r && out) out.textContent = fmt(amount(r.dataset) * q);
  });
}
$$('[data-buy]').forEach((form) => {
  form.addEventListener('change', updateBuyTotals);
  form.addEventListener('input', updateBuyTotals);
  $$('[data-step]', form).forEach((b) => b.addEventListener('click', () => {
    form.qty.value = Math.min(99, Math.max(1, (parseInt(form.qty.value, 10) || 1) + +b.dataset.step));
    updateBuyTotals();
  }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const size = $('input[name=size]:checked', form)?.value;
    const qty = Math.min(99, Math.max(1, parseInt(form.qty.value, 10) || 1));
    if (size) { addToCart(form.dataset.id, size, qty); openDrawer(); }
  });
});

/* ---------- Checkout ---------- */
const checkout = $('[data-checkout]');
const orderForm = $('#order-form');

function isLocal() {
  return !orderForm || orderForm.country.value === 'Sri Lanka';
}
function delivery() {
  const d = ordering.local_delivery || {};
  if (!isLocal()) return null; // quoted later
  const sub = subtotal();
  const freeOver = currency === 'USD' ? d.free_over_usd : d.free_over_lkr;
  if (freeOver && sub >= freeOver) return 0;
  return currency === 'USD' ? Number(d.usd || 0) : Number(d.lkr || 0);
}

function renderCheckout() {
  if (!checkout) return;
  const items = $('[data-summary-items]');
  items.innerHTML = cart.length ? cart.map(lineHTML).join('') : emptyHTML;
  const sub = subtotal(); const del = cart.length ? delivery() : 0;
  $('[data-summary-subtotal]').textContent = fmt(sub);
  $('[data-summary-delivery]').textContent = del === null ? 'Quoted after order' : del === 0 ? 'Free' : fmt(del);
  $('[data-summary-total]').textContent = fmt(sub + (del || 0)) + (del === null ? ' + shipping' : '');
  const d = ordering.local_delivery || {};
  const freeOver = currency === 'USD' ? d.free_over_usd : d.free_over_lkr;
  $('[data-summary-note]').textContent = !cart.length ? '' : del === null
    ? (ordering.international_note || '')
    : (freeOver && del > 0 ? `Free delivery in Sri Lanka on orders over ${fmt(freeOver)}.` : '');
  $$('[data-needs-items]').forEach((b) => { b.disabled = !cart.length; });
}

if (orderForm) {
  const other = $('[data-country-other]');
  const cod = $('[data-pay="cod"] input');
  orderForm.country.addEventListener('change', () => {
    const local = isLocal();
    other.hidden = local;
    other.querySelector('input').required = !local;
    if (cod) {
      cod.disabled = !local;
      cod.closest('.pay').classList.toggle('is-disabled', !local);
      if (!local && cod.checked) { const bank = $('[data-pay="bank"] input'); if (bank) bank.checked = true; }
    }
    if (!local && currency === 'LKR' && !store.get('spm-currency', null)) { currency = 'USD'; renderPrices(); }
    renderCart();
  });
  if (!inSriLanka && !store.get('spm-currency', null)) {
    orderForm.country.value = 'other';
    orderForm.country.dispatchEvent(new Event('change'));
  }

  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const via = e.submitter?.value || 'whatsapp';
    const status = $('[data-form-status]', orderForm);
    status.className = 'form-status';
    if (!cart.length) { status.textContent = 'Your cart is empty.'; status.classList.add('error'); return; }
    $$('.invalid', orderForm).forEach((el) => el.classList.remove('invalid'));
    const bad = $$('[required]', orderForm).filter((el) => !el.closest('[hidden]') && !el.value.trim());
    if (via === 'email' && !orderForm.email.value.trim()) bad.push(orderForm.email);
    if (orderForm.email.value && !orderForm.email.checkValidity()) bad.push(orderForm.email);
    if (bad.length) {
      bad.forEach((el) => el.classList.add('invalid'));
      bad[0].focus();
      status.textContent = via === 'email' && !orderForm.email.value.trim()
        ? 'Please add your email address so we can reply.' : 'Please fill in the highlighted fields.';
      status.classList.add('error');
      return;
    }

    const ref = orderRef();
    const text = orderText(ref);
    if (via === 'whatsapp') {
      window.open(`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      orderSent(ref);
      return;
    }
    // Email via FormSubmit; falls back to the visitor's email app if the service can't be reached.
    const btn = e.submitter; if (btn) btn.disabled = true;
    status.textContent = 'Sending your order…';
    const f = new FormData(orderForm);
    try {
      const res = await fetch(`${ordering.email_service}${encodeURIComponent(shop.email)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `New order ${ref} — ${f.get('name')}`,
          _template: 'box', _captcha: 'false', _replyto: f.get('email'),
          'Order ref': ref, Name: f.get('name'), Phone: f.get('phone'), Email: f.get('email'),
          Order: text,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false || data.success === 'false') throw new Error(data.message || res.status);
      orderSent(ref);
    } catch (err) {
      window.location.href = `mailto:${shop.email}?subject=${encodeURIComponent(`Order ${ref}`)}&body=${encodeURIComponent(text)}`;
      status.textContent = 'We opened your email app with the order filled in — please press Send there.';
      status.classList.add('ok');
    } finally { if (btn) btn.disabled = false; }
  });
}

function orderRef() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SPM-${ymd}-${rand}`;
}

function orderText(ref) {
  const f = new FormData(orderForm);
  const country = isLocal() ? 'Sri Lanka' : f.get('country_other');
  const del = delivery(); const sub = subtotal();
  const lines = cart.map((i, n) => {
    const v = variantOf(i);
    return `${n + 1}. ${catalog[i.id].name} (${i.size}) x ${i.qty} = ${fmt(amount(v) * i.qty)}`;
  });
  return [
    `New order - ${shop.name}`,
    `Order ref: ${ref}`,
    '',
    ...lines,
    '',
    `Subtotal: ${fmt(sub)}`,
    `Delivery: ${del === null ? 'please quote shipping' : del === 0 ? 'Free' : fmt(del)}`,
    `Total: ${fmt(sub + (del || 0))}${del === null ? ' + shipping' : ''}`,
    '',
    `Name: ${f.get('name')}`,
    `Phone: ${f.get('phone')}`,
    f.get('email') ? `Email: ${f.get('email')}` : null,
    `Address: ${f.get('address')}, ${f.get('city')}${f.get('postcode') ? ' ' + f.get('postcode') : ''}, ${country}`,
    `Payment: ${f.get('payment') || '-'}`,
    f.get('notes') ? `Notes: ${f.get('notes')}` : null,
  ].filter((l) => l !== null).join('\n');
}

function orderSent(ref) {
  cart = []; saveCart();
  $('[data-order-ref]').textContent = ref;
  $('.checkout-grid').hidden = true;
  $('[data-order-done]').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Contact form ---------- */
const contact = $('[data-contact]');
contact?.addEventListener('submit', (e) => {
  e.preventDefault();
  const status = $('[data-form-status]', contact);
  const bad = $$('[required]', contact).filter((el) => !el.value.trim());
  $$('.invalid', contact).forEach((el) => el.classList.remove('invalid'));
  if (bad.length) { bad.forEach((el) => el.classList.add('invalid')); bad[0].focus(); status.textContent = 'Please fill in the highlighted fields.'; status.className = 'form-status error'; return; }
  const f = new FormData(contact);
  const text = `Hello ${shop.name},\n\n${f.get('message')}\n\nName: ${f.get('name')}\nReply to: ${f.get('reply')}\nTopic: ${f.get('topic')}`;
  if ((e.submitter?.value || 'whatsapp') === 'whatsapp') {
    window.open(`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  } else {
    window.location.href = `mailto:${shop.email}?subject=${encodeURIComponent(f.get('topic'))}&body=${encodeURIComponent(text)}`;
  }
  status.textContent = 'Thank you — we will reply soon.'; status.className = 'form-status ok';
});

renderPrices();
renderCart();
updateBuyTotals();

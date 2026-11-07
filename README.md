# SPM Organics website

Online shop for SPM Organics — pure, single-ingredient organic products from Sri Lanka,
starting with curry leaves powder. Built with [Hugo](https://gohugo.io), hosted free on
GitHub Pages. No server or database: the cart lives in the visitor's browser and orders are
sent to you by **WhatsApp** or **email**.

## Before going live

1. Open `data/business.yaml` and replace every line marked `# TODO`
   (phone, WhatsApp number, email, location, delivery charges, story).
2. Set `contact.enabled: true` — this switches on the checkout buttons, contact links
   and the floating WhatsApp button.
3. Check sizes and prices in `content/products/curry-leaves-powder.md`.
4. Place one test email order. FormSubmit sends a one-time **activation email** to your
   address; click the link and every later order arrives in your inbox.

## Edit the content

| What | Where |
| --- | --- |
| Phone, WhatsApp, email, delivery fees, payment options, FAQ, story | `data/business.yaml` |
| A product's sizes, prices (LKR + USD), description, how-to-use | `content/products/<product>.md` |
| Add a new product | copy `content/products/curry-leaves-powder.md` to a new file and edit it |
| Product photo | put the image in `assets/images/` and set `photo:` in the product file |

Until you have real product photos, the site draws a pouch illustration with your logo
(`layouts/_partials/pack.html`). Its label colour is `pack_color` in each product file.

## How ordering works

- Visitors pick a size and add it to the cart (kept in their browser).
- Prices show in **LKR** for visitors in Sri Lanka and **USD** for everyone else;
  they can switch at the top of the page.
- At checkout they enter their details and choose **Send order on WhatsApp** (opens a
  pre-filled WhatsApp chat to your number) or **Send order by email** (sent through
  FormSubmit to `contact.email`). Each order gets a reference like `SPM-261107-AB12`.
- Sri Lanka orders show the local delivery fee; international orders say shipping will be
  quoted. Cash on delivery is only offered in Sri Lanka.

### Adding card payments later

`ordering.payment_methods` in `data/business.yaml` already lists "Card payment — coming
soon". When you're ready, sign up with a payment provider (e.g. **PayHere** for Sri Lankan
cards, **Stripe** or **PayPal** for international cards), then the checkout script
(`assets/js/main.js`, the `orderForm` submit handler) can send the cart to their hosted
checkout page.

## Preview locally

```bash
hugo server
```

Open http://localhost:1313 — the page reloads as you edit.

## Deploy

Every push to `main` is built and deployed by `.github/workflows/hugo.yaml`.
In the GitHub repository go to **Settings → Pages** and set **Source** to **GitHub Actions**.

## Project layout

| Path | What it is |
| --- | --- |
| `data/business.yaml` | Site-wide text and shop settings |
| `content/products/` | One file per product |
| `layouts/` | HTML templates (home, shop, product, about, contact, checkout) |
| `layouts/_partials/logo.html` | The "Rooted in purity" badge logo as SVG |
| `assets/css/main.css` | Styles |
| `assets/js/main.js` | Cart, currency switch, checkout (WhatsApp / email) |
| `static/brand/logo-original.jpg` | Original logo artwork |

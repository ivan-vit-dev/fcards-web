# Platby (Stripe) – zapnutí placeného režimu

Aplikace běží ve dvou režimech podle proměnné prostředí:

| Režim | Web (Vercel / `.env`) | Cloud Functions (`functions/.env`) | Chování |
|---|---|---|---|
| zdarma (výchozí) | `NEXT_PUBLIC_BILLING_MODE=free` nebo nenastaveno | `BILLING_MODE=free` nebo nenastaveno | Všechny funkce odemčené pro všechny. AI úpravy mají měsíční limit `FREE_MODE_AI_CREDITS` (výchozí 20), protože každá stojí peníze. Žádné ceníky ani platby. |
| placený | `NEXT_PUBLIC_BILLING_MODE=paid` | `BILLING_MODE=paid` | Tarify Zdarma / Premium / Team / Klub s limity z `TIER_LIMITS` (`src/lib/subscriptionEngine.ts`), předplatné přes Stripe. |

Obě hodnoty musí být stejné. Limity vždy vynucuje server (Cloud Functions); web je jen zobrazuje.

## Jak to funguje

1. Uživatel na stránce **Nastavení → Předplatné** zvolí tarif a měsíční nebo roční platbu.
2. Funkce `createCheckoutSession` založí zákazníka ve Stripe (jednou na uživatele) a přesměruje ho na **Stripe Checkout**.
3. Po zaplacení pošle Stripe událost na webhook `stripeWebhook`. Ten načte předplatné ze Stripe a zapíše `subscriptionTier` a `subscription` do `users/{uid}`.
4. Změnu tarifu, zrušení, změnu karty a faktury řeší uživatel ve **Stripe Customer Portal** (`createPortalSession`).
5. Když se platba nezdaří (stav `past_due`), uživatel si tarif nechá, dokud Stripe platbu opakuje. Pak tarif spadne na `free`, data zůstanou.
6. Smazání účtu nejdřív zruší předplatné. Zákazník a faktury ve Stripe zůstanou kvůli účetnictví.

## Postup zapnutí

### 1. Stripe účet
- Zaregistrujte se na <https://dashboard.stripe.com>. Vše nejdřív vyzkoušejte v **testovacím režimu** (Test mode).
- Nastavení → Business: údaje firmy, IČO, bankovní účet pro výplaty.
- Nastavení → Faktury: zapněte zasílání faktur e-mailem. Podle toho, zda jste plátce DPH, nastavte daně (Stripe Tax nebo ruční sazby).

### 2. Produkty a ceny
V Product catalog vytvořte dva produkty, oba s cenami v **CZK** a typu **Recurring**:

| Produkt | Měsíčně | Ročně |
|---|---|---|
| Premium | 149 Kč | 1 490 Kč |
| Team | 399 Kč | 3 990 Kč |

Zkopírujte čtyři **Price ID** (`price_…`). Když změníte ceny, změňte i `TIER_PRICES_CZK` a `TIER_PRICES_YEARLY_CZK` v `src/lib/subscriptionEngine.ts`, protože se zobrazují v aplikaci.

### 3. Customer Portal
Nastavení → Billing → Customer portal:
- povolte zrušení předplatného (na konci období), změnu platební metody a historii faktur;
- povolte změnu tarifu mezi Premium a Team (měsíčně i ročně) a vyberte všechny 4 ceny;
- vyplňte odkazy na podmínky a zásady: `https://<vaše-doména>/cs/legal/terms` a `/cs/legal/privacy`.

### 4. Webhook
Developers → Webhooks → Add endpoint:
- URL: `https://europe-west1-fcards-web.cloudfunctions.net/stripeWebhook`
- události: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`
- zkopírujte **Signing secret** (`whsec_…`).

### 5. Tajné klíče (Firebase secrets – nikdy do `.env`)
```bash
npx firebase functions:secrets:set STRIPE_SECRET_KEY      # sk_test_… (později sk_live_…)
npx firebase functions:secrets:set STRIPE_WEBHOOK_SECRET  # whsec_…
```
> Funkce `deleteAccount`, `createCheckoutSession`, `createPortalSession` a `stripeWebhook` tyto secrets deklarují, takže **musí existovat i v režimu zdarma**, jinak deploy selže. Dokud Stripe nemáte, nastavte obě na libovolnou zástupnou hodnotu, třeba `not-configured`.

### 6. `functions/.env`
```
BILLING_MODE=paid
APP_URL=https://<vaše-doména>
STRIPE_PRICE_PREMIUM_MONTHLY=price_…
STRIPE_PRICE_PREMIUM_YEARLY=price_…
STRIPE_PRICE_TEAM_MONTHLY=price_…
STRIPE_PRICE_TEAM_YEARLY=price_…
```
Pak `cd functions && npm run deploy`.

### 7. Web
Ve Vercelu (Settings → Environment Variables) nastavte `NEXT_PUBLIC_BILLING_MODE=paid` a nasaďte znovu.

### 8. Test (testovací režim)
- Karta `4242 4242 4242 4242`, libovolné budoucí datum a CVC → tarif se aktivuje během pár sekund.
- Karta `4000 0000 0000 0341` → nezdařená obnova (`past_due`).
- Zrušení v portálu → u plánu se ukáže datum konce; po něm tarif spadne na Zdarma.
- Lokálně: `stripe listen --forward-to <URL webhooku>`.

### 9. Ostrý provoz
Přepněte Stripe do Live mode. Vytvořte znovu produkty a ceny, webhook a klíče (live hodnoty jsou jiné) a zopakujte kroky 5–7.

## Právní body k ověření
- Text o 14denní lhůtě na odstoupení (podmínky, sekce 5): případně zapněte v Checkout souhlas s podmínkami (`consent_collection`).
- Uvádění cen s DPH nebo bez DPH podle toho, zda jste plátce.
- Smlouva o zpracování osobních údajů se Stripe (Stripe DPA).

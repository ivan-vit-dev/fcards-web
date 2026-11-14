import type { Metadata } from "next";
import { AI_PROCESSORS, DIGITAL_CONSENT_AGE, LEGAL_VERSION, OPERATOR } from "@/lib/legal";
import { isPaidMode } from "@/lib/billing";

export const metadata: Metadata = { title: "Zásady ochrany osobních údajů" };

// DRAFT — must be reviewed by a lawyer before public launch (see OPERATOR placeholders).
export default function PrivacyPage() {
  return (
    <>
      <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
        Návrh dokumentu – před spuštěním služby jej musí zkontrolovat právník.
      </p>
      <h1>Zásady ochrany osobních údajů</h1>
      <p className="text-muted-foreground">Platné od {LEGAL_VERSION}</p>

      <p>
        Fotbalové Kartičky používají i děti. Proto se snažíme sbírat jen to, co aplikace opravdu potřebuje,
        a vše podstatné vysvětlit srozumitelně. Tyto zásady popisují, jak zpracováváme osobní údaje podle
        nařízení GDPR (2016/679) a zákona č. 110/2019 Sb.
      </p>

      <h2>1. Kdo údaje zpracovává</h2>
      <p>
        Správcem je {OPERATOR.name}, IČO {OPERATOR.id}, {OPERATOR.address}. Kontakt pro vše, co se týká
        osobních údajů: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.
      </p>

      <h2>2. Jaké údaje zpracováváme</h2>
      <ul>
        <li>
          <strong>Účet:</strong> jméno, e-mail, heslo (uložené jen jako otisk u Firebase Authentication), při
          přihlášení přes Google také profilová fotka z Google účtu; informace, kdo účet založil (uživatel 15+
          nebo rodič) a kdy byly uděleny souhlasy.
        </li>
        <li>
          <strong>Hráči:</strong> jméno, pozice, číslo dresu, národnost, fotky, tým a statistiky ze zápasů.
        </li>
        <li>
          <strong>Kartičky:</strong> design, fotky a jejich AI úpravy, vygenerovaný příběh, sdílené odkazy.
        </li>
        <li>
          <strong>Týmy a kluby:</strong> název, logo, barvy, zápasy a soupiska.
        </li>
        <li>
          <strong>Nahlášení obsahu:</strong> důvod a poznámka; abychom zabránili opakovanému nahlašování,
          ukládáme u přihlášených identifikátor účtu, u nepřihlášených jen nevratný otisk (hash) IP adresy.
          Vlastník obsahu se nedozví, kdo jej nahlásil.
        </li>
        <li>
          <strong>Technické údaje:</strong> token pro push notifikace (pokud je povolíte) a – jen s vaším
          souhlasem – analytické údaje o používání aplikace.
        </li>
      </ul>

      <h2>3. Proč a na jakém základě</h2>
      <ul>
        <li>
          <strong>Provoz aplikace</strong> (účet, hráči, kartičky, tisk) – plnění smlouvy, čl. 6 odst. 1 písm. b)
          GDPR.
        </li>
        <li>
          <strong>Úpravy fotek pomocí AI</strong>, <strong>zveřejnění kartičky nebo profilu</strong> a{" "}
          <strong>analytické cookies</strong> – souhlas, čl. 6 odst. 1 písm. a) GDPR. Souhlas můžete kdykoli
          odvolat; zpracování před odvoláním tím nepřestává být zákonné.
        </li>
        <li>
          <strong>Bezpečnost, moderování veřejného obsahu a ochrana před zneužitím</strong> – oprávněný zájem, čl. 6 odst. 1 písm. f) GDPR.
        </li>
      </ul>

      <h2>4. Děti</h2>
      <p>
        Dítě mladší {DIGITAL_CONSENT_AGE} let si účet samo založit nemůže. Účet za něj zakládá a spravuje rodič
        nebo jiný zákonný zástupce, který zároveň uděluje souhlasy (AI úpravy, zveřejnění). Zjistíme-li, že účet
        založilo dítě mladší {DIGITAL_CONSENT_AGE} let bez rodiče, účet smažeme. Fotky a údaje dětí nikdy
        neprodáváme a nepoužíváme k reklamě.
      </p>

      <h2>5. Komu údaje předáváme</h2>
      <p>Údaje zpracovávají za nás tito zpracovatelé:</p>
      <ul>
        <li>Google Ireland Ltd. / Google LLC – Firebase (přihlášení, databáze, úložiště fotek, serverové funkce, notifikace, analytika)</li>
        <li>Vercel Inc. (USA) – hosting webové aplikace</li>
        {isPaidMode() && (
          <li>
            Stripe Payments Europe, Ltd. (Irsko) – platby předplatného; předáváme e-mail a jméno, platební údaje
            zadáváte přímo Stripe
          </li>
        )}
        {AI_PROCESSORS.map((p) => (
          <li key={p.name}>
            {p.name} – {p.purpose}; předáváme: {p.data}. Jen se souhlasem s AI úpravami.
          </li>
        ))}
      </ul>
      <p>
        Někteří zpracovatelé sídlí v USA. Předání probíhá na základě rozhodnutí Evropské komise o odpovídající
        ochraně (EU-US Data Privacy Framework) u certifikovaných společností, jinak na základě standardních
        smluvních doložek. [DOPLNIT: ověřit certifikaci a smlouvy o zpracování u každého zpracovatele.]
      </p>
      <p>
        Zveřejněnou kartičku nebo profil uvidí každý, kdo má odkaz. Nic jiného nezveřejňujeme.
      </p>

      <h2>6. Jak dlouho údaje uchováváme</h2>
      <p>
        Dokud účet existuje. Jednotlivé kartičky, hráče a AI úpravy můžete smazat kdykoli. Při smazání účtu
        smažeme všechny údaje i fotky okamžitě; ze záloh zmizí nejpozději do [DOPLNIT] dní. AI služby fotky po
        zpracování neuchovávají déle, než stanoví jejich podmínky [DOPLNIT: ověřit u Replicate].
      </p>

      <h2 id="cookies">7. Cookies a úložiště v prohlížeči</h2>
      <p>
        Nezbytné úložiště používáme pro přihlášení a vaše volby (např. motiv). Analytické cookies (Google
        Analytics přes Firebase) spustíme jen tehdy, když je v liště povolíte. Volbu můžete změnit odkazem
        „Nastavení cookies“ v patičce.
      </p>

      <h2>8. Vaše práva</h2>
      <ul>
        <li>přístup k údajům a jejich kopie – v aplikaci Nastavení → Soukromí a účet → Stáhnout moje data</li>
        <li>oprava údajů – přímo v aplikaci</li>
        <li>výmaz – v aplikaci Nastavení → Soukromí a účet → Smazat účet</li>
        <li>omezení zpracování, přenositelnost, námitka</li>
        <li>odvolání souhlasu – v Nastavení → Soukromí a účet, u zveřejnění vypnutím přepínače</li>
        <li>
          stížnost u Úřadu pro ochranu osobních údajů, Pplk. Sochora 27, 170 00 Praha 7,{" "}
          <a href="https://uoou.gov.cz" target="_blank" rel="noreferrer">
            uoou.gov.cz
          </a>
        </li>
      </ul>
      <p>
        S čímkoli dalším nám napište na <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>. Odpovíme do
        jednoho měsíce.
      </p>

      <h2>9. Změny</h2>
      <p>
        Při podstatné změně těchto zásad vás při příštím přihlášení požádáme o jejich odsouhlasení.
      </p>
    </>
  );
}

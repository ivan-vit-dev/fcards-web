import type { Metadata } from "next";
import { DIGITAL_CONSENT_AGE, LEGAL_VERSION, OPERATOR } from "@/lib/legal";
import { isPaidMode } from "@/lib/billing";

export const metadata: Metadata = { title: "Podmínky použití" };

// DRAFT — must be reviewed by a lawyer before public launch (see OPERATOR placeholders).
export default function TermsPage() {
  return (
    <>
      <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
        Návrh dokumentu – před spuštěním služby jej musí zkontrolovat právník.
      </p>
      <h1>Podmínky použití</h1>
      <p className="text-muted-foreground">Platné od {LEGAL_VERSION}</p>

      <h2>1. Služba</h2>
      <p>
        Fotbalové Kartičky (dále „služba“) provozuje {OPERATOR.name}, IČO {OPERATOR.id}, {OPERATOR.address}.
        Služba umožňuje vytvářet personalizované fotbalové kartičky z fotek a statistik hráčů, upravovat je
        pomocí AI, sdílet je a tisknout.
      </p>

      <h2>2. Účet</h2>
      <ul>
        <li>
          Účet si může založit osoba starší {DIGITAL_CONSENT_AGE} let. Pro mladší děti účet zakládá a spravuje
          rodič nebo zákonný zástupce a odpovídá za jeho používání.
        </li>
        <li>Přihlašovací údaje chraňte; za činnost na účtu odpovídá jeho držitel.</li>
        <li>Účet můžete kdykoli smazat v Nastavení → Soukromí a účet.</li>
      </ul>

      <h2>3. Fotky a obsah, který nahráváte</h2>
      <ul>
        <li>
          Nahrávejte jen fotky, ke kterým máte práva, a fotky osob jen s jejich svolením (u dětí se svolením
          rodiče).
        </li>
        <li>
          Obsah zůstává váš. Udělujete nám pouze oprávnění, které potřebujeme k provozu služby: uložit jej,
          upravit podle vašich pokynů (včetně AI), zobrazit vám a – pokud kartičku zveřejníte – komukoli s
          odkazem.
        </li>
        <li>
          Zakázaný je obsah nezákonný, urážlivý, sexuální, násilný, obsah zesměšňující jiné osoby a obsah
          porušující práva třetích osob. Takový obsah můžeme bez upozornění skrýt nebo smazat a účet zablokovat.
        </li>
      </ul>

      <h2>4. AI úpravy</h2>
      <p>
        AI úpravy (póza, emoce, styl, pozadí, příběh) vytvářejí služby třetích stran. Výsledek nemusí přesně
        odpovídat skutečné podobě hráče a může obsahovat chyby. Použití AI vyžaduje samostatný souhlas a
        spotřebovává měsíční AI kredity podle tarifu; neúspěšná úprava kredit nespotřebuje.
      </p>

      <h2>5. Tarify a platby</h2>
      {isPaidMode() ? (
        <ul>
          <li>
            Základní tarif je zdarma. Placené tarify (Premium, Team) jsou předplatné na měsíc nebo na rok za
            ceny uvedené v aplikaci v době objednávky. [DOPLNIT: ceny včetně DPH / provozovatel není plátcem DPH.]
          </li>
          <li>
            Platby zpracovává Stripe Payments Europe, Ltd. Údaje o platební kartě provozovatel nezískává.
            Fakturu najdete ve správě předplatného.
          </li>
          <li>
            Předplatné se automaticky obnovuje na další období a platba se strhne na jeho začátku. Zrušit ho
            můžete kdykoli v Nastavení → Předplatné → Spravovat předplatné; placené funkce pak zůstanou do konce
            zaplaceného období. Za nevyčerpanou část období se peníze nevracejí.
          </li>
          <li>
            Když se platba nezdaří, opakujeme ji několik dní. Pokud se nepodaří, tarif se změní na bezplatný;
            kartičky a data zůstanou.
          </li>
          <li>
            Odstoupení od smlouvy (spotřebitelé): placené funkce se zpřístupní ihned po zaplacení. Objednávkou
            žádáte o okamžité poskytnutí digitálního obsahu a berete na vědomí, že tím ztrácíte právo odstoupit
            do 14 dnů (§ 1837 písm. l) občanského zákoníku). [DOPLNIT: ověřit s právníkem, případně přidat
            zaškrtávací políčko do Stripe Checkout.]
          </li>
          <li>Tarif Klub se sjednává individuálně.</li>
        </ul>
      ) : (
        <p>Služba je teď zdarma. Úpravy fotek pomocí AI mají měsíční limit, který je uveden v aplikaci.</p>
      )}

      <h2>6. Dostupnost a odpovědnost</h2>
      <p>
        Službu poskytujeme tak, jak je, a průběžně ji vylepšujeme. Neodpovídáme za krátkodobou nedostupnost ani
        za obsah, který do služby nahrají uživatelé. Odpovědnost, kterou zákon vyloučit nedovoluje, tím není
        dotčena.
      </p>

      <h2>7. Ukončení</h2>
      <p>
        Smlouva skončí smazáním účtu. Při závažném porušení těchto podmínek můžeme účet zrušit.
      </p>

      <h2>8. Závěrečná ustanovení</h2>
      <p>
        Řídí se právem České republiky. Změny podmínek oznámíme v aplikaci a požádáme o jejich odsouhlasení.
        Spotřebitelské spory řeší Česká obchodní inspekce (
        <a href="https://adr.coi.cz" target="_blank" rel="noreferrer">
          adr.coi.cz
        </a>
        ). Kontakt: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.
      </p>
    </>
  );
}

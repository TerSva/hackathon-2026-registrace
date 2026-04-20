# TESTING — checklist

Pro každou položku: ✅ prošlo, ❌ neprošlo (a popis chyby).

---

## 1. Lokální test — prázdný submit

- [ ] Otevři `index.html` v prohlížeči (stačí double-click nebo `file://`)
- [ ] Neklikej do žádného pole. Rovnou klikni **Odeslat registraci**
- [ ] **Očekávané chování:**
  - nevyskočí žádný `alert()` dialog
  - pod poli Jméno, Příjmení, E-mail, Role a Počet členů se objeví **magenta** textová chyba
  - borders těchto polí zrůžoví (magenta tón)
  - consent block zrůžoví a objeví se hláška o nutnosti souhlasu
  - stránka scrollne na první chybu

## 2. Lokální test — částečně vyplněný submit

- [ ] Vyplň jen Jméno a E-mail (neplatný formát, např. `abc`)
- [ ] Klikni **Odeslat**
- [ ] **Očekávané chování:**
  - Jméno nebude mít error, ostatní povinná pole ano
  - E-mail pole má chybu „Zadej platnou e-mailovou adresu"
  - po opravě (začneš psát platný e-mail) error zmizí

## 3. Lokální test — správný submit

- [ ] Vyplň všechna povinná pole správně, zaškrtni GDPR checkbox
- [ ] Klikni **Odeslat**
- [ ] **Očekávané chování:**
  - tlačítko se zamkne a zobrazí „Odesílám…"
  - stránka se redirectuje na `success.html`
  - na success stránce vidíš zelený check, text „Registrace proběhla!" a padající částice

## 4. Google Sheet — nový řádek

- [ ] Otevři Google Sheet (list `Registrace`)
- [ ] **Očekávané chování:**
  - přibyl nový řádek s timestamp, jménem, e-mailem, rolí, počtem členů, GDPR = ANO, kódem `HACK-XXXXX`
  - hlavička zůstala nezměněná, zamčená, tmavé pozadí

## 5. E-mail — potvrzení doručeno

- [ ] Otevři schránku e-mailu, který jsi vyplnil
- [ ] **Očekávané chování:**
  - dorazil e-mail s předmětem `Registrace potvrzena — HACK-XXXXX`
  - obsahuje gradient nadpis, kód, datum + místo konání, CTA na učebnici
  - odesilatel: `AI & Programming Hackathon 2026 <martin.k.svanda@gmail.com>`

## 6. Honeypot — anti-spam

- [ ] Otevři `index.html` a DevTools (F12)
- [ ] V konzoli:
  ```js
  document.getElementById('website').value = 'bot-filled-me';
  ```
- [ ] Vyplň povinná pole, klikni **Odeslat**
- [ ] **Očekávané chování:**
  - redirectne na `success.html` (bot dostane stejný fake úspěch)
  - v Sheetu **NEPŘIBUDE žádný řádek** (data nejsou odeslána)
  - žádný e-mail nedorazí

## 7. Chybějící povinné pole — inline chyba

- [ ] Vyplň vše kromě Role (nech `Vyber svou roli…`)
- [ ] Klikni **Odeslat**
- [ ] **Očekávané chování:**
  - jen pole Role má magenta error
  - žádný submit neproběhne

## 8. Neplatný e-mail — inline chyba

- [ ] Vyplň vše, jako e-mail zadej `abc@def` (bez TLD)
- [ ] Klikni **Odeslat**
- [ ] **Očekávané chování:**
  - pole E-mail má chybu „Zadej platnou e-mailovou adresu"
  - pak změň na `abc@def.com` — chyba zmizí při psaní

## 9. Live error clearing

- [ ] Klikni **Odeslat** s prázdnými poli (vyvolá errors)
- [ ] Začni psát do Jména
- [ ] **Očekávané chování:**
  - jakmile začneš psát (input event), error u Jména zmizí, border se vrátí na normal
  - ostatní errors zůstávají

## 10. Mobile — responsivita (volitelné)

- [ ] Otevři `index.html` v mobilním view (DevTools → Toggle device toolbar)
- [ ] **Očekávané chování:**
  - formulář je single-column (grid `cols-2` se lomí na 1 sloupec pod 560px)
  - tlačítka a inputy jsou dobře klikatelné

---

## Ze strany adminu (martin.k.svanda@gmail.com)

- [ ] V Apps Scriptu **Executions** tabu vidím historii POST requestů
- [ ] Při chybě `Missing required fields` — znamená, že někdo obešel frontend validaci (nebo něco pokazil)
- [ ] Při `Gmail quota exceeded` — dosaženo 100 mailů/den — upozorni se a případně zvyš limit přes workspace účet

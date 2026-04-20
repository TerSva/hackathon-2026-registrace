# SETUP — AI & Programming Hackathon 2026

Kompletní deploy návod krok za krokem. Tento dokument je určen pro **Martina Švandu** (martin.k.svanda@gmail.com), který má vlastnit Sheet, Apps Script projekt i odesílaný e-mail.

---

## Co budeš potřebovat

- Google účet: **martin.k.svanda@gmail.com**
- GitHub účet (pro hostování přes GitHub Pages)
- ~20 minut času

---

## Přehled architektury

```
Uživatel → GitHub Pages (index.html)
              │  fetch POST (no-cors)
              ▼
          Apps Script Web App (doPost)
              │           │
              ▼           ▼
          Google Sheet  Gmail (MailApp)
```

- **Frontend** hostovaný zdarma na GitHub Pages jako statický web.
- **Backend** je Apps Script — zapisuje do Sheetu, posílá e-mail.
- **Data** jsou v Google Sheetu, který vlastní martin.k.svanda@gmail.com.

---

## KROK 1 — Google Sheet

1. Přihlas se jako **martin.k.svanda@gmail.com**.
2. Otevři [Google Sheets](https://sheets.google.com) → **Blank spreadsheet**.
3. Přejmenuj soubor na `Hackathon 2026 — Registrace`.
4. Zkopíruj **ID sheetu** z URL — je to ten dlouhý řetězec mezi `/d/` a `/edit`:
   ```
   https://docs.google.com/spreadsheets/d/[TADY_JE_ID]/edit
   ```
5. V repu projektu je v `apps-script/Code.gs` konstanta `SHEET_ID` už přednastavená na:
   ```
   1TvRRFUQ7umPuCCSigqbrJgr4kHLk4ZcqLfoDPb619yE
   ```
   Pokud si vytvoříš **nový** sheet, nahraď tuto hodnotu jeho ID. Pokud chceš použít existující sheet s tímto ID, přeskoč a pokračuj dál.

> **Poznámka:** Sheet vlastní ten, kdo ho vytvořil. Při deployi Apps Scriptu `Execute as: Me` znamená, že Sheet musí být přístupný pod stejným účtem, pod kterým spouštíš deploy.

---

## KROK 2 — Apps Script projekt

1. Přihlas se jako **martin.k.svanda@gmail.com** a otevři [script.google.com](https://script.google.com).
2. Klikni **New project** (nahoře vlevo).
3. Přejmenuj projekt (klik na `Untitled project`) → `Hackathon Registration Webhook`.
4. V levém panelu klikni na `Code.gs` (jediný soubor).
5. **Smaž celý obsah** a vlož obsah souboru [`apps-script/Code.gs`](../apps-script/Code.gs) z tohoto repa.
6. Zkontroluj, že `SHEET_ID` odpovídá tvému Sheetu.
7. Ulož: **Ctrl/⌘ + S** (nebo ikona diskety).

---

## KROK 3 — Inicializace sheetu (jednorázově)

1. V editoru Apps Scriptu nahoře najdi dropdown **Select function**.
2. Vyber `initSheet`.
3. Klikni **Run** (▶️).
4. **První spuštění** → Google chce schválit oprávnění:
   - klikni **Review permissions**
   - vyber účet **martin.k.svanda@gmail.com**
   - uvidíš varování *Google hasn't verified this app* — klikni **Advanced → Go to Hackathon Registration Webhook (unsafe)** (je to tvůj vlastní kód, neboj)
   - potvrď **Allow**
5. Script se spustí a v execution logu (Ctrl/⌘ + Enter) uvidíš:
   ```
   Sheet initialized: Registrace
   ```
6. Otevři Sheet — měl bys vidět:
   - list **Registrace** s 14 sloupci
   - tmavou hlavičku (bílý text na `#0f172a`), zamčenou (warning-only)
   - výchozí list `List1` / `Sheet1` byl smazán

---

## KROK 4 — Test end-to-end v editoru

1. V Apps Scriptu vyber funkci `testSubmit` → **Run**.
2. Při prvním spuštění tě vyzve k oprávnění pro **Gmail (MailApp)** — potvrď.
3. Ověř:
   - v Sheetu přibyl řádek s `Test Uživatel` a kódem `HACK-XXXXX`
   - do schránky **martin.k.svanda@gmail.com** dorazil e-mail se subjectem `Registrace potvrzena — HACK-XXXXX`

Pokud vše sedí, pokračuj na deploy.

---

## KROK 5 — Deploy jako Web App

1. V Apps Scriptu vpravo nahoře klikni **Deploy → New deployment**.
2. Vlevo u ikony ozubeného kola klikni → **Web app**.
3. Vyplň:
   - **Description:** `v1`
   - **Execute as:** `Me (martin.k.svanda@gmail.com)`
   - **Who has access:** `Anyone`
4. Klikni **Deploy**.
5. Znovu potvrď oprávnění, pokud chce.
6. Zobrazí se **Web app URL** — zkopíruj ji. Vypadá nějak takto:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
7. Ulož si ji — budeš ji potřebovat v dalším kroku.

> **⚠️ DŮLEŽITÉ:** Každá změna v `Code.gs` vyžaduje **nový deployment** (Manage deployments → edit 🖊️ → Version: New version → Deploy). Dříve vydaná URL přestává fungovat až v momentě, kdy ji přepíšeš, ale změny se propíší až s novou verzí.

---

## KROK 6 — Vlož URL do frontendu

Otevři `index.html` v editoru a najdi řádek:

```js
const APPS_SCRIPT_URL = 'REPLACE_WITH_APPS_SCRIPT_WEB_APP_URL';
```

Nahraď placeholder skutečnou Web app URL, kterou jsi získal v kroku 5:

```js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx.../exec';
```

Ulož.

---

## KROK 7 — GitHub Pages

1. Vytvoř nový **public** repo na GitHubu: `hackathon-registration` (nebo jakkoli pojmenuj).
2. Push všech souborů z této složky:
   ```
   index.html
   success.html
   apps-script/Code.gs
   docs/SETUP.md
   docs/TESTING.md
   docs/EMAIL_TEMPLATE.md
   README.md
   ```
3. Na GitHubu jdi do **Settings → Pages**.
4. Source: **Deploy from a branch** → vyber `main` / `/` (root) → **Save**.
5. Po ~1 minutě bude stránka dostupná na:
   ```
   https://USERNAME.github.io/hackathon-registration/
   ```
6. Otevři URL v prohlížeči — mělo by se načíst `index.html`.

---

## KROK 8 — Production test

1. Otevři GitHub Pages URL (`https://USERNAME.github.io/hackathon-registration/`).
2. Vyplň formulář reálnými daty (použij svůj e-mail).
3. Klikni **Odeslat registraci**.
4. Po odeslání by měla proběhnout redirect na `success.html`.
5. Zkontroluj:
   - v Sheetu přibyl řádek s tvými daty
   - přišel potvrzovací e-mail

Pokud ano — **hotovo, deploy je live**.

---

## Co je třeba nastavit ručně — shrnutí

| Co                          | Kde                                                      |
|-----------------------------|----------------------------------------------------------|
| `SHEET_ID` (pokud měníš)    | `apps-script/Code.gs`                                    |
| `APPS_SCRIPT_URL`           | `index.html` — konstanta `APPS_SCRIPT_URL`               |
| GitHub repo + Pages         | GitHub Settings → Pages                                  |
| Oprávnění Apps Scriptu      | Poprvé při `initSheet` a `testSubmit`                    |
| Deploy Web app              | Apps Script → Deploy → New deployment (Execute as Me)    |

---

## Troubleshooting

**Form se odešle, ale v Sheetu nic nepřibude.**
→ Web app URL není nasazená jako nová verze po změně kódu. V Apps Scriptu: **Manage deployments → edit → New version → Deploy**. Zkontroluj i `Who has access: Anyone`.

**E-mail nedorazil.**
→ Zkontroluj [MailApp quota](https://developers.google.com/apps-script/guides/services/quotas) (100/den pro free Gmail účet). Podívej se v Apps Scriptu **Executions** na případné chyby.

**CORS chyba v konzoli.**
→ Fetch je nastavený na `mode: 'no-cors'`. Pokud tam vidíš CORS chybu, asi není `'no-cors'`. Zkontroluj `index.html`.

**Uživatel odešle, ale skript spadne — uvidí success stránku, ale data se nezapíšou.**
→ To je známý trade-off `no-cors` módu: klient nevidí odpověď serveru. Monitoruj Apps Script **Executions** pár dní po spuštění a případně upozorni účastníky, kteří měli chybu.

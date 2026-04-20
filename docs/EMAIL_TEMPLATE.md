# EMAIL_TEMPLATE — potvrzovací e-mail

Šablona HTML e-mailu odesílaného po úspěšné registraci. Kód je v [`apps-script/Code.gs`](../apps-script/Code.gs) ve funkci `sendConfirmationEmail()`.

---

## Předmět

```
Registrace potvrzena — HACK-XXXXX
```

## Odesilatel

- `From:` AI & Programming Hackathon 2026 `<martin.k.svanda@gmail.com>`
- `Reply-To:` `svanda@praut.cz`

## Struktura e-mailu

1. **Gradient nadpis** — „Registrace potvrzena!" v brand gradientu (cyan → blue → purple → magenta)
2. **Osobní oslovení** — jménem registrovaného
3. **Kód registrace** — `HACK-XXXXX` v šedém boxu
4. **Detaily eventu:**
   - Datum: 19.–21. 6. 2026
   - Čas: Pátek 12:00 – Neděle 12:00 (48 hodin)
   - Místo: Integrovaná střední škola Cheb, Obrněné brigády 2258/6
5. **CTA** — gradient box s tlačítkem „Otevřít učebnici" → https://ucebnice.praut.cz/
6. **Kontakt** — reply na svanda@praut.cz

---

## Proč martin.k.svanda@gmail.com a ne svanda@praut.cz?

MailApp v Apps Scriptu odesílá z účtu, pod kterým běží deployment. Skript proto musí být nasazený pod `martin.k.svanda@gmail.com`. Aby odpovědi chodily na firemní e-mail, je nastaveno `replyTo: svanda@praut.cz`.

## Limity Gmailu přes MailApp

- Běžný Gmail účet: **100 e-mailů / den**
- Google Workspace: **1500 / den**

Pokud se počet registrací překročí 100/den, je třeba buď:
- upgradovat účet na Workspace
- nebo migrovat na `GmailApp` s `threadFollowups` (jiný limit)
- nebo napojit externí SMTP (komplikovanější)

Pro hackathon s očekávanými 50–100 účastníky je free Gmail limit dostatečný.

---

## Ukázka HTML

```html
<body style="margin:0; padding:24px; background:#f8fafc; font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:16px; padding:40px; border:1px solid #e2e8f0;">

    <div style="font-size:28px; font-weight:900; line-height:1.1; margin-bottom:16px;">
      <span style="background:linear-gradient(135deg,#22d3ee 0%,#3b82f6 30%,#a855f7 70%,#d946ef 100%);
                   -webkit-background-clip:text; background-clip:text; color:transparent;">
        Registrace potvrzena!
      </span>
    </div>

    <p style="color:#334155; font-size:15px; line-height:1.7;">
      Ahoj <strong>{{firstName}}</strong>,<br><br>
      potvrzujeme tvou registraci na <strong>AI &amp; Programming Hackathon 2026</strong>.
      Těšíme se na tebe!
    </p>

    <div style="background:#f1f5f9; border-radius:12px; padding:20px; margin:24px 0;">
      <div style="color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:0.1em;
                  margin-bottom:8px; font-weight:600;">Tvůj registrační kód</div>
      <div style="font-family:'Courier New',monospace; font-size:22px; font-weight:700;
                  color:#0f172a; letter-spacing:0.04em;">HACK-XXXXX</div>
    </div>

    <!-- Kdy & kde -->
    <!-- CTA Otevřít učebnici (gradient box) -->
    <!-- Kontakt -->

  </div>
</body>
```

> Plný kód → `apps-script/Code.gs:sendConfirmationEmail()`.

---

## Testování e-mailu

V editoru Apps Scriptu spusť funkci `testSubmit` — odešle se fake registrace na `martin.k.svanda@gmail.com`. Zkontroluj vizuální stránku v Gmailu.

E-mailové klienty renderují HTML různě:
- **Gmail web** — nejblíže originálu
- **Apple Mail** — většinou dobré
- **Outlook** — gradient text často nepodporuje, fallback color

Gradient v `color:transparent` + `background-clip:text` někdy nejede — v Outlooku se zobrazí černý text. To je OK, text je čitelný.

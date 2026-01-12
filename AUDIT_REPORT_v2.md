# Tetra HMS - Audit Report v2

**Dato:** 2026-01-12  
**Utført av:** Codex (uavhengig gjennomgang etter Claude-rapport)  
**Prosjekt:** Tetra HMS SaaS  
**Stack:** Next.js 16.1.1, React 19, TypeScript 5, Supabase, Anthropic Claude API  

---

## Sammendrag

Kodebasen er solid og sikkerhetsbevisst med RLS, rollebasert tilgang og stram AI‑prompting. Det viktigste å adressere er: (1) PDF‑parsing‑risiko, (2) lagring av invite‑data i localStorage, (3) filtype‑validering utover MIME, og (4) forbedret rate‑limit‑signalering og observability. Flere av funnene i forrige rapport er nå enten løst eller overdrevet i alvorlighetsgrad.

---

## Kritiske funn (må adresseres)

### K1: PDF‑parsing med `pdf-parse` uten sandbox
**Fil:** `src/app/api/upload/route.ts`  
**Risiko:** PDF‑parsing kan brukes til DoS (høy CPU/minne). `pdf-parse` er gammelt og har historisk svakheter.  
**Anbefaling:**
- Bytt til `pdfjs-dist` eller `pdf-lib` og kjør parsing i isolert worker (evt. edge‑function eller queue).
- Legg inn timeout/size‑guard før parsing (f.eks. max pages eller max extracted length).

### K2: Invite‑data lagres i localStorage
**Fil:** `src/app/invite/[token]/AcceptInvite.tsx`  
**Risiko:** XSS kan lese token/rolle/org/team fra localStorage.  
**Anbefaling:**
- Flytt invite‑data til httpOnly cookie eller server‑session.
- Hvis localStorage må brukes: krypter payload og sett kort TTL.

---

## Medium funn (bør prioriteres)

### M1: Filtype‑validering kun via MIME
**Fil:** `src/app/api/upload/route.ts`  
**Risiko:** MIME er lett å forfalske.  
**Anbefaling:**  
- Valider både filendelse og magic bytes (PDF/PNG/JPEG).  
- Avvis ukjent innhold før opplasting.

### M2: Rate‑limit signalering var uklar i UI
**Status:** **Fikset** – 429 meldes eksplisitt i chat.  
**Fil:** `src/app/employee/hooks/useEmployeeChat.ts`  
**Merknad:** Behold som ferdig.

### M3: Manglende paginering for admin‑lister
**Filer:** `src/app/admin/page.tsx`, admin tabs  
**Risiko:** Ytelsesproblem når data vokser.  
**Anbefaling:** Cursor‑paginering + "Last flere".

### M4: Duplisert Supabase‑klientkode i auth‑callbacks
**Filer:** `src/app/auth/callback/route.ts`, `src/app/invite/[token]/callback/route.ts`  
**Anbefaling:** Felles helper (`createRouteClient(request, response)`).

---

## Lave funn (kvalitet/vedlikehold)

### L1: Store komponentfiler (EmployeeApp)
**Fil:** `src/app/employee/EmployeeApp.tsx`  
**Anbefaling:** Del opp i `HomeContent`, `InstructionsContent`, `ChatContent` (valgfritt).

### L2: Input‑lengdevalidering
**Filer:** Admin hooks (team/mappe/navn).  
**Anbefaling:** Innfør maks‑lengde (f.eks. 100 tegn) med brukerfeil.

### L3: Typing kan strammes inn
**Fil:** `src/lib/types.ts`  
**Anbefaling:** Bruk union types for `role`, `severity`, `status`.

---

## Status siden forrige rapport

- **Upstash rate‑limit** er nå implementert med fallback og bedre defaults.
- **Emoji/glyph‑ikoner** er byttet til `lucide-react`.
- **UI‑feedback** for 429 er forbedret.
- **README** er oppdatert med riktige env‑defaults.

---

## Foreslått handlingsplan (kort)

1) Bytt/isolér PDF‑parsing (K1).  
2) Flytt invite‑data bort fra localStorage (K2).  
3) Innfør magic‑bytes validering for upload (M1).  
4) Paginering i admin‑lister (M3).  
5) Strammere typer og input‑lengde (L2/L3).  

---

**Samlet vurdering:** 7.5/10 – sterk MVP med noen sikkerhetspunkter som bør lukkes før større skalering.

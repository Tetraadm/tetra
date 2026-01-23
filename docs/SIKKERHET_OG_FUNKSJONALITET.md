# Tetrivo HMS - Sikkerhets- og Funksjonalitetsoversikt

**Dato:** 23. Januar 2026
**Dokumentversjon:** 1.0
**Mottaker:** Sikkerhetsansvarlig / Compliance Officer

---

## 1. Executive Summary

Tetrivo er en skybasert (SaaS) HMS-plattform utviklet for norske virksomheter. Plattformen sentraliserer internkontroll, dokumenthåndtering og oppfølging av ansatte. 

Sikkerhet og personvern er fundamentale byggeklosser i arkitekturen ("Security by Design"), ikke etterpåklokskap. Vi opererer med en null-tillits-tilnærming (Zero Trust) til datatilgang.

---

## 2. Compliance og Standarder

Vi forplikter oss til å følge strenge internasjonale standarder for informasjonssikkerhet og personvern.

### 🇪🇺 EU GDPR (Personvernforordningen)
Tetrivo er bygget for full etterlevelse av GDPR:
*   **Datasupverenitet:** Alle data lagres og prosesseres innenfor EØS (primært Sverige/Irland) via Supabase og AWS/fly.io infrastruktur.
*   **Right to be Forgotten:** Dedikerte verktøy for å permanent slette persondata på forespørsel.
*   **Privacy by Default:** Kun nødvendige data samles inn (Dataminimering).
*   **Databehandleravtale (DPA):** Standardisert DPA tilgjengelig for alle kunder.

### 🌐 ISO-Sertifiseringer
Våre prosesser og tekniske kontroller er utformet i tråd med:
*   **ISO 27001 (Informasjonssikkerhet):** Fokus på konfidensialitet, integritet og tilgjengelighet.
*   **ISO 9001 (Kvalitetsstyring):** Konsistens i leveranse og kontinuerlig forbedring.

---

## 3. Funksjonalitetsoversikt

### 📁 Sikker Dokumenthåndtering
*   Sentralisert opplasting og versjonering av HMS-dokumenter (PDF, tekst).
*   Automatisk tekstekstraksjon for søkbarhet.
*   **Sikkerhet:** Dokumenter er strengt avgrenset til organisasjonen som eier dem.

### 🤖 AI-Assistent ("Spør Tetrivo")
En sikker AI-løsning for ansatte:
*   Lar ansatte stille spørsmål om rutiner ("Hva gjør jeg ved brann?").
*   **Ingen Hallusinering:** AI-modellen (Claude/OpenAI hybrid) er begrenset via systeminstrukser til å *kun* svare basert på bedriftens opplastede dokumenter.
*   **Datavern:** Dataene dine brukes *ikke* til å trene offentlige modeller.

### ✅ Lesebekreftelser (Internkontroll)
*   Verifiserbar logg på at ansatte har lest pålagte instrukser.
*   Uforanderlig revisjonsspor (Audit log) for hvem, hva, og når.
*   Gir ledere sanntidsoversikt over compliance-status i teamet.

---

## 4. Teknisk Sikkerhetsarkitektur

### Autentisering og Tilgang
*   **Passordløs Innlogging:** Vi bruker "Magic Links" via e-post. Dette eliminerer risikoen for svake passord eller passordlekkasjer.
*   **Tilgangsstyring (RBAC):**
    *   **Admin:** Full organisasjonskontroll.
    *   **Teamleder:** Begrenset til egne ansatte.
    *   **Ansatt:** Kun lesetilgang til relevante data.

### Database og Isolering (Det viktigste punktet)
Vi bruker **Row Level Security (RLS)** i PostgreSQL-databasen.
*   Dette betyr at sikkerheten håndheves helt nede på databasenivået, ikke bare i applikasjonskoden.
*   Hver spørring sjekker automatisk brukerens ID og organisasjon.
*   Det er teknisk umulig for en kunde å få tilgang til en annen kundes data, selv ved feil i applikasjonslaget.

### Kryptering
*   **Data in Transit:** All trafikk krypteres med TLS 1.3 (HTTPS).
*   **Data at Rest:** Databasen og filagring er kryptert på disk (AES-256).

### Logging og Overvåking
*   **Audit Logs:** Kritiske hendelser (sletting, rettighetsendringer, innlogging) logges i et format som ikke kan endres av brukeren.
*   **Automatisk Opprydding:** Logger slettes automatisk etter definert lagringstid (default 90 dager) for å møte GDPR-krav om lagringsbegrensning.

---

## 5. Drift og Beredskap

*   **Oppetid:** Vi kjører på redundant infrastruktur med automatisk failover.
*   **Backup:** Point-in-time recovery (PITR) muliggjør gjenoppretting ned til sekundet ved uhell.
*   **Sårbarhetsskanning:** Kontinuerlig overvåking av avhengigheter og kode for kjente sårbarheter.

---

*Utarbeidet av Tetrivo Development Team for gjennomgang av sikkerhetsavdeling.*

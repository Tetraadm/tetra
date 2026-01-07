# SSO Setup Guide for Tetra

For å aktivere Microsoft innlogging må du konfigurere Azure AD OAuth provider i Supabase.

## 🟦 Microsoft/Azure AD OAuth Setup

### 1. Opprett Azure AD App
1. Gå til [Azure Portal](https://portal.azure.com/)
2. Gå til **Azure Active Directory** → **App registrations**
3. Klikk **New registration**
4. Gi appen et navn (f.eks. "Tetra SSO")
5. Velg **Accounts in any organizational directory**
6. Legg til **Redirect URI**:
   ```
   https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/auth/v1/callback
   ```
7. Klikk **Register**

### 2. Opprett Client Secret
1. Gå til **Certificates & secrets**
2. Klikk **New client secret**
3. Gi en beskrivelse og velg utløpsdato
4. Kopier **Secret Value** (vises kun én gang!)

### 3. Hent Application ID
1. Gå til **Overview**
2. Kopier **Application (client) ID**

### 4. Konfigurer API Permissions
1. Gå til **API permissions**
2. Klikk **Add a permission**
3. Velg **Microsoft Graph**
4. Velg **Delegated permissions**
5. Legg til: `email`, `openid`, `profile`
6. Klikk **Grant admin consent**

### 5. Konfigurer i Supabase
1. Gå til [Supabase Dashboard](https://supabase.com/dashboard)
2. Velg ditt prosjekt
3. Gå til **Authentication** → **Providers**
4. Aktiver **Azure**
5. Lim inn **Azure Client ID** og **Azure Secret**
6. Klikk **Save**

---

## ✅ Testing

1. Gå til login-siden: `https://tetra.onl`
2. Klikk på **Fortsett med Microsoft**
3. Godkjenn tilgangene
4. Du blir redirectet tilbake og logget inn automatisk

## 🔒 Sikkerhet

- OAuth secrets skal **aldri** lagres i kode eller git
- Bruk alltid HTTPS redirect URIs
- Begrens redirect URIs til kun tetra.onl og supabase domenet
- Roter secrets regelmessig (anbefalt hvert 6. måned)

## 📝 Notater

- Microsoft/Azure AD er ideelt for bedriftsbrukere med M365 kontoer
- Magic link (e-post) er fortsatt tilgjengelig som backup
- SSO fungerer både for ny registrering og påfølgende innlogginger

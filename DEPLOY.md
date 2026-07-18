# Guida al Deployment — LokiSpesi

Questa guida ti accompagna passo dopo passo per portare l'app online.

---

## Prerequisiti

Prima di iniziare, assicurati di avere:

- Un account **GitHub** (gratuito)
- Un account **Supabase** (gratuito, tier free) — [supabase.com](https://supabase.com)
- Un account **Vercel** (gratuito) — [vercel.com](https://vercel.com)
- Un account **GoCardless** (gratuito, sandbox) — [gocardless.com](https://gocardless.com)
- **Node.js** installato (ce l'hai già, v22.17.0)

---

## 1. Creare il progetto Supabase e caricare le migrations

### 1.1 Crea il progetto

1. Vai su [supabase.com/dashboard](https://supabase.com/dashboard) e fai login con GitHub
2. Clicca **"New project"**
3. Compila:
   - **Name**: `lokispesi`
   - **Database Password**: genera una password sicura (salvala nel password manager, serve dopo)
   - **Region**: `West Europe (Frankfurt)` — il più vicino all'Italia
   - **Pricing Plan**: Free
4. Clicca **"Create project"** — ci vogliono ~2 minuti

### 1.2 Ottieni le credenziali

1. Nel dashboard del progetto, vai su **Settings > API** nel menu laterale
2. Copia questi due valori (ti serviranno tra poco):
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **anon public key**: stringa lunga che inizia con `eyJ...`

### 1.3 Carica lo schema del database

Apri PowerShell nella cartella del progetto e incolla:

```powershell
cd "C:\Users\elect\Documents\Progetti\LokiSpesi (tracker spese)\lokispesi"

# Imposta le variabili d'ambiente con i valori copiati dal dashboard
$env:SUPABASE_URL = "https://xxxxxxxxxxxx.supabase.co"
$env:SUPABASE_KEY = "la-tua-anon-key"

# Installa la CLI di Supabase come dipendenza del progetto
npm install -D supabase --legacy-peer-deps

# Inizializza Supabase localmente (collegandolo al progetto remoto)
npx supabase init

# Collega il progetto locale a quello remoto
npx supabase link --project-ref "xxxxxxxxxxxx"

# Carica la migration
npx supabase db push
```

> **Nota:** Sostituisci `xxxxxxxxxxxx` con l'ID del tuo progetto (lo trovi nell'URL del dashboard o nel Project URL prima di `.supabase.co`).

### 1.4 Verifica

1. Nel dashboard Supabase, vai su **Table Editor** nel menu laterale
2. Dovresti vedere tutte le 13 tabelle create:
   `profiles`, `categories`, `transactions`, `bank_accounts`, `bank_connections`, `bank_transactions`, `manual_wallets`, `wallet_snapshots`, `scheduled_transactions`, `family_groups`, `family_members`, `sync_queue`, `sync_log`

### 1.5 Configura le variabili d'ambiente locali

Crea il file `.env.local` (non committare su git):

```powershell
@"
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=la-tua-anon-key
VITE_SUPABASE_FUNCTIONS_URL=https://xxxxxxxxxxxx.supabase.co/functions/v1
"@ | Out-File -FilePath .env.local -Encoding utf8
```

---

## 2. Registrarsi su GoCardless per le API key

### 2.1 Crea l'account

1. Vai su [gocardless.com/bank-account-data](https://gocardless.com/bank-account-data/)
2. Clicca **"Get started"** o **"Sign up"**
3. Registrati con la tua email
4. Scegli il piano **"Sandbox"** (gratuito, per sviluppo/test)

### 2.2 Ottieni le credenziali

1. Nel dashboard GoCardless, vai su **Settings > API Keys**
2. Clicca **"Create new secret"**
3. Copia:
   - **Secret ID**: stringa tipo `abc123...`
   - **Secret Key**: stringa tipo `def456...`

### 2.3 Imposta le variabili nelle Edge Functions

Nel dashboard Supabase, vai su **Settings > Edge Functions** e aggiungi queste variabili d'ambiente:

```
GOCARDLESS_SECRET_ID=il-tuo-secret-id
GOCARDLESS_SECRET_KEY=la-tua-secret-key
APP_URL=https://lokispesi.vercel.app
```

---

## 3. Deployare il frontend su Vercel

### 3.1 Prepara il repository GitHub

```powershell
cd "C:\Users\elect\Documents\Progetti\LokiSpesi (tracker spese)\lokispesi"

# Inizializza git (se non già fatto)
git init
git add .
git commit -m "Initial commit: LokiSpesi v1.0"

# Crea un repository su GitHub (fallo manualmente su github.com/new)
# Poi collega e pusha:
git remote add origin https://github.com/IL-TUO-USERNAME/lokispesi.git
git branch -M main
git push -u origin main
```

### 3.2 Deploya su Vercel

1. Vai su [vercel.com](https://vercel.com) e fai login con GitHub
2. Clicca **"Add New..." > "Project"**
3. Seleziona il repository `lokispesi`
4. In **Framework Preset**, seleziona **Vite**
5. In **Root Directory**, lascia `./` (o imposta `lokispesi`)
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`
8. Espandi **Environment Variables** e aggiungi:
   ```
   VITE_SUPABASE_URL = https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = la-tua-anon-key
   ```
9. Clicca **"Deploy"**

Dopo ~2 minuti l'app sarà online su `https://lokispesi.vercel.app`.

### 3.3 Testa la PWA

1. Apri l'URL su iPhone (Safari)
2. Tocca l'icona **Condividi** (il quadrato con la freccia)
3. Scorri e seleziona **"Aggiungi a Home"**
4. L'app si installerà come un'app nativa, con icona e splash screen

---

## 4. Deployare le Edge Functions su Supabase

### 4.1 Prepara le funzioni

Le Edge Functions sono già pronte in `supabase/edge-functions/`. Per deployarle:

```powershell
cd "C:\Users\elect\Documents\Progetti\LokiSpesi (tracker spese)\lokispesi"

# Deploya ogni Edge Function individualmente:

npx supabase functions deploy gocardless-connect --project-ref "xxxxxxxxxxxx"
npx supabase functions deploy gocardless-sync --project-ref "xxxxxxxxxxxx"
npx supabase functions deploy gocardless-callback --project-ref "xxxxxxxxxxxx"
npx supabase functions deploy process-scheduled --project-ref "xxxxxxxxxxxx"
npx supabase functions deploy reconcile-transactions --project-ref "xxxxxxxxxxxx"
npx supabase functions deploy wallet-snapshot --project-ref "xxxxxxxxxxxx"
```

### 4.2 Verifica

Ogni funzione deployata mostrerà un URL tipo:
```
https://xxxxxxxxxxxx.supabase.co/functions/v1/gocardless-connect
```

Testa almeno la funzione `gocardless-connect` con una chiamata curl:

```powershell
curl -X POST "https://xxxxxxxxxxxx.supabase.co/functions/v1/gocardless-connect" `
  -H "Authorization: Bearer LA-TUA-ANON-KEY" `
  -H "Content-Type: application/json" `
  -d '{"institution_id":"BANCA_SELLA_SELBIT2B"}'
```

Dovresti ricevere un errore di autenticazione (normale — non sei loggato) ma non un 404.

---

## 5. Configurare le variabili d'ambiente complete

### 5.1 Riepilogo variabili

Ecco dove vanno impostate tutte le variabili:

#### Su Vercel (frontend) — Settings > Environment Variables

| Nome | Valore | Dove trovarlo |
|------|--------|---------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase > Settings > API |

#### Su Supabase (Edge Functions) — Settings > Edge Functions > Secrets

| Nome | Valore | Dove trovarlo |
|------|--------|---------------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service_role) | Supabase > Settings > API |
| `GOCARDLESS_SECRET_ID` | `abc...` | GoCardless > API Keys |
| `GOCARDLESS_SECRET_KEY` | `def...` | GoCardless > API Keys |
| `APP_URL` | `https://lokispesi.vercel.app` | URL Vercel dopo il deploy |

### 5.2 Configura pg_cron per le transazioni ricorrenti

Nel **SQL Editor** di Supabase, esegui questa query per schedulare le Edge Function:

```sql
-- Esegui process-scheduled ogni giorno alle 06:00 UTC
SELECT cron.schedule(
  'process-scheduled',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://xxxxxxxxxxxx.supabase.co/functions/v1/process-scheduled',
    headers:='{"Authorization": "Bearer LA-TUA-SERVICE-ROLE-KEY"}'::jsonb
  )
  $$
);

-- Esegui wallet-snapshot ogni giorno alle 23:55 UTC
SELECT cron.schedule(
  'wallet-snapshot',
  '55 23 * * *',
  $$
  SELECT net.http_post(
    url:='https://xxxxxxxxxxxx.supabase.co/functions/v1/wallet-snapshot',
    headers:='{"Authorization": "Bearer LA-TUA-SERVICE-ROLE-KEY"}'::jsonb
  )
  $$
);
```

---

## Verifica finale

Dopo aver completato tutti i passaggi, verifica che tutto funzioni:

1. **Apri il sito su Vercel** — dovresti vedere la schermata Diario
2. **Registrati** con email/password — dovrebbe creare il profilo e le categorie default
3. **Aggiungi una spesa** — clicca il pulsante +
4. **Cambia tab** — Portafoglio, Conti, Panoramica, Impostazioni
5. **Testa offline** — in Safari, vai in modalità aereo, l'app deve funzionare lo stesso
6. **Installa PWA** — Aggiungi a Home, apri l'icona, deve aprirsi a schermo intero
7. **Collega banca** — vai su Conti > Collega banca (sandbox GoCardless)

---

## Troubleshooting comune

| Problema | Soluzione |
|----------|-----------|
| **"Supabase URL not configured"** | Controlla le variabili d'ambiente su Vercel (`VITE_SUPABASE_URL`) |
| **CORS error sulle Edge Functions** | Verifica che `APP_URL` su Supabase punti all'URL corretto di Vercel |
| **Migration non caricata** | Nel SQL Editor di Supabase, incolla manualmente il contenuto di `supabase/migrations/00001_initial_schema.sql` |
| **PWA non si installa** | Verifica che il sito sia servito su HTTPS (Vercel lo fa automaticamente) |
| **GoCardless sandbox non funziona** | Le credenziali sandbox sono limitate. Per test reale, richiedi l'accesso production a GoCardless |

## Risorse utili

- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI Docs](https://supabase.com/docs/reference/cli)
- [GoCardless Bank Account Data Docs](https://developer.gocardless.com/bank-account-data/overview)
- [Vercel Docs](https://vercel.com/docs)
- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app)

# Resita Pulse

Aplicatie web Next.js pentru feed local, evenimente, business-uri, harta si conturi.

## Local

```bash
npm install
npm run dev
```

Aplicatia porneste de obicei pe `http://localhost:3000`.

## Variabile de mediu

Copiaza `.env.example` in `.env.local` si completeaza valorile din Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SHOW_DEMO_CONTENT=false
NEXT_PUBLIC_CONTACT_EMAIL=contact@example.com
NEXT_PUBLIC_OPERATOR_NAME=Operatorul Resita Pulse
```

Pe Vercel, aceleasi variabile trebuie adaugate in:
`Project Settings -> Environment Variables`.

## Supabase

Ruleaza schema din `supabase-mvp-schema.sql` in Supabase Dashboard:
`SQL Editor -> New query -> Run`.

Schema include:
- `profiles`
- `businesses`
- `posts`
- `events`
- `event_participants`
- `notifications`
- storage pentru avatar, media business si poze de postari

Pentru curatenie inainte de lansare, foloseste `supabase-launch-cleanup.sql`.
Ruleaza-l doar dupa ce verifici ca vrei sa stergi postarile, evenimentele si
notificarile de test.

## Deploy pe Vercel

1. Urca proiectul pe GitHub.
2. In Vercel, alege `Add New Project`.
3. Selecteaza repository-ul.
4. Daca proiectul este in subfolder, seteaza Root Directory la `city-pulse`.
5. Adauga variabilele:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SHOW_DEMO_CONTENT=false`
   - `NEXT_PUBLIC_CONTACT_EMAIL`
   - `NEXT_PUBLIC_OPERATOR_NAME`
6. Deploy.

Build command:

```bash
npm run build
```

Output-ul este gestionat automat de Vercel pentru Next.js.

## PWA

Aplicatia are manifest, service worker si icon-uri pentru instalare pe telefon:
- Android: prompt nativ de instalare cand browserul permite.
- iOS: card cu instructiuni pentru `Share -> Add to Home Screen`.

PWA functioneaza corect doar pe HTTPS, deci pe linkul Vercel.

## Verificare inainte de deploy

```bash
npm run lint
npm run build
```

Inainte de lansare publica:
- seteaza `NEXT_PUBLIC_CONTACT_EMAIL` si `NEXT_PUBLIC_OPERATOR_NAME`
- verifica variabilele Supabase pe Vercel
- ruleaza optional `supabase-launch-cleanup.sql` pentru continutul de test
- testeaza creare cont normal si cont business
- testeaza instalarea PWA pe Android/iOS

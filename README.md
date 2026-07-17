# VPS Client Dashboard

Moderní klientský dashboard pro správu VPS přes Proxmox API. Frontend je postavený v Next.js + TypeScript, Tailwind CSS a Recharts. Backend proxuje požadavky na Proxmox API a udržuje API token bezpečně mimo frontend.

- Vylepšený moderní tmavý dashboard s přehledovými kartami, živými statistikami a akcemi pro VPS.

## Funkce

- Přihlášení uživatelů pomocí JWT
- Seznam přiřazených VM pro každého klienta
- Ovládání napájení: Start, Stop, Shutdown, Reset
- Detail VM s grafy CPU/RAM a síťovým provozem
- VNC ticket endpoint pro noVNC integraci
- Admin rozhraní pro správu uživatelů a přiřazených VM
- Kompletně oddělený frontend od Proxmox API tokenu

## Struktura projektu

- `app/` — Next.js App Router
- `app/api/` — serverové API routes
- `components/` — klientské komponenty
- `lib/` — helpery, typy, auth a Proxmox proxy
- `tailwind.config.ts` — Tailwind konfigurace
- `tsconfig.json` — TypeScript konfigurace

## Instalace na Linuxu

1. Stáhni závislosti:

```bash
cd "/cesta/k/Zesium - VPS PANEL"
npm install
```

2. Nastav environment proměnné:

```bash
export JWT_SECRET="suprovytajnyklic"
export PROXMOX_API_URL="https://tvoje-proxmox.example.com:8006"
export PROXMOX_API_TOKEN="uzivatel@pve!token_id=xxxxxxxxxx"
```

3. Spusť vývojový server:

```bash
npm run dev
```

4. Otevři v prohlížeči:

```text
http://localhost:3000
```

## Demo uživatelé

- `alice` / `password123`
- `bob` / `securepass`
- `admin` / `adminpass`

## Environment proměnné

- `JWT_SECRET` — tajný klíč pro JWT
- `PROXMOX_API_URL` — URL Proxmox API
- `PROXMOX_API_TOKEN` — Proxmox API token ve formátu `user@pve!token_id=...`

## Důležitá bezpečnostní pravidla

- Frontend nikdy nesmí znát `PROXMOX_API_TOKEN`
- Backend vždy kontroluje, že uživatel vlastní požadovaný `vmid`
- Pro produkci použij HTTPS a secure cookies
- V produkci použij reálnou databázi místo `mock-db.ts`

## Jak to rozšířit

- Přidat reálné přihlášení přes databázi a hashované heslo
- Napojit skutečnou databázi (Postgres, MariaDB, SQLite)
- Přidat noVNC frontend pro přímé připojení do konzole
- Nasadit na Linux server s Nginx reverzní proxy

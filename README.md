# Next.js Framework Starter

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/next-starter-template)

<!-- dash-content-start -->

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). It's deployed on Cloudflare Workers as a [static website](https://developers.cloudflare.com/workers/static-assets/).

This template uses [OpenNext](https://opennext.js.org/) via the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare), which works by taking the Next.js build output and transforming it, so that it can run in Cloudflare Workers.

<!-- dash-content-end -->

Outside of this repo, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/) (the `create-cloudflare` CLI):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/next-starter-template
```

A live public deployment of this template is available at [https://next-starter-template.templates.workers.dev](https://next-starter-template.templates.workers.dev)

## Getting Started

First, run:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Then run the development server (using the package manager of your choice):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## SaaS + Custom Domain Demo

This template is now wired for a multi-tenant SaaS experience that assumes your platform apex is `singoo.ai`:

- `src/lib/tenants.ts` contains mocked customer records (marketing site, paid tenants, and a pending onboarding flow).  
- The home page (`src/app/page.tsx`) inspects the incoming `Host` header inside the Cloudflare Worker / Next.js server component and renders the matching tenant with a unique brand theme, copy, and CTA.  
- Domain lists are split between default Workers.dev/localhost hostnames and customer-provided hostnames so you can verify routing at a glance.

### Using Cloudflare KV for tenant lookup

Tenants resolve from Cloudflare KV whenever the binding `TENANTS` is available. The worker falls back to static seed data if the namespace is empty or missing.

1. Create a namespace and wire it to Wrangler:

   ```bash
   wrangler kv namespace create TENANTS
   wrangler kv namespace create TENANTS --preview
   # Copy the IDs into wrangler.jsonc (look for REPLACE_WITH_* placeholders)
   ```

2. Seed the namespace with the sample tenants (see `config/tenants/`):

   ```bash
   wrangler kv:key put --binding=TENANTS tenant:studio --path=config/tenants/studio.json
   wrangler kv:key put --binding=TENANTS tenant:test2025 --path=config/tenants/test2025.json
   wrangler kv:key put --binding=TENANTS tenant:globex --path=config/tenants/globex.json
   ```

3. Map hostnames to tenant slugs so lookups resolve instantly (adapt to your own customers and subdomains):

   ```bash
   wrangler kv:key put --binding=TENANTS host:singoo.ai studio
   wrangler kv:key put --binding=TENANTS host:www.singoo.ai studio
   wrangler kv:key put --binding=TENANTS host:saas.singoo.ai studio
   wrangler kv:key put --binding=TENANTS host:test2025.singoo.ai test2025
   wrangler kv:key put --binding=TENANTS host:test2025.singoo.vip test2025
   wrangler kv:key put --binding=TENANTS host:globex.singoo.ai globex
   wrangler kv:key put --binding=TENANTS host:globex.localhost:3000 globex
   ```

   The prefixes (`tenant:` and `host:`) can be reused for automation. See the exported `KV_TENANT_KEY_PREFIX` and `KV_HOST_KEY_PREFIX` constants in `src/lib/tenants.ts`.

### Testing Different Tenants Locally

1. Run the dev server so it accepts arbitrary host headers:

   ```bash
   npm run dev -- --hostname 0.0.0.0 --port 3000
   ```

2. Hit the server with a custom host header (or add an entry to your `hosts` file):

   ```bash
   curl -H "Host: acme.localhost:3000" http://127.0.0.1:3000
   curl -H "Host: globex.localhost:3000" http://127.0.0.1:3000
   ```

3. Tailwind-driven styles and copy will change instantly, proving that tenant resolution happens before rendering.

Add or edit tenants by updating the array in `src/lib/tenants.ts`. Each tenant can list as many `domains` (platform-controlled) and `customDomains` (customer-controlled) as needed.

### Wiring Customer Domains on Cloudflare

1. Deploy the Worker (`npm run build && npm run deploy`).
2. For every tenant-owned hostname, create a [Custom Hostname](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas) that points to the Worker, or add a Worker Route if the DNS zone already lives in your account.
3. Cloudflare forwards the original `Host` header to the Worker. No extra code is needed—just append each hostname to the right tenant in `src/lib/tenants.ts`.
4. Optional: store tenants in KV/D1/R2 and swap out the static config once you move past prototyping.

## Deploying To Production

| Command                           | Action                                       |
| :-------------------------------- | :------------------------------------------- |
| `npm run build`                   | Build your production site                   |
| `npm run preview`                 | Preview your build locally, before deploying |
| `npm run build && npm run deploy` | Deploy your production site to Cloudflare    |
| `npm wrangler tail`               | View real-time logs for all Workers          |

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

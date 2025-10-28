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

- `src/lib/tenants.ts` exposes a helper that resolves the tenant slug (via KV) and随后调用租户内容 API。接口可由环境变量 `TENANT_API_BASE` 配置（默认指向一个占位地址），返回值中 `meta` 字段应包含页面所需的名称、主题色、功能标签等。  
- The home page (`src/app/page.tsx`) inspects the incoming `Host` header inside the Cloudflare Worker / Next.js server component and renders the matching tenant with API 数据。若接口不可用则回退到内置示例。  
- Domain lists are split between default Workers.dev/localhost hostnames and customer-provided hostnames so you can verify routing at a glance.

### Using Cloudflare KV for tenant lookup

Tenants resolve from Cloudflare KV whenever the binding `TENANTS` is available. The worker falls back to static seed data if the namespace is empty or missing.

1. Create a namespace and wire it to Wrangler:

   ```bash
   wrangler kv namespace create TENANTS
   wrangler kv namespace create TENANTS --preview
   # Copy the IDs into wrangler.jsonc (look for REPLACE_WITH_* placeholders)
   ```

2. Map hostnames to tenant slugs so lookups resolve instantly (adapt to你的域名布局):

   ```bash
   wrangler kv:key put --binding=TENANTS host:singoo.ai studio
   wrangler kv:key put --binding=TENANTS host:www.singoo.ai studio
   wrangler kv:key put --binding=TENANTS host:saas.singoo.ai studio
   wrangler kv:key put --binding=TENANTS host:test2025.singoo.ai test2025
   wrangler kv:key put --binding=TENANTS host:test2025.singoo.vip test2025
   wrangler kv:key put --binding=TENANTS host:globex.singoo.ai globex
   wrangler kv:key put --binding=TENANTS host:globex.localhost:3000 globex
   ```

   只需保存 `host:<域名>` → `<租户 slug>` 的映射即可。租户的详细配置集中保留在代码仓库中，方便版本管理。
3. 配置租户内容 API（可选但推荐）：

   ```bash
   # .dev.vars / .env.local 示例
   TENANT_API_BASE=https://api.your-domain.com
   ```

   你的接口需要在 `GET /tenants/<slug>` 时返回如下结构（示例）：

   ```json
   {
     "slug": "a",
     "meta": {
       "name": "A 零售",
       "tagline": "面向 a.singoo.vip 将线下客流转化为会员价值。",
       "description": "...",
       "accent": "#14b8a6",
       "secondary": "#042f2e",
       "features": ["会员积分钱包", "..."],
       "verified": true
     }
   }
   ```

   当 `verified` 为 `false` 时，页面会直接返回 403 Forbidden，提示域名尚未通过验证。

### Testing Different Tenants Locally

1. Run the dev server so it accepts arbitrary host headers:

   ```bash
   npm run dev -- --hostname 0.0.0.0 --port 3000
   ```

2. Hit the server with a custom host header (or add an entry to your `hosts` file):

   ```bash
   curl -H "Host: singoo.ai" http://127.0.0.1:3000
   curl -H "Host: test2025.singoo.vip" http://127.0.0.1:3000
   ```

3. Tailwind-driven styles and copy will change instantly, proving that tenant resolution happens before rendering.
Add or edit tenants by更新 `src/lib/tenants.ts` 中的静态配置（或对应的 JSON 模板），再为域名写入新的 KV 映射即可。

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

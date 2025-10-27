import Link from "next/link";
import { headers } from "next/headers";
import { getAllTenants, getTenantFromHost } from "@/lib/tenants";

export default function Home() {
	const host = headers().get("host");
	const tenant = getTenantFromHost(host);
	const otherTenants = getAllTenants().filter(
		(otherTenant) => otherTenant.slug !== tenant.slug
	);

	const gradient = `linear-gradient(135deg, ${tenant.accent}, ${tenant.secondary})`;

	return (
		<div className="min-h-screen bg-slate-950 text-white font-[family-name:var(--font-geist-sans)]">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 sm:px-8">
				<section
					className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl sm:p-12"
					style={{ backgroundImage: gradient }}
				>
					<div className="absolute inset-0 bg-black/30" aria-hidden />
					<div className="relative flex flex-col gap-6">
						<span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/50 px-4 py-1 text-sm font-medium uppercase tracking-[0.18em] text-white/80">
							Active tenant
							<span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
						</span>
						<div className="space-y-1">
							<h1 className="text-4xl font-semibold sm:text-5xl">
								{tenant.name}
							</h1>
							<p className="text-lg text-white/80">{tenant.tagline}</p>
						</div>
						<p className="max-w-2xl text-base text-white/80">
							{tenant.description}
						</p>
						<div className="flex flex-wrap gap-4 text-sm text-white/90">
							<div className="rounded-2xl border border-white/30 bg-black/30 px-4 py-3">
								<p className="text-white/60">Host header</p>
								<p className="font-semibold">{host ?? "unknown"}</p>
							</div>
							<div className="rounded-2xl border border-white/30 bg-black/30 px-4 py-3">
								<p className="text-white/60">Status</p>
								<p className="font-semibold uppercase">
									{tenant.status ?? "live"}
								</p>
							</div>
							<div className="rounded-2xl border border-white/30 bg-black/30 px-4 py-3">
								<p className="text-white/60">Custom domains</p>
								<p className="font-semibold">{tenant.customDomains.length}</p>
							</div>
						</div>
						<div className="flex flex-wrap gap-3 text-sm">
							{tenant.features.map((feature) => (
								<span
									key={feature}
									className="rounded-full border border-white/40 bg-black/30 px-4 py-1.5 text-white/80"
								>
									{feature}
								</span>
							))}
						</div>
						<div className="pt-2">
							<Link
								className="inline-flex items-center rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-white/80"
								href={tenant.cta.href}
								target="_blank"
								rel="noreferrer"
							>
								{tenant.cta.label}
							</Link>
						</div>
					</div>
				</section>

				<section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8">
					<div className="flex flex-col gap-2">
						<h2 className="text-2xl font-semibold">Domain routing</h2>
						<p className="text-base text-slate-200/70">
							Add every hostname that should resolve to this tenant. Cloudflare
							Workers forwards the original <code>Host</code> header, so Next.js
							can look up the tenant before rendering.
						</p>
					</div>
					<div className="mt-6 grid gap-6 md:grid-cols-2">
						<div>
							<h3 className="text-sm uppercase tracking-widest text-slate-400">
								Routed via Workers.dev / localhost
							</h3>
							<ul className="mt-3 space-y-2 text-base text-slate-50">
								{tenant.domains.map((domain) => (
									<li
										key={domain}
										className="rounded-2xl border border-white/5 bg-slate-800/80 px-4 py-3"
									>
										{domain}
									</li>
								))}
							</ul>
						</div>
						<div>
							<h3 className="text-sm uppercase tracking-widest text-slate-400">
								Customer-owned domains
							</h3>
							<ul className="mt-3 space-y-2 text-base text-slate-50">
								{tenant.customDomains.length ? (
									tenant.customDomains.map((domain) => (
										<li
											key={domain}
											className="rounded-2xl border border-emerald-500/20 bg-emerald-400/10 px-4 py-3"
										>
											{domain}
										</li>
									))
								) : (
									<li className="rounded-2xl border border-white/5 bg-slate-800/80 px-4 py-3 text-slate-300">
										No custom domains connected yet.
									</li>
								)}
							</ul>
						</div>
					</div>
				</section>

				<section className="rounded-3xl border border-white/5 bg-slate-900/50 p-6 sm:p-8">
					<div className="flex flex-col gap-2">
						<h2 className="text-2xl font-semibold">Other tenants</h2>
						<p className="text-base text-slate-200/70">
							The component below helps you demo tenant switching without
							redeploying. Update <code>src/lib/tenants.ts</code> to add your own
							records.
						</p>
					</div>
					<div className="mt-6 grid gap-4 sm:grid-cols-2">
						{otherTenants.map((other) => (
							<div
								key={other.slug}
								className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
							>
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-semibold">{other.name}</h3>
									<span
										className={`text-xs font-semibold uppercase ${
											other.status === "pending"
												? "text-amber-300"
												: "text-emerald-300"
										}`}
									>
										{other.status ?? "live"}
									</span>
								</div>
								<p className="mt-1 text-sm text-slate-300">{other.tagline}</p>
								<ul className="mt-4 space-y-1 text-sm text-slate-400">
									{other.customDomains.map((domain) => (
										<li key={domain}>
											<span className="text-slate-500">Custom:</span> {domain}
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}

import { headers } from "next/headers";
import { resolveTenantForHost } from "@/lib/tenants.js";

export default async function Home() {
	const headerList = await headers();
	const host = headerList.get("host");
	const { meta, matchedByKv, source, cacheStatus } =
		await resolveTenantForHost(host);

	if (!matchedByKv) {
		return (
			<div className="min-h-screen bg-[#0b042d] text-white font-[family-name:var(--font-geist-sans)]">
				<div className="mx-auto w-full max-w-4xl px-6 py-24 sm:px-12">
					<section className="relative overflow-hidden rounded-3xl border border-[#7c3aed]/50 bg-gradient-to-br from-[#c026d3] via-[#7c3aed] to-[#2563eb] p-12 text-center shadow-[0_35px_120px_-25px_rgba(124,58,237,0.55)]">
						<div className="pointer-events-none absolute -top-40 -left-32 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
						<div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />
						<p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/80">
							403 Forbidden
						</p>
						<h1 className="mt-6 text-4xl font-semibold sm:text-5xl text-white">
							域名尚未授权访问
						</h1>
						<p className="mt-4 text-base text-white/85">
							我们检测到域名{" "}
							<span className="font-mono text-white">
								{host ?? "unknown-host"}
							</span>{" "}
							尚未在平台中完成授权。请完成 DNS 校验或联系站点管理员以继续访问{" "}
							{meta.name}。
						</p>
						<p className="mt-6 text-sm text-white/70">
							配置成功后刷新页面即可恢复访问。
						</p>
					</section>
				</div>
			</div>
		);
	}

	const gradient = `linear-gradient(135deg, ${meta.accent}, ${meta.secondary})`;

	return (
		<div className="min-h-screen bg-slate-950 text-white font-[family-name:var(--font-geist-sans)]">
			<div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-8">
				<section
					className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-10 shadow-2xl sm:p-16"
					style={{ backgroundImage: gradient }}
				>
					<div className="absolute inset-0 bg-black/35" aria-hidden />
					<div className="relative flex flex-col gap-6">
						<span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/40 px-4 py-1 text-sm font-medium uppercase tracking-[0.18em] text-white/80">
							租户预览
							<span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
						</span>
						<div className="space-y-3">
							<h1 className="text-4xl font-semibold sm:text-5xl">
								{meta.name}
							</h1>
							<p className="text-lg text-white/80">{meta.tagline}</p>
						</div>
						<p className="max-w-2xl text-base text-white/75 leading-relaxed">
							{meta.description}
						</p>
						<div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-white/70">
							<span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
								Host / {host ?? "unknown"}
							</span>
							<span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
								Slug / {meta.slug}
							</span>
							{source !== "fallback" ? (
								<span className="rounded-full border border-emerald-300/80 bg-emerald-400/10 px-4 py-2 text-emerald-200">
									{source === "edge-cache"
										? `数据来源：边缘缓存 (${cacheStatus ?? "HIT"})`
										: "数据来源：API（源站）"}
								</span>
							) : (
								<span className="rounded-full border border-amber-300/80 bg-amber-400/10 px-4 py-2 text-amber-100">
									数据来源：Fallback
								</span>
							)}
						</div>
						<div className="mt-4 inline-flex flex-wrap gap-3 text-sm text-white/85">
							{meta.features.map((feature) => (
								<span
									key={feature}
									className="rounded-full border border-white/40 bg-black/30 px-4 py-1.5"
								>
									{feature}
								</span>
							))}
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

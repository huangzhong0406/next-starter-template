type CTA = {
	label: string;
	href: string;
};

export type TenantConfig = {
	slug: string;
	name: string;
	tagline: string;
	description: string;
	accent: string;
	secondary: string;
	domains: string[];
	customDomains: string[];
	features: string[];
	cta: CTA;
	status?: "live" | "pending";
};

export type TenantResolution = {
	tenant: TenantConfig;
	tenants: TenantConfig[];
	source: "kv" | "fallback";
};

export const KV_TENANT_KEY_PREFIX = "tenant:";
export const KV_HOST_KEY_PREFIX = "host:";

const CF_CONTEXT_SYMBOL = Symbol.for("__cloudflare-context__");

const sanitizeHost = (host?: string | null): string | undefined => {
	if (!host) {
		return undefined;
	}
	const trimmed = host.split(",")[0]?.trim();
	return trimmed?.replace(/\/.*$/, "").toLowerCase();
};

const staticTenants: TenantConfig[] = [
	{
		slug: "studio",
		name: "Singoo Control Center",
		tagline: "Launch and operate every customer workspace under singoo.ai.",
		description:
			"Use this tenant as your control plane and marketing surface. It responds to localhost, your primary apex, and saas.singoo.ai so prospects can onboard before receiving a dedicated hostname.",
		accent: "#2563eb",
		secondary: "#0f172a",
		domains: [
			"localhost",
			"localhost:3000",
			"127.0.0.1:3000",
			"singoo.ai",
			"www.singoo.ai",
			"saas.singoo.ai"
		],
		customDomains: ["app.singoo.ai"],
		features: [
			"Instant workspace provisioning",
			"Primary domain landing page",
			"Custom domain enrollment",
			"Billing + usage insights"
		],
		cta: {
			label: "Create a workspace",
			href: "https://dash.cloudflare.com/?to=/:account/workers"
		},
		status: "live"
	},
	{
		slug: "test2025",
		name: "Test2025 Workspace",
		tagline: "Branded portal dedicated to test2025.singoo.vip.",
		description:
			"A production customer CNAMEs their domain to saas.singoo.ai. Store the custom hostname in KV so the very first request renders the branded experience.",
		accent: "#f97316",
		secondary: "#431407",
		domains: ["test2025.singoo.ai"],
		customDomains: ["test2025.singoo.vip"],
		features: [
			"Chargeback guardrails",
			"Same-day payouts",
			"Multi-ledger exports",
			"SOC 2 controls"
		],
		cta: {
			label: "Talk to our team",
			href: "mailto:team@test2025.singoo.vip"
		},
		status: "live"
	},
	{
		slug: "globex",
		name: "Globex Retail",
		tagline: "Turn retail traffic into memberships.",
		description:
			"Demonstrates a tenant still pending DNS validation. KV keeps the record so you can preview the experience with a temporary subdomain while the customer's apex is onboarding.",
		accent: "#14b8a6",
		secondary: "#042f2e",
		domains: ["globex.singoo.ai", "globex.localhost:3000"],
		customDomains: ["shop.globex.example.com"],
		features: [
			"Loyalty wallets",
			"Customer data clean rooms",
			"Campaign level A/B tests",
			"Edge personalization"
		],
		cta: {
			label: "Send invite email",
			href: "mailto:onboarding@globex.example.com"
		},
		status: "pending"
	}
];

const fallbackTenant = staticTenants[0];

const staticHostIndex = new Map<string, TenantConfig>();
for (const tenant of staticTenants) {
	for (const domain of [...tenant.domains, ...tenant.customDomains]) {
		const clean = sanitizeHost(domain);
		if (clean) {
			staticHostIndex.set(clean, tenant);
		}
	}
}

const isTenantConfig = (value: unknown): value is TenantConfig => {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.slug === "string" &&
		typeof candidate.name === "string" &&
		Array.isArray(candidate.domains) &&
		Array.isArray(candidate.customDomains)
	);
};

const getCloudflareEnv = (): CloudflareEnv | undefined => {
	try {
		const context = Reflect.get(globalThis, CF_CONTEXT_SYMBOL) as
			| { env?: CloudflareEnv }
			| undefined;
		return context?.env;
	} catch {
		return undefined;
	}
};

const loadTenantFromKv = async (
	env: CloudflareEnv,
	slug: string
): Promise<TenantConfig | undefined> => {
	try {
		const record = await env.TENANTS.get<TenantConfig>(
			`${KV_TENANT_KEY_PREFIX}${slug}`,
			{ type: "json" }
		);
		return isTenantConfig(record) ? record : undefined;
	} catch (error) {
		console.warn("TENANTS_KV::get tenant failed", error);
		return undefined;
	}
};

const loadTenantsFromKv = async (
	env?: CloudflareEnv
): Promise<TenantConfig[]> => {
	if (!env?.TENANTS) {
		return [];
	}

	try {
		const listResult = await env.TENANTS.list({ prefix: KV_TENANT_KEY_PREFIX });
		if (!listResult.keys.length) {
			return [];
		}

		const records = await Promise.all(
			listResult.keys.map((key) =>
				env.TENANTS.get<TenantConfig>(key.name, { type: "json" })
			)
		);

		return records.filter(isTenantConfig);
	} catch (error) {
		console.warn("TENANTS_KV::list failed", error);
		return [];
	}
};

const getTenantForHostFromKv = async (
	env: CloudflareEnv | undefined,
	host: string | undefined
): Promise<TenantConfig | undefined> => {
	if (!env?.TENANTS || !host) {
		return undefined;
	}

	try {
		const slug = await env.TENANTS.get(`${KV_HOST_KEY_PREFIX}${host}`);
		if (!slug) {
			return undefined;
		}
		return loadTenantFromKv(env, slug);
	} catch (error) {
		console.warn("TENANTS_KV::host lookup failed", error);
		return undefined;
	}
};

const findTenantInList = (
	tenants: TenantConfig[],
	host: string | undefined
): TenantConfig | undefined => {
	if (!host) {
		return undefined;
	}

	return tenants.find((tenant) => {
		const domains = [...tenant.domains, ...tenant.customDomains];
		return domains.some((domain) => sanitizeHost(domain) === host);
	});
};

export const resolveTenantsForHost = async (
	host?: string | null
): Promise<TenantResolution> => {
	const cleanHost = sanitizeHost(host);
	const env = getCloudflareEnv();

	const [kvTenants, kvTenant] = await Promise.all([
		loadTenantsFromKv(env),
		getTenantForHostFromKv(env, cleanHost)
	]);

	let tenantList =
		kvTenants.length > 0 ? [...kvTenants] : [...staticTenants];

	if (kvTenant && !tenantList.some((tenant) => tenant.slug === kvTenant.slug)) {
		tenantList = [kvTenant, ...tenantList];
	}

	const tenant =
		kvTenant ??
		findTenantInList(tenantList, cleanHost) ??
		staticHostIndex.get(cleanHost ?? "") ??
		tenantList[0] ??
		fallbackTenant;

	const source: "kv" | "fallback" =
		kvTenant || kvTenants.length > 0 ? "kv" : "fallback";

	return {
		tenant,
		tenants: tenantList.length > 0 ? tenantList : [fallbackTenant],
		source
	};
};

export const getStaticTenants = () => staticTenants;

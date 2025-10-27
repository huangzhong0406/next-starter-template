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

const tenants: TenantConfig[] = [
	{
		slug: "studio",
		name: "SaaS Control Plane",
		tagline: "Manage every workspace from a single dashboard.",
		description:
			"Use this tenant for your marketing site, onboarding forms, and internal tooling. It responds to the default Workers.dev domain and localhost.",
		accent: "#2563eb",
		secondary: "#0f172a",
		domains: ["localhost", "localhost:3000", "127.0.0.1:3000"],
		customDomains: ["next-starter-template.templates.workers.dev"],
		features: [
			"Workspace provisioning API",
			"Custom domain enrollment",
			"Centralized billing",
			"Audit-ready logging"
		],
		cta: {
			label: "Create a workspace",
			href: "https://dash.cloudflare.com/?to=/:account/workers"
		},
		status: "live"
	},
	{
		slug: "acme",
		name: "Acme Finance",
		tagline: "Embedded treasury for marketplaces.",
		description:
			"This tenant represents a paying customer that connected their own apex domain. Requests to any hostname in the list render Acme's theme.",
		accent: "#f97316",
		secondary: "#431407",
		domains: ["acme.localhost:3000", "acme.next-saas-demo.workers.dev"],
		customDomains: ["finance.acme.example.com"],
		features: [
			"Chargeback guardrails",
			"Same-day payouts",
			"Multi-ledger exports",
			"SOC 2 controls"
		],
		cta: {
			label: "Book a treasury review",
			href: "mailto:sales@acme.example.com"
		},
		status: "live"
	},
	{
		slug: "globex",
		name: "Globex Retail",
		tagline: "Turn retail traffic into memberships.",
		description:
			"Illustrates a tenant that has finished onboarding but is waiting for DNS validation. Helpful when demoing pending custom hostname states.",
		accent: "#14b8a6",
		secondary: "#042f2e",
		domains: ["globex.localhost:3000", "preview.globex-saas.dev"],
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

const FALLBACK_TENANT = tenants[0];

const sanitizeHost = (host?: string | null) => {
	if (!host) {
		return undefined;
	}
	const trimmed = host.split(",")[0]?.trim();
	return trimmed?.replace(/\/.*$/, "").toLowerCase();
};

export const getTenantFromHost = (host?: string | null): TenantConfig => {
	const cleanHost = sanitizeHost(host);
	if (!cleanHost) {
		return FALLBACK_TENANT;
	}

	const match = tenants.find((tenant) =>
		tenant.domains.some((domain) => sanitizeHost(domain) === cleanHost)
	);

	return match ?? FALLBACK_TENANT;
};

export const getAllTenants = () => tenants;

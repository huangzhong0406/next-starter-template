export type TenantMeta = {
	slug: string;
	name: string;
	tagline: string;
	description: string;
	accent: string;
	secondary: string;
	features: string[];
	verified?: boolean;
};

export type TenantResolution = {
	slug: string;
	meta: TenantMeta;
	source: "api" | "fallback";
	matchedByKv: boolean;
};

export const KV_HOST_KEY_PREFIX = "host:";

const CF_CONTEXT_SYMBOL = Symbol.for("__cloudflare-context__");
const DEFAULT_API_BASE =
	process.env.TENANT_API_BASE ?? "https://testapi.singoo.cc";

const fallbackTenants: Record<string, TenantMeta> = {
	studio: {
		slug: "studio",
		name: "Singoo 控制中心",
		tagline: "在 singoo.ai 旗下启动并运营每一个客户工作区。",
		description:
			"这里是平台的控制台与营销首页，支持 localhost、本地域名以及 saas.singoo.ai，便于潜在客户在接入自定义域名之前完成注册与体验。",
		accent: "#2563eb",
		secondary: "#0f172a",
		features: [
			"秒级创建工作区",
			"主域引导页与转化漏斗",
			"自定义域接入流程",
			"用量与账单总览"
		],
		verified: true
	}
};

const defaultTenant = fallbackTenants.studio;

type CloudflareContext = { env?: CloudflareEnv };

const sanitizeHost = (host?: string | null): string | undefined => {
	if (!host) {
		return undefined;
	}
	const trimmed = host.split(",")[0]?.trim();
	return trimmed?.replace(/\/.*$/, "").toLowerCase();
};

const deriveSlugFromHost = (host?: string): string => {
	if (!host) {
		return defaultTenant.slug;
	}

	const [label] = host.split(".");
	return label || defaultTenant.slug;
};

const getCloudflareEnv = (): CloudflareEnv | undefined => {
	try {
		const context = Reflect.get(globalThis, CF_CONTEXT_SYMBOL) as
			| CloudflareContext
			| undefined;
		return context?.env;
	} catch {
		return undefined;
	}
};

const getTenantSlugFromKv = async (
	env: CloudflareEnv | undefined,
	host: string | undefined
): Promise<string | undefined> => {
	if (!env?.TENANTS || !host) {
		return undefined;
	}

	try {
		const slug = await env.TENANTS.get(`${KV_HOST_KEY_PREFIX}${host}`);
		return slug ?? undefined;
	} catch (error) {
		console.warn("TENANTS_KV::host lookup failed", { host, error });
		return undefined;
	}
};

type TenantApiResponse = {
	slug?: string;
	meta?: {
		slug?: string;
		name?: string;
		tagline?: string;
		description?: string;
		accent?: string;
		secondary?: string;
		features?: unknown;
		verified?: boolean;
		[key: string]: unknown;
	};
	[key: string]: unknown;
};

const mapApiResponseToMeta = (
	response: TenantApiResponse,
	slug: string
): TenantMeta | undefined => {
	const meta = response.meta;
	if (!meta) {
		return undefined;
	}

	const features = Array.isArray(meta.features)
		? (meta.features.filter((item): item is string => typeof item === "string"))
		: undefined;

	if (
		typeof meta.name !== "string" ||
		typeof meta.tagline !== "string" ||
		typeof meta.description !== "string" ||
		typeof meta.accent !== "string" ||
		typeof meta.secondary !== "string" ||
		!features
	) {
		return undefined;
	}

	return {
		slug: meta.slug ?? response.slug ?? slug,
		name: meta.name,
		tagline: meta.tagline,
		description: meta.description,
		accent: meta.accent,
		secondary: meta.secondary,
		features,
		verified: typeof meta.verified === "boolean" ? meta.verified : undefined
	};
};

const fetchTenantMeta = async (
	slug: string
): Promise<TenantMeta | undefined> => {
	const endpoint = `${DEFAULT_API_BASE.replace(/\/$/, "")}/v2/aisite/pages/${slug}`;

	try {
		const response = await fetch(endpoint, {
			cache: "no-store",
			headers: {
				accept: "application/json",
				"x-tenant-slug": slug
			}
		});

		if (!response.ok) {
			throw new Error(
				`Tenant API returned ${response.status} ${response.statusText}`
			);
		}

		const data = (await response.json()) as TenantApiResponse;
		return mapApiResponseToMeta(data, slug);
	} catch (error) {
		console.warn("TENANT_API::fetch failed", { slug, error });
		return undefined;
	}
};

export const resolveTenantForHost = async (
	host?: string | null
): Promise<TenantResolution> => {
	const cleanHost = sanitizeHost(host);
	const env = getCloudflareEnv();

	const slugFromKv = await getTenantSlugFromKv(env, cleanHost);

	if (!slugFromKv) {
		const derivedSlug = deriveSlugFromHost(cleanHost);
		const fallbackMeta =
			fallbackTenants[derivedSlug] ?? {
				...defaultTenant,
				slug: derivedSlug
			};

		return {
			slug: derivedSlug,
			meta: fallbackMeta,
			source: "fallback",
			matchedByKv: false
		};
	}

	const apiMeta = await fetchTenantMeta(slugFromKv);

	if (apiMeta) {
		return {
			slug: slugFromKv,
			meta: apiMeta,
			source: "api",
			matchedByKv: true
		};
	}

	const fallbackMeta =
		fallbackTenants[slugFromKv] ?? {
			...defaultTenant,
			slug: slugFromKv
		};

	return {
		slug: slugFromKv,
		meta: fallbackMeta,
		source: "fallback",
		matchedByKv: true
	};
};

export const getFallbackTenants = () => fallbackTenants;

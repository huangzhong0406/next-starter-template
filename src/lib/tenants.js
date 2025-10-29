/**
 * @typedef {Object} TenantMeta
 * @property {string} slug
 * @property {string} name
 * @property {string} tagline
 * @property {string} description
 * @property {string} accent
 * @property {string} secondary
 * @property {string[]} features
 * @property {boolean} [verified]
 */

/**
 * @typedef {Object} TenantResolution
 * @property {string} slug
 * @property {TenantMeta} meta
 * @property {"api" | "fallback"} source
 * @property {boolean} matchedByKv
 */

export const KV_HOST_KEY_PREFIX = "host:";

const CF_CONTEXT_SYMBOL = Symbol.for("__cloudflare-context__");
const DEFAULT_API_BASE =
	process.env.TENANT_API_BASE ?? "https://testapi.singoo.cc";

/** @type {Record<string, TenantMeta>} */
const fallbackTenants = {
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

/**
 * @param {string | null | undefined} host
 */
const sanitizeHost = (host) => {
	if (!host) {
		return undefined;
}
	const trimmed = host.split(",")[0]?.trim();
	return trimmed?.replace(/\/.*$/, "").toLowerCase();
};

/**
 * @param {string | undefined} host
 */
const deriveSlugFromHost = (host) => {
	if (!host) {
		return defaultTenant.slug;
	}

	const [label] = host.split(".");
	return label || defaultTenant.slug;
};

/**
 * @returns {CloudflareEnv | undefined}
 */
const getCloudflareEnv = () => {
	try {
		const context = Reflect.get(globalThis, CF_CONTEXT_SYMBOL);
		return context?.env;
	} catch {
		return undefined;
	}
};

/**
 * @param {CloudflareEnv | undefined} env
 * @param {string | undefined} host
 */
const getTenantSlugFromKv = async (env, host) => {
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

/**
 * @typedef {Object} TenantApiResponse
 * @property {string} [slug]
 * @property {Object} [meta]
 */

/**
 * @param {TenantApiResponse} response
 * @param {string | undefined} host
 * @param {string} slug
 * @returns {TenantMeta | undefined}
 */
const mapApiResponseToMeta = (response, slug) => {
	const meta = response.meta;
	if (!meta) {
		return undefined;
	}

	const features = Array.isArray(meta.features)
		? meta.features.filter((item) => typeof item === "string")
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

/**
 * @param {string} slug
 * @returns {Promise<{ meta?: TenantMeta; cacheStatus?: string }>}
 */
const fetchTenantMeta = async (host, slug) => {
	const endpoint = `${DEFAULT_API_BASE.replace(/\/$/, "")}/v2/aisite/pages/${slug}`;

	try {
		const response = await fetch(endpoint, {
			cache: "no-store",
			cf: {
				cacheEverything: true,
				cacheTtl: 3600,
				cacheKey: `tenant-meta:${sanitizeHost(host)}:${slug}`
			},
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

		const data = await response.json();
		return {
			meta: mapApiResponseToMeta(data, slug),
			cacheStatus: response.headers.get("cf-cache-status") ?? undefined
		};
	} catch (error) {
		console.warn("TENANT_API::fetch failed", { slug, error });
		return {};
	}
};

/**
 * @param {string | null | undefined} host
 * @returns {Promise<TenantResolution>}
 */
export const resolveTenantForHost = async (host) => {
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
			matchedByKv: false,
			cacheStatus: undefined
		};
	}

	const { meta: apiMeta, cacheStatus } =
		(await fetchTenantMeta(cleanHost, slugFromKv)) ?? {};

	if (apiMeta) {
		const derivedSource =
			cacheStatus && cacheStatus.toUpperCase() === "HIT"
				? "edge-cache"
				: "api";
		return {
			slug: slugFromKv,
			meta: apiMeta,
			source: derivedSource,
			matchedByKv: true,
			cacheStatus
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
		matchedByKv: true,
		cacheStatus: undefined
	};
};

export const getFallbackTenants = () => fallbackTenants;

/** @type {import('next').NextConfig} */
const backendOrigin = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const nextConfig = {
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Cross-Origin-Opener-Policy",
						value: "same-origin-allow-popups",
					},
				],
			},
		];
	},
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: `${backendOrigin}/api/:path*`,
			},
		];
	},
};

export default nextConfig;


"use client";

import Link from "next/link";

export default function OnboardingFailed() {
	return (
		<div
			className="min-h-screen h-screen flex flex-col items-center justify-center p-4 bg-[url('/grid.avg')] bg-cover bg-center"
		>
			<div className="max-w-lg w-full flex flex-col items-center gap-8 rounded-2xl shadow-2xl border border-red-500 bg-background/90 backdrop-blur-md p-6 md:p-10">
				<img
					src="/landing.png"
					alt="Error"
					className="w-32 h-32 object-contain mb-4 drop-shadow-lg opacity-80"
				/>
				<h1 className="text-4xl font-extrabold text-red-500 text-center mb-2">
					Onboarding Failed
				</h1>
				<p className="text-lg text-gray-100 text-center mb-4">
					There was a problem with your onboarding process.<br />
					Please try again, or contact support if the issue persists.
				</p>
				<div className="flex flex-col md:flex-row gap-4 w-full justify-center">
					<Link
						href="/onboarding/terms"
						className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-lg px-8 py-3 font-bold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-red-400 text-center"
					>
						Retry Onboarding
					</Link>
					<Link
						href="/help"
						className="bg-gray-700 hover:bg-gray-800 active:bg-gray-900 text-white text-lg px-8 py-3 font-bold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-600 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-gray-400 text-center"
					>
						Contact Support
					</Link>
				</div>
			</div>
		</div>
	);
}



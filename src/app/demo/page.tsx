"use client";

import { useEffect, useState } from "react";
import type { DashboardResponse } from "@/lib/dashboard-types";

export default function DemoPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        return (await res.json()) as DashboardResponse;
      })
      .then(setData)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      });
  }, []);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-3xl font-bold">Live Demo</h1>
        <p className="mt-4 text-red-600">Failed to load: {error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-3xl font-bold">Live Demo</h1>
        <p className="mt-4">Loading live data...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">Live Demo</h1>
      <p className="text-sm text-gray-600">No mock data in use.</p>
      <section>
        <h2 className="text-xl font-semibold">Mission</h2>
        <ul className="mt-2 list-disc pl-6">
          {data.insights.briefing.mission.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

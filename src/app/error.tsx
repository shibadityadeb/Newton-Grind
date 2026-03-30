"use client";

import React from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function RootErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorBoundary error={error} reset={reset} />;
}

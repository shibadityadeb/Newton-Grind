"use client";
import React from "react";

export default function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8">
      <h2 className="text-2xl font-bold mb-2 text-red-600">Something went wrong</h2>
      <p className="mb-4 text-gray-600">{error.message || "An unexpected error occurred."}</p>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  );
}

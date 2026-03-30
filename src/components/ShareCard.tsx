"use client";
import React, { useRef } from "react";
import html2canvas from "html2canvas";

interface ShareCardProps {
  rank: number;
  momentum: number;
  streak: number;
}

export default function ShareCard({ rank, momentum, streak }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { backgroundColor: "#fff" });
    const link = document.createElement("a");
    link.download = "newton-grind-stats.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { backgroundColor: "#fff" });
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
    if (blob && navigator.share) {
      const file = new File([blob], "newton-grind-stats.png", { type: "image/png" });
      try {
        await navigator.share({
          files: [file],
          title: "My Newton Grind Stats",
          text: `Rank: #${rank}, Momentum: ${momentum}, Streak: ${streak}`,
        });
      } catch {}
    } else {
      handleDownload();
    }
  };

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="rounded-xl border shadow-lg bg-gradient-to-br from-blue-50 to-green-50 p-6 w-80 mx-auto text-center"
      >
        <h3 className="text-lg font-bold mb-2 text-blue-700">Newton Grind Stats</h3>
        <div className="flex justify-around my-4">
          <div>
            <div className="text-3xl font-bold text-blue-900">#{rank}</div>
            <div className="text-xs text-gray-500">Rank</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-700">{momentum}</div>
            <div className="text-xs text-gray-500">Momentum</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600">{streak}</div>
            <div className="text-xs text-gray-500">QOTD Streak</div>
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-2">newtongrind.com</div>
      </div>
      <div className="flex gap-2 justify-center">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleShare}
        >
          Share my stats
        </button>
        <button
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          onClick={handleDownload}
        >
          Download card
        </button>
      </div>
    </div>
  );
}

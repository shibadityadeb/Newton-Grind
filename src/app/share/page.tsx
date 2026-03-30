import { Syne } from "next/font/google";

const syne = Syne({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

type SearchParams = {
  student?: string;
  course?: string;
  xp?: string;
  attendance?: string;
  streak?: string;
  momentum?: string;
};

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const student = params.student || "Newton Student";
  const course = params.course || "Newton Course";
  const xp = params.xp || "--";
  const attendance = params.attendance || "--";
  const streak = params.streak || "--";
  const momentum = params.momentum || "--";

  return (
    <main className="min-h-screen bg-[#0a0e1a] p-6 text-[#d7deed] grid place-items-center">
      <section className="w-full max-w-xl rounded-2xl border border-[#1c2a44] bg-[#0d1526] p-6 shadow-[0_0_28px_rgba(0,0,0,0.35)]">
        <h1 className={`${syne.className} text-2xl font-bold text-white`}>{student}</h1>
        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7f92b8]">{course}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#2d4369] bg-[#101a30] p-3">
            <p className="text-xs text-[#7f92b8] uppercase">XP</p>
            <p className="mt-1 text-sm font-bold text-[#00d4aa]">{xp}</p>
          </div>
          <div className="rounded-lg border border-[#2d4369] bg-[#101a30] p-3">
            <p className="text-xs text-[#7f92b8] uppercase">Attendance</p>
            <p className="mt-1 text-sm font-bold text-[#00d4aa]">{attendance}%</p>
          </div>
          <div className="rounded-lg border border-[#2d4369] bg-[#101a30] p-3">
            <p className="text-xs text-[#7f92b8] uppercase">Momentum</p>
            <p className="mt-1 text-sm font-bold text-[#00d4aa]">{momentum}</p>
          </div>
          <div className="rounded-lg border border-[#2d4369] bg-[#101a30] p-3">
            <p className="text-xs text-[#7f92b8] uppercase">QOTD Streak</p>
            <p className="mt-1 text-sm font-bold text-[#f59e0b]">{streak}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

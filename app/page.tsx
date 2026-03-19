import Eye from "./components/eye";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdf7da] overflow-hidden">
      <main className="flex flex-col items-center justify-center p-24">
        <Eye size="w-32 sm:w-40 md:w-[550px]" />{" "}
        <div className="text-zinc-800 text-sm font-light tracking-widest animate-pulse">
          IT IS WATCHING
        </div>
      </main>
    </div>
  );
}

import { useEffect } from "react";
import { CelebrationFeed } from "@/components/celebrate/CelebrationFeed";
import { MessageWall } from "@/components/celebrate/MessageWall";
import { Sparkles } from "lucide-react";

export default function Celebrer() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Célébrer — Fais sentir à tes proches qu'ils sont aimés | JDV";
    const meta =
      document.querySelector('meta[name="description"]') ||
      (() => {
        const m = document.createElement("meta");
        m.setAttribute("name", "description");
        document.head.appendChild(m);
        return m;
      })();
    meta.setAttribute(
      "content",
      "Publie des célébrations, laisse des messages, réagis. Le mur de l'amour pour célébrer ceux qui comptent."
    );
  }, []);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-secondary/40 to-background pb-24">
        <header className="relative overflow-hidden bg-gradient-primary py-10 px-4 text-center text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-8 text-4xl animate-pulse">✨</div>
            <div className="absolute top-6 right-12 text-3xl animate-pulse">🎉</div>
            <div className="absolute bottom-4 left-1/3 text-3xl animate-pulse">💖</div>
          </div>
          <div className="relative">
            <Sparkles className="mx-auto h-8 w-8 mb-2 animate-pulse" />
            <h1 className="font-poppins text-3xl font-bold">Célébrer</h1>
            <p className="mt-2 text-sm text-white/90 max-w-md mx-auto">
              Fais ressentir à tes proches qu'ils sont aimés, vus, et célébrés ✨
            </p>
          </div>
        </header>

        <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
          <CelebrationFeed pageType="standalone" />
          <MessageWall pageType="standalone" pageId={null} title="✨ Mur d'amour global" />
        </div>
      </main>
    </>
  );
}
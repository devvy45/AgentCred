import { cn, scoreTone } from "@/lib/utils";

export function ScoreBadge({ score, large = false }: { score: number; large?: boolean }) {
  const tone = scoreTone(score);
  return (
    <div
      className={cn(
        "mono inline-flex items-center justify-center rounded-md border font-black",
        large ? "h-24 w-24 text-4xl" : "h-10 min-w-14 px-3 text-lg",
        tone === "high" && "border-accent/40 bg-accent/10 text-accent",
        tone === "mid" && "border-warning/40 bg-warning/10 text-warning",
        tone === "low" && "border-danger/40 bg-danger/10 text-danger",
      )}
    >
      {score}
    </div>
  );
}

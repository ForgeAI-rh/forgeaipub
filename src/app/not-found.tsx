import Link from "next/link";
import { Mark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="grid-bg flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <Mark size={36} />
      <div className="label">Error 404</div>
      <h1 className="font-display text-3xl font-semibold">Nothing forged here.</h1>
      <p className="max-w-sm text-sm text-steel">The page does not exist, or it belongs to a private agent.</p>
      <Link href="/app" className="btn btn-primary">
        Back to the app
      </Link>
    </div>
  );
}

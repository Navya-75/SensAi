import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-7 bg-[#0b0e17] px-4 py-12">
      <Link href="/" className="text-sm font-bold tracking-[0.2em] text-[#eef4fb]">SENSAI</Link>
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}

import { redirect } from "next/navigation";
import { ResumeLibrary } from "@/components/resumes/resume-library";
import { getSignedInProfile } from "@/lib/auth/user";
import { getResumeLibrary } from "@/lib/resumes/list";

export default async function ResumePage() {
  const profile = await getSignedInProfile();
  if (!profile) redirect("/sign-in");

  let library: Awaited<ReturnType<typeof getResumeLibrary>> = { available: false, resumes: [] };
  try {
    library = await getResumeLibrary(profile);
  } catch {
    library = { available: false, resumes: [] };
  }

  return <ResumeLibrary title="Your resumes" available={library.available} resumes={library.resumes} />;
}

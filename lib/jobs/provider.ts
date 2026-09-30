import "server-only";
import { prisma } from "@/lib/db/prisma";

export type JobFilters = {
  query?: string;
  location?: string;
  experienceLevel?: string;
  employmentType?: string;
  skill?: string;
};

export interface JobProvider {
  list(filters?: JobFilters): Promise<{
    id: string;
    title: string;
    company: string;
    location: string | null;
    employmentType: string | null;
    experienceLevel: string;
    description: string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    source: string;
    sourceName: string | null;
    sourceUrl: string | null;
    postedAt: Date | null;
    isDemo: boolean;
    skills: { name: string; isRequired: boolean }[];
  }[]>;
}

/** Database-backed provider for curated or explicitly demo-labeled listings. */
export class DatabaseJobProvider implements JobProvider {
  async list(filters: JobFilters = {}) {
    const jobs = await prisma.job.findMany({
      where: {
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          { OR: [{ source: "CURATED" }, { source: "DEMO", isDemo: true }] },
          ...(filters.query ? [{ OR: [
            { title: { contains: filters.query, mode: "insensitive" as const } },
            { company: { contains: filters.query, mode: "insensitive" as const } },
            { description: { contains: filters.query, mode: "insensitive" as const } },
          ] }] : []),
          ...(filters.location ? [{ location: { contains: filters.location, mode: "insensitive" as const } }] : []),
          ...(filters.experienceLevel ? [{ experienceLevel: filters.experienceLevel as never }] : []),
          ...(filters.employmentType ? [{ employmentType: filters.employmentType as never }] : []),
          ...(filters.skill ? [{ skills: { some: { skill: { name: { contains: filters.skill, mode: "insensitive" as const } } } } }] : []),
        ],
      },
      orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
      take: 60,
      include: { skills: { include: { skill: { select: { name: true } } } } },
    });
    return jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      description: job.description,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      source: job.source,
      sourceName: job.sourceName,
      sourceUrl: job.sourceUrl,
      postedAt: job.postedAt,
      isDemo: job.isDemo,
      skills: job.skills.map(({ skill, isRequired }) => ({ name: skill.name, isRequired })),
    }));
  }
}

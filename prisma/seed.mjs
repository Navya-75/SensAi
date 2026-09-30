import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const mcqOnly = process.argv.includes("--mcq-only");

const skills = [
  ["JavaScript", "javascript", "PROGRAMMING_LANGUAGE"], ["TypeScript", "typescript", "PROGRAMMING_LANGUAGE"],
  ["React", "react", "FRAMEWORK"], ["Next.js", "next.js", "FRAMEWORK"], ["Node.js", "node.js", "FRAMEWORK"],
  ["SQL", "sql", "DATABASE"], ["PostgreSQL", "postgresql", "DATABASE"], ["Python", "python", "PROGRAMMING_LANGUAGE"],
  ["Git", "git", "TOOL"], ["REST APIs", "rest apis", "TECHNICAL"], ["Communication", "communication", "SOFT"],
  ["Problem solving", "problem solving", "SOFT"],
];

const questions = [
  { topic: "JavaScript", question: "Which value does `typeof null` return in JavaScript?", options: ["null", "undefined", "object", "number"], answer: 2, explanation: "This is a long-standing JavaScript behavior: typeof null returns \"object\". Use a direct null comparison to detect null." },
  { topic: "JavaScript", question: "Which array method returns a new array containing items that pass a test?", options: ["forEach", "filter", "push", "sort"], answer: 1, explanation: "filter creates a new array with only the elements for which the callback returns a truthy value." },
  { topic: "TypeScript", question: "What does a TypeScript interface primarily describe?", options: ["A runtime database", "A shape for values", "A browser event", "A package lock"], answer: 1, explanation: "An interface describes the expected shape of a value for static type checking; it does not create a runtime object." },
  { topic: "React", question: "Why should a list of React elements have stable keys?", options: ["To encrypt each item", "To help React identify items across updates", "To add CSS automatically", "To prevent all rerenders"], answer: 1, explanation: "Stable keys help React match items when a list changes, so it can update the correct elements." },
  { topic: "React", question: "Which hook is intended for synchronizing a component with an external system?", options: ["useState", "useEffect", "useMemo", "useId"], answer: 1, explanation: "useEffect is for synchronizing with external systems such as subscriptions, browser APIs, or network connections." },
  { topic: "Next.js", question: "In the Next.js App Router, where are route segments commonly created?", options: ["Inside app folders with page files", "Only in package.json", "In CSS selectors", "In a database enum"], answer: 0, explanation: "The App Router maps folders under app to URL segments, with page files defining route UI." },
  { topic: "Node.js", question: "What does the Node.js event loop help the runtime handle?", options: ["Asynchronous callbacks and I/O", "Only CSS layout", "Static type checking", "Database schema migrations"], answer: 0, explanation: "The event loop coordinates asynchronous callbacks and non-blocking I/O operations." },
  { topic: "Python", question: "Which Python keyword defines a function?", options: ["func", "def", "function", "lambda"], answer: 1, explanation: "The def keyword begins a named function definition in Python." },
  { topic: "SQL", question: "Which clause filters rows before grouping?", options: ["ORDER BY", "HAVING", "WHERE", "LIMIT"], answer: 2, explanation: "WHERE filters input rows before GROUP BY; HAVING filters groups after aggregation." },
  { topic: "SQL", question: "What does a primary key guarantee in a relational table?", options: ["Rows are sorted", "Each row has a unique, non-null identifier", "Every field is encrypted", "A table has no indexes"], answer: 1, explanation: "A primary key uniquely identifies each row and cannot be null." },
  { topic: "Databases", question: "What is the main purpose of a database index?", options: ["Speed up some data lookups", "Replace all constraints", "Guarantee a smaller database", "Prevent transactions"], answer: 0, explanation: "Indexes can speed up queries that match the indexed columns, with storage and write costs." },
  { topic: "Web fundamentals", question: "Which HTTP method is normally used to retrieve a representation without changing server state?", options: ["GET", "DELETE", "PATCH", "POST"], answer: 0, explanation: "GET is defined as a safe retrieval method and should not request a state change." },
  { topic: "Web fundamentals", question: "What does HTTPS add to HTTP in normal browser connections?", options: ["TLS-protected transport", "Automatic authentication for every app", "A relational database", "Guaranteed correct content"], answer: 0, explanation: "HTTPS uses TLS to protect the connection in transit and authenticate the server certificate." },
  { topic: "Git", question: "What does `git status` show?", options: ["The current branch and working-tree changes", "All remote passwords", "A production deployment", "Database table sizes"], answer: 0, explanation: "git status reports the current branch and staged, unstaged, or untracked changes." },
  { topic: "Algorithms", question: "What is the time complexity of binary search on a sorted array?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 1, explanation: "Each comparison halves the remaining search interval, giving logarithmic time." },
  { topic: "Accessibility", question: "What is the main purpose of a form label associated with an input?", options: ["Provide an accessible name and larger click target", "Validate the server", "Encrypt the value", "Replace keyboard support"], answer: 0, explanation: "An associated label names the control for assistive technology and lets users click the label to focus it." },
  { topic: "JavaScript", question: "What does `Array.isArray([])` return?", options: ["true", "false", "undefined", "object"], answer: 0, explanation: "Array.isArray is the reliable built-in check for whether a value is an array." },
  { topic: "TypeScript", question: "What does a union type such as `string | number` allow?", options: ["A value can be either a string or a number", "A value must be both types at once", "It converts strings to numbers", "It creates two variables"], answer: 0, explanation: "A union type lets a value match any one of the listed types." },
  { topic: "TypeScript", question: "What is a generic useful for?", options: ["Writing reusable code that keeps type information", "Running code only in a browser", "Replacing every interface", "Creating database tables"], answer: 0, explanation: "Generics let reusable functions and types work with different types while preserving useful type checks." },
  { topic: "React", question: "When should a state update use a callback such as `setCount(current => current + 1)`?", options: ["When the next state depends on the previous state", "Only when changing CSS", "Whenever rendering a list", "When importing a component"], answer: 0, explanation: "The updater form reads the latest queued state, which is useful when the new value depends on the old one." },
  { topic: "Next.js", question: "How is a dynamic route segment commonly written in the App Router?", options: ["As a folder like `[id]`", "As a CSS class", "Inside package.json", "As a query in layout.tsx"], answer: 0, explanation: "A bracketed folder such as `[id]` defines a dynamic route segment in the App Router." },
  { topic: "Next.js", question: "What does the `use client` directive mark?", options: ["A client component entry point", "A database transaction", "A static image", "A server-only module"], answer: 0, explanation: "The directive marks a module boundary for components that need client-side features such as state or event handlers." },
  { topic: "Node.js", question: "Which built-in module provides access to file system operations?", options: ["node:fs", "node:css", "node:html", "node:layout"], answer: 0, explanation: "Node.js provides file system operations through the built-in `node:fs` module and its promise APIs." },
  { topic: "Node.js", question: "Why use the promise-based file system API for asynchronous work?", options: ["It lets code await file operations without blocking the flow", "It makes every operation run synchronously", "It automatically encrypts files", "It replaces the event loop"], answer: 0, explanation: "The promise-based API works with async/await and avoids blocking the event loop during file I/O." },
  { topic: "Python", question: "Which list method adds one item to the end of a list?", options: ["append", "extendone", "insertlast", "push"], answer: 0, explanation: "The list method `append` adds one object to the end of a Python list." },
  { topic: "Python", question: "What does `len((3, 5, 8))` return?", options: ["3", "5", "8", "16"], answer: 0, explanation: "The built-in `len` function returns the number of items in a tuple, which is three here." },
  { topic: "SQL", question: "What does an INNER JOIN return?", options: ["Rows with matching values in both joined inputs", "Every possible row combination", "Only rows with no match", "A sorted copy of one table"], answer: 0, explanation: "An INNER JOIN includes rows where the join condition matches in both inputs." },
  { topic: "Databases", question: "What does atomicity mean in the ACID transaction properties?", options: ["A transaction succeeds completely or is rolled back", "Data is always sorted", "Every query uses an index", "A table can have only one column"], answer: 0, explanation: "Atomicity means a transaction's operations are treated as one unit: all succeed or none are committed." },
  { topic: "Databases", question: "What is a foreign key used for?", options: ["Linking a row to a related row and enforcing referential integrity", "Encrypting a database backup", "Sorting every query", "Making a column unique by default"], answer: 0, explanation: "A foreign key references a key in another table and can help enforce valid relationships." },
  { topic: "Web fundamentals", question: "What does the HTTP status code 404 usually mean?", options: ["The requested resource was not found", "The request succeeded", "The server is redirecting permanently", "The client is authenticated"], answer: 0, explanation: "HTTP 404 indicates that the server did not find a representation for the requested resource." },
  { topic: "Git", question: "What does `git commit` do?", options: ["Records staged changes as a repository snapshot", "Downloads every remote branch", "Deletes the current repository", "Starts a web server"], answer: 0, explanation: "A commit records staged changes and metadata in the local repository history." },
  { topic: "Git", question: "Which command creates and switches to a new branch in modern Git?", options: ["git switch -c feature-name", "git status feature-name", "git merge --new feature-name", "git pull -b feature-name"], answer: 0, explanation: "`git switch -c` creates a branch and checks it out; `git checkout -b` is another common form." },
  { topic: "Algorithms", question: "Which data structure follows last-in, first-out order?", options: ["Stack", "Queue", "Sorted array", "Graph"], answer: 0, explanation: "A stack removes the most recently added item first, following last-in, first-out order." },
  { topic: "Algorithms", question: "What is the typical average lookup time for a well-sized hash table?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 0, explanation: "Hash tables provide average constant-time lookup under a reasonable hash distribution, though worst cases can be slower." },
  { topic: "Accessibility", question: "What should informative images generally have?", options: ["Concise alternative text describing their meaning", "A filename read aloud", "A tooltip that only appears on hover", "No text alternative"], answer: 0, explanation: "Alternative text communicates an informative image's purpose or content to people who cannot see it." },
  { topic: "Accessibility", question: "Why should all interactive controls be usable with a keyboard?", options: ["Some users navigate without a mouse", "It makes images smaller", "It removes the need for labels", "It prevents server errors"], answer: 0, explanation: "Keyboard access supports people who use keyboards or assistive technology and is important for accessible interaction." },
];

const insights = [
  { title: "JavaScript reference and guide", summary: "A maintained reference for JavaScript syntax, built-in objects, and browser APIs. Use it to verify language behavior against primary documentation.", industry: "Developer reference", skills: ["JavaScript"], sourceName: "MDN Web Docs", sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
  { title: "Learn React", summary: "The official React learning path introduces components, state, events, and common UI patterns through guided examples.", industry: "Frontend development", skills: ["React", "JavaScript"], sourceName: "React documentation", sourceUrl: "https://react.dev/learn" },
  { title: "Next.js App Router documentation", summary: "Official documentation for layouts, routes, data fetching, and server and client components in the App Router.", industry: "Web development", skills: ["Next.js", "React"], sourceName: "Next.js documentation", sourceUrl: "https://nextjs.org/docs" },
  { title: "Python tutorial", summary: "The official Python tutorial covers core language concepts, data structures, modules, errors, and classes.", industry: "Programming languages", skills: ["Python"], sourceName: "Python documentation", sourceUrl: "https://docs.python.org/3/tutorial/" },
  { title: "PostgreSQL documentation", summary: "Primary documentation for SQL, database administration, data types, queries, and PostgreSQL features.", industry: "Data and databases", skills: ["SQL", "PostgreSQL"], sourceName: "PostgreSQL documentation", sourceUrl: "https://www.postgresql.org/docs/" },
  { title: "OWASP Top 10 project", summary: "A security awareness resource for common web application risks. Treat it as a study guide and verify project-specific controls separately.", industry: "Application security", skills: ["Web security"], sourceName: "OWASP Foundation", sourceUrl: "https://owasp.org/www-project-top-ten/" },
];

const jobs = [
  { title: "Junior Frontend Developer", company: "SENSAI Demo Studio", location: "Remote · Demo", employmentType: "FULL_TIME", experienceLevel: "ENTRY_LEVEL", description: "Sample development listing for practicing profile-to-role matching. This is fictional demo content, not an open vacancy.", skillKeys: ["javascript", "typescript", "react", "next.js", "git"] },
  { title: "Software Engineering Intern", company: "SENSAI Demo Labs", location: "Hybrid · Demo", employmentType: "INTERNSHIP", experienceLevel: "INTERNSHIP", description: "Sample internship listing for practicing job filters and skill matching. This is fictional demo content, not an open vacancy.", skillKeys: ["javascript", "python", "sql", "git", "problem solving"] },
  { title: "Associate Backend Developer", company: "SENSAI Demo Works", location: "Remote · Demo", employmentType: "FULL_TIME", experienceLevel: "ASSOCIATE", description: "Sample backend listing for practicing job filters and skill matching. This is fictional demo content, not an open vacancy.", skillKeys: ["node.js", "rest apis", "postgresql", "sql", "git"] },
];

try {
  if (!mcqOnly) {
    for (const [name, normalizedKey, category] of skills) {
      await prisma.skill.upsert({ where: { normalizedKey }, update: { name, category }, create: { name, normalizedKey, category } });
    }
  }
  for (const item of questions) {
    const existing = await prisma.mcq.findFirst({ where: { topic: item.topic, question: item.question, isDemo: true }, select: { id: true } });
    const data = { topic: item.topic, question: item.question, options: item.options, correctOptionIndex: item.answer, explanation: item.explanation, difficulty: "BEGINNER", isDemo: true };
    if (existing) await prisma.mcq.update({ where: { id: existing.id }, data });
    else await prisma.mcq.create({ data });
  }
  if (!mcqOnly) {
    for (const item of insights) {
      const existing = await prisma.industryInsight.findFirst({ where: { title: item.title, sourceUrl: item.sourceUrl }, select: { id: true } });
      const data = { ...item, isDemo: true, publishedAt: null };
      if (existing) await prisma.industryInsight.update({ where: { id: existing.id }, data });
      else await prisma.industryInsight.create({ data });
    }
  }
  if (!mcqOnly) {
    for (const item of jobs) {
      const existing = await prisma.job.findFirst({ where: { title: item.title, company: item.company, isDemo: true }, select: { id: true } });
      const { skillKeys, ...job } = item;
      const record = existing
        ? await prisma.job.update({ where: { id: existing.id }, data: { ...job, isDemo: true, source: "DEMO", sourceName: "SENSAI sample data", sourceUrl: null, postedAt: null, expiresAt: null, salaryMin: null, salaryMax: null, salaryCurrency: null } })
        : await prisma.job.create({ data: { ...job, isDemo: true, source: "DEMO", sourceName: "SENSAI sample data" } });
      for (const normalizedKey of skillKeys) {
        const skill = await prisma.skill.findUnique({ where: { normalizedKey }, select: { id: true } });
        if (skill) await prisma.jobSkill.upsert({ where: { jobId_skillId: { jobId: record.id, skillId: skill.id } }, update: { isRequired: true }, create: { jobId: record.id, skillId: skill.id, isRequired: true } });
      }
    }
  }
  console.log(mcqOnly ? `Seeded ${questions.length} practice questions.` : `Seeded ${questions.length} practice questions, ${insights.length} reference links, and ${jobs.length} explicitly fictional demo listings.`);
} finally {
  await prisma.$disconnect();
}

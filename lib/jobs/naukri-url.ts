function toJobSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildNaukriSearchUrl(keyword = "", location = "") {
  const role = toJobSlug(keyword);
  const city = toJobSlug(location);
  const searchPath = role ? `${role}-jobs` : "jobs";
  return `https://www.naukri.com/${searchPath}${city ? `-in-${city}` : ""}`;
}

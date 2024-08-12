export default async function NotionFetch(slug: string) {
  return await (
    await fetch(
      `${BACKEND_BRANCHES[await backendBranch.getValue()]}/notion/${slug}`
    )
  ).json();
}

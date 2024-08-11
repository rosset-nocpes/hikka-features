export default async function Teams(slug: string) {
  return await (
    await fetch(
      `${BACKEND_BRANCHES[await backendBranch.getValue()]}/fandub/${slug}`
    )
  ).json();
}

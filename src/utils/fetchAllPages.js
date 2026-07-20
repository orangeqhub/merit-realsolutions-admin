/** Backend list endpoints cap pageSize at 100. */
export const MAX_PAGE_SIZE = 100;

export async function fetchAllPages(fetchPage, params = {}, pageSize = MAX_PAGE_SIZE) {
  const first = await fetchPage({ ...params, page: 1, pageSize });
  const items = [...(first?.items || [])];
  const totalPages = first?.meta?.totalPages ?? 1;

  for (let page = 2; page <= totalPages; page += 1) {
    const result = await fetchPage({ ...params, page, pageSize });
    items.push(...(result?.items || []));
  }

  return items;
}

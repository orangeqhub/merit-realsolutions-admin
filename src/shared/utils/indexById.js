export function indexById(arr = []) {
  return arr.reduce((acc, item) => {
    if (item?.id) acc[item.id] = item;
    return acc;
  }, {});
}

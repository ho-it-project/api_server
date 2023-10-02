export function cleanCityName(city: string) {
  return city
    .replace(/특별시|광역시|특별자치도|자치도|특별자치시|특별자치구|광역자치시|광역자치구|시/g, '')
    .replace('청', '')
    .replace('상', '')
    .replace('라', '')
    .replace('도', '');
}

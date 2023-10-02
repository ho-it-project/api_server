/**
 * 지역명에서 시, 군, 구를 제거합니다.
 * 띄어쓰기로 구분된 지역명을 받아서, 시, 군, 구를 제거한 지역명을 반환합니다.
 *
 * @example
 * cleanAreaName('서울시 강남구') // '서울강남'
 * cleanAreaName('서울 강남구') // '서울강남'
 * cleanAreaName('천안시 동남구') // '천안동남'
 * cleanAreaName('천안시 서북구') // '천안서북'
 * @param areaName
 *
 * @returns
 */
export function cleanAreaName(areaName: string) {
  return areaName
    .split(' ')
    .map((a) => {
      return a[a.length - 1] === '시' || a[a.length - 1] === '군' || a[a.length - 1] === '구' ? a.slice(0, -1) : a;
    })
    .join('');
}

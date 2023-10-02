import { cleanCityName } from '@common/util/cleanCityName';

describe('cleanCityName', () => {
  it('should return empty string when input is empty string', () => {
    expect(cleanCityName('')).toBe('');
  });

  it('should return 서울 when input is 서울, 서울시, 서울특별시', () => {
    expect(cleanCityName('서울')).toBe('서울');
    expect(cleanCityName('서울시')).toBe('서울');
    expect(cleanCityName('서울특별시')).toBe('서울');
  });

  it('should return xx when input is xx, xx시, xx광역시, xx특별자치도, xx자치도, xx특별자치구, xx광역자치시, xx광역자치구', () => {
    expect(cleanCityName('xx')).toBe('xx');
    expect(cleanCityName('xx시')).toBe('xx');
    expect(cleanCityName('xx광역시')).toBe('xx');
    expect(cleanCityName('xx특별자치도')).toBe('xx');
    expect(cleanCityName('xx자치도')).toBe('xx');
    expect(cleanCityName('xx특별자치구')).toBe('xx');
    expect(cleanCityName('xx광역자치시')).toBe('xx');
    expect(cleanCityName('xx광역자치구')).toBe('xx');
  });

  //충청도
  it('should return 충남 when input is 충청남도', () => {
    expect(cleanCityName('충청남도')).toBe('충남');
  });
  it('should return 충북 when input is 충청북도', () => {
    expect(cleanCityName('충청북도')).toBe('충북');
  });

  //전라도
  it('should return 전남 when input is 전라남도', () => {
    expect(cleanCityName('전라남도')).toBe('전남');
  });
  it('should return 전북 when input is 전라북도', () => {
    expect(cleanCityName('전라북도')).toBe('전북');
  });

  //경상도
  it('should return 경남 when input is 경상남도', () => {
    expect(cleanCityName('경상남도')).toBe('경남');
  });
  it('should return 경북 when input is 경상북도', () => {
    expect(cleanCityName('경상북도')).toBe('경북');
  });

  //경기도
  it('should return 경기 when input is 경기도', () => {
    expect(cleanCityName('경기도')).toBe('경기');
  });
});

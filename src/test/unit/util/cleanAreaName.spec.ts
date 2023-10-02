import { cleanAreaName } from '@common/util/cleanAreaName';

describe('cleanAreaName', () => {
  it('should return empty string when input is empty string', () => {
    expect(cleanAreaName('')).toBe('');
  });

  it('should return xx when input is xx구', () => {
    expect(cleanAreaName('xx구')).toBe('xx');
  });

  it('should return xxoo when input is xx시 oo구', () => {
    expect(cleanAreaName('xx시 oo구')).toBe('xxoo');
  });

  it('should return xx when input is xx군', () => {
    expect(cleanAreaName('xx군')).toBe('xx');
  });

  it('should return 천안동남 when input is 천안시 동남구, 천안 동남, 천안시 동남', () => {
    expect(cleanAreaName('천안시 동남구')).toBe('천안동남');
    expect(cleanAreaName('천안 동남')).toBe('천안동남');
    expect(cleanAreaName('천안시 동남')).toBe('천안동남');
  });
});

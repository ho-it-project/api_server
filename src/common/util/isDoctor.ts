export const isDoctor = (role: string) => {
  return role === 'RESIDENT' || role === 'SPECIALIST';
};

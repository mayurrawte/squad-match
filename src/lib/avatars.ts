const AVATAR_STYLES = [
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'big-ears',
  'big-ears-neutral',
  'big-smile',
  'bottts',
  'croodles',
  'croodles-neutral',
  'fun-emoji',
  'icons',
  'identicon',
  'initials',
  'lorelei',
  'lorelei-neutral',
  'micah',
  'miniavs',
  'open-peeps',
  'personas',
  'pixel-art',
  'pixel-art-neutral',
  'thumbs'
];

export const generateAvatar = (seed?: string): string => {
  const randomSeed = seed || Math.random().toString(36).substring(7);
  const randomStyle = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
  
  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9&size=64`;
};
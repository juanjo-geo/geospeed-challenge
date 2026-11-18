import { getRandomCities } from '@/data/cities';
const want = process.argv[2] || 'Katmandú';
const diff = (process.argv[3] || 'easy') as 'easy';
const found: { seed: number; names: string[] }[] = [];
for (let seed = 1000; seed < 400000 && found.length < 8; seed++) {
  const list = getRandomCities(diff, 13, 'world', seed);
  if (list[0].name === want) found.push({ seed, names: list.map((c) => `${c.name} (${c.country})`) });
}
console.log(JSON.stringify(found, null, 1));

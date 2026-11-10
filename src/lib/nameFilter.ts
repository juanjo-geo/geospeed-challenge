/** Nombres visibles para otros jugadores: la misma lista del servidor (_quiz_name_ok), para avisar antes de guardar */
const RUDE = new Set(('puta puto putas putos mierda mierdas verga vergas malparido malparida hijueputa hijueputas hijoeputa hdp marica maricon ' +
  'maricones pendejo pendeja culero culera chinga chingada chingado cabron cabrona zorra gilipollas polla pene fuck fucking fucker shit ' +
  'bitch cunt dick pussy nigger nigga faggot whore slut asshole bastard nazi hitler').split(' '));

export function nameAllowed(name: string): boolean {
  const words = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/);
  return !words.some((w) => RUDE.has(w));
}

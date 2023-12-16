export function wordToUrl(word: string): string {
  return "#/word/" + encodeURIComponent(word);
}

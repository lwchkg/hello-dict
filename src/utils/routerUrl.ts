export function wordToUrl(word: string): string {
  return "#/word/" + encodeURIComponent(word);
}

export function patternToUrl(term: string): string {
  return "#/search/" + encodeURIComponent(term);
}

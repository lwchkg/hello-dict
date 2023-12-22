export enum DictState {
  uninitialized,
  loading,
  loaded,
  retry,
  permaError,
}

export interface IDictionary {
  findWord(word: string): Promise<string[] | null>;
  getState(): DictState;
  patternMatch(pattern: string): Promise<string[] | null>;
}

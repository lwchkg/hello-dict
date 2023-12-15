/* Forked from https://github.com/thenativeweb/wait-for-signals/ because some of
 * the original API should not be async.
 */
export class WaitForSignals {
  readonly promise: Promise<void>;
  private counter = 0;
  // Use ! because TS cannot recognize the assignment in the promise executor.
  private reject!: (reason: Error) => void;
  private resolve!: () => void;

  constructor(private count: number = 1) {
    this.promise = new Promise((resolve, reject): void => {
      this.reject = reject;
      this.resolve = resolve;

      if (count === 0) resolve();
    });
  }

  fail(reason: Error = new Error("WaitForSignals")) {
    this.reject(reason);
  }

  getCount() {
    return this.counter;
  }

  signal() {
    this.counter++;
    if (this.counter === this.count) this.resolve();
  }
}

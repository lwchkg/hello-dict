type augmentedPromise<T> = Promise<T> & {
  reason: unknown;
  status?: string;
  value?: T;
};

// This is code copied from React official documentation.
// TODO: replace with real implementation when the bug is fixed.
export function reactPromise<T>(promise: Promise<T>): Promise<T> | T {
  const augPromise = promise as augmentedPromise<T>;

  if (augPromise.status === "fulfilled") {
    return augPromise.value!;
  } else if (augPromise.status === "rejected") {
    throw augPromise.reason;
  } else if (augPromise.status === "pending") {
    throw augPromise;
  } else {
    augPromise.status = "pending";
    augPromise.then(
      (result: T) => {
        augPromise.status = "fulfilled";
        augPromise.value = result;
      },
      (reason: unknown) => {
        augPromise.status = "rejected";
        augPromise.reason = reason;
      },
    );
    throw augPromise;
  }
}

export function wait(durationInMs = 500) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), durationInMs);
  });
}

export function getMockService<T>() {
  let resolveService: (response: T) => void = () => {
    throw new Error('Promise not initialized');
  };
  let rejectService: (reason?: string) => void = () => {};
  const promise = new Promise<T>((resolve, reject) => {
    resolveService = resolve;
    rejectService = reject;
  });

  return {
    service: promise,
    resolve: resolveService,
    reject: rejectService,
  };
}

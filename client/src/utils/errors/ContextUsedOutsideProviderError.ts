class ContextUsedOutsideProviderError extends Error {
  constructor(providerName: string, hookName: string) {
    super(`"${hookName}" must be used within "${providerName}"`);
  }
}

export default ContextUsedOutsideProviderError;

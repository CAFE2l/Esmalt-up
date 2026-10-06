/** Next throws this while prerendering a handler that reads the request. It must propagate. */
export function rethrowIfDynamicServerError(error: unknown): void {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
  ) {
    throw error;
  }
}

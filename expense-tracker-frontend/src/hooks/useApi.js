// Deprecated: axios-based hook removed. Use one of:
// - useAPIHook(apiFunction) for generic wrapped calls
// - useStaleWhileRevalidate(endpoint, params, options) for SWR-style fetching

export default function deprecatedUseApi() {
  throw new Error('useApi ist veraltet. Bitte nutze useAPIHook oder useStaleWhileRevalidate.');
}

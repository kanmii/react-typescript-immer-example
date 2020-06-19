/* istanbul ignore file */
import { apiUrlReactEnv } from "./env-variables";

export function getBackendUrls(uri?: string) {
  if (process.env.NODE_ENV === "production") {
    return {
      apiUrl: "/api",
    };
  }

  const apiUrl = uri || process.env[apiUrlReactEnv];

  if (!apiUrl) {
    throw new Error(
      `You must set the "${apiUrlReactEnv}" environment variable`,
    );
  }

  const url = new URL(apiUrl);

  return {
    apiUrl: url.href,
  };
}

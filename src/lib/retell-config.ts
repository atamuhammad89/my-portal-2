/**
 * Retell AI Module Configuration & Feature Flags
 * Server & Client environment flags for controlling Retell capabilities.
 */

export const RETELL_FEATURE_FLAGS = {
  PHONE_NUMBERS: process.env.RETELL_ENABLE_PHONE_NUMBERS !== "false",
  KNOWLEDGE_BASE: process.env.RETELL_ENABLE_KNOWLEDGE_BASE !== "false",
  ANALYTICS: process.env.RETELL_ENABLE_ANALYTICS !== "false",
  TESTING: process.env.RETELL_ENABLE_TESTING !== "false",
  BATCH_CALLS: process.env.RETELL_ENABLE_BATCH_CALLS !== "false",
  VOICES: process.env.RETELL_ENABLE_VOICES !== "false",
  LLMS: process.env.RETELL_ENABLE_LLMS !== "false",
} as const;

export type RetellFeatureKey = keyof typeof RETELL_FEATURE_FLAGS;

export function isFeatureEnabled(featureKey: RetellFeatureKey): boolean {
  return RETELL_FEATURE_FLAGS[featureKey] ?? true;
}

export type FeatureUnavailableResponse = {
  error: "FeatureUnavailable";
  message: string;
  feature: string;
  status: 503;
};

export function createFeatureUnavailableResponse(featureName: string): FeatureUnavailableResponse {
  return {
    error: "FeatureUnavailable",
    message: `The Retell ${featureName} capability is currently disabled or unavailable on this account.`,
    feature: featureName,
    status: 503,
  };
}

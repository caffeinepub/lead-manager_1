// This file is kept for backwards compatibility but is no longer the primary context.
// The main context is now LMSContext.tsx
// Old pages that referenced this have been replaced.

export {
  LMSProvider as LeadsProvider,
  useLMS as useLeadsContext,
} from "./LMSContext";

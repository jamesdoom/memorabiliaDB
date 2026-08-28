export const portfolioReadOnly =
  import.meta.env.VITE_PORTFOLIO_READ_ONLY === "true" ||
  (import.meta.env.PROD &&
    import.meta.env.VITE_PORTFOLIO_READ_ONLY !== "false");

export const portfolioReadOnlyMessage =
  "Public portfolio demo is read-only. You can explore the dashboard, but edits are disabled.";


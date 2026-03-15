# AssetSieve Copilot Instructions (Minimal)

## Hard Rules

- Use function declarations for top-level exports and React components.
- Use descriptive file names. Do not use files named `index.ts` or `index.tsx`.
- Keep tab-specific code inside that tab folder. Put shared code in global `components/`, `hooks/`, or `utils/`.
- Keep UI and logic separate: component renders UI, hook contains non-trivial state/logic.

## Design Bias

- Prefer simple, explicit code.
- Avoid abstractions until a pattern is stable and clearly reused.
- Some duplication is acceptable when it keeps features readable and local.

## Chrome Extension Context

- This is a DevTools panel extension, not a popup.
- Network data comes from `chrome.devtools.network`.
- Processing/export happens client-side.

## Feature Work Checklist

1. Decide scope: shared vs tab-specific.
2. Add/adjust component + hook + styles only where needed.
3. Follow existing patterns in the closest similar tab.
4. Keep changes small and easy to reason about.

# Code checking

Ask me to check the result when you are done, instead of running all kinds of commands for building and running tests.

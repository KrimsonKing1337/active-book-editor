# activeBook coding conventions

Follow these conventions in all new code and refactors in this repository.

- Prefer small, sequential operations over dense expressions. Name intermediate values when that clarifies intent.
- Avoid nested ternaries and multi-step logic inside one expression. Use `if` / `else` for complex conditions.
- Declare event handlers as named functions before JSX; do not write multi-line inline handlers in JSX props.
- Calculate derived labels, descriptions, and other display values before `return`, then render the variables.
- Place JSX element text or expressions on their own line, including short text such as button or span labels.
- Separate sibling JSX elements with a blank line.
- Prefer one component per folder with a matching `index.ts` and barrel exports.
- Keep TypeScript lines within 120 characters where practical.
- In React hook dependency arrays, list data values before functions.

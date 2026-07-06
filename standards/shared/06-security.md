# Security

## Require
- Never bind unsanitized user content to [innerHTML]
- Use Angular sanitization; DomSanitizer only with explicit trust review
- No secrets, tokens, or API keys in client code or Storybook stories
- Auth-sensitive routes guarded; avoid leaking PII in logs

## Flag
- innerHTML with dynamic user input
- bypassSecurityTrust* without documented justification
- console.log of tokens, passwords, or PII
- Client-side-only "security" for authorization

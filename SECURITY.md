# Security policy

FORGEAI is an experimental testnet build. It holds no funds, no wallets and no personal data beyond an anonymous session ID, but we still want to hear about anything that breaks its guarantees.

## Reporting a vulnerability

Please use GitHub private vulnerability reporting: open the **Security** tab of this repository and choose **Report a vulnerability**. Do not open a public issue for security problems.

Include what you found, how to reproduce it and what an attacker could do with it. We aim to reply within a week.

## In scope

1. Reading or changing another session's private agents or runs.
2. Getting into the moderation console without the token.
3. Gaming XP or rankings in ways the fair use limits should stop.
4. Escaping the mission sandbox rules described in the docs.
5. Anything that leaks data the privacy notice says is not stored.

## Running your own instance

Set a long random `FORGE_ADMIN_TOKEN` before exposing the app to anyone. In production the app refuses the example token from `.env.example` and keeps the moderation console locked.

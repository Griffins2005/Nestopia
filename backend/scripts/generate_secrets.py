#!/usr/bin/env python3
"""Print random values for production env vars."""
import secrets

print("# Paste these into Render → Environment if the Blueprint did not generate them")
print(f"SECRET_KEY={secrets.token_urlsafe(48)}")
print(f"SESSION_SECRET_KEY={secrets.token_urlsafe(48)}")

#!/usr/bin/env python3
"""Print random values for Railway / production env vars."""
import secrets

print("# Paste these into Railway → Variables")
print(f"SECRET_KEY={secrets.token_urlsafe(48)}")
print(f"SESSION_SECRET_KEY={secrets.token_urlsafe(48)}")

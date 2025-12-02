# backend/limiter.py
from slowapi import Limiter
from slowapi.util import get_remote_address

# Create the limiter once
limiter = Limiter(key_func=get_remote_address)


import re
from fastapi import HTTPException

ID_REGEX = re.compile(r"^[a-z][a-z0-9_]{2,49}$")

def validate_id(value: str):
    if not ID_REGEX.match(value):
        raise HTTPException(
            status_code=400,
            detail="Invalid ID format. Use lowercase letters, numbers, underscores."
        )

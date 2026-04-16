def get_next_version(latest_version: str | None) -> str:
    """
    Auto-increment semantic-like simple version:
    None -> 1.0.0
    1.0.0 -> 1.0.1
    1.0.9 -> 1.0.10
    """
    if not latest_version:
        return "1.0.0"

    try:
        parts = latest_version.split(".")
        major, minor, patch = map(int, parts)
        patch += 1
        return f"{major}.{minor}.{patch}"
    except Exception:
        return "1.0.0"
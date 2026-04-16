from app.database.session import Base, engine


def init_db():
    """Initialize database tables (if needed for local development)."""
    Base.metadata.create_all(bind=engine)

from app.db.session import Base
# Import all models here so that Alembic's autogenerate can detect them
import app.db.models  # noqa: F401

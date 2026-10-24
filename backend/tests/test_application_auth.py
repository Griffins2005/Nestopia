import os
import unittest
from datetime import datetime

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "test-secret-key-must-be-at-least-32-chars")
os.environ.setdefault("SESSION_SECRET_KEY", "test-session-key-must-be-at-least-32-chars")

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
import app.db.models  # noqa: F401
from app.db.models import Listing, RentalApplication, User
from app.utils.application_helpers import (
    create_application_from_contact,
    get_application_detail,
    landlord_accept,
)


def _session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()


def _user(db, email, role):
    user = User(email=email, role=role, auth_method="email", name=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _listing(db, landlord):
    listing = Listing(
        landlord_id=landlord.id,
        title="Room",
        location="Cornell",
        rent_price=700,
        property_type="Room",
        bedrooms=1,
        bathrooms=1,
        available_from="2027-08-01",
        max_occupants=1,
        amenities=[],
        building_features=[],
        tenant_preferences=[],
        created_at=datetime.utcnow(),
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


class ApplicationAuthTests(unittest.TestCase):
    def setUp(self):
        self.db = _session()
        self.landlord = _user(self.db, "host@example.com", "landlord")
        self.other_landlord = _user(self.db, "other@example.com", "landlord")
        self.renter = _user(self.db, "renter@example.com", "renter")
        self.stranger = _user(self.db, "stranger@example.com", "renter")
        self.listing = _listing(self.db, self.landlord)

    def tearDown(self):
        self.db.close()

    def test_landlord_cannot_apply_as_a_tenant(self):
        with self.assertRaises(HTTPException) as raised:
            create_application_from_contact(self.db, self.landlord, self.listing.id)
        self.assertEqual(raised.exception.status_code, 403)

    def test_other_landlord_cannot_accept(self):
        app = RentalApplication(
            listing_id=self.listing.id,
            tenant_id=self.renter.id,
            landlord_id=self.landlord.id,
            status="pending",
        )
        self.db.add(app)
        self.db.commit()
        with self.assertRaises(HTTPException) as raised:
            landlord_accept(self.db, self.other_landlord, app.id)
        self.assertEqual(raised.exception.status_code, 403)

    def test_stranger_cannot_read_application(self):
        app = RentalApplication(
            listing_id=self.listing.id,
            tenant_id=self.renter.id,
            landlord_id=self.landlord.id,
            status="pending",
        )
        self.db.add(app)
        self.db.commit()
        with self.assertRaises(HTTPException) as raised:
            get_application_detail(self.db, self.stranger, app.id)
        self.assertEqual(raised.exception.status_code, 403)

    def test_owning_landlord_can_accept_pending_application(self):
        app = RentalApplication(
            listing_id=self.listing.id,
            tenant_id=self.renter.id,
            landlord_id=self.landlord.id,
            status="pending",
        )
        self.db.add(app)
        self.db.commit()
        accepted = landlord_accept(self.db, self.landlord, app.id)
        self.assertEqual(accepted.status, "awaiting_tenant")


if __name__ == "__main__":
    unittest.main()

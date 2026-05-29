from datetime import date, datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.db.models import (
    Listing,
    ListingOccupant,
    ProfileReview,
    RentalApplication,
    TourRequest,
    User,
)

OPEN_STATUSES = {"pending", "awaiting_tenant", "awaiting_move_in", "scheduled", "active"}


def _user_name(user: Optional[User]) -> str:
    return (user.name if user and user.name else "Member").strip() or "Member"


def activate_due_applications(db: Session, user: User) -> None:
    today = date.today()
    apps = (
        db.query(RentalApplication)
        .filter(
            RentalApplication.status == "scheduled",
            RentalApplication.move_in_date.isnot(None),
            RentalApplication.move_in_date <= today,
        )
        .all()
    )
    for app in apps:
        app.status = "active"
        app.updated_at = datetime.utcnow()
        exists = (
            db.query(ListingOccupant)
            .filter(
                ListingOccupant.listing_id == app.listing_id,
                ListingOccupant.user_id == app.tenant_id,
            )
            .first()
        )
        if not exists:
            db.add(
                ListingOccupant(
                    listing_id=app.listing_id,
                    user_id=app.tenant_id,
                    application_id=app.id,
                    move_in_date=app.move_in_date,
                )
            )
    if apps:
        db.commit()


def _get_application_or_404(db: Session, app_id: int) -> RentalApplication:
    app = (
        db.query(RentalApplication)
        .options(
            joinedload(RentalApplication.listing),
            joinedload(RentalApplication.tenant),
            joinedload(RentalApplication.landlord),
            joinedload(RentalApplication.tours),
        )
        .filter(RentalApplication.id == app_id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


def create_application_from_contact(db: Session, tenant: User, listing_id: int) -> RentalApplication:
    if tenant.role != "renter":
        raise HTTPException(status_code=403, detail="Only tenants can apply to listings.")

    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.landlord_id == tenant.id:
        raise HTTPException(status_code=400, detail="You can't apply to your own listing.")

    existing = (
        db.query(RentalApplication)
        .filter(
            RentalApplication.listing_id == listing_id,
            RentalApplication.tenant_id == tenant.id,
            RentalApplication.status.in_(OPEN_STATUSES),
        )
        .first()
    )
    if existing:
        return existing

    app = RentalApplication(
        listing_id=listing_id,
        tenant_id=tenant.id,
        landlord_id=listing.landlord_id,
        status="pending",
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return _get_application_or_404(db, app.id)


def serialize_application(app: RentalApplication, viewer: User) -> dict:
    listing = app.listing
    tenant = app.tenant
    landlord = app.landlord
    pending_tour = next((t for t in (app.tours or []) if t.status == "pending"), None)

    return {
        "id": app.id,
        "listing_id": app.listing_id,
        "listing_title": listing.title if listing else "",
        "tenant_id": app.tenant_id,
        "tenant_name": _user_name(tenant),
        "landlord_id": app.landlord_id,
        "landlord_name": _user_name(landlord),
        "status": app.status,
        "move_in_date": app.move_in_date.isoformat() if app.move_in_date else None,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
        "pending_tour": serialize_tour(pending_tour) if pending_tour else None,
        "is_tenant": viewer.id == app.tenant_id,
        "is_landlord": viewer.id == app.landlord_id,
    }


def serialize_tour(tour: Optional[TourRequest]) -> Optional[dict]:
    if not tour:
        return None
    return {
        "id": tour.id,
        "application_id": tour.application_id,
        "proposed_by_id": tour.proposed_by_id,
        "scheduled_at": tour.scheduled_at,
        "status": tour.status,
        "created_at": tour.created_at,
    }


def _activity_item(kind: str, title: str, subtitle: str, at: datetime, icon: str, application_id: Optional[int] = None) -> dict:
    return {
        "kind": kind,
        "title": title,
        "subtitle": subtitle,
        "at": at,
        "icon": icon,
        "application_id": application_id,
    }


def build_activity_feed(db: Session, user: User) -> List[dict]:
    items: List[dict] = []
    is_landlord = user.role == "landlord"

    if is_landlord:
        apps = (
            db.query(RentalApplication)
            .options(joinedload(RentalApplication.listing), joinedload(RentalApplication.tenant))
            .filter(RentalApplication.landlord_id == user.id)
            .order_by(RentalApplication.updated_at.desc())
            .limit(30)
            .all()
        )
        for app in apps:
            listing_title = app.listing.title if app.listing else "Listing"
            tenant_name = _user_name(app.tenant)
            if app.status == "pending":
                items.append(_activity_item(
                    "application_received", "New application received",
                    f"{listing_title} — from {tenant_name}", app.created_at, "file-signature", app.id,
                ))
            elif app.status == "awaiting_tenant":
                items.append(_activity_item(
                    "awaiting_tenant", "Awaiting tenant confirmation",
                    listing_title, app.updated_at, "file-signature", app.id,
                ))
            elif app.status == "awaiting_move_in":
                items.append(_activity_item(
                    "awaiting_move_in", "Set move-in date",
                    f"{listing_title} — {tenant_name} confirmed", app.updated_at, "calendar", app.id,
                ))
            elif app.status in {"scheduled", "active"}:
                move_label = app.move_in_date.strftime("%b %d, %Y") if app.move_in_date else "TBD"
                items.append(_activity_item(
                    "move_in_set", "Tenant scheduled to move in",
                    f"{listing_title} — {move_label}", app.updated_at, "calendar-check", app.id,
                ))
            elif app.status == "rejected":
                items.append(_activity_item(
                    "application_rejected", "Application declined",
                    f"{listing_title} — {tenant_name}", app.updated_at, "file-signature", app.id,
                ))
            elif app.status == "withdrawn":
                items.append(_activity_item(
                    "application_withdrawn", "Application withdrawn",
                    f"{listing_title} — {tenant_name}", app.updated_at, "file-signature", app.id,
                ))
    else:
        apps = (
            db.query(RentalApplication)
            .options(joinedload(RentalApplication.listing), joinedload(RentalApplication.landlord))
            .filter(RentalApplication.tenant_id == user.id)
            .order_by(RentalApplication.updated_at.desc())
            .limit(30)
            .all()
        )
        for app in apps:
            listing_title = app.listing.title if app.listing else "Listing"
            if app.status == "pending":
                items.append(_activity_item(
                    "application_submitted", "Application submitted",
                    listing_title, app.created_at, "file-signature", app.id,
                ))
            elif app.status == "awaiting_tenant":
                items.append(_activity_item(
                    "landlord_accepted", "Host accepted your application",
                    f"{listing_title} — confirm to continue", app.updated_at, "circle-check", app.id,
                ))
            elif app.status == "awaiting_move_in":
                items.append(_activity_item(
                    "awaiting_move_in", "Waiting for move-in date",
                    listing_title, app.updated_at, "calendar", app.id,
                ))
            elif app.status in {"scheduled", "active"}:
                move_label = app.move_in_date.strftime("%b %d, %Y") if app.move_in_date else "TBD"
                items.append(_activity_item(
                    "move_in_set", "Move-in scheduled",
                    f"{listing_title} — {move_label}", app.updated_at, "calendar-check", app.id,
                ))
            elif app.status == "rejected":
                items.append(_activity_item(
                    "application_rejected", "Application declined",
                    listing_title, app.updated_at, "file-signature", app.id,
                ))

    tours = (
        db.query(TourRequest)
        .join(RentalApplication)
        .options(joinedload(TourRequest.application).joinedload(RentalApplication.listing))
        .filter(
            TourRequest.status == "pending",
            (RentalApplication.tenant_id == user.id) | (RentalApplication.landlord_id == user.id),
            TourRequest.proposed_by_id != user.id,
        )
        .order_by(TourRequest.created_at.desc())
        .limit(10)
        .all()
    )
    for tour in tours:
        listing_title = tour.application.listing.title if tour.application and tour.application.listing else "Listing"
        when = tour.scheduled_at.strftime("%a %b %d, %I:%M %p")
        items.append(_activity_item(
            "tour_proposed", "Tour proposed",
            f"{listing_title} — {when}", tour.created_at, "calendar", tour.application_id,
        ))

    accepted_tours = (
        db.query(TourRequest)
        .join(RentalApplication)
        .options(joinedload(TourRequest.application).joinedload(RentalApplication.listing))
        .filter(
            TourRequest.status == "accepted",
            (RentalApplication.tenant_id == user.id) | (RentalApplication.landlord_id == user.id),
        )
        .order_by(TourRequest.created_at.desc())
        .limit(5)
        .all()
    )
    for tour in accepted_tours:
        listing_title = tour.application.listing.title if tour.application and tour.application.listing else "Listing"
        when = tour.scheduled_at.strftime("%a %b %d, %I:%M %p")
        items.append(_activity_item(
            "tour_scheduled", "Tour scheduled",
            f"{listing_title} — {when}", tour.scheduled_at, "calendar-check", tour.application_id,
        ))

    reviews = (
        db.query(ProfileReview)
        .options(joinedload(ProfileReview.reviewer))
        .filter(ProfileReview.reviewee_id == user.id)
        .order_by(ProfileReview.created_at.desc())
        .limit(5)
        .all()
    )
    for review in reviews:
        reviewer = _user_name(review.reviewer)
        items.append(_activity_item(
            "review_received", f"You received a {review.rating}-star review",
            f"from {reviewer}", review.created_at, "star",
        ))

    items.sort(key=lambda x: x["at"], reverse=True)
    return items[:25]


def get_applications_for_user(db: Session, user: User) -> List[dict]:
    if user.role == "landlord":
        apps = (
            db.query(RentalApplication)
            .options(
                joinedload(RentalApplication.listing),
                joinedload(RentalApplication.tenant),
                joinedload(RentalApplication.landlord),
                joinedload(RentalApplication.tours),
            )
            .filter(RentalApplication.landlord_id == user.id)
            .order_by(RentalApplication.updated_at.desc())
            .limit(20)
            .all()
        )
    else:
        apps = (
            db.query(RentalApplication)
            .options(
                joinedload(RentalApplication.listing),
                joinedload(RentalApplication.tenant),
                joinedload(RentalApplication.landlord),
                joinedload(RentalApplication.tours),
            )
            .filter(RentalApplication.tenant_id == user.id)
            .order_by(RentalApplication.updated_at.desc())
            .limit(20)
            .all()
        )
    return [serialize_application(a, user) for a in apps]


def withdraw_application(db: Session, user: User, app_id: int) -> RentalApplication:
    app = _get_application_or_404(db, app_id)
    if app.tenant_id != user.id:
        raise HTTPException(status_code=403, detail="Not your application")
    if app.status not in {"pending", "awaiting_tenant"}:
        raise HTTPException(status_code=400, detail="This application can no longer be withdrawn")
    app.status = "withdrawn"
    app.updated_at = datetime.utcnow()
    db.commit()
    return _get_application_or_404(db, app.id)


def landlord_reject(db: Session, user: User, app_id: int) -> RentalApplication:
    app = _get_application_or_404(db, app_id)
    if app.landlord_id != user.id:
        raise HTTPException(status_code=403, detail="Not your listing application")
    if app.status != "pending":
        raise HTTPException(status_code=400, detail="Application is not pending review")
    app.status = "rejected"
    app.updated_at = datetime.utcnow()
    db.commit()
    return _get_application_or_404(db, app.id)


def landlord_accept(db: Session, user: User, app_id: int) -> RentalApplication:
    app = _get_application_or_404(db, app_id)
    if app.landlord_id != user.id:
        raise HTTPException(status_code=403, detail="Not your listing application")
    if app.status != "pending":
        raise HTTPException(status_code=400, detail="Application is not pending review")
    app.status = "awaiting_tenant"
    app.updated_at = datetime.utcnow()
    db.commit()
    return _get_application_or_404(db, app.id)


def tenant_confirm(db: Session, user: User, app_id: int) -> RentalApplication:
    app = _get_application_or_404(db, app_id)
    if app.tenant_id != user.id:
        raise HTTPException(status_code=403, detail="Not your application")
    if app.status != "awaiting_tenant":
        raise HTTPException(status_code=400, detail="Host has not accepted yet")
    app.status = "awaiting_move_in"
    app.updated_at = datetime.utcnow()
    db.commit()
    return _get_application_or_404(db, app.id)


def set_move_in_date(db: Session, user: User, app_id: int, move_in_date: date) -> RentalApplication:
    app = _get_application_or_404(db, app_id)
    if app.landlord_id != user.id:
        raise HTTPException(status_code=403, detail="Not your listing application")
    if app.status != "awaiting_move_in":
        raise HTTPException(status_code=400, detail="Tenant must confirm before setting move-in")
    if move_in_date < date.today():
        raise HTTPException(status_code=400, detail="Move-in date must be today or later")
    app.move_in_date = move_in_date
    app.status = "scheduled" if move_in_date > date.today() else "active"
    app.updated_at = datetime.utcnow()
    if app.status == "active":
        db.add(
            ListingOccupant(
                listing_id=app.listing_id,
                user_id=app.tenant_id,
                application_id=app.id,
                move_in_date=move_in_date,
            )
        )
    db.commit()
    return _get_application_or_404(db, app.id)


def propose_tour(db: Session, user: User, app_id: int, scheduled_at: datetime) -> TourRequest:
    app = _get_application_or_404(db, app_id)
    if user.id not in {app.tenant_id, app.landlord_id}:
        raise HTTPException(status_code=403, detail="Not part of this application")
    if app.status in {"withdrawn", "rejected"}:
        raise HTTPException(status_code=400, detail="Application is closed")
    pending = next((t for t in app.tours if t.status == "pending"), None)
    if pending:
        raise HTTPException(status_code=400, detail="A tour is already pending approval")
    if scheduled_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Tour must be scheduled in the future")

    tour = TourRequest(
        application_id=app.id,
        proposed_by_id=user.id,
        scheduled_at=scheduled_at,
        status="pending",
    )
    db.add(tour)
    app.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(tour)
    return tour


def respond_tour(db: Session, user: User, tour_id: int, accept: bool) -> TourRequest:
    tour = (
        db.query(TourRequest)
        .options(joinedload(TourRequest.application))
        .filter(TourRequest.id == tour_id)
        .first()
    )
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    app = tour.application
    if user.id not in {app.tenant_id, app.landlord_id}:
        raise HTTPException(status_code=403, detail="Not part of this application")
    if tour.proposed_by_id == user.id:
        raise HTTPException(status_code=400, detail="You can't respond to your own tour proposal")
    if tour.status != "pending":
        raise HTTPException(status_code=400, detail="Tour already responded to")
    tour.status = "accepted" if accept else "rejected"
    app.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(tour)
    return tour


def counter_propose_tour(
    db: Session, user: User, tour_id: int, scheduled_at: datetime
) -> TourRequest:
    tour = (
        db.query(TourRequest)
        .options(joinedload(TourRequest.application))
        .filter(TourRequest.id == tour_id)
        .first()
    )
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    app = tour.application
    if user.id not in {app.tenant_id, app.landlord_id}:
        raise HTTPException(status_code=403, detail="Not part of this application")
    if tour.proposed_by_id == user.id:
        raise HTTPException(status_code=400, detail="You can't respond to your own tour proposal")
    if tour.status != "pending":
        raise HTTPException(status_code=400, detail="Tour already responded to")
    if scheduled_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Tour must be scheduled in the future")

    tour.status = "rejected"
    new_tour = TourRequest(
        application_id=app.id,
        proposed_by_id=user.id,
        scheduled_at=scheduled_at,
        status="pending",
    )
    db.add(new_tour)
    app.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(new_tour)
    return new_tour

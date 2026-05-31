from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.schemas.application import (
    ActivityFeedOut,
    ApplicationCreateIn,
    ApplicationDetailOut,
    ApplicationOut,
    MoveInDateIn,
    TourOut,
    TourProposeIn,
)
from app.utils.application_helpers import (
    activate_due_applications,
    build_activity_feed,
    count_pending_reviews,
    create_application_from_contact,
    get_application_detail,
    get_applications_for_user,
    landlord_accept,
    landlord_approve_lease,
    landlord_reject,
    propose_tour,
    respond_tour,
    counter_propose_tour,
    serialize_application,
    serialize_tour,
    set_move_in_date,
    tenant_confirm,
    withdraw_application,
)

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("/activity", response_model=ActivityFeedOut)
def get_activity(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    activate_due_applications(db, current_user)
    return {
        "activity": build_activity_feed(db, current_user),
        "applications": get_applications_for_user(db, current_user),
        "pending_review_count": count_pending_reviews(db, current_user),
    }


@router.get("/{app_id}", response_model=ApplicationDetailOut)
def get_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_application_detail(db, current_user, app_id)


@router.post("/from-contact", response_model=ApplicationOut)
def apply_from_contact(
    payload: ApplicationCreateIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    app = create_application_from_contact(db, current_user, payload.listing_id)
    return serialize_application(app, current_user)


@router.post("/{app_id}/withdraw", response_model=ApplicationOut)
def withdraw(app_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    app = withdraw_application(db, current_user, app_id)
    return serialize_application(app, current_user)


@router.post("/{app_id}/landlord-accept", response_model=ApplicationOut)
def accept_as_landlord(app_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    app = landlord_accept(db, current_user, app_id)
    return serialize_application(app, current_user)


@router.post("/{app_id}/landlord-reject", response_model=ApplicationOut)
def reject_as_landlord(app_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    app = landlord_reject(db, current_user, app_id)
    return serialize_application(app, current_user)


@router.post("/{app_id}/landlord-approve-lease", response_model=ApplicationOut)
def approve_lease_as_landlord(
    app_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    app = landlord_approve_lease(db, current_user, app_id)
    return serialize_application(app, current_user)


@router.post("/{app_id}/tenant-confirm", response_model=ApplicationOut)
def confirm_as_tenant(app_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    app = tenant_confirm(db, current_user, app_id)
    return serialize_application(app, current_user)


@router.post("/{app_id}/move-in", response_model=ApplicationOut)
def schedule_move_in(
    app_id: int,
    payload: MoveInDateIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    app = set_move_in_date(db, current_user, app_id, payload.move_in_date)
    return serialize_application(app, current_user)


@router.post("/{app_id}/tours", response_model=TourOut)
def schedule_tour(
    app_id: int,
    payload: TourProposeIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    tour = propose_tour(db, current_user, app_id, payload.scheduled_at)
    return serialize_tour(tour)


@router.post("/tours/{tour_id}/accept", response_model=TourOut)
def accept_tour(tour_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    tour = respond_tour(db, current_user, tour_id, accept=True)
    return serialize_tour(tour)


@router.post("/tours/{tour_id}/reject", response_model=TourOut)
def reject_tour(tour_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    tour = respond_tour(db, current_user, tour_id, accept=False)
    return serialize_tour(tour)


@router.post("/tours/{tour_id}/counter", response_model=TourOut)
def counter_tour(
    tour_id: int,
    payload: TourProposeIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    tour = counter_propose_tour(db, current_user, tour_id, payload.scheduled_at)
    return serialize_tour(tour)

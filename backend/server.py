from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import stripe
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize Stripe
stripe.api_key = os.environ['STRIPE_SECRET_KEY']

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = "sierra_explore_secret_key_2025"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Sierra Explore API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Enhanced Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    full_name: str
    phone: Optional[str] = None
    user_type: str = "user"  # user, admin
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserLogin(BaseModel):
    email: str
    password: str

class UserSignup(BaseModel):
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None

class Location(BaseModel):
    district: str  # e.g., "Western Area", "Bo", "Kenema"
    city: str  # e.g., "Freetown", "Bo", "Kenema"
    area: Optional[str] = None  # e.g., "Lumley", "Aberdeen", "Congo Town"
    coordinates: Dict[str, float]  # {"lat": 8.4840, "lng": -13.2299}

class Hotel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    location: Location
    images: List[str]  # Base64 encoded images
    amenities: List[str]
    room_types: List[Dict[str, Any]]
    price_per_night: float
    rating: float = 0.0
    reviews_count: int = 0
    reviews: List[Dict[str, Any]] = []
    available: bool = True
    contact_info: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Car(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    brand: str
    model: str
    year: int
    description: str
    location: Location
    images: List[str]
    features: List[str]
    price_per_day: float
    transmission: str  # "Manual", "Automatic"
    fuel_type: str  # "Petrol", "Diesel"
    seats: int
    available: bool = True
    rating: float = 0.0
    reviews_count: int = 0
    reviews: List[Dict[str, Any]] = []
    contact_info: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    location: Location
    date: datetime
    end_date: Optional[datetime] = None
    images: List[str]
    category: str  # "Cultural", "Music", "Festival", "Sports"
    price: float
    max_attendees: int
    current_attendees: int = 0
    organizer: str
    available: bool = True
    rating: float = 0.0
    reviews_count: int = 0
    reviews: List[Dict[str, Any]] = []
    contact_info: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Tour(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    destinations: List[Location]
    duration_days: int
    images: List[str]
    included: List[str]
    price_per_person: float
    max_group_size: int
    difficulty_level: str  # "Easy", "Moderate", "Challenging"
    tour_type: str  # "Cultural", "Adventure", "Beach", "Historical"
    available: bool = True
    rating: float = 0.0
    reviews_count: int = 0
    reviews: List[Dict[str, Any]] = []
    contact_info: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RealEstate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    location: Location
    property_type: str  # "House", "Apartment", "Land", "Commercial"
    listing_type: str  # "Sale", "Rent"
    price: float
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqm: Optional[float] = None
    images: List[str]
    features: List[str]
    available: bool = True
    contact_info: Dict[str, str]
    rating: float = 0.0
    reviews_count: int = 0
    reviews: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BookingRequest(BaseModel):
    service_type: str  # "hotel", "car", "event", "tour"
    service_id: str
    start_date: str
    end_date: Optional[str] = None
    guests: int = 1
    special_requests: Optional[str] = None

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    service_type: str  # "hotel", "car", "event", "tour"
    service_id: str
    service_name: str
    booking_date: datetime = Field(default_factory=datetime.utcnow)
    start_date: datetime
    end_date: Optional[datetime] = None
    guests: int = 1
    total_price: float
    payment_status: str = "pending"  # "pending", "paid", "refunded"
    payment_intent_id: Optional[str] = None
    stripe_payment_id: Optional[str] = None
    status: str = "confirmed"  # "confirmed", "cancelled"
    special_requests: Optional[str] = None

class PaymentRequest(BaseModel):
    booking_id: str
    amount: float
    currency: str = "usd"

class TripPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_query: str
    destinations: List[str]
    duration_days: int
    budget: Optional[float] = None
    preferences: List[str]
    suggested_hotels: List[str]
    suggested_cars: List[str]
    suggested_tours: List[str]
    suggested_events: List[str]
    total_estimated_cost: float
    itinerary: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Utility Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")

async def verify_admin(user = Depends(verify_token)):
    if user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# AI Trip Planner
async def generate_trip_plan(query: str, destinations: List[str], duration: int, budget: Optional[float] = None) -> TripPlan:
    # Initialize AI chat
    chat = LlmChat(
        api_key=os.environ['OPENAI_API_KEY'],
        session_id=f"trip_plan_{uuid.uuid4()}",
        system_message="""You are an expert Sierra Leone travel assistant. Create detailed trip plans for visitors to Sierra Leone, 
        focusing on authentic experiences, local culture, beautiful beaches, historical sites, and adventure activities. 
        Provide practical recommendations for hotels, transportation, tours, and events specific to Sierra Leone."""
    ).with_model("openai", "gpt-4o-mini")
    
    # Create user message for trip planning
    user_message = UserMessage(
        text=f"""Plan a {duration}-day trip to Sierra Leone with the following details:
        - Destinations: {', '.join(destinations)}
        - Budget: ${budget if budget else 'Not specified'}
        - User query: {query}
        
        Please provide:
        1. A day-by-day itinerary
        2. Recommended accommodation in each location
        3. Transportation suggestions
        4. Must-visit attractions and activities
        5. Cultural experiences and local food
        6. Estimated costs for each activity
        
        Focus on authentic Sierra Leone experiences including beaches like Tokeh and River No. 2, 
        cultural sites in Freetown, Banana Islands, Bunce Island, and local markets."""
    )
    
    # Get AI response
    response = await chat.send_message(user_message)
    
    # Create trip plan object
    trip_plan = TripPlan(
        user_query=query,
        destinations=destinations,
        duration_days=duration,
        budget=budget,
        preferences=[],
        suggested_hotels=[],
        suggested_cars=[],
        suggested_tours=[],
        suggested_events=[],
        total_estimated_cost=budget or 1000,
        itinerary={"ai_generated_plan": response}
    )
    
    return trip_plan

# Routes

# Authentication Routes
@api_router.post("/auth/signup")
async def signup(user_data: UserSignup):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        phone=user_data.phone
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token = create_access_token({"sub": user.id, "email": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "user_type": user.user_type
        }
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    # Check for hardcoded admin credentials
    if login_data.email == "sierraexplorenow@gmail.com" and login_data.password == "Sierraexplore@24":
        # Create or update admin user
        admin_user = await db.users.find_one({"email": login_data.email})
        if not admin_user:
            admin_user = User(
                email=login_data.email,
                password_hash=hash_password(login_data.password),
                full_name="Sierra Explore Admin",
                user_type="admin"
            )
            await db.users.insert_one(admin_user.dict())
        else:
            # Update to admin if not already
            await db.users.update_one(
                {"email": login_data.email}, 
                {"$set": {"user_type": "admin"}}
            )
            admin_user["user_type"] = "admin"
        
        # Create access token
        access_token = create_access_token({"sub": admin_user["id"], "email": admin_user["email"]})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": admin_user["id"],
                "email": admin_user["email"],
                "full_name": admin_user["full_name"],
                "user_type": "admin"
            }
        }
    
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = create_access_token({"sub": user["id"], "email": user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "user_type": user.get("user_type", "user")
        }
    }

# Hotels Routes
@api_router.get("/hotels", response_model=List[Hotel])
async def get_hotels():
    hotels = await db.hotels.find({"available": True}).to_list(100)
    return [Hotel(**hotel) for hotel in hotels]

@api_router.get("/hotels/{hotel_id}", response_model=Hotel)
async def get_hotel(hotel_id: str):
    hotel = await db.hotels.find_one({"id": hotel_id})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return Hotel(**hotel)

@api_router.post("/hotels", response_model=Hotel)
async def create_hotel(hotel: Hotel, admin = Depends(verify_admin)):
    await db.hotels.insert_one(hotel.dict())
    return hotel

@api_router.put("/hotels/{hotel_id}", response_model=Hotel)
async def update_hotel(hotel_id: str, hotel: Hotel, admin = Depends(verify_admin)):
    await db.hotels.update_one({"id": hotel_id}, {"$set": hotel.dict()})
    return hotel

@api_router.delete("/hotels/{hotel_id}")
async def delete_hotel(hotel_id: str, admin = Depends(verify_admin)):
    result = await db.hotels.delete_one({"id": hotel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return {"message": "Hotel deleted successfully"}

# Cars Routes
@api_router.get("/cars", response_model=List[Car])
async def get_cars():
    cars = await db.cars.find({"available": True}).to_list(100)
    return [Car(**car) for car in cars]

@api_router.get("/cars/{car_id}", response_model=Car)
async def get_car(car_id: str):
    car = await db.cars.find_one({"id": car_id})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    return Car(**car)

@api_router.post("/cars", response_model=Car)
async def create_car(car: Car, admin = Depends(verify_admin)):
    await db.cars.insert_one(car.dict())
    return car

@api_router.put("/cars/{car_id}", response_model=Car)
async def update_car(car_id: str, car: Car, admin = Depends(verify_admin)):
    await db.cars.update_one({"id": car_id}, {"$set": car.dict()})
    return car

@api_router.delete("/cars/{car_id}")
async def delete_car(car_id: str, admin = Depends(verify_admin)):
    result = await db.cars.delete_one({"id": car_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Car not found")
    return {"message": "Car deleted successfully"}

# Events Routes
@api_router.get("/events", response_model=List[Event])
async def get_events():
    events = await db.events.find({"available": True}).to_list(100)
    return [Event(**event) for event in events]

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return Event(**event)

@api_router.post("/events", response_model=Event)
async def create_event(event: Event, admin = Depends(verify_admin)):
    await db.events.insert_one(event.dict())
    return event

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event: Event, admin = Depends(verify_admin)):
    await db.events.update_one({"id": event_id}, {"$set": event.dict()})
    return event

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, admin = Depends(verify_admin)):
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# Tours Routes
@api_router.get("/tours", response_model=List[Tour])
async def get_tours():
    tours = await db.tours.find({"available": True}).to_list(100)
    return [Tour(**tour) for tour in tours]

@api_router.get("/tours/{tour_id}", response_model=Tour)
async def get_tour(tour_id: str):
    tour = await db.tours.find_one({"id": tour_id})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    return Tour(**tour)

@api_router.post("/tours", response_model=Tour)
async def create_tour(tour: Tour, admin = Depends(verify_admin)):
    await db.tours.insert_one(tour.dict())
    return tour

@api_router.put("/tours/{tour_id}", response_model=Tour)
async def update_tour(tour_id: str, tour: Tour, admin = Depends(verify_admin)):
    await db.tours.update_one({"id": tour_id}, {"$set": tour.dict()})
    return tour

@api_router.delete("/tours/{tour_id}")
async def delete_tour(tour_id: str, admin = Depends(verify_admin)):
    result = await db.tours.delete_one({"id": tour_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tour not found")
    return {"message": "Tour deleted successfully"}

# Real Estate Routes
@api_router.get("/real-estate", response_model=List[RealEstate])
async def get_real_estate():
    properties = await db.real_estate.find({"available": True}).to_list(100)
    return [RealEstate(**prop) for prop in properties]

@api_router.get("/real-estate/{property_id}", response_model=RealEstate)
async def get_property(property_id: str):
    property = await db.real_estate.find_one({"id": property_id})
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    return RealEstate(**property)

@api_router.post("/real-estate", response_model=RealEstate)
async def create_property(property: RealEstate, admin = Depends(verify_admin)):
    await db.real_estate.insert_one(property.dict())
    return property

@api_router.put("/real-estate/{property_id}", response_model=RealEstate)
async def update_property(property_id: str, property: RealEstate, admin = Depends(verify_admin)):
    await db.real_estate.update_one({"id": property_id}, {"$set": property.dict()})
    return property

@api_router.delete("/real-estate/{property_id}")
async def delete_property(property_id: str, admin = Depends(verify_admin)):
    result = await db.real_estate.delete_one({"id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Property deleted successfully"}

# AI Trip Planner Route
@api_router.post("/ai-trip-planner", response_model=TripPlan)
async def create_trip_plan(
    query: str,
    destinations: List[str],
    duration: int,
    budget: Optional[float] = None
):
    trip_plan = await generate_trip_plan(query, destinations, duration, budget)
    await db.trip_plans.insert_one(trip_plan.dict())
    return trip_plan

# Booking Routes
@api_router.post("/bookings/create", response_model=Booking)
async def create_booking(booking_request: BookingRequest, user = Depends(verify_token)):
    # Get service details
    service_collection = f"{booking_request.service_type}s"
    if booking_request.service_type == "real-estate":
        service_collection = "real_estate"
    
    service = await db[service_collection].find_one({"id": booking_request.service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Calculate total price
    start_date = datetime.fromisoformat(booking_request.start_date)
    end_date = datetime.fromisoformat(booking_request.end_date) if booking_request.end_date else start_date
    
    if booking_request.service_type == "hotel":
        days = (end_date - start_date).days or 1
        total_price = service["price_per_night"] * days * booking_request.guests
    elif booking_request.service_type == "car":
        days = (end_date - start_date).days or 1
        total_price = service["price_per_day"] * days
    elif booking_request.service_type == "event":
        total_price = service["price"] * booking_request.guests
    elif booking_request.service_type == "tour":
        total_price = service["price_per_person"] * booking_request.guests
    else:  # real-estate
        total_price = service["price"]
    
    # Create booking
    booking = Booking(
        user_id=user["id"],
        service_type=booking_request.service_type,
        service_id=booking_request.service_id,
        service_name=service["name"] if "name" in service else service["title"],
        start_date=start_date,
        end_date=end_date,
        guests=booking_request.guests,
        total_price=total_price,
        special_requests=booking_request.special_requests
    )
    
    await db.bookings.insert_one(booking.dict())
    return booking

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str, user = Depends(verify_token)):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user owns this booking or is admin
    if booking["user_id"] != user["id"] and user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return Booking(**booking)

@api_router.get("/my-bookings", response_model=List[Booking])
async def get_my_bookings(user = Depends(verify_token)):
    bookings = await db.bookings.find({"user_id": user["id"]}).to_list(100)
    return [Booking(**booking) for booking in bookings]

@api_router.get("/admin/bookings", response_model=List[Booking])
async def get_all_bookings(admin = Depends(verify_admin)):
    bookings = await db.bookings.find({}).to_list(1000)
    return [Booking(**booking) for booking in bookings]

# Payment Routes
@api_router.post("/payments/create-intent")
async def create_payment_intent(payment_request: PaymentRequest, user = Depends(verify_token)):
    try:
        # Get booking
        booking = await db.bookings.find_one({"id": payment_request.booking_id})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking["user_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Create Stripe payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(payment_request.amount * 100),  # Stripe uses cents
            currency=payment_request.currency,
            metadata={
                "platform": "sierra_explore",
                "booking_id": payment_request.booking_id,
                "user_id": user["id"]
            }
        )
        
        # Update booking with payment intent
        await db.bookings.update_one(
            {"id": payment_request.booking_id},
            {"$set": {"payment_intent_id": intent.id}}
        )
        
        return {"client_secret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/payments/confirm")
async def confirm_payment(payment_intent_id: str, user = Depends(verify_token)):
    try:
        # Retrieve payment intent from Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status == "succeeded":
            # Update booking status
            booking_id = intent.metadata.get("booking_id")
            await db.bookings.update_one(
                {"id": booking_id},
                {"$set": {
                    "payment_status": "paid",
                    "stripe_payment_id": payment_intent_id
                }}
            )
            
            return {"status": "success", "message": "Payment confirmed"}
        else:
            return {"status": "failed", "message": "Payment not completed"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Initialize with comprehensive Sierra Leone sample data
@api_router.post("/admin/init-sample-data")
async def init_sample_data(admin = Depends(verify_admin)):
    # Sierra Leone locations
    freetown_location = Location(
        district="Western Area",
        city="Freetown",
        area="Aberdeen",
        coordinates={"lat": 8.4840, "lng": -13.2299}
    )
    
    lumley_location = Location(
        district="Western Area", 
        city="Freetown",
        area="Lumley",
        coordinates={"lat": 8.4667, "lng": -13.2833}
    )
    
    bo_location = Location(
        district="Bo",
        city="Bo",
        coordinates={"lat": 7.9644, "lng": -11.7383}
    )
    
    kenema_location = Location(
        district="Kenema",
        city="Kenema", 
        coordinates={"lat": 7.8767, "lng": -11.1900}
    )
    
    tokeh_location = Location(
        district="Western Area",
        city="Freetown",
        area="Tokeh",
        coordinates={"lat": 8.3000, "lng": -13.1500}
    )
    
    # Sample Hotels
    sample_hotels = [
        Hotel(
            name="Radisson Blu Mammy Yoko Hotel",
            description="Luxury beachfront hotel in Aberdeen with stunning ocean views, infinity pool, and world-class amenities. Experience the best of Sierra Leone hospitality.",
            location=freetown_location,
            images=[],
            amenities=["WiFi", "Pool", "Restaurant", "Beach Access", "Spa", "Conference Rooms", "Fitness Center", "Room Service"],
            room_types=[
                {"type": "Standard Room", "price": 150, "description": "Comfortable room with city view"},
                {"type": "Ocean View Suite", "price": 250, "description": "Luxury suite with ocean view and balcony"},
                {"type": "Presidential Suite", "price": 400, "description": "Ultimate luxury with panoramic views"}
            ],
            price_per_night=150.0,
            rating=4.5,
            reviews_count=142,
            reviews=[
                {"user": "John D.", "rating": 5, "comment": "Amazing ocean views and excellent service!", "date": "2024-11-15"},
                {"user": "Sarah M.", "rating": 4, "comment": "Beautiful hotel, great location for exploring Freetown", "date": "2024-11-10"}
            ],
            contact_info={"phone": "+232 22 229 600", "email": "info@radissonblu.sl"}
        ),
        Hotel(
            name="Country Lodge Complex",
            description="Comfortable accommodation in the heart of Freetown with traditional Sierra Leonean hospitality and modern amenities.",
            location=freetown_location,
            images=[],
            amenities=["WiFi", "Restaurant", "Parking", "Conference Rooms", "Garden", "Bar"],
            room_types=[
                {"type": "Standard Room", "price": 80, "description": "Cozy room with garden view"},
                {"type": "Deluxe Room", "price": 120, "description": "Spacious room with modern amenities"}
            ],
            price_per_night=80.0,
            rating=4.0,
            reviews_count=89,
            contact_info={"phone": "+232 22 240 918", "email": "reservations@countrylodge.sl"}
        ),
        Hotel(
            name="Tokeh Sands Beach Resort", 
            description="Beachfront paradise on Tokeh Beach with pristine white sand, crystal clear waters, and authentic local cuisine.",
            location=tokeh_location,
            images=[],
            amenities=["Beach Access", "Restaurant", "Bar", "WiFi", "Water Sports", "Local Tours"],
            room_types=[
                {"type": "Beach Bungalow", "price": 120, "description": "Traditional bungalow steps from the beach"},
                {"type": "Ocean Villa", "price": 200, "description": "Luxury villa with private beach access"}
            ],
            price_per_night=120.0,
            rating=4.3,
            reviews_count=67,
            contact_info={"phone": "+232 77 123 456", "email": "info@tokehsands.sl"}
        ),
        Hotel(
            name="Bo Heritage Hotel",
            description="Historic hotel in Bo showcasing Sierra Leone's cultural heritage with modern comfort and traditional charm.",
            location=bo_location,
            images=[],
            amenities=["WiFi", "Restaurant", "Cultural Center", "Parking", "Conference Rooms"],
            room_types=[
                {"type": "Heritage Room", "price": 60, "description": "Room with traditional decor"},
                {"type": "Modern Suite", "price": 90, "description": "Contemporary suite with cultural touches"}
            ],
            price_per_night=60.0,
            rating=3.9,
            reviews_count=45,
            contact_info={"phone": "+232 32 270 123", "email": "reservations@boheritage.sl"}
        )
    ]
    
    # Sample Cars
    sample_cars = [
        Car(
            name="Toyota Landcruiser - Adventure Ready",
            brand="Toyota",
            model="Land Cruiser",
            year=2022,
            description="Perfect for exploring Sierra Leone's diverse terrain. Reliable 4WD vehicle ideal for beach trips to Tokeh, mountain adventures, and city touring.",
            location=freetown_location,
            images=[],
            features=["4WD", "GPS Navigation", "Air Conditioning", "Safety Kit", "Tool Kit", "Spare Tire"],
            price_per_day=85.0,
            transmission="Automatic",
            fuel_type="Diesel",
            seats=7,
            rating=4.6,
            reviews_count=34,
            contact_info={"phone": "+232 77 456 789", "email": "rentals@sierraauto.sl"}
        ),
        Car(
            name="Honda Civic - City Explorer",
            brand="Honda", 
            model="Civic",
            year=2021,
            description="Comfortable and fuel-efficient car perfect for exploring Freetown and nearby attractions. Great for couples and small families.",
            location=freetown_location,
            images=[],
            features=["Air Conditioning", "GPS", "Bluetooth", "USB Charging", "Safety Kit"],
            price_per_day=45.0,
            transmission="Automatic",
            fuel_type="Petrol",
            seats=5,
            rating=4.2,
            reviews_count=78,
            contact_info={"phone": "+232 77 456 789", "email": "rentals@sierraauto.sl"}
        ),
        Car(
            name="Suzuki Jimny - Off-Road Champion",
            brand="Suzuki",
            model="Jimny", 
            year=2023,
            description="Compact 4WD vehicle perfect for adventurous travelers. Ideal for reaching remote beaches and mountain villages.",
            location=bo_location,
            images=[],
            features=["4WD", "Manual Transmission", "Tool Kit", "First Aid Kit", "Compact Size"],
            price_per_day=35.0,
            transmission="Manual",
            fuel_type="Petrol", 
            seats=4,
            rating=4.4,
            reviews_count=23,
            contact_info={"phone": "+232 32 456 123", "email": "rental@bo-cars.sl"}
        )
    ]
    
    # Sample Tours
    sample_tours = [
        Tour(
            name="Banana Islands Paradise Tour",
            description="3-day island hopping adventure to the pristine Banana Islands. Experience untouched beaches, snorkeling, local fishing villages, and Sierra Leone's best-kept secret.",
            destinations=[
                Location(district="Western Area", city="Banana Islands", coordinates={"lat": 8.1667, "lng": -13.0833}),
                freetown_location
            ],
            duration_days=3,
            images=[],
            included=["Boat transfers", "2 nights accommodation", "All meals", "Snorkeling gear", "Local guide", "Village tour"],
            price_per_person=285.0,
            max_group_size=12,
            difficulty_level="Easy",
            tour_type="Beach",
            rating=4.8,
            reviews_count=56,
            contact_info={"phone": "+232 77 888 999", "email": "tours@sierraadventures.sl"}
        ),
        Tour(
            name="Bunce Island Historical Experience",
            description="Half-day tour to Bunce Island, a significant historical site in the transatlantic slave trade. Learn about Sierra Leone's complex history with expert guides.",
            destinations=[
                Location(district="Western Area", city="Bunce Island", coordinates={"lat": 8.6167, "lng": -13.0833}),
                freetown_location
            ],
            duration_days=1,
            images=[],
            included=["Boat transfer", "Expert historian guide", "Lunch", "Museum visit"],
            price_per_person=65.0,
            max_group_size=20,
            difficulty_level="Easy", 
            tour_type="Historical",
            rating=4.7,
            reviews_count=123,
            contact_info={"phone": "+232 77 777 888", "email": "history@sierratours.sl"}
        ),
        Tour(
            name="Freetown Peninsula Cultural Trek", 
            description="5-day cultural immersion through Freetown Peninsula. Visit local communities, learn traditional crafts, enjoy authentic cuisine, and experience real Sierra Leonean culture.",
            destinations=[freetown_location, lumley_location, tokeh_location],
            duration_days=5,
            images=[],
            included=["4 nights accommodation", "All meals", "Cultural workshops", "Local transportation", "Community visits", "Traditional performances"],
            price_per_person=395.0,
            max_group_size=8,
            difficulty_level="Moderate",
            tour_type="Cultural",
            rating=4.9,
            reviews_count=41,
            contact_info={"phone": "+232 77 999 000", "email": "culture@sierraimmersion.sl"}
        )
    ]
    
    # Sample Events
    sample_events = [
        Event(
            name="Freetown Music Festival",
            description="Annual celebration of Sierra Leone's vibrant music scene featuring local and international artists, traditional performances, and modern fusion.",
            location=freetown_location,
            date=datetime(2025, 8, 15, 18, 0),
            end_date=datetime(2025, 8, 17, 23, 0),
            images=[],
            category="Music",
            price=25.0,
            max_attendees=5000,
            current_attendees=1250,
            organizer="Sierra Leone Music Association",
            rating=4.6,
            reviews_count=89,
            contact_info={"phone": "+232 77 111 222", "email": "info@freetownmusic.sl"}
        ),
        Event(
            name="Krio Cultural Festival",
            description="Celebrate Sierra Leone's rich Krio heritage with traditional food, music, dance, and storytelling. A colorful display of local culture and traditions.",
            location=freetown_location,
            date=datetime(2025, 7, 20, 10, 0),
            end_date=datetime(2025, 7, 22, 20, 0),
            images=[],
            category="Cultural",
            price=15.0,
            max_attendees=2000,
            current_attendees=670,
            organizer="Krio Heritage Foundation",
            rating=4.8,
            reviews_count=156,
            contact_info={"phone": "+232 77 333 444", "email": "heritage@krio.sl"}
        ),
        Event(
            name="Tokeh Beach Festival",
            description="Beach celebration with local bands, traditional fishing demonstrations, surfing competitions, and the freshest seafood in Sierra Leone.",
            location=tokeh_location,
            date=datetime(2025, 9, 5, 14, 0),
            end_date=datetime(2025, 9, 7, 22, 0),
            images=[],
            category="Festival",
            price=30.0,
            max_attendees=1500,
            current_attendees=450,
            organizer="Tokeh Community Association",
            rating=4.4,
            reviews_count=67,
            contact_info={"phone": "+232 77 555 666", "email": "festival@tokeh.sl"}
        )
    ]
    
    # Sample Real Estate
    sample_properties = [
        RealEstate(
            title="Luxury Beachfront Villa - Aberdeen",
            description="Stunning 4-bedroom villa with direct beach access, infinity pool, and panoramic ocean views. Perfect for vacation rental or permanent residence.",
            location=freetown_location,
            property_type="House",
            listing_type="Sale",
            price=450000.0,
            bedrooms=4,
            bathrooms=3,
            area_sqm=320.0,
            images=[],
            features=["Beach Access", "Pool", "Garden", "Parking", "Security", "Modern Kitchen", "Ocean Views"],
            contact_info={"phone": "+232 77 123 987", "email": "sales@sierraproperty.sl", "agent": "Mohamed Kamara"}
        ),
        RealEstate(
            title="Modern Apartment - Central Freetown",
            description="Contemporary 2-bedroom apartment in the heart of Freetown. Walking distance to markets, restaurants, and business district.",
            location=freetown_location,
            property_type="Apartment",
            listing_type="Rent",
            price=800.0,  # Monthly rent
            bedrooms=2,
            bathrooms=2,
            area_sqm=95.0,
            images=[],
            features=["Air Conditioning", "WiFi", "Parking", "Security", "City Views", "Modern Appliances"],
            contact_info={"phone": "+232 77 456 321", "email": "rentals@freetownhomes.sl", "agent": "Fatima Sesay"}
        ),
        RealEstate(
            title="Commercial Land - Bo Business District",
            description="Prime commercial land in Bo's growing business district. Perfect for hotel, shopping center, or office complex development.",
            location=bo_location,
            property_type="Land",
            listing_type="Sale",
            price=125000.0,
            area_sqm=2500.0,
            images=[],
            features=["Prime Location", "Commercial Zoning", "Road Access", "Utilities Available", "Development Ready"],
            contact_info={"phone": "+232 32 789 456", "email": "commercial@bo-land.sl", "agent": "Abdul Rahman"}
        )
    ]
    
    # Insert all sample data
    for hotel in sample_hotels:
        await db.hotels.insert_one(hotel.dict())
    
    for car in sample_cars:
        await db.cars.insert_one(car.dict())
    
    for tour in sample_tours:
        await db.tours.insert_one(tour.dict())
    
    for event in sample_events:
        await db.events.insert_one(event.dict())
    
    for property in sample_properties:
        await db.real_estate.insert_one(property.dict())
    
    return {"message": "Comprehensive Sierra Leone sample data initialized successfully"}

# Statistics for admin dashboard
@api_router.get("/admin/stats")
async def get_admin_stats(admin = Depends(verify_admin)):
    hotel_count = await db.hotels.count_documents({"available": True})
    car_count = await db.cars.count_documents({"available": True}) 
    event_count = await db.events.count_documents({"available": True})
    tour_count = await db.tours.count_documents({"available": True})
    property_count = await db.real_estate.count_documents({"available": True})
    user_count = await db.users.count_documents({"user_type": "user"})
    booking_count = await db.bookings.count_documents({})
    
    # Recent bookings
    recent_bookings = await db.bookings.find({}).sort("booking_date", -1).limit(5).to_list(5)
    
    return {
        "hotels": hotel_count,
        "cars": car_count, 
        "events": event_count,
        "tours": tour_count,
        "properties": property_count,
        "users": user_count,
        "bookings": booking_count,
        "recent_bookings": recent_bookings
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
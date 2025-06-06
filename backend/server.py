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

# Models
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
    available: bool = True
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
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    service_type: str  # "hotel", "car", "event", "tour"
    service_id: str
    booking_date: datetime = Field(default_factory=datetime.utcnow)
    start_date: datetime
    end_date: Optional[datetime] = None
    guests: int = 1
    total_price: float
    payment_status: str = "pending"  # "pending", "paid", "refunded"
    payment_intent_id: Optional[str] = None
    status: str = "confirmed"  # "confirmed", "cancelled"

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
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check for admin credentials
    if login_data.email == "admin@sierraexplore.com" and login_data.password == "admin123":
        user["user_type"] = "admin"
        await db.users.update_one({"email": login_data.email}, {"$set": {"user_type": "admin"}})
    
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

# Events Routes
@api_router.get("/events", response_model=List[Event])
async def get_events():
    events = await db.events.find({"available": True}).to_list(100)
    return [Event(**event) for event in events]

@api_router.post("/events", response_model=Event)
async def create_event(event: Event, admin = Depends(verify_admin)):
    await db.events.insert_one(event.dict())
    return event

# Tours Routes
@api_router.get("/tours", response_model=List[Tour])
async def get_tours():
    tours = await db.tours.find({"available": True}).to_list(100)
    return [Tour(**tour) for tour in tours]

@api_router.post("/tours", response_model=Tour)
async def create_tour(tour: Tour, admin = Depends(verify_admin)):
    await db.tours.insert_one(tour.dict())
    return tour

# Real Estate Routes
@api_router.get("/real-estate", response_model=List[RealEstate])
async def get_real_estate():
    properties = await db.real_estate.find({"available": True}).to_list(100)
    return [RealEstate(**prop) for prop in properties]

@api_router.post("/real-estate", response_model=RealEstate)
async def create_property(property: RealEstate, admin = Depends(verify_admin)):
    await db.real_estate.insert_one(property.dict())
    return property

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
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: Booking, user = Depends(verify_token)):
    booking.user_id = user["id"]
    await db.bookings.insert_one(booking.dict())
    return booking

@api_router.get("/my-bookings", response_model=List[Booking])
async def get_my_bookings(user = Depends(verify_token)):
    bookings = await db.bookings.find({"user_id": user["id"]}).to_list(100)
    return [Booking(**booking) for booking in bookings]

# Payment Routes
@api_router.post("/create-payment-intent")
async def create_payment_intent(amount: float, currency: str = "usd"):
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Stripe uses cents
            currency=currency,
            metadata={"platform": "sierra_explore"}
        )
        return {"client_secret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Initialize with sample data
@api_router.post("/admin/init-sample-data")
async def init_sample_data(admin = Depends(verify_admin)):
    # Sample Sierra Leone locations
    freetown_location = Location(
        district="Western Area",
        city="Freetown",
        area="Aberdeen",
        coordinates={"lat": 8.4840, "lng": -13.2299}
    )
    
    bo_location = Location(
        district="Bo",
        city="Bo",
        coordinates={"lat": 7.9644, "lng": -11.7383}
    )
    
    # Sample hotels
    sample_hotels = [
        Hotel(
            name="Radisson Blu Mammy Yoko Hotel",
            description="Luxury beachfront hotel in Aberdeen with stunning ocean views",
            location=freetown_location,
            images=[],
            amenities=["WiFi", "Pool", "Restaurant", "Beach Access", "Spa"],
            room_types=[{"type": "Standard", "price": 150}, {"type": "Suite", "price": 250}],
            price_per_night=150.0,
            rating=4.5
        ),
        Hotel(
            name="Country Lodge Complex",
            description="Comfortable accommodation in the heart of Freetown",
            location=freetown_location,
            images=[],
            amenities=["WiFi", "Restaurant", "Parking", "Conference Rooms"],
            room_types=[{"type": "Standard", "price": 80}, {"type": "Deluxe", "price": 120}],
            price_per_night=80.0,
            rating=4.0
        )
    ]
    
    # Insert sample data
    for hotel in sample_hotels:
        await db.hotels.insert_one(hotel.dict())
    
    return {"message": "Sample data initialized successfully"}

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

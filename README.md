# SmartPantry - Full Stack Food Expiration Tracker

A complete full-stack application that helps you track food expiration dates, reduce waste, and get recipe suggestions based on your pantry items.

## 🏗️ Project Structure

```
smartpantry/
├── frontend/                 # React Native Mobile App
│   ├── src/
│   │   ├── screens/         # Screen components
│   │   ├── services/        # API and notification services
│   │   ├── types/          # TypeScript definitions
│   │   └── components/     # Reusable components
│   ├── package.json
│   └── ...
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── models/         # Database models
│   │   └── core/           # Core functionality
│   ├── main.py
│   └── requirements.txt
└── README.md
```

## 🚀 Features

### Frontend (React Native)
- 🍎 **Food Item Management**: Add, edit, and delete food items with expiration dates
- 📅 **Expiration Tracking**: Get alerts for items expiring soon
- 🍳 **Recipe Suggestions**: Get recipe recommendations based on your expiring ingredients
- 📊 **Waste Analytics**: Track your food waste and potential savings
- 🎨 **Dark Theme**: Beautiful dark UI design
- 📱 **Cross-Platform**: Works on both iOS and Android

### Backend (Python FastAPI)
- 🔐 **User Authentication**: Secure login and registration
- 🗄️ **Database Management**: Store and retrieve food items, recipes, and user data
- 🤖 **AI Recipe Suggestions**: Intelligent recipe recommendations
- 📊 **Analytics Engine**: Food waste tracking and reporting
- 🔔 **Notification System**: Push notifications for expiring items
- 📈 **API Endpoints**: RESTful API for mobile app integration

## 🛠️ Tech Stack

### Frontend
- **React Native**: 0.81.0
- **TypeScript**: For type safety
- **React Native Paper**: UI components
- **Date-fns**: Date manipulation
- **Axios**: HTTP client for API calls
- **AsyncStorage**: Local data persistence

### Backend
- **Python**: 3.8+
- **FastAPI**: Modern, fast web framework
- **SQLAlchemy**: Database ORM
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **JWT**: Authentication tokens
- **Pydantic**: Data validation

## 📋 Prerequisites

### Frontend Development
- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Backend Development
- Python 3.8 or higher
- pip (Python package manager)
- PostgreSQL (for database)
- Redis (for caching)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/smartpantry.git
cd smartpantry
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# iOS Setup (macOS only)
cd ios
pod install
cd ..

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

## 📱 Mobile App Features

### Home Screen
- Overview of expiring items
- Food waste score
- Quick access to add new items

### Pantry View
- Complete inventory management
- Category-based filtering
- Search functionality
- Expiration status tracking

### Recipe Suggestions
- AI-powered recipe recommendations
- Based on expiring ingredients
- Difficulty and time filtering

### Profile
- User settings and preferences
- Notification management
- Usage statistics

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Food Items
- `GET /food-items` - Get all food items
- `POST /food-items` - Create new food item
- `PUT /food-items/{id}` - Update food item
- `DELETE /food-items/{id}` - Delete food item
- `GET /food-items/expiring` - Get expiring items

### Recipes
- `GET /recipes/suggestions` - Get recipe suggestions
- `GET /recipes/{id}` - Get specific recipe
- `POST /recipes` - Create new recipe

### Analytics
- `GET /analytics/waste-report` - Get waste report
- `GET /analytics/waste-history` - Get waste history

## 🗄️ Database Schema

### Users
- id, email, name, password_hash, created_at, updated_at

### Food Items
- id, user_id, name, category, location, quantity, unit, expiration_date, notes, created_at, updated_at

### Recipes
- id, title, ingredients, instructions, prep_time, cook_time, servings, difficulty, created_at

### Waste Reports
- id, user_id, month, total_waste, waste_by_category, savings, items_wasted, created_at

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Formatting
```bash
# Backend
cd backend
black .
isort .

# Frontend
cd frontend
npm run lint
npm run format
```

## 🚀 Deployment

### Backend Deployment
1. Set up a PostgreSQL database
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
1. Build the app for production
2. Deploy to app stores (iOS App Store, Google Play Store)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React Native community
- FastAPI community
- React Native Paper for UI components
- Date-fns for date manipulation utilities

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ for reducing food waste


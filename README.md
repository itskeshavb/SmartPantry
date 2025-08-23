# SmartPantry - Full Stack Food Expiration Tracker

A complete full-stack application powered by **Microsoft Azure** that helps you track food expiration dates, reduce waste, and get recipe suggestions based on your pantry items. Built with React Native + TypeScript frontend and FastAPI backend, fully integrated with Azure cloud services.

## 🏗️ Project Structure

```
food/
├── SmartPantry/              # React Native Mobile App
│   ├── src/
│   │   ├── screens/         # Screen components (Home, Pantry, Recipes, Profile)
│   │   ├── services/        # API and notification services
│   │   ├── types/          # TypeScript definitions
│   │   └── components/     # Reusable components
│   ├── android/            # Android native files
│   ├── ios/               # iOS native files
│   └── package.json
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── api/            # API routes (food items, auth, storage)
│   │   ├── models/         # Database models (Cosmos DB)
│   │   ├── core/           # Azure integrations & auth
│   │   └── services/       # Business logic
│   ├── main.py
│   └── requirements.txt
└── README.md
```

## ☁️ Azure Cloud Integration

This application leverages **multiple Azure services** for a complete cloud-native experience:

### 🔐 **Azure AD B2C** - Authentication & User Management
- Secure user registration and login
- Social media login integration
- Multi-factor authentication support
- JWT token-based authentication

### 🗄️ **Azure Cosmos DB** - NoSQL Database
- High-performance document database
- Global distribution capabilities
- Automatic scaling and partitioning
- Stores food items, user data, and analytics

### 👁️ **Azure Computer Vision** - OCR & Image Analysis
- Extract text from food labels and receipts
- Automatic detection of product names and expiration dates
- Ingredient recognition from food packaging
- Smart image processing for better accuracy

### 📬 **Azure Notification Hubs** - Push Notifications
- Cross-platform push notifications (iOS + Android)
- APNS (Apple Push Notification Service) integration
- FCM (Firebase Cloud Messaging) integration
- Automated expiration alerts and reminders

### 💾 **Azure Blob Storage** - Image Storage
- Secure storage for receipt and food label images
- CDN integration for fast image delivery
- Automatic image optimization and compression
- SAS token-based secure access

### 🚀 **Azure App Service** - Backend Hosting
- Scalable FastAPI application hosting
- Automatic deployment and scaling
- Built-in monitoring and logging
- SSL/TLS encryption

## 🚀 Features

### Frontend (React Native)
- 🍎 **Food Item Management**: Add, edit, and delete food items with expiration dates
- 📷 **Image Upload & OCR**: Take photos of receipts/labels for automatic data extraction
- 📅 **Expiration Tracking**: Get push notifications for items expiring soon
- 🍳 **Recipe Suggestions**: Get recipe recommendations based on your expiring ingredients
- 📊 **Waste Analytics**: Track your food waste and potential savings
- 🎨 **Dark Theme**: Beautiful dark UI design
- 📱 **Cross-Platform**: Works on both iOS and Android
- 🔐 **Azure AD B2C Login**: Secure authentication with social login options

### Backend (Python FastAPI)
- 🔐 **Azure AD B2C Integration**: Secure user authentication and authorization
- 🗄️ **Cosmos DB Operations**: High-performance database operations
- 👁️ **Computer Vision OCR**: Automatic text extraction from images
- 💾 **Blob Storage Management**: Secure image storage and retrieval
- 📬 **Push Notifications**: Automated alerts via Azure Notification Hubs
- 🤖 **AI Recipe Suggestions**: Intelligent recipe recommendations
- 📊 **Analytics Engine**: Food waste tracking and reporting
- 📈 **RESTful API**: Complete API for mobile app integration

## 🛠️ Tech Stack

### Frontend (React Native)
- **React Native**: 0.81.0 - Cross-platform mobile framework
- **TypeScript**: For type safety and better development experience
- **React Native Paper**: Material Design UI components
- **Date-fns**: Date manipulation and formatting
- **Axios**: HTTP client for API calls
- **AsyncStorage**: Local data persistence
- **React Native Image Picker**: Camera and gallery integration
- **React Native Safe Area Context**: Safe area handling

### Backend (FastAPI + Azure)
- **Python**: 3.8+ with FastAPI framework
- **FastAPI**: Modern, fast web framework with automatic API docs
- **Azure Cosmos DB SDK**: Official Azure Cosmos DB client
- **Azure Computer Vision SDK**: Image analysis and OCR capabilities
- **Azure Blob Storage SDK**: File storage and management
- **Azure AD B2C SDK**: Authentication and user management
- **Azure Notification Hubs SDK**: Push notification services
- **Pydantic**: Data validation and serialization
- **Python-JOSE**: JWT token handling
- **Uvicorn**: ASGI server for FastAPI

### Azure Cloud Services
- **Azure AD B2C**: Identity and access management
- **Azure Cosmos DB**: NoSQL document database
- **Azure Computer Vision**: AI-powered image analysis
- **Azure Blob Storage**: Scalable object storage
- **Azure Notification Hubs**: Cross-platform push notifications
- **Azure App Service**: Web application hosting

## 📋 Prerequisites

### Frontend Development
- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Backend Development
- Python 3.8 or higher
- pip (Python package manager)

### Azure Cloud Services Setup
- **Azure Subscription**: Active Azure account
- **Azure AD B2C Tenant**: For user authentication
- **Azure Cosmos DB Account**: NoSQL database instance
- **Azure Computer Vision Resource**: For OCR capabilities
- **Azure Storage Account**: For blob storage
- **Azure Notification Hubs**: For push notifications
- **Azure App Service**: For backend hosting (optional for local dev)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/smartpantry.git
cd smartpantry
```

### 2. Azure Services Configuration

Before running the application, set up these Azure services:

#### Azure AD B2C Setup
1. Create an Azure AD B2C tenant
2. Register your mobile application
3. Configure user flows for sign-up/sign-in
4. Note down: `tenant_name`, `client_id`, `policy_name`

#### Azure Cosmos DB Setup
1. Create a Cosmos DB account (Core SQL API)
2. Create a database named `smartpantry`
3. Create containers: `users`, `food_items`, `waste_reports`
4. Note down: `endpoint_url`, `primary_key`

#### Azure Computer Vision Setup
1. Create a Computer Vision resource
2. Note down: `endpoint`, `subscription_key`

#### Azure Storage Account Setup
1. Create a storage account
2. Create a container named `food-images`
3. Note down: `connection_string`, `account_name`, `account_key`

#### Azure Notification Hubs Setup
1. Create a Notification Hub namespace and hub
2. Configure APNS and FCM credentials
3. Note down: `connection_string`, `hub_name`

### 3. Backend Setup

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

# Create .env file with Azure credentials
cat > .env << EOF
# Azure AD B2C
AZURE_B2C_TENANT_NAME=your-tenant-name
AZURE_B2C_CLIENT_ID=your-client-id
AZURE_B2C_POLICY_NAME=your-policy-name

# Azure Cosmos DB
COSMOS_DB_ENDPOINT=your-cosmos-endpoint
COSMOS_DB_KEY=your-cosmos-key
COSMOS_DB_DATABASE_NAME=smartpantry

# Azure Computer Vision
COMPUTER_VISION_ENDPOINT=your-vision-endpoint
COMPUTER_VISION_KEY=your-vision-key

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=your-storage-connection
AZURE_STORAGE_ACCOUNT_NAME=your-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-account-key

# Azure Notification Hubs
NOTIFICATION_HUB_CONNECTION_STRING=your-hub-connection
NOTIFICATION_HUB_NAME=your-hub-name

# API Configuration
SECRET_KEY=your-jwt-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF

# Start the backend server
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at `http://localhost:8000`
API documentation will be available at `http://localhost:8000/docs`

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd SmartPantry

# Install dependencies
npm install

# iOS Setup (macOS only)
cd ios
pod install
cd ..

# Start Metro bundler (in a separate terminal)
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
- `GET /food-items` - Get all food items from Cosmos DB
- `POST /food-items` - Create new food item in Cosmos DB
- `PUT /food-items/{id}` - Update food item in Cosmos DB
- `DELETE /food-items/{id}` - Delete food item from Cosmos DB
- `GET /food-items/expiring` - Get expiring items with notification triggers

### Image Processing & OCR
- `POST /ocr/extract-receipt` - Upload image and extract text using Azure Computer Vision
- `POST /storage/upload-image` - Upload image to Azure Blob Storage
- `GET /storage/images/{filename}` - Get image from Azure Blob Storage
- `DELETE /storage/images/{filename}` - Delete image from Azure Blob Storage

### Authentication (Azure AD B2C)
- `POST /auth/login` - User login via Azure AD B2C
- `POST /auth/register` - User registration via Azure AD B2C
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user profile

### Notifications
- `POST /notifications/register-device` - Register device token for push notifications
- `POST /notifications/send` - Send push notification via Azure Notification Hubs
- `GET /notifications/test` - Test notification functionality

### Recipes
- `GET /recipes/suggestions` - Get AI-powered recipe suggestions
- `GET /recipes/{id}` - Get specific recipe
- `POST /recipes` - Create new recipe

### Analytics
- `GET /analytics/waste-report` - Get waste report from Cosmos DB
- `GET /analytics/waste-history` - Get waste history and trends

## 🗄️ Database Schema (Azure Cosmos DB)

### Users Collection
```json
{
  "id": "user_uuid",
  "email": "user@example.com",
  "name": "User Name",
  "azure_b2c_id": "azure_user_id",
  "preferences": {
    "notifications_enabled": true,
    "theme": "dark"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Food Items Collection
```json
{
  "id": "item_uuid",
  "user_id": "user_uuid",
  "name": "Milk",
  "category": "dairy",
  "location": "refrigerator",
  "quantity": 1,
  "unit": "liter",
  "purchase_date": "2024-01-01",
  "expiration_date": "2024-01-07",
  "notes": "Organic whole milk",
  "image_url": "https://storage.blob.core.windows.net/...",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Waste Reports Collection
```json
{
  "id": "report_uuid",
  "user_id": "user_uuid",
  "month": "2024-01",
  "total_items": 15,
  "items_consumed": 12,
  "items_wasted": 3,
  "waste_percentage": 20.0,
  "estimated_savings": 15.50,
  "waste_by_category": {
    "dairy": 1,
    "produce": 2
  },
  "created_at": "2024-01-31T00:00:00Z"
}
```

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

### Backend Deployment (Azure App Service)
```bash
# Install Azure CLI
az login

# Create resource group
az group create --name smartpantry-rg --location "East US"

# Create App Service plan
az appservice plan create --name smartpantry-plan --resource-group smartpantry-rg --sku B1 --is-linux

# Create web app
az webapp create --resource-group smartpantry-rg --plan smartpantry-plan --name smartpantry-api --runtime "PYTHON|3.9"

# Configure environment variables
az webapp config appsettings set --resource-group smartpantry-rg --name smartpantry-api --settings \
  COSMOS_DB_ENDPOINT="your-cosmos-endpoint" \
  COSMOS_DB_KEY="your-cosmos-key" \
  COMPUTER_VISION_ENDPOINT="your-vision-endpoint" \
  COMPUTER_VISION_KEY="your-vision-key" \
  AZURE_STORAGE_CONNECTION_STRING="your-storage-connection" \
  NOTIFICATION_HUB_CONNECTION_STRING="your-hub-connection"

# Deploy code
az webapp deployment source config-zip --resource-group smartpantry-rg --name smartpantry-api --src backend.zip
```

### Frontend Deployment
1. **iOS App Store**:
   - Configure signing certificates in Xcode
   - Build for release: `cd ios && xcodebuild -scheme SmartPantry -configuration Release`
   - Upload to App Store Connect

2. **Google Play Store**:
   - Generate signed APK: `cd android && ./gradlew assembleRelease`
   - Upload to Google Play Console

### CI/CD Pipeline (Azure DevOps)
```yaml
# azure-pipelines.yml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

stages:
- stage: Backend
  jobs:
  - job: BackendBuild
    steps:
    - task: UsePythonVersion@0
      inputs:
        versionSpec: '3.9'
    - script: pip install -r backend/requirements.txt
    - task: AzureWebApp@1
      inputs:
        azureSubscription: 'your-subscription'
        appName: 'smartpantry-api'
        package: 'backend'

- stage: Frontend
  jobs:
  - job: AndroidBuild
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '16.x'
    - script: |
        cd SmartPantry
        npm install
        cd android
        ./gradlew assembleRelease
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Microsoft Azure** for comprehensive cloud services
- React Native community for excellent mobile development framework
- FastAPI community for modern Python web framework
- React Native Paper for beautiful Material Design components
- Azure documentation and SDK teams for excellent developer experience

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ for reducing food waste • Powered by **Microsoft Azure** ☁️


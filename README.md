# SmartPantry - Food Expiration Tracker

A React Native mobile application that helps you track food expiration dates, reduce waste, and get recipe suggestions based on your pantry items.

## Features

- 🍎 **Food Item Management**: Add, edit, and delete food items with expiration dates
- 📅 **Expiration Tracking**: Get alerts for items expiring soon
- 🍳 **Recipe Suggestions**: Get recipe recommendations based on your expiring ingredients
- 📊 **Waste Analytics**: Track your food waste and potential savings
- 🎨 **Dark Theme**: Beautiful dark UI design
- 📱 **Cross-Platform**: Works on both iOS and Android

## Screenshots

*Add screenshots here once you have them*

## Tech Stack

- **React Native**: 0.81.0
- **TypeScript**: For type safety
- **React Native Paper**: UI components
- **Date-fns**: Date manipulation
- **Axios**: HTTP client for API calls
- **AsyncStorage**: Local data persistence

## Installation

### Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smartpantry.git
   cd smartpantry
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup** (macOS only)
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Run the app**
   ```bash
   # For Android
   npx react-native run-android
   
   # For iOS (macOS only)
   npx react-native run-ios
   ```

## Project Structure

```
src/
├── screens/           # Screen components
│   ├── HomeScreen.tsx
│   ├── AddItemScreen.tsx
│   ├── PantryViewScreen.tsx
│   ├── RecipeSuggestionsScreen.tsx
│   └── ProfileScreen.tsx
├── services/          # API and notification services
│   ├── api.ts
│   └── notificationService.ts
├── types/            # TypeScript type definitions
│   └── index.ts
└── components/       # Reusable components
```

## Features in Detail

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

## API Integration

The app is designed to work with a backend API for full functionality. Currently, it gracefully handles cases where the backend is not available by providing mock data.

### Backend Features (when available)
- User authentication
- Food item CRUD operations
- Recipe suggestions
- Waste analytics
- Push notifications

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- React Native community
- React Native Paper for UI components
- Date-fns for date manipulation utilities

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ for reducing food waste

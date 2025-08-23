import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddItemScreen from './src/screens/AddItemScreen';
import PantryViewScreen from './src/screens/PantryViewScreen';
import RecipeSuggestionsScreen from './src/screens/RecipeSuggestionsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { User } from './src/types';
import apiService from './src/services/api';

type Screen = 'home' | 'addItem' | 'pantry' | 'recipes' | 'profile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        // Verify token is still valid
        const response = await apiService.getUserProfile();
        if (response.success && response.data) {
          setCurrentUser(response.data);
          setIsAuthenticated(true);
        } else {
          // Token is invalid, remove it
          await AsyncStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (user: User, token: string) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentScreen('home');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      apiService.clearAuthToken();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setCurrentScreen('home');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const renderScreen = () => {
    const navigation = { navigate: setCurrentScreen };
    const route = { params: {} };
    
    switch (currentScreen) {
      case 'home':
        return <HomeScreen navigation={navigation} onLogout={handleLogout} />;
      case 'addItem':
        return <AddItemScreen navigation={navigation} route={route} />;
      case 'pantry':
        return <PantryViewScreen navigation={navigation} />;
      case 'recipes':
        return <RecipeSuggestionsScreen navigation={navigation} />;
      case 'profile':
        return <ProfileScreen navigation={navigation} onLogout={handleLogout} />;
              default:
          return <HomeScreen navigation={navigation} onLogout={handleLogout} />;
    }
  };

  const TabButton = ({ screen, icon, label, isActive }: { 
    screen: Screen; 
    icon: string; 
    label: string; 
    isActive: boolean; 
  }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={() => setCurrentScreen(screen)}
    >
      <Text style={[styles.tabIcon, isActive && styles.activeTabIcon]}>{icon}</Text>
      <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{label}</Text>
    </TouchableOpacity>
  );

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <PaperProvider>
          <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading SmartPantry...</Text>
            </View>
          </SafeAreaView>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <PaperProvider>
          <LoginScreen navigation={{}} onLogin={handleLogin} />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  // Show main app if authenticated
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            {renderScreen()}
          </View>
          
          <View style={styles.tabBar}>
            <TabButton 
              screen="home" 
              icon="🏠" 
              label="Home" 
              isActive={currentScreen === 'home'} 
            />
            <TabButton 
              screen="pantry" 
              icon="🥫" 
              label="Pantry" 
              isActive={currentScreen === 'pantry'} 
            />
            <TabButton 
              screen="recipes" 
              icon="🍳" 
              label="Recipes" 
              isActive={currentScreen === 'recipes'} 
            />
            <TabButton 
              screen="profile" 
              icon="👤" 
              label="Profile" 
              isActive={currentScreen === 'profile'} 
            />
          </View>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTabButton: {
    backgroundColor: '#0f3460',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  activeTabIcon: {
    color: '#e94560',
  },
  tabLabel: {
    fontSize: 12,
    color: '#a8a8a8',
  },
  activeTabLabel: {
    color: '#e94560',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 16,
  },
});

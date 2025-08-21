import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import AddItemScreen from './src/screens/AddItemScreen';
import PantryViewScreen from './src/screens/PantryViewScreen';
import RecipeSuggestionsScreen from './src/screens/RecipeSuggestionsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

type Screen = 'home' | 'addItem' | 'pantry' | 'recipes' | 'profile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const renderScreen = () => {
    const navigation = { navigate: setCurrentScreen };
    const route = { params: {} };
    
    switch (currentScreen) {
      case 'home':
        return <HomeScreen navigation={navigation} />;
      case 'addItem':
        return <AddItemScreen navigation={navigation} route={route} />;
      case 'pantry':
        return <PantryViewScreen navigation={navigation} />;
      case 'recipes':
        return <RecipeSuggestionsScreen navigation={navigation} />;
      case 'profile':
        return <ProfileScreen navigation={navigation} />;
      default:
        return <HomeScreen navigation={navigation} />;
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
});

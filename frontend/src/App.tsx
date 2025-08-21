import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import HomeScreen from './screens/HomeScreen';
import AddItemScreen from './screens/AddItemScreen';
import PantryViewScreen from './screens/PantryViewScreen';
import RecipeSuggestionsScreen from './screens/RecipeSuggestionsScreen';

// Import icons (you'll need to install react-native-vector-icons)
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for the main app flow
function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddItem" 
        component={AddItemScreen}
        options={{ 
          title: 'Add Food Item',
          headerStyle: {
            backgroundColor: '#2196f3',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="PantryView" 
        component={PantryViewScreen}
        options={{ 
          title: 'Pantry View',
          headerStyle: {
            backgroundColor: '#2196f3',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="RecipeSuggestions" 
        component={RecipeSuggestionsScreen}
        options={{ 
          title: 'Recipe Suggestions',
          headerStyle: {
            backgroundColor: '#2196f3',
          },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}

// Tab navigator for the main app
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Pantry') {
            iconName = 'fridge';
          } else if (route.name === 'Recipes') {
            iconName = 'food-variant';
          } else if (route.name === 'Profile') {
            iconName = 'account';
          }

          // You'll need to implement proper icon rendering
          // return <Icon name={iconName} size={size} color={color} />;
          return null; // Placeholder
        },
        tabBarActiveTintColor: '#2196f3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={MainStack} />
      <Tab.Screen name="Pantry" component={PantryViewScreen} />
      <Tab.Screen name="Recipes" component={RecipeSuggestionsScreen} />
      <Tab.Screen name="Profile" component={HomeScreen} /> {/* Placeholder */}
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}




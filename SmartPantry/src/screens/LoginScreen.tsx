import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import apiService from '../services/api';

interface LoginScreenProps {
  navigation: any;
  onLogin: (user: User, token: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        // Verify token is still valid
        const response = await apiService.getUserProfile();
        if (response.success && response.data) {
          setIsAuthenticated(true);
          onLogin(response.data, token);
        } else {
          // Token is invalid, remove it
          await AsyncStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      console.error('Error checking existing auth:', error);
    }
  };

  const handleAzureB2CLogin = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would:
      // 1. Open Azure AD B2C login page in a WebView
      // 2. Handle the authentication flow
      // 3. Get the access token
      // 4. Store the token and user info
      
      // For now, we'll simulate the B2C login process
      Alert.alert(
        'Azure AD B2C Login',
        'This would open the Azure AD B2C login page. For now, we\'ll simulate the login.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setLoading(false),
          },
          {
            text: 'Simulate Login',
            onPress: () => simulateB2CLogin(),
          },
        ]
      );
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login. Please try again.');
      setLoading(false);
    }
  };

  const simulateB2CLogin = async () => {
    try {
      // Simulate B2C authentication
      const mockToken = 'mock_b2c_token_' + Date.now();
      const mockUser: User = {
        id: 'b2c_user_' + Date.now(),
        email: 'user@example.com',
        name: 'B2C User',
        householdId: undefined,
        preferences: {
          notificationDays: 3,
          theme: 'dark',
          units: 'imperial',
        },
      };

      // Store token
      await AsyncStorage.setItem('authToken', mockToken);
      
      // Update API service with token
      apiService.setAuthToken(mockToken);
      
      // Call onLogin callback
      onLogin(mockUser, mockToken);
      
    } catch (error) {
      console.error('Simulated login error:', error);
      Alert.alert('Error', 'Failed to complete login.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      // Create a guest user session
      const guestToken = 'guest_token_' + Date.now();
      const guestUser: User = {
        id: 'guest_' + Date.now(),
        email: 'guest@smartpantry.com',
        name: 'Guest User',
        householdId: undefined,
        preferences: {
          notificationDays: 3,
          theme: 'dark',
          units: 'imperial',
        },
      };

      // Store token
      await AsyncStorage.setItem('authToken', guestToken);
      
      // Update API service with token
      apiService.setAuthToken(guestToken);
      
      // Call onLogin callback
      onLogin(guestUser, guestToken);
      
    } catch (error) {
      console.error('Guest login error:', error);
      Alert.alert('Error', 'Failed to create guest session.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.loadingText}>Loading your pantry...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* App Logo/Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>SmartPantry</Text>
          <Text style={styles.appSubtitle}>Track your food, reduce waste</Text>
        </View>

        {/* Login Card */}
        <Card style={styles.loginCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Welcome to SmartPantry</Title>
            <Paragraph style={styles.cardDescription}>
              Sign in to access your food inventory, track expiration dates, and get recipe suggestions.
            </Paragraph>

            {/* Azure AD B2C Login Button */}
            <Button
              mode="contained"
              onPress={handleAzureB2CLogin}
              style={styles.loginButton}
              buttonColor="#0078d4"
              textColor="#ffffff"
              loading={loading}
              disabled={loading}
            >
              Sign in with Microsoft
            </Button>

            {/* Guest Login Button */}
            <Button
              mode="outlined"
              onPress={handleGuestLogin}
              style={styles.guestButton}
              textColor="#e94560"
              buttonColor="transparent"
              loading={loading}
              disabled={loading}
            >
              Continue as Guest
            </Button>

            {/* Features Preview */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>What you can do:</Text>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📱</Text>
                <Text style={styles.featureText}>Scan receipts and food labels</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📅</Text>
                <Text style={styles.featureText}>Track expiration dates</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🍳</Text>
                <Text style={styles.featureText}>Get recipe suggestions</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureText}>Monitor food waste</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#a8a8a8',
    textAlign: 'center',
  },
  loginCard: {
    backgroundColor: '#16213e',
    elevation: 4,
    marginBottom: 20,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    color: '#a8a8a8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  loginButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  guestButton: {
    marginBottom: 24,
    paddingVertical: 8,
    borderColor: '#e94560',
  },
  featuresContainer: {
    marginTop: 20,
  },
  featuresTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 30,
  },
  featureText: {
    color: '#a8a8a8',
    fontSize: 14,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
});

export default LoginScreen;

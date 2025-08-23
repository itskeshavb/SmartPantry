import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, Avatar, List, Switch } from 'react-native-paper';
import { User } from '../types';
import apiService from '../services/api';

interface ProfileScreenProps {
  navigation: any;
  onLogout?: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation, onLogout }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserProfile();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.logout();
              // Call the onLogout callback to return to login screen
              if (onLogout) {
                onLogout();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const renderProfileHeader = () => (
    <Card style={styles.profileCard}>
      <Card.Content style={styles.profileContent}>
        <Avatar.Text 
          size={80} 
          label={user?.name?.charAt(0) || 'U'} 
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Title style={styles.profileName}>{user?.name || 'User Name'}</Title>
          <Paragraph style={styles.profileEmail}>{user?.email || 'user@example.com'}</Paragraph>
        </View>
      </Card.Content>
    </Card>
  );

  const renderStats = () => (
    <Card style={styles.statsCard}>
      <Card.Content>
        <Title style={styles.cardTitle}>Your Stats</Title>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Items Tracked</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Waste Saved</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Recipes Made</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderSettings = () => (
    <Card style={styles.settingsCard}>
      <Card.Content>
        <Title style={styles.cardTitle}>Settings</Title>
        
        <List.Item
          title="Notifications"
          description="Get alerts for expiring food"
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              color="#e94560"
            />
          )}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
        />
        
        <List.Item
          title="Dark Mode"
          description="Use dark theme"
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              color="#e94560"
            />
          )}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
        />
        
        <List.Item
          title="Edit Profile"
          description="Update your information"
          left={(props) => <List.Icon {...props} icon="account-edit" />}
          onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon!')}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
        />
        
        <List.Item
          title="Help & Support"
          description="Get help and contact support"
          left={(props) => <List.Icon {...props} icon="help-circle" />}
          onPress={() => Alert.alert('Coming Soon', 'Help & Support will be available soon!')}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
        />
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {renderProfileHeader()}
        {renderStats()}
        {renderSettings()}
        
        <View style={styles.logoutContainer}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            textColor="#e94560"
            buttonColor="transparent"
          >
            Logout
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 20,
    backgroundColor: '#16213e',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a8a8a8',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 20,
  },
  profileCard: {
    margin: 16,
    elevation: 2,
    backgroundColor: '#16213e',
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    backgroundColor: '#e94560',
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: '#a8a8a8',
    fontSize: 16,
  },
  statsCard: {
    margin: 16,
    elevation: 2,
    backgroundColor: '#16213e',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
  },
  statLabel: {
    fontSize: 12,
    color: '#a8a8a8',
    marginTop: 4,
  },
  settingsCard: {
    margin: 16,
    elevation: 2,
    backgroundColor: '#16213e',
  },
  listItemTitle: {
    color: '#ffffff',
    fontSize: 16,
  },
  listItemDescription: {
    color: '#a8a8a8',
    fontSize: 14,
  },
  logoutContainer: {
    margin: 16,
    marginBottom: 32,
  },
  logoutButton: {
    borderColor: '#e94560',
    borderWidth: 2,
  },
});

export default ProfileScreen;

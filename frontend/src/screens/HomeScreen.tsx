import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, FAB } from 'react-native-paper';
import { format, differenceInDays } from 'date-fns';
import { FoodItem, FoodWasteReport } from '../types';
import apiService from '../services/api';
import notificationService from '../services/notificationService';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [expiringItems, setExpiringItems] = useState<FoodItem[]>([]);
  const [wasteReport, setWasteReport] = useState<FoodWasteReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      await notificationService.initialize();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [expiringResponse, wasteResponse] = await Promise.all([
        apiService.getExpiringItems(7),
        apiService.getFoodWasteReport(format(new Date(), 'yyyy-MM')),
      ]);

      if (expiringResponse.success) {
        setExpiringItems(expiringResponse.data || []);
      }

      if (wasteResponse.success) {
        setWasteReport(wasteResponse.data || null);
      }
    } catch (error) {
      console.error('Failed to load home data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getExpirationStatus = (expirationDate: string) => {
    const daysUntilExpiration = differenceInDays(new Date(expirationDate), new Date());
    
    if (daysUntilExpiration < 0) {
      return { status: 'expired', color: '#f44336', text: 'Expired' };
    } else if (daysUntilExpiration <= 1) {
      return { status: 'critical', color: '#ff9800', text: 'Expires today' };
    } else if (daysUntilExpiration <= 3) {
      return { status: 'warning', color: '#ffc107', text: `${daysUntilExpiration} days left` };
    } else {
      return { status: 'safe', color: '#4caf50', text: `${daysUntilExpiration} days left` };
    }
  };

  const renderExpiringItem = (item: FoodItem) => {
    const status = getExpirationStatus(item.expirationDate);
    
    return (
      <Card key={item.id} style={styles.itemCard} onPress={() => navigation.navigate('FoodItemDetail', { itemId: item.id })}>
        <Card.Content>
          <View style={styles.itemHeader}>
            <Title style={styles.itemTitle}>{item.name}</Title>
            <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
              <Text style={styles.statusText}>{status.text}</Text>
            </View>
          </View>
          <Paragraph style={styles.itemDetails}>
            {item.quantity} {item.unit} • {item.location} • Expires {format(new Date(item.expirationDate), 'MMM dd')}
          </Paragraph>
        </Card.Content>
      </Card>
    );
  };

  const renderWasteScore = () => {
    if (!wasteReport) return null;

    const scoreColor = wasteReport.wasteScore <= 10 ? '#4caf50' : 
                      wasteReport.wasteScore <= 25 ? '#ffc107' : '#f44336';

    return (
      <Card style={styles.wasteCard}>
        <Card.Content>
          <Title>Food Waste Score</Title>
          <View style={styles.wasteScoreContainer}>
            <Text style={[styles.wasteScore, { color: scoreColor }]}>
              {wasteReport.wasteScore}%
            </Text>
            <Text style={styles.wasteSubtitle}>
              {wasteReport.consumedItems} consumed • {wasteReport.expiredItems} expired
            </Text>
          </View>
          <Text style={styles.savingsText}>
            Potential savings: ${wasteReport.savings.toFixed(2)}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Food Tracker</Text>
          <Text style={styles.headerSubtitle}>Keep your food fresh</Text>
        </View>

        {renderWasteScore()}

        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title>Expiring Soon ({expiringItems.length})</Title>
            {expiringItems.length === 0 ? (
              <Paragraph style={styles.emptyText}>
                No items expiring in the next 7 days! 🎉
              </Paragraph>
            ) : (
              expiringItems.map(renderExpiringItem)
            )}
          </Card.Content>
        </Card>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddItem')}
          >
            <Text style={styles.actionButtonText}>Add Item</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PantryView')}
          >
            <Text style={styles.actionButtonText}>View Pantry</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('RecipeSuggestions')}
          >
            <Text style={styles.actionButtonText}>Recipes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="camera"
        onPress={() => navigation.navigate('AddItem', { useCamera: true })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  wasteCard: {
    margin: 16,
    elevation: 2,
  },
  wasteScoreContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  wasteScore: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  wasteSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  savingsText: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  sectionCard: {
    margin: 16,
    elevation: 2,
  },
  itemCard: {
    marginVertical: 8,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  actionButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#ff5722',
  },
});

export default HomeScreen;


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
           <Title style={styles.cardTitle}>Food Waste Score</Title>
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
          <Text style={styles.headerTitle}>SmartPantry</Text>
          <Text style={styles.headerSubtitle}>Keep your food fresh</Text>
        </View>

                <View style={styles.addItemSection}>
          <TouchableOpacity
            style={styles.addItemButton}
            onPress={() => navigation.navigate('addItem')}
          >
            <Text style={styles.addItemButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Expiring Soon ({expiringItems.length})</Title>
            {expiringItems.length === 0 ? (
              <Paragraph style={styles.emptyText}>
                No items expiring in the next 7 days! 🎉
              </Paragraph>
            ) : (
              expiringItems.map(renderExpiringItem)
            )}
          </Card.Content>
        </Card>

        {renderWasteScore()}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="camera"
        onPress={() => navigation.navigate('addItem')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
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
  wasteCard: {
    margin: 16,
    elevation: 2,
    backgroundColor: '#16213e',
  },
  wasteScoreContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  wasteScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  wasteSubtitle: {
    fontSize: 14,
    color: '#a8a8a8',
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
    backgroundColor: '#16213e',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemCard: {
    marginVertical: 8,
    elevation: 1,
    backgroundColor: '#0f3460',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    flex: 1,
    color: '#ffffff',
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
    color: '#a8a8a8',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#a8a8a8',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  addItemSection: {
    padding: 16,
    alignItems: 'center',
  },
  addItemButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addItemButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#e94560',
  },
});

export default HomeScreen;



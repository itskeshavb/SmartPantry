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
import { Card, Title, Paragraph, Chip, Searchbar, FAB } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { format, differenceInDays } from 'date-fns';
import { FoodItem, FoodCategory, StorageLocation } from '../types';
import apiService from '../services/api';

interface PantryViewScreenProps {
  navigation: any;
}

const PantryViewScreen: React.FC<PantryViewScreenProps> = ({ navigation }) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    loadFoodItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [foodItems, searchQuery, selectedCategory, selectedLocation, showExpired]);

  const loadFoodItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFoodItems(1, 100); // Get all items
      
      if (response.success && response.data) {
        setFoodItems(response.data.items || []);
      }
    } catch (error) {
      console.error('Failed to load food items:', error);
      Alert.alert('Error', 'Failed to load food items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFoodItems();
    setRefreshing(false);
  };

  const filterItems = () => {
    let filtered = [...foodItems];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter(item => item.location === selectedLocation);
    }

    // Expired filter
    if (showExpired) {
      filtered = filtered.filter(item => {
        const daysUntilExpiration = differenceInDays(new Date(item.expirationDate), new Date());
        return daysUntilExpiration < 0;
      });
    }

    setFilteredItems(filtered);
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

  const renderFoodItem = (item: FoodItem) => {
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
            {item.quantity} {item.unit} • {item.location} • {item.category}
          </Paragraph>
          <Paragraph style={styles.itemDate}>
            Expires: {format(new Date(item.expirationDate), 'MMM dd, yyyy')}
          </Paragraph>
          {item.notes && (
            <Paragraph style={styles.itemNotes}>
              Notes: {item.notes}
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderCategoryDropdown = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>Filter by Category</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCategory || 'all'}
          onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}
          style={styles.picker}
          mode="dropdown"
        >
          <Picker.Item label="All Categories" value="all" />
          {Object.values(FoodCategory).map((category) => (
            <Picker.Item 
              key={category} 
              label={category.charAt(0).toUpperCase() + category.slice(1)} 
              value={category} 
            />
          ))}
        </Picker>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity
        style={[styles.actionButton, showExpired && styles.actionButtonActive]}
        onPress={() => setShowExpired(!showExpired)}
      >
        <Text style={[styles.actionButtonText, showExpired && styles.actionButtonTextActive]}>
          {showExpired ? 'Hide Expired' : 'Show Expired'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          setSearchQuery('');
          setSelectedCategory(null);
          setSelectedLocation(null);
          setShowExpired(false);
        }}
      >
        <Text style={styles.actionButtonText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => {
    const totalItems = filteredItems.length;
    const expiredItems = filteredItems.filter(item => {
      const daysUntilExpiration = differenceInDays(new Date(item.expirationDate), new Date());
      return daysUntilExpiration < 0;
    }).length;
    const expiringSoon = filteredItems.filter(item => {
      const daysUntilExpiration = differenceInDays(new Date(item.expirationDate), new Date());
      return daysUntilExpiration >= 0 && daysUntilExpiration <= 3;
    }).length;

    return (
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title style={{ color: '#fff' }}>Pantry Overview</Title>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalItems}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#ff9800' }]}>{expiringSoon}</Text>
              <Text style={styles.statLabel}>Expiring Soon</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#f44336' }]}>{expiredItems}</Text>
              <Text style={styles.statLabel}>Expired</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pantry View</Text>
        <Text style={styles.headerSubtitle}>Organize and track your food</Text>
      </View>

      <Searchbar
        placeholder="Search food items..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {renderStats()}
      {renderCategoryDropdown()}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredItems.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Title style={styles.emptyTitle}>No items found</Title>
              <Paragraph style={styles.emptyText}>
                {searchQuery || selectedCategory || selectedLocation || showExpired
                  ? 'Try adjusting your filters'
                  : 'Add some food items to get started!'}
              </Paragraph>
            </Card.Content>
          </Card>
        ) : (
          filteredItems.map(renderFoodItem)
        )}
      </ScrollView>

      {renderQuickActions()}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddItem')}
      />
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a8a8a8',
    marginTop: 4,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 4, // Reduce bottom margin to bring content closer
  },
  filterLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    marginTop: 8,
    marginBottom: 16, // Reduce bottom margin to close gap with content
  },
  picker: {
    height: 50,
    backgroundColor: 'transparent',
  },
  filterDropdown: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  filterDropdownText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  filterDropdownIcon: {
    color: '#a8a8a8',
    fontSize: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#16213e',
    marginHorizontal: 16,
    marginTop: 8, // Reduce top margin to bring it closer to content
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  actionButton: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonActive: {
    backgroundColor: '#e94560',
  },
  actionButtonText: {
    color: '#a8a8a8',
    fontWeight: '500',
  },
  actionButtonTextActive: {
    color: '#fff',
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
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#a8a8a8',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 80, // Reduce bottom padding to bring content closer to action buttons
  },
  itemCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
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
  itemDate: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 4,
    fontWeight: '500',
  },
  itemNotes: {
    fontSize: 14,
    color: '#a8a8a8',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyCard: {
    margin: 16,
    marginTop: 8, // Reduce top margin to close gap with dropdown
    marginBottom: 50, // Keep bottom margin to bring it closer to action buttons
    elevation: 4, // Increase elevation for more prominence
    backgroundColor: '#16213e',
    minHeight: 120, // Make the card larger
  },
  emptyTitle: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 20, // Make title larger
    fontWeight: 'bold',
    marginBottom: 12, // Add more space below title
  },
  emptyText: {
    textAlign: 'center',
    color: '#a8a8a8',
    fontStyle: 'italic',
    fontSize: 16, // Make text larger
    lineHeight: 24, // Improve readability
    paddingHorizontal: 20, // Add padding for better text layout
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#e94560',
  },
});

export default PantryViewScreen;


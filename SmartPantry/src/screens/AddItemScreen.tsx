import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Chip,
  FAB,
  Portal,
  Modal,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { format, addDays } from 'date-fns';
import { FoodCategory, StorageLocation, OCRResult } from '../types';
import apiService from '../services/api';
import notificationService from '../services/notificationService';


interface AddItemScreenProps {
  navigation: any;
  route: any;
}

const AddItemScreen: React.FC<AddItemScreenProps> = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: FoodCategory.OTHER,
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    expirationDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    quantity: '1',
    unit: 'piece',
    location: StorageLocation.FRIDGE,
    notes: '',
    barcode: '',
  });

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState<'purchase' | 'expiration'>('purchase');

  const { useCamera } = route.params || {};

  useEffect(() => {
    if (useCamera) {
      handleTakePhoto();
    }
  }, [useCamera]);

  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      });

      if (result.assets && result.assets[0] && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        await processImage(uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSelectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      });

      if (result.assets && result.assets[0] && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        await processImage(uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const processImage = async (uri: string) => {
    try {
      setLoading(true);
      const response = await apiService.uploadImage(uri);
      
      if (response.success && response.data) {
        setOcrResults(response.data);
        // Try to extract product name from OCR results
        const productName = extractProductName(response.data);
        if (productName) {
          setFormData(prev => ({ ...prev, name: productName }));
        }
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      Alert.alert('Error', 'Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const extractProductName = (results: OCRResult[]): string => {
    // Simple heuristic to find product name
    const textLines = results.map(r => r.text.toLowerCase());
    
    // Look for common product indicators
    const productIndicators = ['product', 'item', 'brand', 'name'];
    for (const line of textLines) {
      for (const indicator of productIndicators) {
        if (line.includes(indicator)) {
          return results.find(r => r.text.toLowerCase().includes(indicator))?.text || '';
        }
      }
    }
    
    // Return the first line with reasonable length
    const reasonableLines = textLines.filter(line => line.length > 3 && line.length < 50);
    return reasonableLines[0] || '';
  };

  const handleBarcodeScan = (barcode: string) => {
    setFormData(prev => ({ ...prev, barcode }));
    setShowScanner(false);
    // Placeholder for barcode scanning functionality
    Alert.alert('Barcode Scanned', `Barcode: ${barcode}`);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }

    try {
      setLoading(true);
      
      const foodItem = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        imageUrl: imageUri || undefined,
      };

      const response = await apiService.createFoodItem(foodItem);
      
      if (response.success) {
        // Schedule notification for expiration
        await notificationService.scheduleExpirationNotification(
          response.data!,
          3 // Notify 3 days before expiration
        );
        
        const message = response.message || 'Food item added successfully!';
        Alert.alert('Success', message, [
          { text: 'OK', onPress: () => navigation.navigate('home') }
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to add item');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderImageSection = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Product Image</Title>
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <Button onPress={() => setImageUri(null)}>Remove</Button>
          </View>
        ) : (
          <View style={styles.imageButtons}>
            <Button mode="outlined" onPress={handleTakePhoto} style={styles.imageButton}>
              Take Photo
            </Button>
            <Button mode="outlined" onPress={handleSelectImage} style={styles.imageButton}>
              Choose from Gallery
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderOCRResults = () => {
    if (ocrResults.length === 0) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Detected Text</Title>
          {ocrResults.map((result, index) => (
            <Chip key={index} style={styles.ocrChip} onPress={() => setFormData(prev => ({ ...prev, name: result.text }))}>
              {result.text}
            </Chip>
          ))}
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Food Item</Text>
        </View>

        {renderImageSection()}
        {renderOCRResults()}

        <Card style={styles.card}>
          <Card.Content>
            <Title>Item Details</Title>
            
            <TextInput
              label="Product Name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              style={styles.input}
            />

            <TextInput
              label="Barcode"
              value={formData.barcode}
              onChangeText={(text) => setFormData(prev => ({ ...prev, barcode: text }))}
              style={styles.input}
              right={<TextInput.Icon icon="barcode-scan" onPress={() => setShowScanner(true)} />}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Category *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    style={styles.picker}
                    mode="dropdown"
                  >
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

              <View style={styles.halfWidth}>
                <Text style={styles.label}>Storage Location *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.location}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                    style={styles.picker}
                    mode="dropdown"
                  >
                    {Object.values(StorageLocation).map((location) => (
                      <Picker.Item 
                        key={location} 
                        label={location.charAt(0).toUpperCase() + location.slice(1)} 
                        value={location} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Quantity"
                  value={formData.quantity}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: text }))}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Unit</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.unit}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                    style={styles.picker}
                    mode="dropdown"
                  >
                    <Picker.Item label="Piece" value="piece" />
                    <Picker.Item label="Grams" value="grams" />
                    <Picker.Item label="Kilograms" value="kg" />
                    <Picker.Item label="Ounces" value="oz" />
                    <Picker.Item label="Pounds" value="lbs" />
                    <Picker.Item label="Milliliters" value="ml" />
                    <Picker.Item label="Liters" value="l" />
                    <Picker.Item label="Cups" value="cups" />
                    <Picker.Item label="Tablespoons" value="tbsp" />
                    <Picker.Item label="Teaspoons" value="tsp" />
                    <Picker.Item label="Packages" value="packages" />
                    <Picker.Item label="Bottles" value="bottles" />
                    <Picker.Item label="Cans" value="cans" />
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Purchase Date"
                  value={formData.purchaseDate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, purchaseDate: text }))}
                  style={styles.input}
                />
              </View>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Expiration Date"
                  value={formData.expirationDate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, expirationDate: text }))}
                  style={styles.input}
                />
              </View>
            </View>

            <TextInput
              label="Notes (optional)"
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          Add Item
        </Button>
      </ScrollView>

      <Portal>
        <Modal
          visible={showScanner}
          onDismiss={() => setShowScanner(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.scannerPlaceholder}>
            <Text style={styles.scannerText}>Barcode Scanner</Text>
            <Text style={styles.scannerSubtext}>Placeholder for barcode scanning functionality</Text>
            <Button mode="contained" onPress={() => setShowScanner(false)}>
              Close
            </Button>
          </View>
        </Modal>
      </Portal>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  imageButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  ocrChip: {
    marginVertical: 2,
  },
  input: {
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    marginVertical: 8,
  },
  picker: {
    height: 50,
    backgroundColor: 'transparent',
  },
  submitButton: {
    margin: 16,
    paddingVertical: 8,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  scannerPlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  scannerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scannerSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default AddItemScreen;


import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';
import { Button, Card, Title, Paragraph } from 'react-native-paper';

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onBarcodeScanned, onClose }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const devices = useCameraDevices();
  const device = devices.back;

  const [frameProcessor, barcodes] = useScanBarcodes([
    BarcodeFormat.ALL_FORMATS,
  ], {
    checkInverted: true,
  });

  React.useEffect(() => {
    checkPermission();
  }, []);

  React.useEffect(() => {
    if (barcodes && barcodes.length > 0) {
      const barcode = barcodes[0];
      if (barcode.rawValue) {
        onBarcodeScanned(barcode.rawValue);
      }
    }
  }, [barcodes]);

  const checkPermission = async () => {
    const status = await Camera.requestCameraPermission();
    setHasPermission(status === 'granted');
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Camera Permission Required</Title>
            <Paragraph>
              This app needs camera access to scan barcodes. Please grant camera permission.
            </Paragraph>
            <Button mode="contained" onPress={checkPermission} style={styles.button}>
              Grant Permission
            </Button>
            <Button mode="outlined" onPress={onClose} style={styles.button}>
              Cancel
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Camera Not Available</Title>
            <Paragraph>
              Camera is not available on this device.
            </Paragraph>
            <Button mode="outlined" onPress={onClose} style={styles.button}>
              Close
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFillObject}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        frameProcessorFps={5}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <View style={styles.buttonContainer}>
          <Button mode="contained" onPress={onClose} style={styles.button}>
            Cancel
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  card: {
    margin: 20,
    backgroundColor: 'white',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    marginVertical: 5,
    minWidth: 120,
  },
});

export default BarcodeScanner;



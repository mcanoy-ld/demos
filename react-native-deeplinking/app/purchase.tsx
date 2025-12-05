import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function PurchaseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [quantity, setQuantity] = useState('1');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const ticketName = params.name as string;
  const ticketPrice = parseFloat(params.price as string);
  const ticketDuration = params.duration as string;
  const ticketDescription = params.description as string;
  const ticketIcon = params.icon as string;

  const qty = parseInt(quantity) || 1;
  const total = ticketPrice * qty;

  const handlePurchase = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing Information', 'Please fill in your name and email');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    Alert.alert(
      'Purchase Confirmed! 🎉',
      `Thank you ${name}! Your ${qty} ${ticketName}${qty > 1 ? 's' : ''} for $${total.toFixed(2)} has been confirmed. Check your email at ${email} for your tickets.`,
      [
        {
          text: 'Done',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase Ticket</Text>
      </View>

      <View style={styles.ticketPreview}>
        <View style={styles.ticketIconContainer}>
          <Text style={styles.ticketIcon}>{ticketIcon}</Text>
        </View>
        <Text style={styles.ticketName}>{ticketName}</Text>
        <Text style={styles.ticketDuration}>{ticketDuration}</Text>
        <Text style={styles.ticketDescription}>{ticketDescription}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price per ticket:</Text>
          <Text style={styles.price}>${ticketPrice.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="1"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor="#888"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="john@example.com"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={handlePurchase}
          activeOpacity={0.8}
        >
          <Text style={styles.purchaseButtonText}>
            Purchase {qty > 1 ? `${qty} Tickets` : 'Ticket'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1929',
  },
  header: {
    backgroundColor: '#1E3A5F',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#87CEEB',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ticketPreview: {
    backgroundColor: '#1E3A5F',
    margin: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ticketIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E4A6F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketIcon: {
    fontSize: 48,
  },
  ticketName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  ticketDuration: {
    fontSize: 16,
    color: '#87CEEB',
    marginBottom: 8,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#B0C4DE',
    textAlign: 'center',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#B0C4DE',
    marginRight: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2E4A6F',
  },
  totalContainer: {
    backgroundColor: '#1E3A5F',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  purchaseButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});


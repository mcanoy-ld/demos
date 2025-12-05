import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useBoolVariation } from '@launchdarkly/react-native-client-sdk';

interface TicketOption {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  icon: string;
  flagKey: string; // LaunchDarkly flag key for this ticket
}

const ticketOptions: TicketOption[] = [
  {
    id: '1',
    name: 'Full Day Pass',
    price: 89,
    duration: '9:00 AM - 5:00 PM',
    description: 'Access to all lifts and trails',
    icon: '⛷️',
    flagKey: 'full-day-pass',
  },
  {
    id: '2',
    name: 'Half Day Pass',
    price: 59,
    duration: '9:00 AM - 1:00 PM',
    description: 'Morning access to all lifts',
    icon: '🎿',
    flagKey: 'half-day-pass',
  },
  {
    id: '3',
    name: 'Evening Pass',
    price: 45,
    duration: '4:00 PM - 9:00 PM',
    description: 'Night skiing access',
    icon: '🌙',
    flagKey: 'evening-pass',
  },
  {
    id: '4',
    name: 'Multi-Day Pass',
    price: 249,
    duration: '3 Days',
    description: 'Best value for extended stays',
    icon: '🏔️',
    flagKey: 'multi-day-pass',
  },
  {
    id: '5',
    name: 'QA Pass',
    price: 0,
    duration: 'Internal Use Only',
    description: 'For QA and internal testing purposes',
    icon: '🧪',
    flagKey: 'qa-pass',
  },
];

export default function HomeScreen() {
  const router = useRouter();

  // Evaluate LaunchDarkly flags for each ticket option
  // Default to true if flag is not available
  const fullDayPassVisible = useBoolVariation('full-day-pass', true);
  const halfDayPassVisible = useBoolVariation('half-day-pass', true);
  const eveningPassVisible = useBoolVariation('evening-pass', true);
  const multiDayPassVisible = useBoolVariation('multi-day-pass', true);
  const qaPassVisible = useBoolVariation('qa-pass', false); // Default to false - internal only

  const handleSelectTicket = (ticket: TicketOption) => {
    router.push({
      pathname: '/purchase',
      params: {
        id: ticket.id,
        name: ticket.name,
        price: ticket.price.toString(),
        duration: ticket.duration,
        description: ticket.description,
        icon: ticket.icon,
      },
    });
  };

  // Map flag visibility to ticket options
  const flagVisibilityMap: Record<string, boolean> = {
    'full-day-pass': fullDayPassVisible,
    'half-day-pass': halfDayPassVisible,
    'evening-pass': eveningPassVisible,
    'multi-day-pass': multiDayPassVisible,
    'qa-pass': qaPassVisible,
  };

  // Filter tickets based on LaunchDarkly flags
  const visibleTickets = ticketOptions.filter((ticket) => {
    return flagVisibilityMap[ticket.flagKey] !== false;
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏔️ Ski Resort v2.2</Text>
        <Text style={styles.headerSubtitle}>Buy Your Lift Ticket</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Available Tickets</Text>
        
        {visibleTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tickets available at this time.</Text>
          </View>
        ) : (
          visibleTickets.map((ticket) => (
            <TouchableOpacity
              key={ticket.id}
              style={styles.ticketCard}
              onPress={() => handleSelectTicket(ticket)}
              activeOpacity={0.8}
            >
              <View style={styles.ticketIconContainer}>
                <Text style={styles.ticketIcon}>{ticket.icon}</Text>
              </View>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketName}>{ticket.name}</Text>
                <Text style={styles.ticketDuration}>{ticket.duration}</Text>
                <Text style={styles.ticketDescription}>{ticket.description}</Text>
              </View>
              <View style={styles.ticketPriceContainer}>
                <Text style={styles.ticketPrice}>${ticket.price}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#B0C4DE',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  ticketCard: {
    backgroundColor: '#1E3A5F',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  ticketIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2E4A6F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ticketIcon: {
    fontSize: 32,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ticketDuration: {
    fontSize: 14,
    color: '#87CEEB',
    marginBottom: 4,
  },
  ticketDescription: {
    fontSize: 12,
    color: '#B0C4DE',
  },
  ticketPriceContainer: {
    marginLeft: 12,
  },
  ticketPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#B0C4DE',
    textAlign: 'center',
  },
});

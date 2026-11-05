import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';

export default function App() {
  const [speed, setSpeed] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function startLocationTracking() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission was denied');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          const rawSpeed = location.coords.speed;
          if (rawSpeed !== null && rawSpeed > 0) {
            const speedKmh = rawSpeed * 3.6;
            setSpeed(speedKmh);
          } else {
            setSpeed(0);
          }
        }
      );
    }

    startLocationTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : (
        <View style={styles.speedBox}>
          <Text style={styles.speedText}>
            {speed !== null ? Math.round(speed) : '--'}
          </Text>
          <Text style={styles.unitText}>km/h</Text>
        </View>
      )}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedText: {
    fontSize: 96,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  unitText: {
    fontSize: 24,
    color: '#888888',
    marginTop: 8,
  },
  errorText: {
    fontSize: 18,
    color: '#ff5555',
    textAlign: 'center',
    marginHorizontal: 20,
  },
});

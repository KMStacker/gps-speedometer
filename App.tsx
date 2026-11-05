import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { useKeepAwake } from 'expo-keep-awake';

export default function App() {
  useKeepAwake();
  const [speed, setSpeed] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
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
          const rawAccuracy = location.coords.accuracy;

          setAccuracy(rawAccuracy);

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
          <Text style={styles.accuracyText}>
            {accuracy !== null ? `Accuracy: ±${Math.round(accuracy)} m` : 'Searching GPS...'}
          </Text>
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
  accuracyText: {
    fontSize: 14,
    color: '#d4cbcb',
    marginTop: 24,
    fontVariant: ['tabular-nums'],
  },
  errorText: {
    fontSize: 18,
    color: '#ff5555',
    textAlign: 'center',
    marginHorizontal: 20,
  },
});

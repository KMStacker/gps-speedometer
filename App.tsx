import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { useKeepAwake } from 'expo-keep-awake';

function getAccuracyColor(accuracy: number | null): string {
  if (accuracy === null || accuracy > 25) {
    return '#f87171';
  }
  if (accuracy <= 10) {
    return '#4ade80';
  }
  return '#facc15';
}

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
          <Text
            style={styles.speedText}
            numberOfLines={1} 
            adjustsFontSizeToFit
          >
            {speed !== null ? Math.round(speed) : '--'}
          </Text>
          <Text style={styles.unitText}>km/h</Text>
          <View style={styles.accuracyContainer}>
            <View
              style={[
                styles.accuracyDot,
                { backgroundColor: getAccuracyColor(accuracy) },
              ]}
            />
            <Text style={[styles.accuracyText, { color: getAccuracyColor(accuracy) }]}>
              {accuracy !== null ? `Accuracy: ±${Math.round(accuracy)} m` : 'Searching GPS...'}
            </Text>
          </View>
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
    fontSize: 160,
    fontWeight: 'bold',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    lineHeight: 170,
  },
  unitText: {
    fontSize: 24,
    color: '#888888',
    marginTop: 8,
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  accuracyDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  accuracyText: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  errorText: {
    fontSize: 18,
    color: '#ff5555',
    textAlign: 'center',
    marginHorizontal: 20,
  },
});

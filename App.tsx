import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
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

            if (rawAccuracy !== null && rawAccuracy <= 10) {
              setMaxSpeed((prevMax) => Math.max(prevMax, speedKmh));
            }
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

          <View style={styles.statsContainer}>
            <Text style={styles.maxSpeedLabel}>MAX SPEED</Text>
            <Text style={styles.maxSpeedValue}>{Math.round(maxSpeed)} km/h</Text>
            <Pressable
              style={({ pressed }) => [
                styles.resetButton,
                pressed && styles.resetButtonPressed,
              ]}
              onPress={() => setMaxSpeed(0)}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </Pressable>
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
  statsContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  maxSpeedLabel: {
    fontSize: 12,
    color: '#888888',
    letterSpacing: 1.5,
  },
  maxSpeedValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  resetButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  resetButtonPressed: {
    backgroundColor: '#3a3a3a',
  },
  resetButtonText: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#ff5555',
    textAlign: 'center',
    marginHorizontal: 20,
  },
});

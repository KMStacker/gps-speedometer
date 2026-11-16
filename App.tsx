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
  const [speedSum, setSpeedSum] = useState<number>(0);
  const [speedCount, setSpeedCount] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [showMore, setShowMore] = useState<boolean>(false);
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

              if (speedKmh >= 1) {
                setSpeedSum((prevSum) => prevSum + speedKmh);
                setSpeedCount((prevCount) => prevCount + 1);
              }
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

  const avgSpeed = speedCount > 0 ? speedSum / speedCount : 0;

  function handleResetStats() {
    setMaxSpeed(0);
    setSpeedSum(0);
    setSpeedCount(0);
  }

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

          <Pressable
            style={({ pressed }) => [
              styles.toggleButton,
              pressed && styles.toggleButtonPressed,
            ]}
            onPress={() => setShowMore((prev) => !prev)}
          >
            <Text style={styles.toggleButtonText}>
              {showMore ? 'Hide info' : 'Show more'}
            </Text>
          </Pressable>

          {showMore && (
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>MAX SPEED</Text>
                  <Text style={styles.statValue}>{Math.round(maxSpeed)} km/h</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>AVG SPEED</Text>
                  <Text style={styles.statValue}>{Math.round(avgSpeed)} km/h</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.resetButton,
                  pressed && styles.resetButtonPressed,
                ]}
                onPress={handleResetStats}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </Pressable>
            </View>
          )}
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
  toggleButton: {
    marginTop: 32,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333333',
  },
  toggleButtonPressed: {
    backgroundColor: '#2e2e2e',
  },
  toggleButtonText: {
    color: '#aaaaaa',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statsContainer: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#2e2e2e',
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    letterSpacing: 1.5,
  },
  statValue: {
    fontSize: 24,
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

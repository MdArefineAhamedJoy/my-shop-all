import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View } from "react-native";
import { Notice, Text } from "@/components/ui";

export function ProductVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  const { error } = useEvent(player, "statusChange", { status: player.status });
  return (
    <View style={styles.container}>
      <Text style={styles.label}>A closer look</Text>
      {error ? (
        <Notice tone="error">
          The video could not be loaded. Please try again later.
        </Notice>
      ) : (
        <VideoView
          player={player}
          nativeControls
          fullscreenOptions={{ enable: true }}
          style={styles.video}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { marginTop: 24, gap: 14 },
  label: { fontSize: 15, fontWeight: "600" },
  video: { width: "100%", aspectRatio: 16 / 9, borderRadius: 12 },
});

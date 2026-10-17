import AsyncStorage from "@react-native-async-storage/async-storage";

export const storage = {
  async read<T>(
    key: string,
    validate: (value: unknown) => value is T
  ): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    if (!validate(parsed)) throw new Error("Saved data has an invalid format.");
    return parsed;
  },
  async write<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};

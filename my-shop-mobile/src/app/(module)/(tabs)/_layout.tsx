import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader } from "@/components/layout/AppHeader";
import { Icon } from "@/components/ui";
import { AppColors, fonts } from "@/constants";
import { useShop } from "@/hooks/useShop";
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { count, state } = useShop();
  return (
    <Tabs
      screenOptions={{
        header: () => <AppHeader />,
        tabBarActiveTintColor: AppColors.primaryDark,
        tabBarInactiveTintColor: AppColors.secondaryText,
        tabBarStyle: {
          height: 66 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 6 + insets.bottom,
          borderTopColor: AppColors.border,
          backgroundColor: AppColors.white,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 10,
          lineHeight: 15,
        },
        sceneStyle: { backgroundColor: AppColors.white },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? "home" : "home-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? "grid" : "grid-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarBadge: state.wishlist.length || undefined,
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? "heart" : "heart-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Bag",
          tabBarBadge: count || undefined,
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={focused ? "bag-handle" : "bag-handle-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? "person" : "person-outline"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

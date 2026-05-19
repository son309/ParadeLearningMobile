import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../constants/theme";

type BottomNavProps = {
  active: "Home" | "Search" | "Courses" | "Profile";
  onPressHome: () => void;
  onPressSearch: () => void;
  onPressCourses: () => void;
  onPressProfile: () => void;
};

function NavItem({
  label,
  active,
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  icon: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Image
        source={icon}
        style={[
          styles.icon,
          { tintColor: active ? theme.colors.primary : theme.colors.muted },
        ]}
        resizeMode="contain"
      />
      <Text style={[styles.label, active && styles.labelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function BottomNav({
  active,
  onPressHome,
  onPressSearch,
  onPressCourses,
  onPressProfile,
}: BottomNavProps) {
  return (
    <View style={styles.container}>
      <NavItem
        label="Home"
        active={active === "Home"}
        icon={require("../asset/home.png")}
        onPress={onPressHome}
      />
      <NavItem
        label="Search"
        active={active === "Search"}
        icon={require("../asset/search.png")}
        onPress={onPressSearch}
      />
      <NavItem
        label="Courses"
        active={active === "Courses"}
        icon={require("../asset/graduation.png")}
        onPress={onPressCourses}
      />
      <NavItem
        label="Profile"
        active={active === "Profile"}
        icon={require("../asset/user (1).png")}
        onPress={onPressProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  item: {
    alignItems: "center",
    paddingVertical: 6,
    flex: 1,
  },
  icon: {
    width: 24,
    height: 24,
  },
  label: {
    marginTop: 2,
    fontSize: 10,
    color: theme.colors.muted,
  },
  labelActive: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
});

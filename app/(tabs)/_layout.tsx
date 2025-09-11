/**
 * Tabs Layout
 * 主應用 Tab 導航設置
 */

import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="discover"
        options={{
          title: '探索',
          tabBarIcon: () => null, // Will add icons later
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: '配對',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '消息',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}
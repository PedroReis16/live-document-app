const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DocumentStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DocumentList" component={DocumentListScreen} />
      <Stack.Screen name="DocumentEdit" component={DocumentEditScreen} />
      <Stack.Screen name="DocumentView" component={DocumentViewScreen} />
      <Stack.Screen name="Share" component={ShareScreen} />
      <Stack.Screen name="Join" component={JoinScreen} />
    </Stack.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Documents"
        component={DocumentStack}
        options={{
          tabBarIcon: ({ color }) => <DocumentIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <UserIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

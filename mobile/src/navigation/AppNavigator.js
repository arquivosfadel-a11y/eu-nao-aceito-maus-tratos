import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import NewComplaintScreen from '../screens/NewComplaintScreen';
import MyComplaintsScreen from '../screens/MyComplaintsScreen';
import AllComplaintsScreen from '../screens/AllComplaintsScreen';
import ComplaintDetailScreen from '../screens/ComplaintDetailScreen';
import AdocaoScreen from '../screens/AdocaoScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import RatingScreen from '../screens/RatingScreen';

// Telas do secretário
import SecretaryHomeScreen from '../screens/SecretaryHomeScreen';
import SecretaryComplaintDetailScreen from '../screens/SecretaryComplaintDetailScreen';
import NewWorkLogScreen from '../screens/NewWorkLogScreen';
import WorkLogsScreen from '../screens/WorkLogsScreen';
import PhoneVerificationScreen from '../screens/PhoneVerificationScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();
  if (loading) return null;

  const isSecretary = user?.role === 'secretary' || user?.role === 'protector';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
          </>
        ) : isSecretary ? (
          <>
            <Stack.Screen name="SecretaryHome" component={SecretaryHomeScreen} />
            <Stack.Screen name="SecretaryComplaintDetail" component={SecretaryComplaintDetailScreen} />
            <Stack.Screen name="WorkLogs" component={WorkLogsScreen} />
            <Stack.Screen name="NewWorkLog" component={NewWorkLogScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="NewComplaint" component={NewComplaintScreen} />
            <Stack.Screen name="MyComplaints" component={MyComplaintsScreen} />
            <Stack.Screen name="AllComplaints" component={AllComplaintsScreen} />
            <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
            <Stack.Screen name="Adocao" component={AdocaoScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Rating" component={RatingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
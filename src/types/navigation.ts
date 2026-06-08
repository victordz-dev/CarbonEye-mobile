export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  History: undefined;
  Info: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Details: { areaId: string; areaNome: string };
  HealthCheck: undefined;
  Notifications: undefined;
  TestArea: undefined;
};

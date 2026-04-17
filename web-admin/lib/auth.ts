import api from './api';

export interface ValidatorCity {
  id: string;
  name: string;
  state: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'citizen' | 'secretary' | 'protector' | 'mayor' | 'validator' | 'admin' | 'councilman' | 'chamber_president';
  city_id?: string;
  city?: any;
  department?: any;
  avatar_url?: string;
  whatsapp?: string;
  validatorCities?: ValidatorCity[];
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const saveSession = (token: string, user: User) => {
  localStorage.setItem('participa_token', token);
  localStorage.setItem('participa_user', JSON.stringify(user));
};

export const getSession = (): { token: string | null; user: User | null } => {
  if (typeof window === 'undefined') return { token: null, user: null };
  const token = localStorage.getItem('participa_token');
  const userStr = localStorage.getItem('participa_user');
  const user = userStr ? JSON.parse(userStr) : null;
  return { token, user };
};

export const logout = () => {
  localStorage.removeItem('participa_token');
  localStorage.removeItem('participa_user');
  window.location.href = '/login';
};

export const isAuthenticated = (): boolean => {
  const { token } = getSession();
  return !!token;
};

export const getRedirectByRole = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/validacao';
    case 'validator':
      return '/validacao';
    case 'protector':
      return '/protetor';
    case 'secretary':
      return '/protetor';
    case 'mayor':
      return '/validacao';
    case 'councilman':
    case 'chamber_president':
      return '/vereador';
    default:
      return '/login';
  }
};

export const checkRoutePermission = (role: string, pathname: string): string | null => {
  if (pathname.startsWith('/validacao') && role !== 'admin' && role !== 'validator') {
    return getRedirectByRole(role);
  }
  if (pathname.startsWith('/protetor') && role !== 'protector' && role !== 'secretary') {
    return getRedirectByRole(role);
  }
  if (pathname.startsWith('/secretario') && role !== 'secretary' && role !== 'protector') {
    return getRedirectByRole(role);
  }
  if (pathname.startsWith('/adocao') && role !== 'admin' && role !== 'validator') {
    return getRedirectByRole(role);
  }
  if (pathname.startsWith('/prefeito') && role !== 'mayor' && role !== 'admin') {
    return getRedirectByRole(role);
  }
  if (pathname.startsWith('/vereador') && role !== 'councilman' && role !== 'chamber_president' && role !== 'admin') {
    return getRedirectByRole(role);
  }
  return null;
};

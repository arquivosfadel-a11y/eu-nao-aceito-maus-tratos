export interface City {
  id: string;
  name: string;
  state: string;
  ibge_code?: string;
  is_active: boolean;
  mayor_name?: string;
  logo_url?: string;
  latitude?: number;
  longitude?: number;
  contact_email?: string;
  contact_phone?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  city_id: string;
  responsible_name?: string;
  responsible_email?: string;
  responsible_whatsapp?: string;
  categories: string[];
  is_active: boolean;
  total_complaints: number;
  resolved_complaints: number;
}

export interface Protector {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  city_id?: string;
  city_name?: string;
  avatar_url?: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  in_progress_count?: number;
  city?: { id: string; name: string; state: string };
}

export interface Animal {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: string;
  gender?: string;
  description?: string;
  images: string[];
  city_id?: string;
  city_name?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  status: 'available' | 'adopted' | 'pending';
  registered_by?: string;
  registeredBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Complaint {
  id: string;
  protocol: string;
  title: string;
  description: string;
  category: string;
  animal_category?: string;
  abuse_type?: string;
  city_name?: string;
  status: 'pending' | 'validated' | 'in_progress' | 'resolved' | 'rejected' | 'not_resolved' | 'closed';
  citizen_id: string;
  city_id: string;
  department_id?: string;
  secretary_id?: string;
  protector_id?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  neighborhood?: string;
  images: string[];
  is_public: boolean;
  validated_at?: string;
  resolved_at?: string;
  rejection_reason?: string;
  resolution_description?: string;
  resolution_images: string[];
  views_count: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  citizen?: {
    id: string;
    name: string;
    avatar_url?: string;
    phone?: string;
    whatsapp?: string;
  };
  councilman_id?: string;
  councilman?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  protector?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  city?: {
    id: string;
    name: string;
    state: string;
    city_type?: 'prefeitura' | 'camara';
  };
  department?: {
    id: string;
    name: string;
  };
  secretary?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface Message {
  id: string;
  complaint_id: string;
  sender_id: string;
  sender_role: 'citizen' | 'secretary' | 'protector';
  content: string;
  is_read: boolean;
  read_at?: string;
  attachment_url?: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    avatar_url?: string;
    role: string;
  };
}

export interface DashboardStats {
  total: number;
  resolved: number;
  in_progress: number;
  pending: number;
  resolution_rate: number;
}

export interface MapData {
  id: string;
  protocol: string;
  status: string;
  latitude: number;
  longitude: number;
  category: string;
  title: string;
}

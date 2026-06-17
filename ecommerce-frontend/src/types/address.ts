export interface UserAddress {
  id: number;
  province: string;
  city: string;
  detail: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  is_default: boolean;
  created_at: string;
}

export interface AddressCreate {
  province: string;
  city: string;
  detail: string;
  recipient_name?: string;
  recipient_phone?: string;
  is_default?: boolean;
}

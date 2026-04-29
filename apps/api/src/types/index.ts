export enum Currency {
  UAH = 'UAH',
  ALL = 'ALL',
  EUR = 'EUR',
  USD = 'USD'
}

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string
          avatar_url?: string | null
        }
        Update: {
          display_name?: string
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      partnerships: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          status: 'pending' | 'active' | 'dissolved'
          created_at: string
          updated_at: string
        }
        Insert: {
          user1_id: string
          user2_id: string
          status?: 'pending' | 'active' | 'dissolved'
        }
        Update: {
          status?: 'pending' | 'active' | 'dissolved'
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'partnerships_user1_id_fkey'
            columns: ['user1_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'partnerships_user2_id_fkey'
            columns: ['user2_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      invitations: {
        Row: {
          id: string
          inviter_id: string
          invitee_email: string
          invite_code: string
          status: 'pending' | 'accepted' | 'expired' | 'cancelled'
          created_at: string
          expires_at: string
        }
        Insert: {
          inviter_id: string
          invitee_email: string
          status?: 'pending' | 'accepted' | 'expired' | 'cancelled'
        }
        Update: {
          status?: 'pending' | 'accepted' | 'expired' | 'cancelled'
        }
        Relationships: [
          {
            foreignKeyName: 'invitations_inviter_id_fkey'
            columns: ['inviter_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string
          color: string
          partnership_id: string | null
          created_by: string | null
        }
        Insert: {
          name: string
          icon?: string
          color?: string
          partnership_id?: string | null
          created_by?: string | null
        }
        Update: {
          name?: string
          icon?: string
          color?: string
          partnership_id?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          partnership_id: string | null
          category_id: string
          description: string
          amount: number
          expense_date: string
          is_shared: boolean
          is_split: boolean
          split_from_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          partnership_id?: string | null
          category_id: string
          description?: string
          amount: number
          expense_date?: string
          is_shared?: boolean
          is_split?: boolean
          split_from_id?: string | null
        }
        Update: {
          category_id?: string
          description?: string
          amount?: number
          expense_date?: string
          is_shared?: boolean
          is_split?: boolean
          split_from_id?: string | null
          partnership_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'expenses_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expenses_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expenses_partnership_id_fkey'
            columns: ['partnership_id']
            isOneToOne: false
            referencedRelation: 'partnerships'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      split_expense: {
        Args: { p_expense_id: string }
        Returns: {
          original_id: string
          copy_id: string
          creator_amount: number
          partner_amount: number
        }
      }
      unsplit_expense: {
        Args: { p_expense_id: string }
        Returns: {
          original_id: string
          deleted_copy_id: string
          restored_amount: number
        }
      }
    }
    Enums: Record<string, never>
  }
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Partnership = Database['public']['Tables']['partnerships']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']
export type Expense = Database['public']['Tables']['expenses']['Row']

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type PartnershipInsert = Database['public']['Tables']['partnerships']['Insert']
export type PartnershipUpdate = Database['public']['Tables']['partnerships']['Update']
export type InvitationInsert = Database['public']['Tables']['invitations']['Insert']
export type InvitationUpdate = Database['public']['Tables']['invitations']['Update']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

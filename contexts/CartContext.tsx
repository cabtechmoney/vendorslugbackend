'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { CartItem, DeliveryZone } from '@/types';

interface CartState {
  items: CartItem[];
  deliveryZone: DeliveryZone | null;
  deliveryFee: number;
}

interface CartContextType {
  state: CartState;
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryZone: (zone: DeliveryZone) => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_DELIVERY_ZONE'; payload: DeliveryZone }
  | { type: 'RESTORE_CART'; payload: CartState };

const initialState: CartState = {
  items: [],
  deliveryZone: null,
  deliveryFee: 0,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: Math.max(0, action.payload.quantity) }
              : item
          )
          .filter((item) => item.quantity > 0),
      };

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'SET_DELIVERY_ZONE':
      return {
        ...state,
        deliveryZone: action.payload,
        deliveryFee: action.payload.fee,
      };

    case 'RESTORE_CART':
      return action.payload;

    default:
      return state;
  }
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'RESTORE_CART', payload: parsed });
      } catch (error) {
        console.error('Failed to restore cart:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const setDeliveryZone = (zone: DeliveryZone) => {
    dispatch({ type: 'SET_DELIVERY_ZONE', payload: zone });
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return state.items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotal = () => {
    return getSubtotal() + state.deliveryFee;
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setDeliveryZone,
        getTotalItems,
        getSubtotal,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ✅ The hook is now exported from this file
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
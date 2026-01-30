
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './use-toast';
import type { Listing } from '@/lib/types';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';

// Define the shape of a single cart item
export interface CartItem {
    listingId: string;
    title: string;
    price: number;
    primaryImageUrl: string | null;
    quantity: number;
    availableQuantity: number;
}

// Define the shape of the cart context state
interface CartContextType {
    items: CartItem[];
    storeId: string | null;
    itemCount: number;
    subtotal: number;
    addToCart: (listing: Listing, quantity: number) => void;
    removeFromCart: (listingId: string) => void;
    clearCart: () => void;
}

// Create the context with a default undefined value
const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to get cart from local storage
const getInitialCart = (): { items: CartItem[], storeId: string | null } => {
    if (typeof window === 'undefined') {
        return { items: [], storeId: null };
    }
    try {
        const storedCart = localStorage.getItem('vaultverse-cart');
        if (storedCart) {
            return JSON.parse(storedCart);
        }
    } catch (error) {
        // ...existing code...
    }
    return { items: [], storeId: null };
};


export function CartProvider({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();
    const [items, setItems] = useState<CartItem[]>(getInitialCart().items);
    const [storeId, setStoreId] = useState<string | null>(getInitialCart().storeId);

    // Save to localStorage whenever cart changes
    useEffect(() => {
        try {
            const cartState = JSON.stringify({ items, storeId });
            localStorage.setItem('vaultverse-cart', cartState);
        } catch (error) {
            // ...existing code...
        }
    }, [items, storeId]);

    const addToCart = (listing: Listing, quantity: number) => {
        try {
            // Rule: Cart can only contain items from one store
            if (storeId && storeId !== listing.storeId) {
                throw new Error('You can only add items from one store at a time. Please finish or clear your current cart before shopping from another store.');
            }

            // If cart is empty, set the storeId
            if (!storeId) {
                setStoreId(listing.storeId);
            }

            setItems(prevItems => {
                const existingItemIndex = prevItems.findIndex(item => item.listingId === listing.listingId);
                if (existingItemIndex > -1) {
                    // Update quantity if item already in cart
                    const newItems = [...prevItems];
                    const existingItem = newItems[existingItemIndex];
                    const newQuantity = existingItem.quantity + quantity;

                    if (newQuantity > listing.quantityAvailable) {
                        throw new Error(`You can only add up to ${listing.quantityAvailable} of this item to your cart.`);
                    }

                    existingItem.quantity = newQuantity;
                    toast({
                        title: "Cart Updated",
                        description: `${listing.title} quantity increased to ${newQuantity}.`,
                    });
                    return newItems;
                } else {
                    if (quantity > listing.quantityAvailable) {
                        throw new Error(`You can only add up to ${listing.quantityAvailable} of this item to your cart.`);
                    }
                    // Add new item to cart
                    const newItem: CartItem = {
                        listingId: listing.listingId,
                        title: listing.title,
                        price: listing.price,
                        primaryImageUrl: listing.primaryImageUrl,
                        quantity,
                        availableQuantity: listing.quantityAvailable
                    };
                    toast({
                        title: "Item Added to Cart",
                        description: `${listing.title} has been added to your cart.`,
                    });
                    return [...prevItems, newItem];
                }
            });
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Cart Error",
                description: getFriendlyErrorMessage(err),
            });
        }
    };

    const removeFromCart = (listingId: string) => {
        try {
            setItems(prevItems => {
                const newItems = prevItems.filter(item => item.listingId !== listingId);
                // If cart becomes empty, clear the storeId
                if (newItems.length === 0) {
                    setStoreId(null);
                }
                toast({
                    title: "Item Removed",
                    description: "The item has been removed from your cart.",
                });
                return newItems;
            });
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Cart Error",
                description: getFriendlyErrorMessage(err),
            });
        }
    };

    const clearCart = () => {
        try {
            setItems([]);
            setStoreId(null);
            toast({
                title: "Cart Cleared",
                description: "Your shopping cart is now empty.",
            });
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Cart Error",
                description: getFriendlyErrorMessage(err),
            });
        }
    };

    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

    const value = {
        items,
        storeId,
        itemCount,
        subtotal,
        addToCart,
        removeFromCart,
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom hook to use the cart context
export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        // Production: User-friendly error
        throw new Error('Cart error: Something went wrong with your cart. Please refresh the page or contact support if this keeps happening.');
    }
    return context;
};

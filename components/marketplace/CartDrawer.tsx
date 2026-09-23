'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
 interface CheckoutItem{
    id: string | number;
  img?: string;
  name: string;
  price: number;
  quantity: number;

 }
interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;

}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const {
    state,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getSubtotal,
    getTotal,
  } = useCart();

  const items = state.items;
  const subtotal = getSubtotal();
  const total = getTotal();

  const handleWhatsAppCheckout = () => {
    // Implement checkout logic
    console.log('Checkout via WhatsApp');
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-background shadow-2xl">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        <Dialog.Title className="text-lg font-semibold">
                          Your Cart
                        </Dialog.Title>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {getTotalItems()}
                        </span>
                      </div>
                      <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-muted transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-6">
                      {items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                          <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-semibold">Your cart is empty</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Start adding items to checkout
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {items.map((item: CheckoutItem) => (
                            <div
                              key={item.id}
                              className="flex gap-4 rounded-xl border p-3"
                            >
                              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                                {item.img && (
                                  <Image
                                    src={item.img}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 space-y-1">
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm font-semibold text-primary">
                                  ₦{item.price.toLocaleString()}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 rounded-full p-0"
                                    onClick={() => updateQuantity(String(item.id), item.quantity - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-medium">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 rounded-full p-0"
                                    onClick={() => updateQuantity(String(item.id), item.quantity + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <button
                                    onClick={() => removeFromCart(String(item.id))}
                                    className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {items.length > 0 && (
                      <div className="border-t px-4 py-4 space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₦{subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Delivery</span>
                            <span>₦{state.deliveryFee.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 text-lg font-semibold">
                            <span>Total</span>
                            <span>₦{total.toLocaleString()}</span>
                          </div>
                        </div>

                        <Button
                          onClick={handleWhatsAppCheckout}
                          variant="gradient"
                          size="lg"
                          className="w-full"
                        >
                          Checkout via WhatsApp
                        </Button>

                        <button
                          onClick={clearCart}
                          className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors"
                        >
                          Clear Cart
                        </button>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
      const storagedCart = localStorage.getItem('@RocketShoes:cart');

      if (storagedCart) {
        return JSON.parse(storagedCart);
      }

      return [];
  });
  
  const addProduct = async (productId: number) => { 
    try {
      const updateCart = [...cart];
      const productExistCart = updateCart.find((cartProduct) => cartProduct.id === productId);

      const product = await api.get<Product>(`products/${productId}`).then(response => (response.data));
      const stockProduct = await api.get<Stock>(`stock/${productId}`).then(response => (response.data));

      if(productExistCart){
        if(productExistCart.amount + 1 <= stockProduct.amount){
          const newCart = cart.map(productCart => {
            if(productCart.id === productId){
              return {...productCart, amount: productCart.amount + 1}
            }else{
              return productCart;
            }
          });
           localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          setCart(newCart);
        }else{
          toast.error('Quantidade solicitada fora de estoque');
        }  
      }
      else{
        if(stockProduct.amount > 0){
          const newCart = [...cart, {...product, amount: 1}];
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          setCart(newCart);
        }else{
          toast.error('Quantidade solicitada fora de estoque');
        } 
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if(cart.find(product => product.id === productId)){
        const newCart = cart.filter(product => product.id !== productId);
        
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      }else{
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){
        return;
      }

      if(cart.find(product => product.id === productId)){
        const stockProduct = await api.get<Stock>(`stock/${productId}`).then(response => (response.data));
      
        if(amount <= stockProduct.amount){
          const newCart = cart.map(product => {
            if(product.id === productId){
              return {...product, amount: amount}
            }else{
              return product;
            }
          });
          
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          setCart(newCart);
        }
        else{
          toast.error('Quantidade solicitada fora de estoque');
        }      
      } 
      else{
        throw Error();
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

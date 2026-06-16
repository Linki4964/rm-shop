// src/components/CartDrawer/CartDrawer.tsx
import { useEffect } from 'react';
import { useCartStore } from '../../store/cartStore';
import { useToast, useConfirm } from '../Toast';
import styles from './CartDrawer.module.css';
import { useNavigate } from 'react-router-dom';
interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, totalQuantity, isLoading, fetchCart, updateItemQuantity, removeItem, clearCart } = useCartStore();
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen, fetchCart]);

  const handleQuantityChange = async (itemId: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    await updateItemQuantity(itemId, newQty);
  };

  const handleRemove = async (itemId: number) => {
    const ok = await confirm({ message: '确定要从购物车移除该商品吗？' });
    if (ok) {
      await removeItem(itemId);
      toast.success('已移除');
    }
  };

  const handleClear = async () => {
    const ok = await confirm({ message: '确定清空购物车吗？' });
    if (ok) {
      await clearCart();
      toast.success('购物车已清空');
    }
  };

   // 在组件内调用
  const navigate = useNavigate();
  const handleCheckout = () => {
     // 关闭抽屉并跳转到结算页
     onClose();
     navigate('/checkout');
   };



  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      <div className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h5>购物车</h5>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.body}>
          {isLoading && <div className="text-center py-3">加载中...</div>}
          {!isLoading && items.length === 0 && (
            <div className="text-center text-muted py-5">购物车空空如也~</div>
          )}
          {items.map((item) => (
            <div key={item.id} className={styles.cartItem}>
              <img
                src={item.product.image_url || 'https://via.placeholder.com/60'}
                alt={item.product.name}
                className={styles.productImg}
              />
              <div className={styles.itemInfo}>
                <div className={styles.productName}>{item.product.name}</div>
                <div className={styles.productPrice}>¥{item.product.price}</div>
                <div className={styles.quantityControl}>
                  <button onClick={() => handleQuantityChange(item.id, item.quantity, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleQuantityChange(item.id, item.quantity, 1)}>+</button>
                  <button className={styles.removeBtn} onClick={() => handleRemove(item.id)}>删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.footer}>
          <div className={styles.total}>总计: {totalQuantity} 件商品</div>
          <div className={styles.actions}>
            {items.length > 0 && (
              <button className={styles.clearBtn} onClick={handleClear}>清空购物车</button>
            )}
             <button className={styles.checkoutBtn} onClick={handleCheckout}>去结算</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
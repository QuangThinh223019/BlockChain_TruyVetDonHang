/**
 * Frontend Optimization Guidelines
 * Best practices for React performance
 */

// ==================== COMPONENT MEMOIZATION ====================

// Bad: Component re-renders on every parent re-render
function OrderList({ orders }) {
  return (
    <div>
      {orders.map(order => <OrderItem key={order.id} order={order} />)}
    </div>
  );
}

// Good: Use React.memo to prevent unnecessary re-renders
const OrderList = React.memo(function OrderList({ orders }) {
  return (
    <div>
      {orders.map(order => <OrderItem key={order.id} order={order} />)}
    </div>
  );
});

// ==================== CALLBACK OPTIMIZATION ====================

// Bad: Creates new function every render
function OrderDetail({ orderId }) {
  const handleClick = () => {
    console.log(orderId);
  };

  return <button onClick={handleClick}>Click me</button>;
}

// Good: Use useCallback to memoize function
import { useCallback } from 'react';

function OrderDetail({ orderId }) {
  const handleClick = useCallback(() => {
    console.log(orderId);
  }, [orderId]);

  return <button onClick={handleClick}>Click me</button>;
}

// ==================== USEMEMO OPTIMIZATION ====================

// Bad: Expensive calculation every render
function OrderStats({ orders }) {
  const totalOrders = orders.filter(o => o.status === 'DELIVERED').length;
  const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0);

  return <div>Orders: {totalOrders}, Total: {totalAmount}</div>;
}

// Good: Memoize expensive calculations
import { useMemo } from 'react';

function OrderStats({ orders }) {
  const stats = useMemo(() => ({
    totalOrders: orders.filter(o => o.status === 'DELIVERED').length,
    totalAmount: orders.reduce((sum, o) => sum + o.amount, 0)
  }), [orders]);

  return <div>Orders: {stats.totalOrders}, Total: {stats.totalAmount}</div>;
}

// ==================== LAZY LOADING ====================

// Bad: Loads all components upfront
import OrderHistory from './OrderHistory';
import OrderAnalytics from './OrderAnalytics';
import OrderReports from './OrderReports';

function Dashboard() {
  return (
    <div>
      <OrderHistory />
      <OrderAnalytics />
      <OrderReports />
    </div>
  );
}

// Good: Lazy load components that are not immediately needed
import { lazy, Suspense } from 'react';

const OrderHistory = lazy(() => import('./OrderHistory'));
const OrderAnalytics = lazy(() => import('./OrderAnalytics'));
const OrderReports = lazy(() => import('./OrderReports'));

function Dashboard() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <OrderHistory />
        <OrderAnalytics />
        <OrderReports />
      </Suspense>
    </div>
  );
}

// ==================== API CALL OPTIMIZATION ====================

// Bad: Fetches on every render
function OrderDetail({ orderId }) {
  const [order, setOrder] = useState(null);

  const data = fetch(`/api/orders/${orderId}`).then(r => r.json());

  return <div>{order?.name}</div>;
}

// Good: Fetch with useEffect dependencies
import { useEffect } from 'react';

function OrderDetail({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(data => setOrder(data))
      .finally(() => setLoading(false));
  }, [orderId]); // Only re-fetch when orderId changes

  if (loading) return <div>Loading...</div>;
  return <div>{order?.name}</div>;
}

// ==================== STATE MANAGEMENT ====================

// Bad: Too many useState calls
function OrderForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
}

// Good: Group related state
function OrderForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  });

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  return (
    <form>
      <input name="name" value={formData.name} onChange={handleChange} />
      <input name="email" value={formData.email} onChange={handleChange} />
    </form>
  );
}

// ==================== LIST RENDERING ====================

// Bad: No key prop
function OrdersList({ orders }) {
  return (
    <ul>
      {orders.map(order => <li>{order.name}</li>)}
    </ul>
  );
}

// Good: Use unique key prop
function OrdersList({ orders }) {
  return (
    <ul>
      {orders.map(order => <li key={order.id}>{order.name}</li>)}
    </ul>
  );
}

// ==================== PROFILING ====================

// Use React DevTools Profiler to identify bottlenecks:
// 1. Open React DevTools
// 2. Go to Profiler tab
// 3. Record a session
// 4. Analyze which components take longest to render
// 5. Apply optimizations above

// ==================== CHECKLIST ====================

/*
✓ Use React.memo for components that receive same props
✓ Use useCallback for event handlers
✓ Use useMemo for expensive calculations
✓ Use lazy/Suspense for code splitting
✓ Group related useState calls
✓ Use keys for list items
✓ Avoid unnecessary re-renders
✓ Profile with React DevTools
✓ Cache API responses
✓ Debounce/throttle input handlers
✓ Code splitting by route
✓ Image optimization
✓ CSS-in-JS optimization
*/

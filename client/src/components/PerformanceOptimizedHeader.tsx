import { memo } from 'react';
import Header from './header';

// Memoize header to prevent unnecessary re-renders
const PerformanceOptimizedHeader = memo(Header);

export default PerformanceOptimizedHeader;
import React from 'react';
import {
  ShoppingCart,
  Utensils,
  Car,
  Receipt,
  ShoppingBag,
  Film,
  HeartPulse,
  Briefcase,
  Laptop,
  TrendingUp,
  Wallet,
  Landmark,
  PiggyBank,
  CreditCard,
  Coffee,
  Home,
  Plane,
  Gift,
  BookOpen,
  Smartphone,
  Smile,
  CircleDollarSign,
  HelpCircle,
  LucideProps,
} from 'lucide-react';

export const AVAILABLE_ICONS = [
  'ShoppingCart',
  'Utensils',
  'Car',
  'Receipt',
  'ShoppingBag',
  'Film',
  'HeartPulse',
  'Briefcase',
  'Laptop',
  'TrendingUp',
  'Wallet',
  'Landmark',
  'PiggyBank',
  'CreditCard',
  'Coffee',
  'Home',
  'Plane',
  'Gift',
  'BookOpen',
  'Smartphone',
  'Smile',
];

export const AVAILABLE_COLORS = [
  '#00BFA5', // Ivy Teal
  '#3193F5', // Blue
  '#7C4DFF', // Purple
  '#FF6E40', // Orange
  '#FF5252', // Red
  '#F5D018', // Yellow
  '#F53D99', // Pink
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#EC4899', // Fuchsia
  '#8B5CF6', // Violet
  '#14B8A6', // Cyan
];

export function renderCategoryIcon(
  iconName: string,
  props: LucideProps | number = { size: 18 }
): React.ReactElement {
  const finalProps: LucideProps = typeof props === 'number' ? { size: props } : props;
  switch (iconName) {
    case 'ShoppingCart': return <ShoppingCart {...finalProps} />;
    case 'Utensils': return <Utensils {...finalProps} />;
    case 'Car': return <Car {...finalProps} />;
    case 'Receipt': return <Receipt {...finalProps} />;
    case 'ShoppingBag': return <ShoppingBag {...finalProps} />;
    case 'Film': return <Film {...finalProps} />;
    case 'HeartPulse': return <HeartPulse {...finalProps} />;
    case 'Briefcase': return <Briefcase {...finalProps} />;
    case 'Laptop': return <Laptop {...finalProps} />;
    case 'TrendingUp': return <TrendingUp {...finalProps} />;
    case 'Wallet': return <Wallet {...finalProps} />;
    case 'Landmark': return <Landmark {...finalProps} />;
    case 'PiggyBank': return <PiggyBank {...finalProps} />;
    case 'CreditCard': return <CreditCard {...finalProps} />;
    case 'Coffee': return <Coffee {...finalProps} />;
    case 'Home': return <Home {...finalProps} />;
    case 'Plane': return <Plane {...finalProps} />;
    case 'Gift': return <Gift {...finalProps} />;
    case 'BookOpen': return <BookOpen {...finalProps} />;
    case 'Smartphone': return <Smartphone {...finalProps} />;
    case 'Smile': return <Smile {...finalProps} />;
    default: return <CircleDollarSign {...finalProps} />;
  }
}

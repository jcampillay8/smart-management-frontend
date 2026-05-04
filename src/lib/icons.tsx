import { 
  Plus, Trash2, Pencil, ChevronDown, X, Tag, 
  Utensils, ChefHat, Coffee, Flame, Warehouse, Package, 
  Box, Archive, Sparkles, Bed, Lamp, Brush, ConciergeBell, ShoppingBag, Store,
  Beef, Drumstick, Fish, Salad, Sprout, Apple, Banana, Cherry, Citrus, Grape, 
  Leaf, Milk, Sandwich, Soup, Egg, Carrot, Wine, Beer, GlassWater, IceCream, 
  Cake, Lollipop, Wheat, Droplet, Snowflake, Pizza, Martini, Zap, Croissant
} from "lucide-react";

export const ICON_MAP: Record<string, any> = {
  Utensils, ChefHat, Coffee, Flame, Warehouse, Package, 
  Box, Archive, Sparkles, Bed, Lamp, Brush, ConciergeBell, Tag, ShoppingBag, Store,
  Beef, Drumstick, Fish, Salad, Sprout, Apple, Banana, Cherry, Citrus, Grape, 
  Leaf, Milk, Sandwich, Soup, Egg, Carrot, Wine, Beer, GlassWater, IceCream, 
  Cake, Lollipop, Wheat, Droplet, Snowflake, Pizza, Martini, Zap, Croissant
};

export const CategoryIcon = ({ name, className }: { name?: string, className?: string }) => {
  const Icon = name && ICON_MAP[name] ? ICON_MAP[name] : Tag;
  return <Icon className={className} />;
};

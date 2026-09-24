import React from 'react';
import {
  Home,
  BookOpen,
  TrendingUp,
  PieChart,
  User,
  Award,
  Trophy,
  Wallet,
  ShieldCheck,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownLeft,
  ArrowUpLeft,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Flame,
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  Minus,
  Info,
  DollarSign,
  Building2,
  Layers,
  Lock,
  Unlock,
  RefreshCw,
  Bell,
  Settings,
  HelpCircle,
  Share2,
  Calendar,
  Zap,
  Rocket,
  Lightbulb,
  Check,
  X,
  Sliders,
  Compass,
  Briefcase,
  Activity,
  BarChart3,
  LucideProps,
} from 'lucide-react-native';
import Svg, { Rect } from 'react-native-svg';
import { THEME } from './theme';

export interface IconProps extends LucideProps {
  name: string;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = THEME.colors.textPrimary,
  ...rest
}) => {
  switch (name) {
    case 'home':
      return <Home size={size} color={color} {...rest} />;
    case 'learn':
    case 'education':
    case 'book':
      return <BookOpen size={size} color={color} {...rest} />;
    case 'invest':
    case 'growth':
    case 'trending-up':
      return <TrendingUp size={size} color={color} {...rest} />;
    case 'budget':
    case 'pie-chart':
    case 'chart':
      return <PieChart size={size} color={color} {...rest} />;
    case 'portfolio':
    case 'briefcase':
      return <Briefcase size={size} color={color} {...rest} />;
    case 'profile':
    case 'user':
      return <User size={size} color={color} {...rest} />;
    case 'rewards':
    case 'badge':
    case 'award':
      return <Award size={size} color={color} {...rest} />;
    case 'leaderboard':
    case 'trophy':
      return <Trophy size={size} color={color} {...rest} />;
    case 'wallet':
    case 'cash':
      return <Wallet size={size} color={color} {...rest} />;
    case 'shield':
    case 'safety':
      return <ShieldCheck size={size} color={color} {...rest} />;
    case 'target':
    case 'goal':
      return <Target size={size} color={color} {...rest} />;
    case 'challenge':
    case 'zap':
    case 'lightning':
      return <Zap size={size} color={color} {...rest} />;
    case 'streak':
    case 'flame':
      return <Flame size={size} color={color} {...rest} />;
    case 'arrow-up-right':
      return <ArrowUpRight size={size} color={color} {...rest} />;
    case 'arrow-down-right':
      return <ArrowDownRight size={size} color={color} {...rest} />;
    case 'arrow-down-left':
      return <ArrowDownLeft size={size} color={color} {...rest} />;
    case 'arrow-up-left':
      return <ArrowUpLeft size={size} color={color} {...rest} />;
    case 'bookmark':
      return <Bookmark size={size} color={color} {...rest} />;
    case 'bookmark-filled':
    case 'watchlisted':
      return <BookmarkCheck size={size} color={color} {...rest} />;
    case 'success':
    case 'check-circle':
      return <CheckCircle2 size={size} color={color} {...rest} />;
    case 'warning':
    case 'alert':
      return <AlertCircle size={size} color={color} {...rest} />;
    case 'time':
    case 'clock':
      return <Clock size={size} color={color} {...rest} />;
    case 'search':
      return <Search size={size} color={color} {...rest} />;
    case 'chevron-right':
      return <ChevronRight size={size} color={color} {...rest} />;
    case 'chevron-left':
      return <ChevronLeft size={size} color={color} {...rest} />;
    case 'plus':
    case 'add':
      return <Plus size={size} color={color} {...rest} />;
    case 'minus':
    case 'remove':
      return <Minus size={size} color={color} {...rest} />;
    case 'info':
      return <Info size={size} color={color} {...rest} />;
    case 'stocks':
    case 'stock':
      return <TrendingUp size={size} color={color} {...rest} />;
    case 'funds':
    case 'mutual-funds':
    case 'layers':
      return <Layers size={size} color={color} {...rest} />;
    case 'fd':
    case 'fixed-deposit':
    case 'building':
      return <Building2 size={size} color={color} {...rest} />;
    case 'lock':
      return <Lock size={size} color={color} {...rest} />;
    case 'unlock':
      return <Unlock size={size} color={color} {...rest} />;
    case 'refresh':
      return <RefreshCw size={size} color={color} {...rest} />;
    case 'bell':
    case 'notification':
      return <Bell size={size} color={color} {...rest} />;
    case 'settings':
      return <Settings size={size} color={color} {...rest} />;
    case 'help':
      return <HelpCircle size={size} color={color} {...rest} />;
    case 'share':
      return <Share2 size={size} color={color} {...rest} />;
    case 'calendar':
      return <Calendar size={size} color={color} {...rest} />;
    case 'rocket':
    case 'shark-tank':
      return <Rocket size={size} color={color} {...rest} />;
    case 'tip':
    case 'lightbulb':
    case 'advisor':
      return <Lightbulb size={size} color={color} {...rest} />;
    case 'check':
      return <Check size={size} color={color} {...rest} />;
    case 'close':
    case 'x':
      return <X size={size} color={color} {...rest} />;
    case 'sliders':
      return <Sliders size={size} color={color} {...rest} />;
    case 'waveform':
    case 'soundwave':
    case 'equalizer':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="2" y="9" width="2.5" height="6" rx="1.25" fill={color} />
          <Rect x="6.5" y="5" width="2.5" height="14" rx="1.25" fill={color} />
          <Rect x="11" y="2" width="2.5" height="20" rx="1.25" fill={color} />
          <Rect x="15.5" y="6" width="2.5" height="12" rx="1.25" fill={color} />
          <Rect x="20" y="10" width="2.5" height="4" rx="1.25" fill={color} />
        </Svg>
      );
    case 'activity':
    case 'pulse':
      return <Activity size={size} color={color} {...rest} />;
    case 'barchart':
      return <BarChart3 size={size} color={color} {...rest} />;
    default:
      return <TrendingUp size={size} color={color} {...rest} />;
  }
};

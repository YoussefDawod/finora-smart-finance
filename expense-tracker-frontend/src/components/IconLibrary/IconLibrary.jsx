import React from 'react';
import PropTypes from 'prop-types';
import {
  BanknotesIcon,
  BoltIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ChartBarIcon,
  CodeBracketIcon,
  EllipsisHorizontalIcon,
  FilmIcon,
  GiftTopIcon,
  HeartIcon,
  HomeModernIcon,
  MoonIcon,
  PencilSquareIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SunIcon,
  SparklesIcon,
  TrashIcon,
  ComputerDesktopIcon,
  TruckIcon,
} from '@heroicons/react/24/solid';
import {
  BanknotesIcon as BanknotesIconOutline,
  BoltIcon as BoltIconOutline,
  BookOpenIcon as BookOpenIconOutline,
  BriefcaseIcon as BriefcaseIconOutline,
  ChartBarIcon as ChartBarIconOutline,
  CodeBracketIcon as CodeBracketIconOutline,
  EllipsisHorizontalIcon as EllipsisHorizontalIconOutline,
  FilmIcon as FilmIconOutline,
  GiftTopIcon as GiftTopIconOutline,
  HeartIcon as HeartIconOutline,
  HomeModernIcon as HomeModernIconOutline,
  MoonIcon as MoonIconOutline,
  PencilSquareIcon as PencilSquareIconOutline,
  PaperAirplaneIcon as PaperAirplaneIconOutline,
  ShieldCheckIcon as ShieldCheckIconOutline,
  ShoppingBagIcon as ShoppingBagIconOutline,
  ShoppingCartIcon as ShoppingCartIconOutline,
  SunIcon as SunIconOutline,
  SparklesIcon as SparklesIconOutline,
  TrashIcon as TrashIconOutline,
  ComputerDesktopIcon as ComputerDesktopIconOutline,
  TruckIcon as TruckIconOutline,
} from '@heroicons/react/24/outline';
import { cn } from '../../utils';

const solidIcons = {
  banknotes: BanknotesIcon,
  bolt: BoltIcon,
  'book-open': BookOpenIcon,
  briefcase: BriefcaseIcon,
  'chart-bar': ChartBarIcon,
  'code-bracket': CodeBracketIcon,
  'ellipsis-horizontal': EllipsisHorizontalIcon,
  film: FilmIcon,
  gift: GiftTopIcon,
  heart: HeartIcon,
  home: HomeModernIcon,
  monitor: ComputerDesktopIcon,
  moon: MoonIcon,
  'pencil-square': PencilSquareIcon,
  'paper-airplane': PaperAirplaneIcon,
  shield: ShieldCheckIcon,
  'shopping-bag': ShoppingBagIcon,
  'shopping-cart': ShoppingCartIcon,
  sun: SunIcon,
  sparkles: SparklesIcon,
  trash: TrashIcon,
  truck: TruckIcon,
};

const outlineIcons = {
  banknotes: BanknotesIconOutline,
  bolt: BoltIconOutline,
  'book-open': BookOpenIconOutline,
  briefcase: BriefcaseIconOutline,
  'chart-bar': ChartBarIconOutline,
  'code-bracket': CodeBracketIconOutline,
  'ellipsis-horizontal': EllipsisHorizontalIconOutline,
  film: FilmIconOutline,
  gift: GiftTopIconOutline,
  heart: HeartIconOutline,
  home: HomeModernIconOutline,
  monitor: ComputerDesktopIconOutline,
  moon: MoonIconOutline,
  'pencil-square': PencilSquareIconOutline,
  'paper-airplane': PaperAirplaneIconOutline,
  shield: ShieldCheckIconOutline,
  'shopping-bag': ShoppingBagIconOutline,
  'shopping-cart': ShoppingCartIconOutline,
  sun: SunIconOutline,
  sparkles: SparklesIconOutline,
  trash: TrashIconOutline,
  truck: TruckIconOutline,
};

function IconLibrary({ name, variant = 'solid', size = 24, className, ...props }) {
  const iconSet = variant === 'outline' ? outlineIcons : solidIcons;
  const IconComponent = iconSet[name] || solidIcons.sparkles;

  if (!IconComponent) return null;

  return (
    <IconComponent
      width={size}
      height={size}
      aria-hidden
      className={cn('icon', className)}
      {...props}
    />
  );
}

IconLibrary.propTypes = {
  name: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['solid', 'outline']),
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
};

export default IconLibrary;

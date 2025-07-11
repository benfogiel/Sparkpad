import './CategoryItem.css';

import React from 'react';
import { IonCheckbox, IonRadio } from '@ionic/react';

interface CategoryItemProps {
  category: string;
  selected: boolean;
  onSelect: () => void;
  style?: React.CSSProperties;
}

export const CategoryCheckboxItem: React.FC<CategoryItemProps> = ({
  category,
  selected,
  onSelect,
  style,
}) => {
  return (
    <div className="category-item">
      <IonCheckbox
        checked={selected}
        color={selected ? 'primary' : 'light'}
        onClick={onSelect}
        style={style}
      >
        {category}
      </IonCheckbox>
    </div>
  );
};

export const CategoryRadioItem: React.FC<CategoryItemProps> = ({
  category,
  selected,
  onSelect,
  style,
}) => {
  return (
    <IonRadio
      color={selected ? 'primary' : 'light'}
      onClick={onSelect}
      className="category-item"
      style={style}
    >
      {category}
    </IonRadio>
  );
};

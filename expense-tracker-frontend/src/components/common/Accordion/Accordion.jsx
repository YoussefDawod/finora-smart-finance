/**
 * Placeholder für Accordion Komponente
 */

import React from 'react';

const Accordion = ({ items, allowMultiple = false }) => {
  const [openItems, setOpenItems] = React.useState([]);
  
  const toggleItem = (id) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setOpenItems((prev) => (prev.includes(id) ? [] : [id]));
    }
  };
  
  return (
    <div className="accordion">
      {items.map((item) => (
        <div key={item.id} className="accordion-item">
          <button
            className={`accordion-trigger ${openItems.includes(item.id) ? 'open' : ''}`}
            onClick={() => toggleItem(item.id)}
          >
            {item.title}
          </button>
          {openItems.includes(item.id) && <div className="accordion-content">{item.content}</div>}
        </div>
      ))}
    </div>
  );
};

export default Accordion;

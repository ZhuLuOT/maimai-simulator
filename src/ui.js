export const esc=value=>String(value??'');
// Round only at the display boundary; gameplay keeps fractional consumption and recovery.
export const statNumber=(value,decimals=0)=>Number(value.toFixed(decimals));
export function icon(name){const key=name.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join('');const definition=window.lucide.icons[key]||window.lucide.icons.Circle;return window.lucide.createElement(definition,{'aria-hidden':'true',width:24,height:24});}

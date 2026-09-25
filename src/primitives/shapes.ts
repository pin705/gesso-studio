import type { Paint, Point, SceneNode } from '../types/scene';
import { polygonPoints, starPoints } from './path';

function id(prefix: string, ...values: Array<string | number>): string {
  return `${prefix}-${values.join('-').replace(/[^\w.-]+/g, '_')}`;
}

export function rect(x: number, y: number, width: number, height: number, fill?: Paint): SceneNode {
  return { id: id('rect', x, y, width, height), type: 'rect', x, y, width, height, fill };
}

export function roundedRect(x: number, y: number, width: number, height: number, radius: number, fill?: Paint): SceneNode {
  return { id: id('rounded-rect', x, y, width, height, radius), type: 'rounded-rect', x, y, width, height, radius, fill };
}

export function circle(x: number, y: number, radius: number, fill?: Paint): SceneNode {
  return { id: id('circle', x, y, radius), type: 'circle', x, y, radius, fill };
}

export function ellipse(x: number, y: number, width: number, height: number, fill?: Paint): SceneNode {
  return { id: id('ellipse', x, y, width, height), type: 'ellipse', x, y, width, height, fill };
}

export function line(x1: number, y1: number, x2: number, y2: number, stroke?: Paint, strokeWidth = 1): SceneNode {
  return { id: id('line', x1, y1, x2, y2), type: 'line', x: x1, y: y1, x2, y2, stroke, strokeWidth, lineCap: 'round' };
}

export function polygon(x: number, y: number, radius: number, sides: number, fill?: Paint): SceneNode {
  return { id: id('polygon', x, y, radius, sides), type: 'polygon', x, y, points: polygonPoints({ x, y }, radius, sides), fill };
}

export function star(x: number, y: number, outerRadius: number, innerRadius: number, points = 5, fill?: Paint): SceneNode {
  return { id: id('star', x, y, outerRadius, innerRadius, points), type: 'star', x, y, points: starPoints({ x, y }, outerRadius, innerRadius, points), fill };
}

export function pathNode(d: string, fill?: Paint, stroke?: Paint): SceneNode {
  return { id: id('path', d), type: 'path', d, fill, stroke, lineCap: 'round', lineJoin: 'round' };
}

export function arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, stroke?: Paint): SceneNode {
  const start: Point = { x: x + Math.cos(startAngle) * radius, y: y + Math.sin(startAngle) * radius };
  const end: Point = { x: x + Math.cos(endAngle) * radius, y: y + Math.sin(endAngle) * radius };
  return { id: id('arc', x, y, radius, startAngle, endAngle), type: 'arc', x, y, radius, d: `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0} 1 ${end.x} ${end.y}`, fill: 'none', stroke };
}

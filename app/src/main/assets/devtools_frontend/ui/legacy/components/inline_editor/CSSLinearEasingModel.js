"use strict";
import * as CodeMirror from "../../../../third_party/codemirror.next/codemirror.next.js";
const cssParser = CodeMirror.css.cssLanguage.parser;
const numberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2
});
function findNextDefinedInputIndex(points, currentIndex) {
  for (let i = currentIndex; i < points.length; i++) {
    if (!isNaN(points[i].input)) {
      return i;
    }
  }
  return -1;
}
function consumeLinearStop(cursor, referenceText) {
  const tokens = [];
  while (cursor.type.name !== "," && cursor.type.name !== ")") {
    const token = referenceText.substring(cursor.from, cursor.to);
    if (cursor.type.name !== "NumberLiteral") {
      return null;
    }
    tokens.push(token);
    cursor.next(false);
  }
  if (tokens.length > 3) {
    return null;
  }
  const percentages = tokens.filter((token) => token.includes("%"));
  if (percentages.length > 2) {
    return null;
  }
  const numbers = tokens.filter((token) => !token.includes("%"));
  if (numbers.length !== 1) {
    return null;
  }
  return {
    number: Number(numbers[0]),
    lengthA: percentages[0] ? Number(percentages[0].substring(0, percentages[0].length - 1)) : void 0,
    lengthB: percentages[1] ? Number(percentages[1].substring(0, percentages[1].length - 1)) : void 0
  };
}
function consumeLinearFunction(text) {
  const textToParse = `*{--a: ${text}}`;
  const parsed = cssParser.parse(textToParse);
  const cursor = parsed.cursorAt(textToParse.indexOf(":") + 1);
  while (cursor.name !== "ArgList" && cursor.next(true)) {
    if (cursor.name === "Callee" && textToParse.substring(cursor.from, cursor.to) !== "linear") {
      return null;
    }
  }
  if (cursor.name !== "ArgList") {
    return null;
  }
  cursor.firstChild();
  const stops = [];
  while (cursor.type.name !== ")" && cursor.next(false)) {
    const linearStop = consumeLinearStop(cursor, textToParse);
    if (!linearStop) {
      return null;
    }
    stops.push(linearStop);
  }
  return stops;
}
const KeywordToValue = {
  linear: "linear(0 0%, 1 100%)"
};
export class CSSLinearEasingModel {
  #points;
  constructor(points) {
    this.#points = points;
  }
  // https://w3c.github.io/csswg-drafts/css-easing/#linear-easing-function-parsing
  static parse(text) {
    if (KeywordToValue[text]) {
      return CSSLinearEasingModel.parse(KeywordToValue[text]);
    }
    const stops = consumeLinearFunction(text);
    if (!stops || stops.length < 2) {
      return null;
    }
    let largestInput = -Infinity;
    const points = [];
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const point = { input: NaN, output: stop.number };
      points.push(point);
      if (stop.lengthA !== void 0) {
        point.input = Math.max(stop.lengthA, largestInput);
        largestInput = point.input;
        if (stop.lengthB !== void 0) {
          const extraPoint = { input: NaN, output: point.output };
          points.push(extraPoint);
          extraPoint.input = Math.max(stop.lengthB, largestInput);
          largestInput = extraPoint.input;
        }
      } else if (i === 0) {
        point.input = 0;
        largestInput = 0;
      } else if (i === stops.length - 1) {
        point.input = Math.max(100, largestInput);
      }
    }
    let upperIndex = 0;
    for (let i = 1; i < points.length; i++) {
      if (isNaN(points[i].input)) {
        if (i > upperIndex) {
          upperIndex = findNextDefinedInputIndex(points, i);
        }
        points[i].input = points[i - 1].input + (points[upperIndex].input - points[i - 1].input) / (upperIndex - (i - 1));
      }
    }
    return new CSSLinearEasingModel(points);
  }
  addPoint(point, index) {
    if (index !== void 0) {
      this.#points.splice(index, 0, point);
      return;
    }
    this.#points.push(point);
  }
  removePoint(index) {
    this.#points.splice(index, 1);
  }
  setPoint(index, point) {
    this.#points[index] = point;
  }
  points() {
    return this.#points;
  }
  asCSSText() {
    const args = this.#points.map((point) => `${numberFormatter.format(point.output)} ${numberFormatter.format(point.input)}%`).join(", ");
    const text = `linear(${args})`;
    for (const [keyword, value] of Object.entries(KeywordToValue)) {
      if (value === text) {
        return keyword;
      }
    }
    return text;
  }
}
//# sourceMappingURL=CSSLinearEasingModel.js.map

import { ExternalTokenizer } from "@lezer/lr";
import {
  Identifier,
  ObjectTypeIdentifier,
  AnimationKeyword,
  FalseKeyword,
  LetKeyword,
  TrueKeyword,
} from "./chamebrush-parser.terms";

const identifierStart = /[\p{L}_]/u;
const identifierContinue = /[\p{L}\p{N}_-]/u;

function nextCharacter(next: number, peek: (offset: number) => number): { text: string; width: number } {
  if (next >= 0xd800 && next <= 0xdbff) {
    const low = peek(1);
    if (low >= 0xdc00 && low <= 0xdfff) {
      return { text: String.fromCodePoint(((next - 0xd800) << 10) + low - 0xdc00 + 0x10000), width: 2 };
    }
  }
  return { text: String.fromCharCode(next), width: 1 };
}

function startsObjectHeader(input: { peek(offset: number): number }, offset: number): boolean {
  let lookahead = offset;
  while (input.peek(lookahead) === 32 || input.peek(lookahead) === 9) lookahead += 1;

  let next = input.peek(lookahead);
  if (next < 0) return false;
  let character = nextCharacter(next, (extra) => input.peek(lookahead + extra));
  if (!identifierStart.test(character.text)) return false;
  lookahead += character.width;

  while ((next = input.peek(lookahead)) >= 0) {
    character = nextCharacter(next, (extra) => input.peek(lookahead + extra));
    if (!identifierContinue.test(character.text)) break;
    lookahead += character.width;
  }

  while (input.peek(lookahead) === 32 || input.peek(lookahead) === 9) lookahead += 1;
  return input.peek(lookahead) === 123;
}

export const identifierTokens = new ExternalTokenizer((input, stack) => {
  if (input.next < 0) return;
  let character = nextCharacter(input.next, (offset) => input.peek(offset));
  if (!identifierStart.test(character.text)) return;

  let value = character.text;
  input.advance(character.width);
  while (input.next >= 0) {
    character = nextCharacter(input.next, (offset) => input.peek(offset));
    if (!identifierContinue.test(character.text)) break;
    value += character.text;
    input.advance(character.width);
  }

  const keyword = value === "let" ? LetKeyword
    : value === "animation" ? AnimationKeyword
      : value === "true" ? TrueKeyword
        : value === "false" ? FalseKeyword
          : undefined;
  const term = keyword !== undefined && stack.canShift(keyword) ? keyword
    : stack.canShift(ObjectTypeIdentifier) && startsObjectHeader(input, 0) ? ObjectTypeIdentifier
      : Identifier;
  input.acceptToken(term);
}, { contextual: true });

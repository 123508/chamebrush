import { styleTags, tags } from "@lezer/highlight";
import { parser as generatedParser } from "./chamebrush-parser";

export const chamebrushParser = generatedParser.configure({
  props: [
    styleTags({
      "LetKeyword AnimationKeyword": tags.keyword,
      Boolean: tags.bool,
      Number: tags.number,
      String: tags.string,
      "LineComment BlockComment": tags.comment,
      "ObjectType/ObjectTypeIdentifier": tags.typeName,
      "LetName/Identifier ObjectName/Identifier": tags.definition(tags.variableName),
      "CommandName/Identifier": tags.propertyName,
      "Reference/Identifier": tags.variableName,
      '"{" "}"': tags.brace,
      '"[" "]"': tags.squareBracket,
      '"(" ")"': tags.paren,
      '"."': tags.derefOperator,
      '"+" "-" "*" "/"': tags.arithmeticOperator,
    }),
  ],
});

export interface CliOptions {
  input: string;
  output: string;
  canvas?: string;
  scale: number;
  json: boolean;
}

export function parseArguments(args: string[]): CliOptions | undefined {
  if (args[0] !== "render" && args[0] && args[1] && args.slice(2).every((argument) => argument === "--json")) {
    return { input: args[0], output: args[1], scale: 1, json: args.includes("--json") };
  }
  if (args[0] !== "render" || !args[1]) return undefined;
  let output: string | undefined;
  let canvas: string | undefined;
  let scale = 1;
  let json = false;
  for (let index = 2; index < args.length; index += 1) {
    const argument = args[index];
    if ((argument === "-o" || argument === "--output") && args[index + 1]) output = args[++index];
    else if (argument === "--canvas" && args[index + 1]) canvas = args[++index];
    else if (argument === "--scale" && args[index + 1]) scale = Number(args[++index]);
    else if (argument === "--json") json = true;
    else return undefined;
  }
  if (!output || !Number.isFinite(scale) || scale <= 0) return undefined;
  return { input: args[1], output, ...(canvas ? { canvas } : {}), scale, json };
}

/**
 * @name dye
 * @version 1.0.0
 * @author MahdiDevRoom
 * @license MIT
 * @see https://github.com/MahdiDevRoom/dye
 */
export type EffectName = 'bold' | 'dim' | 'italic' | 'underline' | 'blink' | 'inverse' | 'hidden' | 'strikethrough';
export type ColorName = 'black' | 'brightBlack' | 'red' | 'brightRed' | 'green' | 'brightGreen' | 'yellow' | 'brightYellow' | 'blue' | 'brightBlue' | 'magenta' | 'brightMagenta' | 'cyan' | 'brightCyan' | 'white' | 'brightWhite';
export type RgbValue = `rgb(${number} ${number} ${number})`;
export type CodeValue = `code(${number})`;
export type ColorValue = ColorName | RgbValue | CodeValue | (string & {});
export interface AnsiEffectMap {
    bold: string;
    dim: string;
    italic: string;
    underline: string;
    blink: string;
    inverse: string;
    hidden: string;
    strikethrough: string;
}
export interface AnsiTrueColorMap {
    black: string;
    brightBlack: string;
    red: string;
    brightRed: string;
    green: string;
    brightGreen: string;
    yellow: string;
    brightYellow: string;
    blue: string;
    brightBlue: string;
    magenta: string;
    brightMagenta: string;
    cyan: string;
    brightCyan: string;
    white: string;
    brightWhite: string;
}
export interface AnsiFuncColorMap {
    rgb: (r: number, g: number, b: number) => string;
    code: (c: number) => string;
}
export interface AnsiColorMap extends AnsiTrueColorMap, AnsiFuncColorMap {
}
export interface AnsiMap {
    reset: string;
    ef: AnsiEffectMap;
    fg: AnsiColorMap;
    bg: AnsiColorMap;
}
export interface Style {
    reset?: boolean;
    fg?: ColorValue;
    bg?: ColorValue;
    bold?: boolean;
    dim?: boolean;
    italic?: boolean;
    underline?: boolean;
    blink?: boolean;
    inverse?: boolean;
    hidden?: boolean;
    strikethrough?: boolean;
}
export interface AstTagNode {
    type: 'tag';
    value: Style;
}
export interface AstTextNode {
    type: 'text';
    value: string;
}
export type AstNode = AstTagNode | AstTextNode;
export interface StyledBlock {
    text: string;
    style?: Style;
}
export declare class Dye {
    #private;
    static readonly version = "1.0.0";
    static parseMarkup(markup: string): AstNode[];
    static parseAst(ast: AstNode[]): StyledBlock[];
    static parseStyle(input: StyledBlock[] | Style | undefined): string;
    static innerText(input: string | StyledBlock[]): string;
    static textLength(input: string | StyledBlock[]): number;
    static createTag(style?: Style): string;
    static createStyle(tag: string): Style;
    static render(input: string): string;
    static render(input: string, style: Style): string;
    static render(input: StyledBlock): string;
}

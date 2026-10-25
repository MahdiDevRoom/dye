/**
 * @name dye
 * @version 1.0.1
 * @author MahdiDevRoom
 * @license MIT
 * @see https://github.com/MahdiDevRoom/dye
 */
/* --------------------------------------------------------
  DYE
-------------------------------------------------------- */
export class Dye {
    static version = '1.0.1';
    // --- Privet values ------------------------------------
    static #STYLES = new Set([
        'bold', 'dim', 'italic', 'underline',
        'blink', 'inverse', 'hidden', 'strikethrough',
    ]);
    static #COLORS = new Set([
        'black', 'brightBlack', 'red', 'brightRed',
        'green', 'brightGreen', 'yellow', 'brightYellow',
        'blue', 'brightBlue', 'magenta', 'brightMagenta',
        'cyan', 'brightCyan', 'white', 'brightWhite',
    ]);
    static #ANSI = {
        reset: '\x1b[0m',
        ef: {
            bold: '\x1b[1m',
            dim: '\x1b[2m',
            italic: '\x1b[3m',
            underline: '\x1b[4m',
            blink: '\x1b[5m',
            inverse: '\x1b[7m',
            hidden: '\x1b[8m',
            strikethrough: '\x1b[9m',
        },
        fg: {
            black: '\x1b[30m', brightBlack: '\x1b[90m',
            red: '\x1b[31m', brightRed: '\x1b[91m',
            green: '\x1b[32m', brightGreen: '\x1b[92m',
            yellow: '\x1b[33m', brightYellow: '\x1b[93m',
            blue: '\x1b[34m', brightBlue: '\x1b[94m',
            magenta: '\x1b[35m', brightMagenta: '\x1b[95m',
            cyan: '\x1b[36m', brightCyan: '\x1b[96m',
            white: '\x1b[37m', brightWhite: '\x1b[97m',
            rgb: (r, g, b) => `\x1b[38;2;${r};${g};${b}m`,
            code: (c) => `\x1b[38;5;${c}m`,
        },
        bg: {
            black: '\x1b[40m', brightBlack: '\x1b[100m',
            red: '\x1b[41m', brightRed: '\x1b[101m',
            green: '\x1b[42m', brightGreen: '\x1b[102m',
            yellow: '\x1b[43m', brightYellow: '\x1b[103m',
            blue: '\x1b[44m', brightBlue: '\x1b[104m',
            magenta: '\x1b[45m', brightMagenta: '\x1b[105m',
            cyan: '\x1b[46m', brightCyan: '\x1b[106m',
            white: '\x1b[47m', brightWhite: '\x1b[107m',
            rgb: (r, g, b) => `\x1b[48;2;${r};${g};${b}m`,
            code: (c) => `\x1b[48;5;${c}m`,
        },
    };
    static #SYNTAX = {
        START: '<!',
        END: '>',
        SEPARATOR: ':',
        ARG: {
            START: '(',
            END: ')',
            SEPARATOR: ' ',
        },
    };
    static #ALIASES = {
        '': 'reset',
        'error': 'fg:brightRed bold',
        'warning': 'fg:yellow bold',
        'info': 'fg:brightCyan',
        'success': 'fg:brightGreen',
    };
    static #REGEXP = (() => {
        const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const start = escapeRegExp(Dye.#SYNTAX.START);
        const end = escapeRegExp(Dye.#SYNTAX.END);
        const sep = escapeRegExp(Dye.#SYNTAX.SEPARATOR);
        const argStart = escapeRegExp(Dye.#SYNTAX.ARG.START);
        const argEnd = escapeRegExp(Dye.#SYNTAX.ARG.END);
        const argSep = escapeRegExp(Dye.#SYNTAX.ARG.SEPARATOR);
        return {
            tag: new RegExp(`(${start}[^${end}]*${end})`, 'g'),
            current: new RegExp(`${start}([^${end}]*)${end}`),
            isTag: new RegExp(`^${start}[^${end}]*${end}$`),
            attr: new RegExp(`(\\w+)(?:${sep}([^\\s${argStart}]+)(?:${argStart}([^${argEnd}]*)${argEnd})?)?`, 'g'),
            rgb: new RegExp(`^rgb${argStart}\\s*(\\d+)\\s*${argSep}\\s*(\\d+)\\s*${argSep}\\s*(\\d+)\\s*${argEnd}$`),
            code: new RegExp(`^code${argStart}\\s*(\\d+)\\s*${argEnd}$`),
        };
    })();
    // --- Private Methods ----------------------------------
    static #resolveAlias(content) {
        const trimmed = content.trim();
        return Object.prototype.hasOwnProperty.call(Dye.#ALIASES, trimmed)
            ? Dye.#ALIASES[trimmed]
            : content;
    }
    static #isValidByte(val) {
        return Number.isInteger(val) && val >= 0 && val <= 255;
    }
    static #validateColor(value) {
        // rgb(r g b)
        if (Dye.#REGEXP.rgb.test(value)) {
            const nums = value.match(/\d+/g).map(Number);
            const [r, g, b] = nums;
            return Dye.#isValidByte(r) && Dye.#isValidByte(g) && Dye.#isValidByte(b);
        }
        // code(n)
        if (Dye.#REGEXP.code.test(value)) {
            const code = Number(value.match(/\d+/)[0]);
            return Dye.#isValidByte(code);
        }
        // named color
        return Dye.#COLORS.has(value);
    }
    static #parseAttrs(content) {
        if (!content)
            return { reset: true };
        const matches = content.match(Dye.#REGEXP.attr);
        if (!matches)
            return null;
        const result = {};
        for (const attr of matches) {
            const sepIndex = attr.indexOf(Dye.#SYNTAX.SEPARATOR);
            if (sepIndex !== -1) {
                result[attr.slice(0, sepIndex)] = attr.slice(sepIndex + 1);
            }
            else {
                result[attr] = true;
            }
        }
        return result;
    }
    static #applyStyle(current, styles) {
        if (styles.reset === true)
            return {};
        const result = { ...current };
        for (const [key, value] of Object.entries(styles)) {
            // color
            if (key === 'fg' || key === 'bg') {
                if (typeof value !== 'string')
                    continue;
                if (!Dye.#validateColor(value))
                    continue;
                result[key] = value;
                continue;
            }
            // reset 
            if (key === 'reset') {
                if (value === true)
                    return {};
                continue;
            }
            // effects
            if (Dye.#STYLES.has(key)) {
                if (value === true) {
                    result[key] = true;
                }
                else if (value === false) {
                    delete result[key];
                }
                continue;
            }
        }
        return result;
    }
    static #tagContent(token) {
        return token.slice(Dye.#SYNTAX.START.length, -Dye.#SYNTAX.END.length).trim();
    }
    static #styleToAnsi(kind, value) {
        const table = kind === 'fg' ? Dye.#ANSI.fg : Dye.#ANSI.bg;
        // rgb(r g b)
        if (Dye.#REGEXP.rgb.test(value)) {
            const [r, g, b] = value.match(/\d+/g).map(Number);
            return table.rgb(r, g, b);
        }
        // code(n)
        if (Dye.#REGEXP.code.test(value)) {
            const code = Number(value.match(/\d+/)[0]);
            return table.code(code);
        }
        // named color
        if (Dye.#COLORS.has(value)) {
            return table[value];
        }
        return '';
    }
    // --- Low Level Api ------------------------------------
    static parseMarkup(markup) {
        if (typeof markup !== 'string')
            return [];
        const ast = [];
        const parts = markup.split(Dye.#REGEXP.tag).filter(Boolean);
        for (const part of parts) {
            if (!Dye.#REGEXP.isTag.test(part)) {
                ast.push({ type: 'text', value: part });
                continue;
            }
            const rawContent = Dye.#tagContent(part);
            const resolved = Dye.#resolveAlias(rawContent);
            const attrs = Dye.#parseAttrs(resolved);
            if (attrs)
                ast.push({ type: 'tag', value: attrs });
            else
                ast.push({ type: 'text', value: part });
        }
        return ast;
    }
    static parseAst(ast) {
        if (!Array.isArray(ast))
            return [];
        const result = [];
        let current = {};
        for (const node of ast) {
            if (node.type === 'text') {
                if (node.value)
                    result.push({ text: node.value, style: { ...current } });
                continue;
            }
            if (node.value.reset === true) {
                result.push({ text: '', style: { reset: true } });
                current = {};
            }
            else {
                current = Dye.#applyStyle(current, node.value);
            }
        }
        return result;
    }
    static parseStyle(input) {
        if (Array.isArray(input)) {
            let out = '';
            for (const block of input) {
                out += Dye.parseStyle(block.style) + block.text;
            }
            return out;
        }
        if (!input)
            return '';
        if (input.reset === true)
            return Dye.#ANSI.reset;
        let out = '';
        for (const [key, value] of Object.entries(input)) {
            if (key === 'fg' || key === 'bg') {
                if (typeof value !== 'string')
                    continue;
                out += Dye.#styleToAnsi(key, value);
                continue;
            }
            if (value === true && Dye.#STYLES.has(key)) {
                out += Dye.#ANSI.ef[key];
            }
        }
        return out;
    }
    // --- High Level API -----------------------------------
    static innerText(input) {
        if (Array.isArray(input)) {
            let out = '';
            for (const block of input) {
                if (typeof block.text === 'string')
                    out += block.text;
            }
            return out;
        }
        if (typeof input === 'string') {
            let out = '';
            for (const node of Dye.parseMarkup(input)) {
                if (node.type === 'text')
                    out += node.value;
            }
            return out;
        }
        return '';
    }
    static textLength(input) {
        return Dye.innerText(input).length;
    }
    static createTag(style = {}) {
        const validated = Dye.#applyStyle({}, style);
        const parts = [];
        if (style.reset === true)
            parts.push('reset');
        for (const [key, value] of Object.entries(validated)) {
            if (key === 'fg' || key === 'bg') {
                if (typeof value === 'string')
                    parts.push(`${key}${Dye.#SYNTAX.SEPARATOR}${value}`);
                continue;
            }
            if (value === true)
                parts.push(key);
        }
        return `${Dye.#SYNTAX.START} ${parts.join(' ')} ${Dye.#SYNTAX.END}`;
    }
    static createStyle(tag) {
        const content = Dye.#REGEXP.isTag.test(tag)
            ? Dye.#tagContent(tag)
            : tag.trim();
        const attrs = Dye.#parseAttrs(content);
        if (!attrs)
            return {};
        return Dye.#applyStyle({}, attrs);
    }
    static render(input, style) {
        // render('Hello', { fg: 'red' })
        if (typeof input === 'string' && style) {
            const applied = Dye.#applyStyle({}, style);
            return Dye.parseStyle(applied) + input + Dye.#ANSI.reset;
        }
        // render("Hello <!error> World")
        if (typeof input === 'string') {
            return Dye.parseStyle(Dye.parseAst(Dye.parseMarkup(input)));
        }
        // render({ text: 'Hello', style: { fg: 'red' } })
        if (typeof input === 'object' && input !== null && 'text' in input) {
            const block = input;
            const applied = Dye.#applyStyle({}, block.style ?? {});
            return Dye.parseStyle(applied) + block.text + Dye.#ANSI.reset;
        }
        return '';
    }
}

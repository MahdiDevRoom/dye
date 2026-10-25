# dye

Markup-based terminal styling — lightweight, typed, and dependency-free.

Write `<![...]>` tags inline, get ANSI escape codes out. No template literals, no chains, no dependencies.

## Installation

Install directly from GitHub:

```bash
npm i github:mahdidevroom/dye
```

### Troubleshooting

#### npm 12.x:
```bash
npm install github:mahdidevroom/dye --allow-git=all
```

Or

```bash
npm config set allow-git=all
npm i github:mahdidevroom/dye
```

#### npm 11.x:
```bash
npm install github:mahdidevroom/dye --userconfig=/dev/null
```

## Quick start

```ts
import { Dye } from 'dye';

console.log(Dye.render('<!fg:green>Hello<!> World'));
```

Output: `Hello` printed in green, followed by ` World` in the default color.

## Why markup?

Instead of chaining helpers:

```ts
ANSI.fg.red + ANSI.ef.bold + 'Error' + ANSI.reset
```

you write:

```ts
Dye.render('<!error>Error<!>')
```

Tags are **inline**, **nestable** (via reset), and **aliasable** (`<!error>`, `<!warning>`, …).

## Syntax

| Part      | Example              | Description                        |
|-----------|----------------------|------------------------------------|
| Start     | `<!`                 | Opens a tag                        |
| End       | `>`                  | Closes a tag                       |
| Separator | `:`                  | Separates key from value           |
| Args      | `(` … `)`            | Parameters for `rgb` / `code`      |
| Reset     | `<!>`                | Resets all styles                  |

### Examples

```ts
Dye.render('<!fg:red>red<!>')
Dye.render('<!bg:blue fg:white>white on blue<!>')
Dye.render('<!bold underline>bold + underline<!>')
Dye.render('<!fg:rgb(255 128 0)>orange<!>')
Dye.render('<!fg:code(200)>256-color<!>')
```

## Aliases

| Alias      | Expands to               |
|------------|--------------------------|
| `<!...>`   | `reset`                  |
| `<!error>` | `fg:brightRed bold`      |
| `<!warning>` | `fg:yellow bold`       |
| `<!info>`  | `fg:brightCyan`          |
| `<!success>` | `fg:brightGreen`       |

```ts
Dye.render('<!error>Something went wrong<!>')
Dye.render('<!warning>Careful<!>')
Dye.render('<!info>FYI<!>')
Dye.render('<!success>Done<!>')
```

## API overview

The `Dye` class is entirely static. No instances, no state — just functions.

| Method           | Description                                           |
|------------------|-------------------------------------------------------|
| `version`        | Package version string                                |
| `render`         | Render markup, `{ text, style }`, or `string + style` |
| `parseMarkup`    | Parse markup string → AST                             |
| `parseAst`       | AST → `{ text, style }[]`                             |
| `parseStyle`     | `{ text, style }[]` or `Style` → ANSI string          |
| `createTag`      | `Style` → markup tag                                  |
| `createStyle`    | markup tag → `Style`                                  |
| `innerText`      | Extract plain text from markup or blocks              |
| `textLength`     | Visible length (ANSI stripped)                        |
| `validation`     | Validate a style (silent — see note)                  |

> **Note:** `dye` is intentionally **silent** on invalid input. Invalid colors, styles, and tags are ignored, not thrown or logged. This matches libraries like `chalk`, `kleur`, and `picocolors`.

## `render`

`render` accepts three shapes:

```ts
// 1. Markup string
Dye.render('<!fg:red>Hello<!> World')

// 2. String + style
Dye.render('Hello', { fg: 'red', bold: true })

// 3. Block object
Dye.render({ text: 'Hello', style: { fg: 'green' } })
```

All three return an ANSI string ending with `\x1b[0m`.

## Style

A `Style` is a plain object. All keys are optional.

```ts
interface Style {
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
```

### Colors

`fg` and `bg` accept:

| Form              | Example                 |
|-------------------|-------------------------|
| Named color       | `'red'`, `'brightCyan'` |
| 24-bit RGB        | `'rgb(255 128 0)'`    |
| 256-color code    | `'code(200)'`           |

Named colors (16, matching ANSI):

`black`, `brightBlack`, `red`, `brightRed`, `green`, `brightGreen`,
`yellow`, `brightYellow`, `blue`, `brightBlue`, `magenta`, `brightMagenta`,
`cyan`, `brightCyan`, `white`, `brightWhite`.

### Effects

`bold`, `dim`, `italic`, `underline`, `blink`, `inverse`, `hidden`, `strikethrough`.

Effects and `reset` accept `boolean`:
- `true` → apply
- `false` → remove (for effects)

## Low-level API

If you want to build your own renderer:

```ts
const ast = Dye.parseMarkup('<!fg:red>Hello<!> World');
// [
//   { type: 'tag', value: { fg: 'red' } },
//   { type: 'text', value: 'Hello' },
//   { type: 'tag', value: { reset: true } },
//   { type: 'text', value: ' World' },
// ]

const blocks = Dye.parseAst(ast);
// [
//   { text: 'Hello', style: { fg: 'red' } },
//   { text: '',      style: { reset: true } },
//   { text: ' World', style: {} },
// ]

const ansi = Dye.parseStyle(blocks);
// '\x1b[31mHello\x1b[0m World'
```

## Utilities

### `innerText`

```ts
Dye.innerText('<!fg:red>Hello<!> World');  // 'Hello World'
Dye.innerText([{ text: 'a' }, { text: 'b' }]);  // 'ab'
```

### `textLength`

```ts
Dye.textLength('<!fg:red>Hello<!> World');  // 11
```

### `createTag` / `createStyle`

```ts
Dye.createTag({ fg: 'red', bold: true });   // '<! fg:red bold >'
Dye.createStyle('<!fg:red bold>');           // { fg: 'red', bold: true }
```

## TypeScript

The package ships its own types. No `@types/*` needed.

```ts
import { Dye, Style, ColorName, EffectName } from 'dye';

const style: Style = { fg: 'red', bold: true };
const name: ColorName = 'brightCyan';  // ✅
const name2: ColorName = 'notacolor';  // ❌ compile error
```

## Examples

### Colored logging

```ts
const log = (...args: unknown[]) =>
  console.log(Dye.render('<!fg:brightCyan>[log]<!>'), ...args);

log('Hello');
```

### Rainbow text

```ts
const rainbow = (s: string) => {
  const colors = ['red','yellow','green','cyan','blue','magenta'] as const;
  return [...s]
    .map((ch, i) => Dye.render(ch, { fg: colors[i % colors.length] }))
    .join('');
};

console.log(rainbow('HELLO!'));
```

### A tiny color helper

```ts
const green = (s: string) => Dye.render(s, { fg: 'green' });
const red   = (s: string) => Dye.render(s, { fg: 'red' });

console.log(green('OK'));
console.log(red('FAIL'));
```

## License

[MIT](./LICENSE) © MahdiDevRoom

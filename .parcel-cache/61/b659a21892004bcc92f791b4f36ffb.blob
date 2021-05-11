"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Parser = Parser;
exports.toValue = exports.toPromise = exports.takeLeft = exports.takeRight = exports.recursiveParser = exports.optionalWhitespace = exports.whitespace = exports.endOfInput = exports.startOfInput = exports.skip = exports.possibly = exports.lookAhead = exports.anyCharExcept = exports.anythingExcept = exports.everyCharUntil = exports.everythingUntil = exports.between = exports.choice = exports.sepBy1 = exports.sepBy = exports.sequenceOf = exports.namedSequenceOf = exports.anyOfString = exports.letters = exports.letter = exports.digits = exports.digit = exports.regex = exports.str = exports.peek = exports.anyChar = exports.char = exports.errorMapTo = exports.mapTo = exports.many1 = exports.many = exports.exactly = exports.coroutine = exports.either = exports.succeedWith = exports.fail = exports.decide = exports.parse = exports.tapParser = exports.composeParsers = exports.pipeParsers = exports.withData = exports.mapData = exports.setData = exports.getData = void 0;
const reDigit = /[0-9]/;
const reDigits = /^[0-9]+/;
const reLetter = /[a-zA-Z]/;
const reLetters = /^[a-zA-Z]+/;
const reWhitespaces = /^\s+/;
const reErrorExpectation = /ParseError.+Expecting/;

const isTypedArray = x => x instanceof Uint8Array || x instanceof Uint8ClampedArray || x instanceof Int8Array || x instanceof Uint16Array || x instanceof Int16Array || x instanceof Uint32Array || x instanceof Int32Array || x instanceof Float32Array || x instanceof Float64Array;

const inputTypes = {
  STRING: 'string',
  ARRAY_BUFFER: 'arrayBuffer',
  TYPED_ARRAY: 'typedArray',
  DATA_VIEW: 'dataView'
};
const text = {};

if (typeof TextEncoder !== 'undefined') {
  text.Encoder = TextEncoder;
  text.Decoder = TextDecoder;
} else {
  try {
    const util = require('util');

    text.Encoder = util.TextEncoder;
    text.Decoder = util.TextDecoder;
  } catch (ex) {
    throw new Error('Arcsecond requires TextEncoder and TextDecoder to be polyfilled.');
  }
}

const encoder = new text.Encoder();
const decoder = new text.Decoder();

const getString = (index, length, dataView) => {
  const bytes = Uint8Array.from({
    length
  }, (_, i) => dataView.getUint8(index + i));
  const decodedString = decoder.decode(bytes);
  return decodedString;
};

const getNextCharWidth = (index, dataView) => {
  const byte = dataView.getUint8(index);
  if ((byte & 0x80) >> 7 === 0) return 1;else if ((byte & 0xe0) >> 5 === 0b110) return 2;else if ((byte & 0xf0) >> 4 === 0b1110) return 3;else if ((byte & 0xf0) >> 4 === 0b1111) return 4;
  return 1;
};

const getUtf8Char = (index, length, dataView) => {
  const bytes = Uint8Array.from({
    length
  }, (_, i) => dataView.getUint8(index + i));
  return decoder.decode(bytes);
};

const getCharacterLength = str => {
  let cp;
  let total = 0;
  let i = 0;

  while (i < str.length) {
    cp = str.codePointAt(i);

    while (cp) {
      cp = cp >> 8;
      i++;
    }

    total++;
  }

  return total;
};

const createParserState = (target, data = null) => {
  let dataView;
  let inputType;

  if (typeof target === 'string') {
    const bytes = encoder.encode(target);
    dataView = new DataView(bytes.buffer);
    inputType = inputTypes.STRING;
  } else if (target instanceof ArrayBuffer) {
    dataView = new DataView(target);
    inputType = inputTypes.ARRAY_BUFFER;
  } else if (isTypedArray(target)) {
    dataView = new DataView(target.buffer);
    inputType = inputTypes.TYPED_ARRAY;
  } else if (target instanceof DataView) {
    dataView = target;
    inputType = inputTypes.DATA_VIEW;
  } else {
    throw new Error(`Cannot process input. Must be a string, ArrayBuffer, TypedArray, or DataView. but got ${typeof target}`);
  }

  return {
    dataView,
    inputType,
    isError: false,
    error: null,
    data,
    index: 0,
    result: null
  };
};

const updateError = (state, error) => ({ ...state,
  isError: true,
  error
});

const updateResult = (state, result) => ({ ...state,
  result
});

const updateData = (state, data) => ({ ...state,
  data
});

const updateParserState = (state, result, index) => ({ ...state,
  result,
  index
});

function Parser(p) {
  this.p = p;
}

Parser.prototype.run = function Parser$run(target) {
  const state = createParserState(target, null);
  const resultState = this.p(state);

  if (resultState.isError) {
    return {
      isError: true,
      error: resultState.error,
      index: resultState.index,
      data: resultState.data
    };
  }

  return {
    isError: false,
    result: resultState.result,
    index: resultState.index,
    data: resultState.data
  };
};

Parser.prototype.fork = function Parser$fork(target, errorFn, successFn) {
  const state = createParserState(target);
  const newState = this.p(state);

  if (newState.isError) {
    return errorFn(newState.error, newState);
  }

  return successFn(newState.result, newState);
};

Parser.prototype['fantasy-land/map'] = function Parser$map(fn) {
  const p = this.p;
  return new Parser(function Parser$map$state(state) {
    const newState = p(state);
    if (newState.isError) return newState;
    return updateResult(newState, fn(newState.result));
  });
};

Parser.prototype['fantasy-land/chain'] = function Parser$chain(fn) {
  const p = this.p;
  return new Parser(function Parser$chain$state(state) {
    const newState = p(state);
    if (newState.isError) return newState;
    return fn(newState.result).p(newState);
  });
};

Parser.prototype['fantasy-land/ap'] = function Parser$ap(parserOfFunction) {
  const p = this.p;
  return new Parser(function Parser$ap$state(state) {
    if (state.isError) return state;
    const argumentState = p(state);
    if (argumentState.isError) return argumentState;
    const fnState = parserOfFunction.p(argumentState);
    if (fnState.isError) return fnState;
    return updateResult(fnState, fnState.result(argumentState.result));
  });
};

Parser.prototype.errorMap = function Parser$errorMap(fn) {
  const p = this.p;
  return new Parser(function Parser$errorMap$state(state) {
    const nextState = p(state);
    if (!nextState.isError) return nextState;
    return updateError(nextState, fn({
      error: nextState.error,
      index: nextState.index,
      data: nextState.data
    }));
  });
};

Parser.prototype.errorChain = function Parser$errorChain(fn) {
  const p = this.p;
  return new Parser(function Parser$errorChain$state(state) {
    const nextState = p(state);

    if (nextState.isError) {
      const {
        error,
        index,
        data
      } = nextState;
      const nextParser = fn({
        error,
        index,
        data
      });
      return nextParser.p({ ...nextState,
        isError: false
      });
    }

    return nextState;
  });
};

Parser.prototype.mapFromData = function Parser$mapFromData(fn) {
  const p = this.p;
  return new Parser(function Parser$mapFromData$state(state) {
    const newState = p(state);
    if (newState.error) return newState;
    return updateResult(newState, fn({
      result: newState.result,
      data: newState.data
    }));
  });
};

Parser.prototype.chainFromData = function Parser$chainFromData(fn) {
  const p = this.p;
  return new Parser(function Parser$chainFromData$state(state) {
    const newState = p(state);
    if (newState.error) return newState;
    return fn({
      result: newState.result,
      data: newState.data
    }).p(newState);
  });
};

Parser.prototype.mapData = function Parser$mapData(fn) {
  const p = this.p;
  return new Parser(function mapData$state(state) {
    const newState = p(state);
    return updateData(newState, fn(newState.data));
  });
};

Parser['fantasy-land/of'] = function Parser$of(x) {
  return new Parser(state => updateResult(state, x));
};

Parser.prototype.map = Parser.prototype['fantasy-land/map'];
Parser.prototype.ap = Parser.prototype['fantasy-land/ap'];
Parser.prototype.chain = Parser.prototype['fantasy-land/chain'];
Parser.of = Parser['fantasy-land/of'];
const getData = new Parser(function getData$state(state) {
  if (state.isError) return state;
  return updateResult(state, state.data);
});
exports.getData = getData;

const setData = function setData(x) {
  return new Parser(function setData$state(state) {
    if (state.isError) return state;
    return updateData(state, x);
  });
};

exports.setData = setData;

const mapData = function mapData(fn) {
  return new Parser(function mapData$state(state) {
    if (state.isError) return state;
    return updateData(state, fn(state.data));
  });
};

exports.mapData = mapData;

const withData = function withData(parser) {
  return function withData$stateData(stateData) {
    return setData(stateData).chain(() => parser);
  };
};

exports.withData = withData;

const pipeParsers = function pipeParsers(parsers) {
  return new Parser(function pipeParsers$state(state) {
    let nextState = state;

    for (const parser of parsers) {
      nextState = parser.p(nextState);
    }

    return nextState;
  });
};

exports.pipeParsers = pipeParsers;

const composeParsers = function composeParsers(parsers) {
  return new Parser(function composeParsers$state(state) {
    return pipeParsers([...parsers].reverse()).p(state);
  });
};

exports.composeParsers = composeParsers;

const tapParser = function tapParser(fn) {
  return new Parser(function tapParser$state(state) {
    fn(state);
    return state;
  });
};

exports.tapParser = tapParser;

const parse = function parse(parser) {
  return function parse$targetString(target) {
    return parser.run(target);
  };
};

exports.parse = parse;

const decide = function decide(fn) {
  return new Parser(function decide$state(state) {
    if (state.isError) return state;
    const parser = fn(state.result);
    return parser.p(state);
  });
};

exports.decide = decide;

const fail = function fail(errorMessage) {
  return new Parser(function fail$state(state) {
    if (state.isError) return state;
    return updateError(state, errorMessage);
  });
};

exports.fail = fail;
const succeedWith = Parser.of;
exports.succeedWith = succeedWith;

const either = function either(parser) {
  return new Parser(function either$state(state) {
    if (state.isError) return state;
    const nextState = parser.p(state);
    return updateResult({ ...nextState,
      isError: false
    }, {
      isError: nextState.isError,
      value: nextState.isError ? nextState.error : nextState.result
    });
  });
};

exports.either = either;

const coroutine = function coroutine(g) {
  return new Parser(function coroutine$state(state) {
    const generator = g();
    let nextValue = undefined;
    let nextState = state;

    while (true) {
      const result = generator.next(nextValue);
      const value = result.value;
      const done = result.done;

      if (!done && !(value && value instanceof Parser)) {
        throw new Error(`[coroutine] yielded values must be Parsers, got ${result.value}.`);
      }

      if (done) {
        return updateResult(nextState, value);
      }

      nextState = value.p(nextState);

      if (nextState.isError) {
        return nextState;
      }

      nextValue = nextState.result;
    }
  });
};

exports.coroutine = coroutine;

const exactly = function exactly(n) {
  if (typeof n !== 'number' || n <= 0) {
    throw new TypeError(`exactly must be called with a number > 0, but got ${n}`);
  }

  return function exactly$factory(parser) {
    return new Parser(function exactly$factory$state(state) {
      if (state.isError) return state;
      const results = [];
      let nextState = state;

      for (let i = 0; i < n; i++) {
        const out = parser.p(nextState);

        if (out.isError) {
          return out;
        } else {
          nextState = out;
          results.push(nextState.result);
        }
      }

      return updateResult(nextState, results);
    }).errorMap(({
      index,
      error
    }) => `ParseError (position ${index}): Expecting ${n}${error.replace(reErrorExpectation, '')}`);
  };
};

exports.exactly = exactly;

const many = function many(parser) {
  return new Parser(function many$state(state) {
    if (state.isError) return state;
    const results = [];
    let nextState = state;

    while (true) {
      const out = parser.p(nextState);

      if (out.isError) {
        break;
      } else {
        nextState = out;
        results.push(nextState.result);

        if (nextState.index >= nextState.dataView.byteLength) {
          break;
        }
      }
    }

    return updateResult(nextState, results);
  });
};

exports.many = many;

const many1 = function many1(parser) {
  return new Parser(function many1$state(state) {
    if (state.isError) return state;
    const resState = many(parser).p(state);
    if (resState.result.length) return resState;
    return updateError(state, `ParseError 'many1' (position ${state.index}): Expecting to match at least one value`);
  });
};

exports.many1 = many1;

const mapTo = function mapTo(fn) {
  return new Parser(function mapTo$state(state) {
    if (state.isError) return state;
    return updateResult(state, fn(state.result));
  });
};

exports.mapTo = mapTo;

const errorMapTo = function errorMapTo(fn) {
  return new Parser(function errorMapTo$state(state) {
    if (!state.isError) return state;
    return updateError(state, fn(state.error, state.index, state.data));
  });
};

exports.errorMapTo = errorMapTo;

const char = function char(c) {
  if (!c || getCharacterLength(c) !== 1) {
    throw new TypeError(`char must be called with a single character, but got ${c}`);
  }

  return new Parser(function char$state(state) {
    if (state.isError) return state;
    const {
      index,
      dataView
    } = state;

    if (index < dataView.byteLength) {
      const charWidth = getNextCharWidth(index, dataView);

      if (index + charWidth <= dataView.byteLength) {
        const char = getUtf8Char(index, charWidth, dataView);
        return char === c ? updateParserState(state, c, index + charWidth) : updateError(state, `ParseError (position ${index}): Expecting character '${c}', got '${char}'`);
      }
    }

    return updateError(state, `ParseError (position ${index}): Expecting character '${c}', but got end of input.`);
  });
};

exports.char = char;
const anyChar = new Parser(function anyChar$state(state) {
  if (state.isError) return state;
  const {
    index,
    dataView
  } = state;

  if (index < dataView.byteLength) {
    const charWidth = getNextCharWidth(index, dataView);

    if (index + charWidth <= dataView.byteLength) {
      const char = getUtf8Char(index, charWidth, dataView);
      return updateParserState(state, char, index + charWidth);
    }
  }

  return updateError(state, `ParseError (position ${index}): Expecting a character, but got end of input.`);
});
exports.anyChar = anyChar;
const peek = new Parser(function peek$state(state) {
  if (state.isError) return state;
  const {
    index,
    dataView
  } = state;

  if (index < dataView.byteLength) {
    return updateParserState(state, dataView.getUint8(index), index);
  }

  return updateError(state, `ParseError (position ${index}): Unexpected end of input.`);
});
exports.peek = peek;

const str = function str(s) {
  if (!s || getCharacterLength(s) < 1) {
    throw new TypeError(`str must be called with a string with length > 1, but got ${s}`);
  }

  const encodedStr = encoder.encode(s);
  return new Parser(function str$state(state) {
    const {
      index,
      dataView
    } = state;
    const remainingBytes = dataView.byteLength - index;

    if (remainingBytes < encodedStr.byteLength) {
      return updateError(state, `ParseError (position ${index}): Expecting string '${s}', but got end of input.`);
    }

    const stringAtIndex = getString(index, encodedStr.byteLength, dataView);
    return s === stringAtIndex ? updateParserState(state, s, index + encoder.encode(s).byteLength) : updateError(state, `ParseError (position ${index}): Expecting string '${s}', got '${stringAtIndex}...'`);
  });
};

exports.str = str;

const regex = function regex(re) {
  const typeofre = Object.prototype.toString.call(re);

  if (typeofre !== '[object RegExp]') {
    throw new TypeError(`regex must be called with a Regular Expression, but got ${typeofre}`);
  }

  if (re.toString()[1] !== '^') {
    throw new Error(`regex parsers must contain '^' start assertion.`);
  }

  return new Parser(function regex$state(state) {
    if (state.isError) return state;
    const {
      dataView,
      index
    } = state;
    const rest = getString(index, dataView.byteLength - index, dataView);

    if (rest.length >= 1) {
      const match = rest.match(re);
      return match ? updateParserState(state, match[0], index + encoder.encode(match[0]).byteLength) : updateError(state, `ParseError (position ${index}): Expecting string matching '${re}', got '${rest.slice(0, 5)}...'`);
    }

    return updateError(state, `ParseError (position ${index}): Expecting string matching '${re}', but got end of input.`);
  });
};

exports.regex = regex;
const digit = new Parser(function digit$state(state) {
  if (state.isError) return state;
  const {
    dataView,
    index
  } = state;

  if (dataView.byteLength > index) {
    const charWidth = getNextCharWidth(index, dataView);

    if (index + charWidth <= dataView.byteLength) {
      const char = getUtf8Char(index, charWidth, dataView);
      return dataView.byteLength && char && reDigit.test(char) ? updateParserState(state, char, index + charWidth) : updateError(state, `ParseError (position ${index}): Expecting digit, got '${char}'`);
    }
  }

  return updateError(state, `ParseError (position ${index}): Expecting digit, but got end of input.`);
});
exports.digit = digit;
const digits = regex(reDigits).errorMap(({
  index
}) => `ParseError (position ${index}): Expecting digits`);
exports.digits = digits;
const letter = new Parser(function letter$state(state) {
  if (state.isError) return state;
  const {
    index,
    dataView
  } = state;

  if (dataView.byteLength > index) {
    const charWidth = getNextCharWidth(index, dataView);

    if (index + charWidth <= dataView.byteLength) {
      const char = getUtf8Char(index, charWidth, dataView);
      return dataView.byteLength && char && reLetter.test(char) ? updateParserState(state, char, index + charWidth) : updateError(state, `ParseError (position ${index}): Expecting letter, got '${char}'`);
    }
  }

  return updateError(state, `ParseError (position ${index}): Expecting letter, but got end of input.`);
});
exports.letter = letter;
const letters = regex(reLetters).errorMap(({
  index
}) => `ParseError (position ${index}): Expecting letters`);
exports.letters = letters;

const anyOfString = function anyOfString(s) {
  return new Parser(function anyOfString$state(state) {
    if (state.isError) return state;
    const {
      dataView,
      index
    } = state;

    if (dataView.byteLength > index) {
      const charWidth = getNextCharWidth(index, dataView);

      if (index + charWidth <= dataView.byteLength) {
        const char = getUtf8Char(index, charWidth, dataView);
        return s.includes(char) ? updateParserState(state, char, index + charWidth) : updateError(state, `ParseError (position ${index}): Expecting any of the string "${s}", got ${char}`);
      }
    }

    return updateError(state, `ParseError (position ${index}): Expecting any of the string "${s}", but got end of input.`);
  });
};

exports.anyOfString = anyOfString;

const namedSequenceOf = function namedSequenceOf(pairedParsers) {
  return new Parser(function namedSequenceOf$state(state) {
    if (state.isError) return state;
    const results = {};
    let nextState = state;

    for (const [key, parser] of pairedParsers) {
      const out = parser.p(nextState);

      if (out.isError) {
        return out;
      } else {
        nextState = out;
        results[key] = out.result;
      }
    }

    return updateResult(nextState, results);
  });
};

exports.namedSequenceOf = namedSequenceOf;

const sequenceOf = function sequenceOf(parsers) {
  return new Parser(function sequenceOf$state(state) {
    if (state.isError) return state;
    const length = parsers.length;
    const results = new Array(length);
    let nextState = state;

    for (let i = 0; i < length; i++) {
      const out = parsers[i].p(nextState);

      if (out.isError) {
        return out;
      } else {
        nextState = out;
        results[i] = out.result;
      }
    }

    return updateResult(nextState, results);
  });
};

exports.sequenceOf = sequenceOf;

const sepBy = function sepBy(sepParser) {
  return function sepBy$valParser(valParser) {
    return new Parser(function sepBy$valParser$state(state) {
      if (state.isError) return state;
      let nextState = state;
      let error = null;
      const results = [];

      while (true) {
        const valState = valParser.p(nextState);
        const sepState = sepParser.p(valState);

        if (valState.isError) {
          error = valState;
          break;
        } else {
          results.push(valState.result);
        }

        if (sepState.isError) {
          nextState = valState;
          break;
        }

        nextState = sepState;
      }

      if (error) {
        if (results.length === 0) {
          return updateResult(state, results);
        }

        return error;
      }

      return updateResult(nextState, results);
    });
  };
};

exports.sepBy = sepBy;

const sepBy1 = function sepBy1(sepParser) {
  return function sepBy1$valParser(valParser) {
    return new Parser(function sepBy1$valParser$state(state) {
      if (state.isError) return state;
      const out = sepBy(sepParser)(valParser).p(state);
      if (out.isError) return out;

      if (out.result.length === 0) {
        return updateError(state, `ParseError 'sepBy1' (position ${state.index}): Expecting to match at least one separated value`);
      }

      return out;
    });
  };
};

exports.sepBy1 = sepBy1;

const choice = function choice(parsers) {
  return new Parser(function choice$state(state) {
    if (state.isError) return state;
    let error = null;

    for (const parser of parsers) {
      const out = parser.p(state);
      if (!out.isError) return out;

      if (!error || error && out.index > error.index) {
        error = out;
      }
    }

    return error;
  });
};

exports.choice = choice;

const between = function between(leftParser) {
  return function between$rightParser(rightParser) {
    return function between$parser(parser) {
      return sequenceOf([leftParser, parser, rightParser]).map(([_, x]) => x);
    };
  };
};

exports.between = between;

const everythingUntil = function everythingUntil(parser) {
  return new Parser(state => {
    if (state.isError) return state;
    const results = [];
    let nextState = state;

    while (true) {
      const out = parser.p(nextState);

      if (out.isError) {
        const {
          index,
          dataView
        } = nextState;

        if (dataView.byteLength <= index) {
          return updateError(nextState, `ParseError 'everythingUntil' (position ${nextState.index}): Unexpected end of input.`);
        }

        const val = dataView.getUint8(index);

        if (val) {
          results.push(val);
          nextState = updateParserState(nextState, val, index + 1);
        }
      } else {
        break;
      }
    }

    return updateResult(nextState, results);
  });
};

exports.everythingUntil = everythingUntil;

const everyCharUntil = parser => everythingUntil(parser).map(results => decoder.decode(Uint8Array.from(results)));

exports.everyCharUntil = everyCharUntil;

const anythingExcept = function anythingExcept(parser) {
  return new Parser(function anythingExcept$state(state) {
    if (state.isError) return state;
    const {
      dataView,
      index
    } = state;
    const out = parser.p(state);

    if (out.isError) {
      return updateParserState(state, dataView.getUint8(index), index + 1);
    }

    return updateError(state, `ParseError 'anythingExcept' (position ${index}): Matched '${out.result}' from the exception parser`);
  });
};

exports.anythingExcept = anythingExcept;

const anyCharExcept = function anyCharExcept(parser) {
  return new Parser(function anyCharExcept$state(state) {
    if (state.isError) return state;
    const {
      dataView,
      index
    } = state;
    const out = parser.p(state);

    if (out.isError) {
      if (index < dataView.byteLength) {
        const charWidth = getNextCharWidth(index, dataView);

        if (index + charWidth <= dataView.byteLength) {
          const char = getUtf8Char(index, charWidth, dataView);
          return updateParserState(state, char, index + charWidth);
        }
      }

      return updateError(state, `ParseError 'anyCharExcept' (position ${index}): Unexpected end of input`);
    }

    return updateError(state, `ParseError 'anyCharExcept' (position ${index}): Matched '${out.result}' from the exception parser`);
  });
};

exports.anyCharExcept = anyCharExcept;

const lookAhead = function lookAhead(parser) {
  return new Parser(function lookAhead$state(state) {
    if (state.isError) return state;
    const nextState = parser.p(state);
    return nextState.isError ? updateError(state, nextState.error) : updateResult(state, nextState.result);
  });
};

exports.lookAhead = lookAhead;

const possibly = function possibly(parser) {
  return new Parser(function possibly$state(state) {
    if (state.isError) return state;
    const nextState = parser.p(state);
    return nextState.isError ? updateResult(state, null) : nextState;
  });
};

exports.possibly = possibly;

const skip = function skip(parser) {
  return new Parser(function skip$state(state) {
    if (state.isError) return state;
    const nextState = parser.p(state);
    if (nextState.isError) return nextState;
    return updateResult(nextState, state.result);
  });
};

exports.skip = skip;
const startOfInput = new Parser(function startOfInput$state(state) {
  if (state.isError) return state;
  const {
    index
  } = state;

  if (index > 0) {
    return updateError(state, `ParseError 'startOfInput' (position ${index}): Expected start of input'`);
  }

  return state;
});
exports.startOfInput = startOfInput;
const endOfInput = new Parser(function endOfInput$state(state) {
  if (state.isError) return state;
  const {
    dataView,
    index,
    inputType
  } = state;

  if (index !== dataView.byteLength) {
    const errorByte = inputType === inputTypes.STRING ? String.fromCharCode(dataView.getUint8(index)) : `0x${dataView.getUint8(index).toString(16).padStart(2, '0')}`;
    return updateError(state, `ParseError 'endOfInput' (position ${index}): Expected end of input but got '${errorByte}'`);
  }

  return updateResult(state, null);
});
exports.endOfInput = endOfInput;
const whitespace = regex(reWhitespaces).errorMap(({
  index
}) => `ParseError 'many1' (position ${index}): Expecting to match at least one value`);
exports.whitespace = whitespace;
const optionalWhitespace = possibly(whitespace).map(x => x || '');
exports.optionalWhitespace = optionalWhitespace;

const recursiveParser = function recursiveParser(parserThunk) {
  return new Parser(function recursiveParser$state(state) {
    return parserThunk().p(state);
  });
};

exports.recursiveParser = recursiveParser;

const takeRight = function takeRight(leftParser) {
  return function takeRight$rightParser(rightParser) {
    return leftParser.chain(() => rightParser);
  };
};

exports.takeRight = takeRight;

const takeLeft = function takeLeft(leftParser) {
  return function takeLeft$rightParser(rightParser) {
    return leftParser.chain(x => rightParser.map(() => x));
  };
};

exports.takeLeft = takeLeft;

const toPromise = function toPromise(result) {
  return result.isError ? Promise.reject({
    error: result.error,
    index: result.index,
    data: result.data
  }) : Promise.resolve(result.result);
};

exports.toPromise = toPromise;

const toValue = function toValue(result) {
  if (result.isError) {
    const e = new Error(result.error);
    e.parseIndex = result.index;
    e.data = result.data;
    throw e;
  }

  return result.result;
};

exports.toValue = toValue;

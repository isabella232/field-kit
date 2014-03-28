!(function(e) {if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.FieldKit=e()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/** @const */ var CEILING = 0;
/** @const */ var FLOOR = 1;
/** @const */ var DOWN = 2;
/** @const */ var UP = 3;
/** @const */ var HALF_EVEN = 4;
/** @const */ var HALF_DOWN = 5;
/** @const */ var HALF_UP = 6;

/**
 * Enum for the available rounding modes.
 *
 * @type {number}
 */
var RoundingMode = {
  CEILING: CEILING,
  FLOOR: FLOOR,
  DOWN: DOWN,
  UP: UP,
  HALF_EVEN: HALF_EVEN,
  HALF_DOWN: HALF_DOWN,
  HALF_UP: HALF_UP
};

/** @const */ var NEG = '-';
/** @const */ var SEP = '.';
/** @const */ var NEG_PATTERN = '-';
/** @const */ var SEP_PATTERN = '\\.';
/** @const */ var NUMBER_PATTERN = new RegExp('^('+NEG_PATTERN+')?(\\d*)(?:'+SEP_PATTERN+'(\\d*))?$');

/**
 * Increments the given integer represented by a string by one.
 *
 *   increment('1');  // '2'
 *   increment('99'); // '100'
 *   increment('');   // '1'
 *
 * @param {string} strint
 * @return {string}
 * @private
 */
function increment(strint) {
  var length = strint.length;

  if (length === 0) {
    return '1';
  }

  var last = parseInt(strint[length-1], 10);

  if (last === 9) {
    return increment(strint.slice(0, length-1)) + '0';
  } else {
    return strint.slice(0, length-1) + (last+1);
  }
}

/**
 * Parses the given decimal string into its component parts.
 *
 *   parse('3.14');  // [false, '3', '14']
 *   parse('-3.45'); // [true, '3', '45']
 *
 * @param {string} strnum
 * @return {Array}
 */
function parse(strnum) {
  switch (strnum) {
    case 'NaN': case 'Infinity': case '-Infinity':
      return strnum;
  }

  var match = strnum.match(NUMBER_PATTERN);

  if (!match) {
    throw new Error('cannot round malformed number: '+strnum);
  }

  return [
    match[1] !== undefined,
    match[2],
    match[3] || ''
  ];
}

/**
 * Format the given number configuration as a number string.
 *
 *   format([false, '12', '34']); // '12.34'
 *   format([true, '8', '']);     // '-8'
 *   format([true, '', '7']);     // '-0.7'
 *
 * @param {Array} parts
 * @return {string}
 */
function format(parts) {
  var negative = parts[0];
  var intPart = parts[1];
  var fracPart = parts[2];

  if (intPart.length === 0) {
    intPart = '0';
  } else {
    var firstNonZeroIndex;
    for (firstNonZeroIndex = 0; firstNonZeroIndex < intPart.length; firstNonZeroIndex++) {
      if (intPart[firstNonZeroIndex] !== '0') {
        break;
      }
    }

    if (firstNonZeroIndex !== intPart.length) {
      intPart = intPart.slice(firstNonZeroIndex);
    }
  }

  return (negative ? NEG+intPart : intPart) + (fracPart.length ? SEP+fracPart : '');
}

/**
 * Shift the exponent of the given number (as a string) by the given amount.
 *
 *   shift('12', 2);  // '1200'
 *   shift('12', -2); // '0.12'
 *
 * @param {string|number|Array} strnum
 * @param {number} exponent
 * @return {string|Array}
 */
function shift(strnum, exponent) {
  if (typeof strnum === 'number') {
    strnum = ''+strnum;
  }

  var parsed;
  var shouldFormatResult = true;

  if (typeof strnum === 'string') {
    parsed = parse(strnum);

    if (typeof parsed === 'string') {
      return strnum;
    }

  } else {
    parsed = strnum;
    shouldFormatResult = false;
  }

  var negative = parsed[0];
  var intPart = parsed[1];
  var fracPart = parsed[2];
  var partToMove;

  if (exponent > 0) {
    partToMove = fracPart.slice(0, exponent);
    while (partToMove.length < exponent) {
      partToMove += '0';
    }
    intPart += partToMove;
    fracPart = fracPart.slice(exponent);
  } else if (exponent < 0) {
    while (intPart.length < -exponent) {
      intPart = '0' + intPart;
    }
    partToMove = intPart.slice(intPart.length + exponent);
    fracPart = partToMove + fracPart;
    intPart = intPart.slice(0, intPart.length - partToMove.length);
  }

  var result = [negative, intPart, fracPart];

  if (shouldFormatResult) {
    return format(result);
  } else {
    return result;
  }
}

/**
 * Round the given number represented by a string according to the given
 * precision and mode.
 *
 * @param {string|number} strnum
 * @param {number} precision
 * @param {RoundingMode} mode
 * @return {string}
 */
function round(strnum, precision, mode) {
  if (typeof strnum === 'number') {
    strnum = ''+strnum;
  }

  if (typeof strnum !== 'string') {
    throw new Error('expected a string or number, got: '+strnum);
  }

  if (strnum.length === 0) {
    return strnum;
  }

  if (typeof precision === 'undefined') {
    precision = 0;
  }

  if (typeof mode === 'undefined') {
    mode = HALF_EVEN;
  }

  var parsed = parse(strnum);

  if (typeof parsed === 'string') {
    return parsed;
  }

  if (precision > 0) {
    parsed = shift(parsed, precision);
  }

  var negative = parsed[0];
  var intPart = parsed[1];
  var fracPart = parsed[2];

  switch (mode) {
    case CEILING: case FLOOR: case UP:
      var foundNonZeroDigit = false;
      for (var i = 0, length = fracPart.length; i < length; i++) {
        if (fracPart[i] !== '0') {
          foundNonZeroDigit = true;
          break;
        }
      }
      if (foundNonZeroDigit) {
        if (mode === UP || (negative !== (mode === CEILING))) {
          intPart = increment(intPart);
        }
      }
      break;

    case HALF_EVEN: case HALF_DOWN: case HALF_UP:
      var shouldRoundUp = false;
      var firstFracPartDigit = parseInt(fracPart[0], 10);

      if (firstFracPartDigit > 5) {
        shouldRoundUp = true;
      } else if (firstFracPartDigit === 5) {
        if (mode === HALF_UP) {
          shouldRoundUp = true;
        }

        if (!shouldRoundUp) {
          for (var i = 1, length = fracPart.length; i < length; i++) {
            if (fracPart[i] !== '0') {
              shouldRoundUp = true;
              break;
            }
          }
        }

        if (!shouldRoundUp && mode === HALF_EVEN) {
          var lastIntPartDigit = parseInt(intPart[intPart.length-1], 10);
          shouldRoundUp = lastIntPartDigit % 2 !== 0;
        }
      }

      if (shouldRoundUp) {
        intPart = increment(intPart);
      }
      break;
  }

  return format(shift([negative, intPart, ''], -precision));
}

module.exports = {
  round: round,
  shift: shift,
  modes: RoundingMode
};

},{}],2:[function(_dereq_,module,exports){
/* jshint esnext:true */

var AmexCardFormatter = _dereq_('./amex_card_formatter');
var DefaultCardFormatter = _dereq_('./default_card_formatter');
var cardUtils = _dereq_('./card_utils');

var AdaptiveCardFormatter = function() {
      function AdaptiveCardFormatter() {
        this.amexCardFormatter = new AmexCardFormatter();
        this.defaultCardFormatter = new DefaultCardFormatter();
        this.formatter = this.defaultCardFormatter;
      }

      AdaptiveCardFormatter.prototype.format = function(pan) {
        return this._formatterForPan(pan).format(pan);
      };

      AdaptiveCardFormatter.prototype.parse = function(text, error) {
        return this.formatter.parse(text, error);
      };

      AdaptiveCardFormatter.prototype.isChangeValid = function(change) {
        this.formatter = this._formatterForPan(change.proposed.text);
        return this.formatter.isChangeValid(change);
      };

      AdaptiveCardFormatter.prototype._formatterForPan = function(pan) {
        if (cardUtils.determineCardType(pan.replace(/[^\d]+/g, '')) === cardUtils.AMEX) {
          return this.amexCardFormatter;
        } else {
          return this.defaultCardFormatter;
        }
      };

      return AdaptiveCardFormatter;
    }();

module.exports = AdaptiveCardFormatter;

},{"./amex_card_formatter":3,"./card_utils":5,"./default_card_formatter":6}],3:[function(_dereq_,module,exports){
/* jshint esnext:true */

var DefaultCardFormatter = _dereq_('./default_card_formatter');

var AmexCardFormatter = function() {
      function AmexCardFormatter() {
        Object.getPrototypeOf(AmexCardFormatter.prototype).constructor.apply(this, arguments);
      }

      AmexCardFormatter.__proto__ = DefaultCardFormatter;
      AmexCardFormatter.prototype = Object.create(DefaultCardFormatter.prototype);

      Object.defineProperty(AmexCardFormatter.prototype, "constructor", {
        value: AmexCardFormatter
      });

      AmexCardFormatter.prototype.hasDelimiterAtIndex = function(index) {
        return index === 4 || index === 11;
      };

      return AmexCardFormatter;
    }();

AmexCardFormatter.prototype.maximumLength = 15 + 2;
module.exports = AmexCardFormatter;

},{"./default_card_formatter":6}],4:[function(_dereq_,module,exports){
/* jshint esnext:true */

var TextField = _dereq_('./text_field');
var AdaptiveCardFormatter = _dereq_('./adaptive_card_formatter');
var cardUtils = _dereq_('./card_utils');

var CardMaskStrategy = {
  None: 'None',
  DoneEditing: 'DoneEditing'
};

var CardTextField = function() {
      function CardTextField(element) {
        Object.getPrototypeOf(CardTextField.prototype).constructor.call(this, element, new AdaptiveCardFormatter());
        this.setCardMaskStrategy(CardMaskStrategy.None);
      }

      CardTextField.__proto__ = TextField;
      CardTextField.prototype = Object.create(TextField.prototype);

      Object.defineProperty(CardTextField.prototype, "constructor", {
        value: CardTextField
      });

      CardTextField.prototype.cardType = function() {
        return cardUtils.determineCardType(this.value());
      };

      CardTextField.prototype.cardMaskStrategy = function() {
        return this._cardMaskStrategy;
      };

      CardTextField.prototype.setCardMaskStrategy = function(cardMaskStrategy) {
        if (cardMaskStrategy !== this._cardMaskStrategy) {
          this._cardMaskStrategy = cardMaskStrategy;
          this._syncMask();
        }

        return null;
      };

      CardTextField.prototype.cardMask = function() {
        var text   = this.text();
        var toMask = text.slice(0, -4);
        var last4  = text.slice(-4);

        return toMask.replace(/\d/g, '•') + last4;
      };

      CardTextField.prototype.text = function() {
        if (this._masked) {
          return this._unmaskedText;
        } else {
          return Object.getPrototypeOf(CardTextField.prototype).text.call(this);
        }
      };

      CardTextField.prototype.setText = function(text) {
        if (this._masked) {
          this._unmaskedText = text;
          text = this.cardMask();
        }
        Object.getPrototypeOf(CardTextField.prototype).setText.call(this, text);
      };

      CardTextField.prototype.textFieldDidEndEditing = function() {
        this._editing = false;
        this._syncMask();
      };

      CardTextField.prototype.textFieldDidBeginEditing = function() {
        this._editing = true;
        this._syncMask();
      };

      CardTextField.prototype._enableMasking = function() {
        if (!this._masked) {
          this._unmaskedText = this.text();
          this._masked = true;
          this.setText(this._unmaskedText);
        }
      };

      CardTextField.prototype._disableMasking = function() {
        if (this._masked) {
          this._masked = false;
          this.setText(this._unmaskedText);
          this._unmaskedText = null;
        }
      };

      CardTextField.prototype._syncMask = function() {
        if (this.cardMaskStrategy() === CardMaskStrategy.DoneEditing) {
          if (this._editing) {
            this._disableMasking();
          } else {
            this._enableMasking();
          }
        }
      };

      return CardTextField;
    }();

/**
 * Whether we are currently masking the displayed text.
 */
CardTextField.prototype._masked = false;

/**
 * Whether we are currently editing.
 */
CardTextField.prototype._editing = false;

CardTextField.CardMaskStrategy = CardMaskStrategy;
module.exports = CardTextField;

},{"./adaptive_card_formatter":2,"./card_utils":5,"./text_field":16}],5:[function(_dereq_,module,exports){
var AMEX        = 'amex';
var DISCOVER    = 'discover';
var JCB         = 'jcb';
var MASTERCARD  = 'mastercard';
var VISA        = 'visa';

function determineCardType(pan) {
  if (pan === null || pan === undefined) {
    return null;
  }

  pan = pan.toString();
  var firsttwo = parseInt(pan.slice(0, 2), 10);
  var iin = parseInt(pan.slice(0, 6), 10);
  var halfiin = parseInt(pan.slice(0, 3), 10);

  if (pan[0] === '4') {
    return VISA;
  } else if (pan.slice(0, 4) === '6011' || firsttwo === 65 || (halfiin >= 664 && halfiin <= 649) || (iin >= 622126 && iin <= 622925)) {
    return DISCOVER;
  } else if (pan.slice(0, 4) === '2131' || pan.slice(0, 4) === '1800' || firsttwo === 35) {
    return JCB;
  } else if (firsttwo >= 51 && firsttwo <= 55) {
    return MASTERCARD;
  } else if (firsttwo === 34 || firsttwo === 37) {
    return AMEX;
  }
}

function luhnCheck(pan) {
  var sum = 0;
  var flip = true;
  for (var i = pan.length - 1; i >= 0; i--) {
    var digit = parseInt(pan.charAt(i), 10);
    sum += (flip = !flip) ? Math.floor((digit * 2) / 10) + Math.floor(digit * 2 % 10) : digit;
  }

  return sum % 10 === 0;
}

function validCardLength(pan) {
  switch (determineCardType(pan)) {
    case VISA:
      return pan.length === 13 || pan.length === 16;
    case DISCOVER: case MASTERCARD:
      return pan.length === 16;
    case JCB:
      return pan.length === 15 || pan.length === 16;
    case AMEX:
      return pan.length === 15;
    default:
      return false;
  }
}

module.exports = {
  determineCardType: determineCardType,
  luhnCheck: luhnCheck,
  validCardLength: validCardLength,
  AMEX: AMEX,
  DISCOVER: DISCOVER,
  JCB: JCB,
  MASTERCARD: MASTERCARD,
  VISA: VISA
};

},{}],6:[function(_dereq_,module,exports){
/* jshint esnext:true */

var DelimitedTextFormatter = _dereq_('./delimited_text_formatter');
var cardUtils = _dereq_('./card_utils');

var DefaultCardFormatter = function() {
      function DefaultCardFormatter() {
        Object.getPrototypeOf(DefaultCardFormatter.prototype).constructor.apply(this, arguments);
      }

      DefaultCardFormatter.__proto__ = DelimitedTextFormatter;
      DefaultCardFormatter.prototype = Object.create(DelimitedTextFormatter.prototype);

      Object.defineProperty(DefaultCardFormatter.prototype, "constructor", {
        value: DefaultCardFormatter
      });

      DefaultCardFormatter.prototype.hasDelimiterAtIndex = function(index) {
        return index === 4 || index === 9 || index === 14;
      };

      DefaultCardFormatter.prototype.parse = function(text, error) {
        var value = this._valueFromText(text);
        if (typeof error === 'function') {
          if (!cardUtils.validCardLength(value)) {
            error('card-formatter.number-too-short');
          }
          if (!cardUtils.luhnCheck(value)) {
            error('card-formatter.invalid-number');
          }
        }
        return Object.getPrototypeOf(DefaultCardFormatter.prototype).parse.call(this, text, error);
      };

      DefaultCardFormatter.prototype._valueFromText = function(text) {
        return Object.getPrototypeOf(DefaultCardFormatter.prototype)._valueFromText.call(this, (text || '').replace(/[^\d]/g, ''));
      };

      return DefaultCardFormatter;
    }();

DefaultCardFormatter.prototype.delimiter = ' ';
DefaultCardFormatter.prototype.maximumLength = 16 + 3;
module.exports = DefaultCardFormatter;

},{"./card_utils":5,"./delimited_text_formatter":7}],7:[function(_dereq_,module,exports){
/* jshint esnext:true */

var Formatter = _dereq_('./formatter');

var DelimitedTextFormatter = function() {
      function DelimitedTextFormatter(delimiter) {
        if (!delimiter) { delimiter = this.delimiter; }
        if (delimiter === null || delimiter === undefined || delimiter.length !== 1) {
          throw new Error('delimiter must have just one character');
        }
        this.delimiter = delimiter;
      }

      DelimitedTextFormatter.__proto__ = Formatter;
      DelimitedTextFormatter.prototype = Object.create(Formatter.prototype);

      Object.defineProperty(DelimitedTextFormatter.prototype, "constructor", {
        value: DelimitedTextFormatter
      });

      DelimitedTextFormatter.prototype.delimiterAt = function(index) {
        if (!this.hasDelimiterAtIndex(index)) {
          return null;
        }
        return this.delimiter;
      };

      DelimitedTextFormatter.prototype.isDelimiter = function(chr) {
        return chr === this.delimiter;
      };

      DelimitedTextFormatter.prototype.format = function(value) {
        return this._textFromValue(value);
      };

      DelimitedTextFormatter.prototype._textFromValue = function(value) {
        if (!value) { return ''; }

        var result = '';
        var delimiter;

        for (var i = 0, l = value.length; i < l; i++) {
          while ((delimiter = this.delimiterAt(result.length))) {
            result += delimiter;
          }
          result += value[i];
          while ((delimiter = this.delimiterAt(result.length))) {
            result += delimiter;
          }
        }

        return result;
      };

      DelimitedTextFormatter.prototype.parse = function(text, error) {
        return this._valueFromText(text);
      };

      DelimitedTextFormatter.prototype._valueFromText = function(text) {
        if (!text) { return ''; }
        var result = '';
        for (var i = 0, l = text.length; i < l; i++) {
          if (!this.isDelimiter(text[i])) {
            result += text[i];
          }
        }
        return result;
      };

      DelimitedTextFormatter.prototype.isChangeValid = function(change, error) {
        if (!Object.getPrototypeOf(DelimitedTextFormatter.prototype).isChangeValid.call(this, change, error)) {
          return false;
        }

        var newText = change.proposed.text;
        var range = change.proposed.selectedRange;
        var hasSelection = range.length !== 0;

        var startMovedLeft = range.start < change.current.selectedRange.start;
        var startMovedRight = range.start > change.current.selectedRange.start;
        var endMovedLeft = (range.start + range.length) < (change.current.selectedRange.start + change.current.selectedRange.length);
        var endMovedRight = (range.start + range.length) > (change.current.selectedRange.start + change.current.selectedRange.length);

        var startMovedOverADelimiter = startMovedLeft && this.hasDelimiterAtIndex(range.start) ||
                                        startMovedRight && this.hasDelimiterAtIndex(range.start - 1);
        var endMovedOverADelimiter = endMovedLeft && this.hasDelimiterAtIndex(range.start + range.length) ||
                                      endMovedRight && this.hasDelimiterAtIndex(range.start + range.length - 1);

        if (this.isDelimiter(change.deleted.text)) {
          var newCursorPosition = change.deleted.start - 1;
          // delete any immediately preceding delimiters
          while (this.isDelimiter(newText.charAt(newCursorPosition))) {
            newText = newText.substring(0, newCursorPosition) + newText.substring(newCursorPosition + 1);
            newCursorPosition--;
          }
          // finally delete the real character that was intended
          newText = newText.substring(0, newCursorPosition) + newText.substring(newCursorPosition + 1);
        }

        // adjust the cursor / selection
        if (startMovedLeft && startMovedOverADelimiter) {
          // move left over any immediately preceding delimiters
          while (this.delimiterAt(range.start - 1)) {
            range.start--;
            range.length++;
          }
          // finally move left over the real intended character
          range.start--;
          range.length++;
        }

        if (startMovedRight) {
          // move right over any immediately following delimiters
          // In all but one scenario, the cursor should already be placed after the delimiter group,
          // the one exception is when the format has a leading delimiter. In this case,
          // we need to move past all leading delimiters before placing the real character input
          while (this.delimiterAt(range.start)) {
            range.start++;
            range.length--;
          }
          // if the first character was a delimiter, then move right over the real character that was intended
          if (startMovedOverADelimiter) {
            range.start++;
            range.length--;
            // move right over any delimiters that might immediately follow the real character
            while (this.delimiterAt(range.start)) {
              range.start++;
              range.length--;
            }
          }
        }

        if (hasSelection) { // Otherwise, the logic for the range start takes care of everything.
          if (endMovedOverADelimiter) {
            if (endMovedLeft) {
              // move left over any immediately preceding delimiters
              while (this.delimiterAt(range.start + range.length - 1)) {
                range.length--;
              }
              // finally move left over the real intended character
              range.length--;
            }

            if (endMovedRight) {
              // move right over any immediately following delimters
              while (this.delimiterAt(range.start + range.length)) {
                range.length++;
              }
              // finally move right over the real intended character
              range.length++;
            }
          }

          // trailing delimiters in the selection
          while (this.hasDelimiterAtIndex(range.start + range.length - 1)) {
            if (startMovedLeft || endMovedLeft) {
              range.length--;
            } else {
              range.length++;
            }
          }

          while (this.hasDelimiterAtIndex(range.start)) {
            if (startMovedRight || endMovedRight) {
              range.start++;
              range.length--;
            } else {
              range.start--;
              range.length++;
            }
          }
        } else {
          range.length = 0;
        }

        var result = true;

        var value = this._valueFromText(newText, function() {
          result = false;
          error.apply(null, arguments);
        });

        if (result) {
          change.proposed.text = this._textFromValue(value);
        }

        return result;
      };

      return DelimitedTextFormatter;
    }();

module.exports = DelimitedTextFormatter;

},{"./formatter":10}],8:[function(_dereq_,module,exports){
/* jshint esnext:true */

var TextField           = _dereq_('./text_field');
var ExpiryDateFormatter = _dereq_('./expiry_date_formatter');

var ExpiryDateField = function() {
      function ExpiryDateField(element) {
        Object.getPrototypeOf(ExpiryDateField.prototype).constructor.call(this, element, new ExpiryDateFormatter());
      }

      ExpiryDateField.__proto__ = TextField;
      ExpiryDateField.prototype = Object.create(TextField.prototype);

      Object.defineProperty(ExpiryDateField.prototype, "constructor", {
        value: ExpiryDateField
      });

      ExpiryDateField.prototype.textFieldDidEndEditing = function() {
        var value = this.value();
        if (value) {
          return this.setText(this.formatter().format(value));
        }
      };

      return ExpiryDateField;
    }();

module.exports = ExpiryDateField;

},{"./expiry_date_formatter":9,"./text_field":16}],9:[function(_dereq_,module,exports){
/* jshint esnext:true */

var DelimitedTextFormatter = _dereq_('./delimited_text_formatter');
var zpad2 = _dereq_('./utils').zpad2;

function interpretTwoDigitYear(year) {
  var thisYear = new Date().getFullYear();
  var thisCentury = thisYear - (thisYear % 100);
  var centuries = [thisCentury, thisCentury - 100, thisCentury + 100].sort(function(a, b) {
    return Math.abs(thisYear - (year + a)) - Math.abs(thisYear - (year + b));
  });
  return year + centuries[0];
}

var ExpiryDateFormatter = function() {
      function ExpiryDateFormatter() {
        Object.getPrototypeOf(ExpiryDateFormatter.prototype).constructor.apply(this, arguments);
      }

      ExpiryDateFormatter.__proto__ = DelimitedTextFormatter;
      ExpiryDateFormatter.prototype = Object.create(DelimitedTextFormatter.prototype);

      Object.defineProperty(ExpiryDateFormatter.prototype, "constructor", {
        value: ExpiryDateFormatter
      });

      ExpiryDateFormatter.prototype.hasDelimiterAtIndex = function(index) {
        return index === 2;
      };

      ExpiryDateFormatter.prototype.format = function(value) {
        if (!value) { return ''; }

        var month = value.month;
        var year = value.year;
        year = year % 100;

        return Object.getPrototypeOf(ExpiryDateFormatter.prototype).format.call(this, zpad2(month) + zpad2(year));
      };

      ExpiryDateFormatter.prototype.parse = function(text, error) {
        var monthAndYear = text.split(this.delimiter);
        var month = monthAndYear[0];
        var year = monthAndYear[1];
        if (month && month.match(/^(0?[1-9]|1\d)$/) && year && year.match(/^\d\d?$/)) {
          month = Number(month);
          year = interpretTwoDigitYear(Number(year));
          return { month: month, year: year };
        } else {
          if (typeof error === 'function') {
            error('expiry-date-formatter.invalid-date');
          }
          return null;
        }
      };

      ExpiryDateFormatter.prototype.isChangeValid = function(change, error) {
        if (!error) { error = function(){}; }

        var isBackspace = change.proposed.text.length < change.current.text.length;
        var newText = change.proposed.text;

        if (isBackspace) {
          if (change.deleted.text === this.delimiter) {
            newText = newText[0];
          }
          if (newText === '0') {
            newText = '';
          }
        } else if (change.inserted.text === this.delimiter && change.current.text === '1') {
          newText = '01' + this.delimiter;
        } else if (change.inserted.text.length > 0 && !/^\d$/.test(change.inserted.text)) {
          error('expiry-date-formatter.only-digits-allowed');
          return false;
        } else {
          // 4| -> 04|
          if (/^[2-9]$/.test(newText)) {
            newText = '0' + newText;
          }

          // 15| -> 1|
          if (/^1[3-9]$/.test(newText)) {
            error('expiry-date-formatter.invalid-month');
            return false;
          }

          // Don't allow 00
          if (newText === '00') {
            error('expiry-date-formatter.invalid-month');
            return false;
          }

          // 11| -> 11/
          if (/^(0[1-9]|1[0-2])$/.test(newText)) {
            newText += this.delimiter;
          }

          var match = newText.match(/^(\d\d)(.)(\d\d?).*$/);
          if (match && match[2] === this.delimiter) {
            newText = match[1] + this.delimiter + match[3];
          }
        }

        change.proposed.text = newText;
        change.proposed.selectedRange = { start: newText.length, length: 0 };

        return true;
      };

      return ExpiryDateFormatter;
    }();

ExpiryDateFormatter.prototype.delimiter = '/';
ExpiryDateFormatter.prototype.maximumLength = 5;
module.exports = ExpiryDateFormatter;

},{"./delimited_text_formatter":7,"./utils":18}],10:[function(_dereq_,module,exports){
/* jshint esnext:true */

var Formatter = function() {
      function Formatter() {}

      Formatter.prototype.format = function(text) {
        if (text === undefined || text === null) { text = ''; }
        if (this.maximumLength !== undefined && this.maximumLength !== null) {
          text = text.substring(0, this.maximumLength);
        }
        return text;
      };

      Formatter.prototype.parse = function(text, error) {
        if (text === undefined || text === null) { text = ''; }
        if (this.maximumLength !== undefined && this.maximumLength !== null) {
          text = text.substring(0, this.maximumLength);
        }
        return text;
      };

      Formatter.prototype.isChangeValid = function(change, error) {
        var selectedRange = change.proposed.selectedRange;
        var text = change.proposed.text;
        if (this.maximumLength !== undefined && this.maximumLength !== null && text.length > this.maximumLength) {
          var available = this.maximumLength - (text.length - change.inserted.text.length);
          var newText = change.current.text.substring(0, change.current.selectedRange.start);
          if (available > 0) {
            newText += change.inserted.text.substring(0, available);
          }
          newText += change.current.text.substring(change.current.selectedRange.start + change.current.selectedRange.length);
          var truncatedLength = text.length - newText.length;
          change.proposed.text = newText;
          selectedRange.start -= truncatedLength;
        }
        return true;
      };

      return Formatter;
    }();

module.exports = Formatter;

},{}],11:[function(_dereq_,module,exports){
module.exports = {
  AdaptiveCardFormatter         : _dereq_('./adaptive_card_formatter'),
  AmexCardFormatter             : _dereq_('./amex_card_formatter'),
  CardTextField                 : _dereq_('./card_text_field'),
  DefaultCardFormatter          : _dereq_('./default_card_formatter'),
  DelimitedTextFormatter        : _dereq_('./delimited_text_formatter'),
  ExpiryDateField               : _dereq_('./expiry_date_field'),
  ExpiryDateFormatter           : _dereq_('./expiry_date_formatter'),
  Formatter                     : _dereq_('./formatter'),
  NumberFormatter               : _dereq_('./number_formatter'),
  PhoneFormatter                : _dereq_('./phone_formatter'),
  SocialSecurityNumberFormatter : _dereq_('./social_security_number_formatter'),
  TextField                     : _dereq_('./text_field'),
  UndoManager                   : _dereq_('./undo_manager')
};

},{"./adaptive_card_formatter":2,"./amex_card_formatter":3,"./card_text_field":4,"./default_card_formatter":6,"./delimited_text_formatter":7,"./expiry_date_field":8,"./expiry_date_formatter":9,"./formatter":10,"./number_formatter":13,"./phone_formatter":14,"./social_security_number_formatter":15,"./text_field":16,"./undo_manager":17}],12:[function(_dereq_,module,exports){
/* jshint esnext:true */

var A = 65;
var Y = 89;
var Z = 90;
var ZERO = 48;
var NINE = 57;
var LEFT = 37;
var RIGHT = 39;
var UP = 38;
var DOWN = 40;
var BACKSPACE = 8;
var DELETE = 46;
var TAB = 9;
var ENTER = 13;

var KEYS = {
  A: A,
  Y: Y,
  Z: Z,
  ZERO: ZERO,
  NINE: NINE,
  LEFT: LEFT,
  RIGHT: RIGHT,
  UP: UP,
  DOWN: DOWN,
  BACKSPACE: BACKSPACE,
  DELETE: DELETE,
  TAB: TAB,
  ENTER: ENTER,

  isDigit: function(keyCode) {
    return ZERO <= keyCode && keyCode <= NINE;
  },

  isDirectional: function(keyCode) {
    return keyCode === LEFT || keyCode === RIGHT || keyCode === UP || keyCode === DOWN;
  }
};

var CTRL  = 1 << 0;
var META  = 1 << 1;
var ALT   = 1 << 2;
var SHIFT = 1 << 3;
var cache = {};

/**
 * Builds a BindingSet based on the current platform.
 *
 * @param {string} platform A string name of a platform (e.g. "OSX").
 *
 * @return {BindingSet} keybindings appropriate for the given platform.
 */
function keyBindingsForPlatform(platform) {
  var osx = platform === 'OSX';
  var ctrl = osx ? META : CTRL;

  if (!cache[platform]) {
    cache[platform] = build(platform, function(bind) {
      bind(A         , ctrl       , 'selectAll');
      bind(LEFT      , null       , 'moveLeft');
      bind(LEFT      , ALT        , 'moveWordLeft');
      bind(LEFT      , SHIFT      , 'moveLeftAndModifySelection');
      bind(LEFT      , ALT|SHIFT  , 'moveWordLeftAndModifySelection');
      bind(RIGHT     , null       , 'moveRight');
      bind(RIGHT     , ALT        , 'moveWordRight');
      bind(RIGHT     , SHIFT      , 'moveRightAndModifySelection');
      bind(RIGHT     , ALT|SHIFT  , 'moveWordRightAndModifySelection');
      bind(UP        , null       , 'moveUp');
      bind(UP        , ALT        , 'moveToBeginningOfParagraph');
      bind(UP        , SHIFT      , 'moveUpAndModifySelection');
      bind(UP        , ALT|SHIFT  , 'moveParagraphBackwardAndModifySelection');
      bind(DOWN      , null       , 'moveDown');
      bind(DOWN      , ALT        , 'moveToEndOfParagraph');
      bind(DOWN      , SHIFT      , 'moveDownAndModifySelection');
      bind(DOWN      , ALT|SHIFT  , 'moveParagraphForwardAndModifySelection');
      bind(BACKSPACE , null       , 'deleteBackward');
      bind(BACKSPACE , SHIFT      , 'deleteBackward');
      bind(BACKSPACE , ALT        , 'deleteWordBackward');
      bind(BACKSPACE , ALT|SHIFT  , 'deleteWordBackward');
      bind(BACKSPACE , ctrl       , 'deleteBackwardToBeginningOfLine');
      bind(BACKSPACE , ctrl|SHIFT , 'deleteBackwardToBeginningOfLine');
      bind(DELETE    , null       , 'deleteForward');
      bind(DELETE    , ALT        , 'deleteWordForward');
      bind(TAB       , null       , 'insertTab');
      bind(TAB       , SHIFT      , 'insertBackTab');
      bind(ENTER     , null       , 'insertNewline');
      bind(Z         , ctrl       , 'undo');

      if (osx) {
        bind(LEFT      , META       , 'moveToBeginningOfLine');
        bind(LEFT      , META|SHIFT , 'moveToBeginningOfLineAndModifySelection');
        bind(RIGHT     , META       , 'moveToEndOfLine');
        bind(RIGHT     , META|SHIFT , 'moveToEndOfLineAndModifySelection');
        bind(UP        , META       , 'moveToBeginningOfDocument');
        bind(UP        , META|SHIFT , 'moveToBeginningOfDocumentAndModifySelection');
        bind(DOWN      , META       , 'moveToEndOfDocument');
        bind(DOWN      , META|SHIFT , 'moveToEndOfDocumentAndModifySelection');
        bind(BACKSPACE , CTRL       , 'deleteBackwardByDecomposingPreviousCharacter');
        bind(BACKSPACE , CTRL|SHIFT , 'deleteBackwardByDecomposingPreviousCharacter');
        bind(Z         , META|SHIFT , 'redo');
      } else {
        bind(Y         , CTRL       , 'redo');
      }
    });
  }

  return cache[platform];
}

function build(platform, callback) {
  var result = new BindingSet(platform);
  callback(function() {
    return result.bind.apply(result, arguments);
  });
  return result;
}

var BindingSet = function() {
      function BindingSet(platform) {
        this.platform = platform;
        this.bindings = {};
      }

      BindingSet.prototype.bind = function(keyCode, modifiers, action) {
        if (!this.bindings[keyCode]) { this.bindings[keyCode] = {}; }
        this.bindings[keyCode][modifiers || 0] = action;
      };

      BindingSet.prototype.actionForEvent = function(event) {
        var bindingsForKeyCode = this.bindings[event.keyCode];
        if (bindingsForKeyCode) {
          var modifiers = 0;
          if (event.altKey) { modifiers |= ALT; }
          if (event.ctrlKey) { modifiers |= CTRL; }
          if (event.metaKey) { modifiers |= META; }
          if (event.shiftKey) { modifiers |= SHIFT; }
          return bindingsForKeyCode[modifiers];
        }
      };

      return BindingSet;
    }();

module.exports = {
  KEYS: KEYS,
  keyBindingsForPlatform: keyBindingsForPlatform
};

},{}],13:[function(_dereq_,module,exports){
/* jshint esnext:true, undef:true, node:true */

var Formatter = _dereq_('./formatter');
var utils = _dereq_('./utils');
var isDigits = utils.isDigits;
var startsWith = utils.startsWith;
var endsWith = utils.endsWith;
var trim = utils.trim;
var zpad = utils.zpad;
var forEach = utils.forEach;
var stround = _dereq_('stround');

// Style
var NONE = 0;

var CURRENCY = 1;
var PERCENT = 2;
var DEFAULT_LOCALE = 'en-US';
var DEFAULT_COUNTRY = 'US';

function splitLocaleComponents(locale) {
  var match = locale.match(/^([a-z][a-z])(?:[-_]([a-z][a-z]))?$/i);
  if (match) {
    var lang = match[1] && match[1].toLowerCase();
    var country = match[2] && match[2].toLowerCase();
    return { lang: lang, country: country };
  }
}

/**
 * This simple property getter assumes that properties will never be functions
 * and so attempts to run those functions using the given args.
 */
function get(object, key/*, ...args */) {
  if (object) {
    var value = object[key];
    if (typeof value === 'function') {
      var args = [].slice.call(arguments, 2);
      return value.apply(null, args);
    } else {
      return value;
    }
  }
}

var NumberFormatter = function() {
      function NumberFormatter() {
        Object.getPrototypeOf(NumberFormatter.prototype).constructor.call(this);
        this._locale = 'en';
        this.setNumberStyle(NONE);
      }

      NumberFormatter.prototype.allowsFloats = function() {
        return this._get('allowsFloats');
      };

      NumberFormatter.prototype.setAllowsFloats = function(allowsFloats) {
        this._allowsFloats = allowsFloats;
        return this;
      };

      NumberFormatter.prototype.alwaysShowsDecimalSeparator = function() {
        return this._get('alwaysShowsDecimalSeparator');
      };

      NumberFormatter.prototype.setAlwaysShowsDecimalSeparator = function(alwaysShowsDecimalSeparator) {
        this._alwaysShowsDecimalSeparator = alwaysShowsDecimalSeparator;
        return this;
      };

      NumberFormatter.prototype.countryCode = function() {
        return this._countryCode || DEFAULT_COUNTRY;
      };

      NumberFormatter.prototype.setCountryCode = function(countryCode) {
        this._countryCode = countryCode;
        return this;
      };

      NumberFormatter.prototype.currencyCode = function() {
        return this._get('currencyCode');
      };

      NumberFormatter.prototype.setCurrencyCode = function(currencyCode) {
        this._currencyCode = currencyCode;
        return this;
      };

      NumberFormatter.prototype.currencySymbol = function() {
        if (this._shouldShowNativeCurrencySymbol()) {
          return this._get('currencySymbol');
        } else {
          return this._get('internationalCurrencySymbol');
        }
      };

      NumberFormatter.prototype.setCurrencySymbol = function(currencySymbol) {
        this._currencySymbol = currencySymbol;
        return this;
      };

      NumberFormatter.prototype._shouldShowNativeCurrencySymbol = function() {
        var regionDefaultCurrencyCode = this._regionDefaults().currencyCode;
        if (typeof regionDefaultCurrencyCode === 'function') {
          regionDefaultCurrencyCode = regionDefaultCurrencyCode();
        }
        return this.currencyCode() === regionDefaultCurrencyCode;
      };

      NumberFormatter.prototype.decimalSeparator = function() {
        return this._get('decimalSeparator');
      };

      NumberFormatter.prototype.setDecimalSeparator = function(decimalSeparator) {
        this._decimalSeparator = decimalSeparator;
        return this;
      };

      NumberFormatter.prototype.groupingSeparator = function() {
        return this._get('groupingSeparator');
      };

      NumberFormatter.prototype.setGroupingSeparator = function(groupingSeparator) {
        this._groupingSeparator = groupingSeparator;
        return this;
      };

      NumberFormatter.prototype.groupingSize = function() {
        return this._get('groupingSize');
      };

      NumberFormatter.prototype.setGroupingSize = function(groupingSize) {
        this._groupingSize = groupingSize;
        return this;
      };

      NumberFormatter.prototype.internationalCurrencySymbol = function() {
        return this._get('internationalCurrencySymbol');
      };

      NumberFormatter.prototype.setInternationalCurrencySymbol = function(internationalCurrencySymbol) {
        this._internationalCurrencySymbol = internationalCurrencySymbol;
        return this;
      };

      NumberFormatter.prototype.isLenient = function() {
        return this._lenient;
      };

      NumberFormatter.prototype.setLenient = function(lenient) {
        this._lenient = lenient;
        return this;
      };

      NumberFormatter.prototype.locale = function() {
        return this._locale || DEFAULT_LOCALE;
      };

      NumberFormatter.prototype.setLocale = function(locale) {
        this._locale = locale;
        return this;
      };

      NumberFormatter.prototype.maximum = function() {
        return this._maximum;
      };

      NumberFormatter.prototype.setMaximum = function(max) {
        this._maximum = max;
        return this;
      };

      NumberFormatter.prototype.minimum = function() {
        return this._minimum;
      };

      NumberFormatter.prototype.setMinimum = function(min) {
        this._minimum = min;
        return this;
      };

      NumberFormatter.prototype.maximumFractionDigits = function() {
        return this._get('maximumFractionDigits');
      };

      NumberFormatter.prototype.setMaximumFractionDigits = function(maximumFractionDigits) {
        this._maximumFractionDigits = maximumFractionDigits;
        if (maximumFractionDigits < this.minimumFractionDigits()) {
          this.setMinimumFractionDigits(maximumFractionDigits);
        }
        return this;
      };

      NumberFormatter.prototype.minimumFractionDigits = function() {
        return this._get('minimumFractionDigits');
      };

      NumberFormatter.prototype.setMinimumFractionDigits = function(minimumFractionDigits) {
        this._minimumFractionDigits = minimumFractionDigits;
        if (minimumFractionDigits > this.maximumFractionDigits()) {
          this.setMaximumFractionDigits(minimumFractionDigits);
        }
        return this;
      };

      NumberFormatter.prototype.maximumIntegerDigits = function() {
        return this._get('maximumIntegerDigits');
      };

      NumberFormatter.prototype.setMaximumIntegerDigits = function(maximumIntegerDigits) {
        this._maximumIntegerDigits = maximumIntegerDigits;
        if (maximumIntegerDigits < this.minimumIntegerDigits()) {
          this.setMinimumIntegerDigits(maximumIntegerDigits);
        }
        return this;
      };

      NumberFormatter.prototype.minimumIntegerDigits = function() {
        return this._get('minimumIntegerDigits');
      };

      NumberFormatter.prototype.setMinimumIntegerDigits = function(minimumIntegerDigits) {
        this._minimumIntegerDigits = minimumIntegerDigits;
        if (minimumIntegerDigits > this.maximumIntegerDigits()) {
          this.setMaximumIntegerDigits(minimumIntegerDigits);
        }
        return this;
      };

      NumberFormatter.prototype.exponent = function() {
        return this._get('exponent');
      };

      NumberFormatter.prototype.setExponent = function(exponent) {
        this._exponent = exponent;
        return this;
      };

      NumberFormatter.prototype.negativeInfinitySymbol = function() {
        return this._get('negativeInfinitySymbol');
      };

      NumberFormatter.prototype.setNegativeInfinitySymbol = function(negativeInfinitySymbol) {
        this._negativeInfinitySymbol = negativeInfinitySymbol;
        return this;
      };

      NumberFormatter.prototype.negativePrefix = function() {
        return this._get('negativePrefix');
      };

      NumberFormatter.prototype.setNegativePrefix = function(prefix) {
        this._negativePrefix = prefix;
        return this;
      };

      NumberFormatter.prototype.negativeSuffix = function() {
        return this._get('negativeSuffix');
      };

      NumberFormatter.prototype.setNegativeSuffix = function(prefix) {
        this._negativeSuffix = prefix;
        return this;
      };

      NumberFormatter.prototype.notANumberSymbol = function() {
        return this._get('notANumberSymbol');
      };

      NumberFormatter.prototype.setNotANumberSymbol = function(notANumberSymbol) {
        this._notANumberSymbol = notANumberSymbol;
        return this;
      };

      NumberFormatter.prototype.nullSymbol = function() {
        return this._get('nullSymbol');
      };

      NumberFormatter.prototype.setNullSymbol = function(nullSymbol) {
        this._nullSymbol = nullSymbol;
        return this;
      };

      NumberFormatter.prototype.numberStyle = function() {
        return this._numberStyle;
      };

      NumberFormatter.prototype.setNumberStyle = function(numberStyle) {
        this._numberStyle = numberStyle;
        switch (this._numberStyle) {
          case NONE:
            this._styleDefaults = StyleDefaults.NONE;
            break;
          case PERCENT:
            this._styleDefaults = StyleDefaults.PERCENT;
            break;
          case CURRENCY:
            this._styleDefaults = StyleDefaults.CURRENCY;
            break;
          default:
            this._styleDefaults = null;
        }
        return this;
      };

      NumberFormatter.prototype.percentSymbol = function() {
        return this._get('percentSymbol');
      };

      NumberFormatter.prototype.setPercentSymbol = function(percentSymbol) {
        this._percentSymbol = percentSymbol;
        return this;
      };

      NumberFormatter.prototype.positiveInfinitySymbol = function() {
        return this._get('positiveInfinitySymbol');
      };

      NumberFormatter.prototype.setPositiveInfinitySymbol = function(positiveInfinitySymbol) {
        this._positiveInfinitySymbol = positiveInfinitySymbol;
        return this;
      };

      NumberFormatter.prototype.positivePrefix = function() {
        return this._get('positivePrefix');
      };

      NumberFormatter.prototype.setPositivePrefix = function(prefix) {
        this._positivePrefix = prefix;
        return this;
      };

      NumberFormatter.prototype.positiveSuffix = function() {
        return this._get('positiveSuffix');
      };

      NumberFormatter.prototype.setPositiveSuffix = function(prefix) {
        this._positiveSuffix = prefix;
        return this;
      };

      NumberFormatter.prototype.roundingMode = function() {
        return this._get('roundingMode');
      };

      NumberFormatter.prototype.setRoundingMode = function(roundingMode) {
        this._roundingMode = roundingMode;
        return this;
      };

      NumberFormatter.prototype.usesGroupingSeparator = function() {
        return this._get('usesGroupingSeparator');
      };

      NumberFormatter.prototype.setUsesGroupingSeparator = function(usesGroupingSeparator) {
        this._usesGroupingSeparator = usesGroupingSeparator;
        return this;
      };

      NumberFormatter.prototype.zeroSymbol = function() {
        return this._get('zeroSymbol');
      };

      NumberFormatter.prototype.setZeroSymbol = function(zeroSymbol) {
        this._zeroSymbol = zeroSymbol;
        return this;
      };

      NumberFormatter.prototype._get = function(attr) {
        var value = this['_' + attr];
        if (value !== null && value !== undefined) {
          return value;
        }
        var styleDefaults = this._styleDefaults;
        var localeDefaults = this._localeDefaults();
        var regionDefaults = this._regionDefaults();
        value = get(styleDefaults, attr, this, localeDefaults);
        if (value !== null && value !== undefined) {
          return value;
        }
        value = get(localeDefaults, attr, this, styleDefaults);
        if (value !== null && value !== undefined) {
          return value;
        }
        value = get(regionDefaults, attr, this, styleDefaults);
        if (value !== null && value !== undefined) {
          return value;
        }
        value = get(this._currencyDefaults(), attr, this, localeDefaults);
        if (value !== null && value !== undefined) {
          return value;
        }
        return null;
      };

      NumberFormatter.prototype.format = function(number) {
        if (number === '') {
          return '';
        }

        var zeroSymbol = this.zeroSymbol();
        if (zeroSymbol !== undefined && zeroSymbol !== null && number === 0) {
          return zeroSymbol;
        }

        var nullSymbol = this.nullSymbol();
        if (nullSymbol !== undefined && nullSymbol !== null && number === null) {
          return nullSymbol;
        }

        var notANumberSymbol = this.notANumberSymbol();
        if (notANumberSymbol !== undefined && notANumberSymbol !== null && isNaN(number)) {
          return notANumberSymbol;
        }

        var positiveInfinitySymbol = this.positiveInfinitySymbol();
        if (positiveInfinitySymbol !== undefined && positiveInfinitySymbol !== null && number === Infinity) {
          return positiveInfinitySymbol;
        }

        var negativeInfinitySymbol = this.negativeInfinitySymbol();
        if (negativeInfinitySymbol !== undefined && negativeInfinitySymbol !== null && number === -Infinity) {
          return negativeInfinitySymbol;
        }

        var string = null;
        var negative = number < 0;

        var parts = (''+Math.abs(number)).split('.');
        var integerPart = parts[0];
        var fractionPart = parts[1] || '';

        var exponent = this.exponent();
        if (exponent !== undefined && exponent !== null) {
          var shifted = stround.shift([negative, integerPart, fractionPart], exponent);
          negative = shifted[0];
          integerPart = shifted[1];
          fractionPart = shifted[2];
          while (integerPart[0] === '0') {
            integerPart = integerPart.slice(1);
          }
        }

        // round fraction part to the maximum length
        var maximumFractionDigits = this.maximumFractionDigits();
        if (fractionPart.length > maximumFractionDigits) {
          var unrounded = '' + integerPart + '.' + fractionPart;
          var rounded = this._round(negative ? '-' + unrounded : unrounded);
          if (rounded[0] === '-') {
            rounded = rounded.slice(1);
          }
          parts = rounded.split('.');
          integerPart = parts[0];
          fractionPart = parts[1] || '';
        }

        // right-pad fraction zeros up to the minimum length
        var minimumFractionDigits = this.minimumFractionDigits();
        while (fractionPart.length < minimumFractionDigits) {
          fractionPart += '0';
        }

        // left-pad integer zeros up to the minimum length
        var minimumIntegerDigits = this.minimumIntegerDigits();
        while (integerPart.length < minimumIntegerDigits) {
          integerPart = '0' + integerPart;
        }

        // eat any unneeded trailing zeros
        while (fractionPart.length > minimumFractionDigits && fractionPart.slice(-1) === '0') {
          fractionPart = fractionPart.slice(0, -1);
        }

        // left-truncate any integer digits over the maximum length
        var maximumIntegerDigits = this.maximumIntegerDigits();
        if (maximumIntegerDigits !== undefined && maximumIntegerDigits !== null && integerPart.length > maximumIntegerDigits) {
          integerPart = integerPart.slice(-maximumIntegerDigits);
        }

        // add the decimal separator
        if (fractionPart.length > 0 || this.alwaysShowsDecimalSeparator()) {
          fractionPart = this.decimalSeparator() + fractionPart;
        }

        if (this.usesGroupingSeparator()) {
          var integerPartWithGroupingSeparators = '';
          var copiedCharacterCount = 0;

          for (var i = integerPart.length - 1; i >= 0; i--) {
            if (copiedCharacterCount > 0 && copiedCharacterCount % this.groupingSize() === 0) {
              integerPartWithGroupingSeparators = this.groupingSeparator() + integerPartWithGroupingSeparators;
            }
            integerPartWithGroupingSeparators = integerPart[i] + integerPartWithGroupingSeparators;
            copiedCharacterCount++;
          }
          integerPart = integerPartWithGroupingSeparators;
        }

        var result = integerPart + fractionPart;

        // surround with the appropriate prefix and suffix
        if (negative) {
          result = this.negativePrefix() + result + this.negativeSuffix();
        } else {
          result = this.positivePrefix() + result + this.positiveSuffix();
        }
        return result;
      };

      NumberFormatter.prototype._round = function(number) {
        return stround.round(number, this.maximumFractionDigits(), this.roundingMode());
      };

      NumberFormatter.prototype.parse = function(string, error) {
        var result;
        var positivePrefix = this.positivePrefix();
        var negativePrefix = this.negativePrefix();
        var positiveSuffix = this.positiveSuffix();
        var negativeSuffix = this.negativeSuffix();

        if (this.isLenient()) {
          string = string.replace(/\s/g, '');
          positivePrefix = trim(positivePrefix);
          negativePrefix = trim(negativePrefix);
          positiveSuffix = trim(positiveSuffix);
          negativeSuffix = trim(negativeSuffix);
        }

        var zeroSymbol;
        var nullSymbol;
        var notANumberSymbol;
        var positiveInfinitySymbol;
        var negativeInfinitySymbol;
        var innerString;

        if ((zeroSymbol = this.zeroSymbol()) !== undefined && zeroSymbol !== null && string === zeroSymbol) {
          result = 0;
        } else if ((nullSymbol = this.nullSymbol()) !== undefined && nullSymbol !== null && string === nullSymbol) {
          result = null;
        } else if ((notANumberSymbol = this.notANumberSymbol()) !== undefined && notANumberSymbol !== null && string === notANumberSymbol) {
          result = NaN;
        } else if ((positiveInfinitySymbol = this.positiveInfinitySymbol()) !== undefined && positiveInfinitySymbol !== null && string === positiveInfinitySymbol) {
          result = Infinity;
        } else if ((negativeInfinitySymbol = this.negativeInfinitySymbol()) !== undefined && negativeInfinitySymbol !== null && string === negativeInfinitySymbol) {
          result = -Infinity;
        } else {
          var hasNegativePrefix = startsWith(negativePrefix, string);
          var hasNegativeSuffix = endsWith(negativeSuffix, string);
          if (hasNegativePrefix && (this.isLenient() || hasNegativeSuffix)) {
            innerString = string.slice(negativePrefix.length);
            if (hasNegativeSuffix) {
              innerString = innerString.slice(0, innerString.length - negativeSuffix.length);
            }
            result = this._parseAbsoluteValue(innerString, error);
            if (result !== undefined && result !== null) {
              result *= -1;
            }
          } else {
            var hasPositivePrefix = startsWith(positivePrefix, string);
            var hasPositiveSuffix = endsWith(positiveSuffix, string);
            if (this.isLenient() || (hasPositivePrefix && hasPositiveSuffix)) {
              innerString = string;
              if (hasPositivePrefix) {
                innerString = innerString.slice(positivePrefix.length);
              }
              if (hasPositiveSuffix) {
                innerString = innerString.slice(0, innerString.length - positiveSuffix.length);
              }
              result = this._parseAbsoluteValue(innerString, error);
            } else {
              if (typeof error === 'function') {
                error('number-formatter.invalid-format');
              }
              return null;
            }
          }
        }

        if (result !== undefined && result !== null) {
          var minimum = this.minimum();
          if (minimum !== undefined && minimum !== null && result < minimum) {
            if (typeof error === 'function') {
              error('number-formatter.out-of-bounds.below-minimum');
            }
            return null;
          }

          var maximum = this.maximum();
          if (maximum !== undefined && maximum !== null && result > maximum) {
            if (typeof error === 'function') {
              error('number-formatter.out-of-bounds.above-maximum');
            }
            return null;
          }
        }

        return result;
      };

      NumberFormatter.prototype._parseAbsoluteValue = function(string, error) {
        var number;
        if (string.length === 0) {
          if (typeof error === 'function') {
            error('number-formatter.invalid-format');
          }
          return null;
        }

        var parts = string.split(this.decimalSeparator());
        if (parts.length > 2) {
          if (typeof error === 'function') {
            error('number-formatter.invalid-format');
          }
          return null;
        }

        var integerPart = parts[0];
        var fractionPart = parts[1] || '';

        if (this.usesGroupingSeparator()) {
          var groupingSize = this.groupingSize();
          var groupParts = integerPart.split(this.groupingSeparator());

          if (!this.isLenient()) {
            if (groupParts.length > 1) {
              // disallow 1000,000
              if (groupParts[0].length > groupingSize) {
                if (typeof error === 'function') {
                  error('number-formatter.invalid-format.grouping-size');
                }
                return null;
              }

              // disallow 1,00
              var groupPartsTail = groupParts.slice(1);
              for (var i = 0, l = groupPartsTail.length; i < l; i++) {
                if (groupPartsTail[i].length !== groupingSize) {
                  if (typeof error === 'function') {
                    error('number-formatter.invalid-format.grouping-size');
                  }
                  return null;
                }
              }
            }
          }

          // remove grouping separators
          integerPart = groupParts.join('');
        }

        if (!isDigits(integerPart) || !isDigits(fractionPart)) {
          if (typeof error === 'function') {
            error('number-formatter.invalid-format');
          }
          return null;
        }

        var exponent = this.exponent();
        if (exponent !== undefined && exponent !== null) {
          var shifted = stround.shift([false, integerPart, fractionPart], -exponent);
          var negative = shifted[0];
          integerPart = shifted[1];
          fractionPart = shifted[2];
        }

        number = Number(integerPart) + Number('.' + (fractionPart || '0'));

        if (!this.allowsFloats() && number !== ~~number) {
          if (typeof error === 'function') {
            error('number-formatter.floats-not-allowed');
          }
          return null;
        }

        return number;
      };

      NumberFormatter.prototype._currencyDefaults = function() {
        var result = {};

        forEach(CurrencyDefaults['default'], function(value, key) {
          result[key] = value;
        });

        forEach(CurrencyDefaults[this.currencyCode()], function(value, key) {
          result[key] = value;
        });

        return result;
      };

      NumberFormatter.prototype._regionDefaults = function() {
        var result = {};

        forEach(RegionDefaults.default, function(value, key) {
          result[key] = value;
        });

        forEach(RegionDefaults[this.countryCode()], function(value, key) {
          result[key] = value;
        });

        return result;
      };

      NumberFormatter.prototype._localeDefaults = function() {
        var locale      = this.locale();
        var countryCode = this.countryCode();
        var lang = splitLocaleComponents(locale).lang;
        var result = {};

        var defaultFallbacks = [
          RegionDefaults.default,
          LocaleDefaults.default,
          RegionDefaults[countryCode],  // CA
          LocaleDefaults[lang],         // fr
          LocaleDefaults[locale]        // fr-CA
        ];

        forEach(defaultFallbacks, function(defaults) {
          forEach(defaults, function(value, key) {
            result[key] = value;
          });
        });

        return result;
      };

      return NumberFormatter;
    }();

/**
 * Defaults
 */

NumberFormatter.prototype._allowsFloats = null;

NumberFormatter.prototype._alwaysShowsDecimalSeparator = null;
NumberFormatter.prototype._countryCode = null;
NumberFormatter.prototype._currencyCode = null;
NumberFormatter.prototype._exponent = null;
NumberFormatter.prototype._groupingSeparator = null;
NumberFormatter.prototype._groupingSize = null;
NumberFormatter.prototype._lenient = false;
NumberFormatter.prototype._locale = null;
NumberFormatter.prototype._internationalCurrencySymbol = null;
NumberFormatter.prototype._maximumFractionDigits = null;
NumberFormatter.prototype._minimumFractionDigits = null;
NumberFormatter.prototype._maximumIntegerDigits = null;
NumberFormatter.prototype._minimumIntegerDigits = null;
NumberFormatter.prototype._maximum = null;
NumberFormatter.prototype._minimum = null;
NumberFormatter.prototype._notANumberSymbol = null;
NumberFormatter.prototype._nullSymbol = null;
NumberFormatter.prototype._numberStyle = null;
NumberFormatter.prototype._roundingMode = null;
NumberFormatter.prototype._usesGroupingSeparator = null;
NumberFormatter.prototype._zeroSymbol = null;

/**
 * Aliases
 */

NumberFormatter.prototype.stringFromNumber = NumberFormatter.prototype.format;

NumberFormatter.prototype.numberFromString = NumberFormatter.prototype.parse;
NumberFormatter.prototype.minusSign = NumberFormatter.prototype.negativePrefix;
NumberFormatter.prototype.setMinusSign = NumberFormatter.prototype.setNegativePrefix;
NumberFormatter.prototype.plusSign = NumberFormatter.prototype.positivePrefix;
NumberFormatter.prototype.setPlusSign = NumberFormatter.prototype.setPositivePrefix;
NumberFormatter.Rounding = stround.modes;

NumberFormatter.Style = {
  NONE: NONE,
  CURRENCY: CURRENCY,
  PERCENT: PERCENT
};

var StyleDefaults = {
  NONE: {
    usesGroupingSeparator: false,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    minimumIntegerDigits: 0
  },
  PERCENT: {
    usesGroupingSeparator: false,
    exponent: 2,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    minimumIntegerDigits: 1,
    positiveSuffix: function(formatter) {
      return formatter.percentSymbol();
    },
    negativeSuffix: function(formatter) {
      return formatter.percentSymbol();
    }
  },
  CURRENCY: {
    positivePrefix: function(formatter, locale) {
      return get(locale, 'positiveCurrencyPrefix', formatter, this);
    },
    positiveSuffix: function(formatter, locale) {
      return get(locale, 'positiveCurrencySuffix', formatter, this);
    },
    negativePrefix: function(formatter, locale) {
      return get(locale, 'negativeCurrencyPrefix', formatter, this);
    },
    negativeSuffix: function(formatter, locale) {
      return get(locale, 'negativeCurrencySuffix', formatter, this);
    }
  }
};

var LocaleDefaults = {
  'default': {
    allowsFloats: true,
    alwaysShowsDecimalSeparator: false,
    decimalSeparator: '.',
    groupingSeparator: ',',
    groupingSize: 3,
    negativeInfinitySymbol: '-∞',
    negativePrefix: '-',
    negativeSuffix: '',
    notANumberSymbol: 'NaN',
    nullSymbol: '',
    percentSymbol: '%',
    positiveInfinitySymbol: '+∞',
    positivePrefix: '',
    positiveSuffix: '',
    roundingMode: NumberFormatter.Rounding.HALF_EVEN,
    positiveCurrencyPrefix: function(formatter) {
      return formatter.currencySymbol();
    },
    positiveCurrencySuffix: '',
    negativeCurrencyPrefix: function(formatter) {
      return '(' + (formatter.currencySymbol());
    },
    negativeCurrencySuffix: function(formatter) {
      return ')';
    }
  },
  fr: {
    decimalSeparator: ',',
    groupingSeparator: ' ',
    percentSymbol: ' %',
    positiveCurrencyPrefix: '',
    positiveCurrencySuffix: function(formatter) {
      return ' ' + (formatter.currencySymbol());
    },
    negativeCurrencyPrefix: function(formatter) {
      return '(';
    },
    negativeCurrencySuffix: function(formatter) {
      return ' ' + (formatter.currencySymbol()) + ')';
    }
  },
  ja: {
    negativeCurrencyPrefix: function(formatter) {
      return '-' + (formatter.currencySymbol());
    },
    negativeCurrencySuffix: ''
  },
  'en-GB': {
    negativeCurrencyPrefix: function(formatter) {
      return '-' + (formatter.currencySymbol());
    },
    negativeCurrencySuffix: ''
  }
};

var RegionDefaults = {
  CA: {
    currencyCode: 'CAD'
  },
  DE: {
    currencyCode: 'EUR'
  },
  ES: {
    currencyCode: 'EUR'
  },
  FR: {
    currencyCode: 'EUR'
  },
  GB: {
    currencyCode: 'GBP'
  },
  JP: {
    currencyCode: 'JPY'
  },
  US: {
    currencyCode: 'USD'
  }
};

var CurrencyDefaults = {
  'default': {
    currencySymbol: function(formatter) {
      return formatter.currencyCode();
    },
    internationalCurrencySymbol: function(formatter) {
      return formatter.currencyCode();
    },
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    minimumIntegerDigits: 1,
    usesGroupingSeparator: true
  },
  CAD: {
    currencySymbol: '$',
    internationalCurrencySymbol: 'CA$'
  },
  EUR: {
    currencySymbol: '€'
  },
  GBP: {
    currencySymbol: '£',
    internationalCurrencySymbol: 'GB£'
  },
  JPY: {
    currencySymbol: '¥',
    internationalCurrencySymbol: 'JP¥',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  },
  USD: {
    currencySymbol: '$',
    internationalCurrencySymbol: 'US$'
  }
};

module.exports = NumberFormatter;

},{"./formatter":10,"./utils":18,"stround":1}],14:[function(_dereq_,module,exports){
/* jshint esnext:true */

var DelimitedTextFormatter = _dereq_('./delimited_text_formatter');

// (415) 555-1212
var NANP_PHONE_DELIMITERS = {
  0: '(',
  4: ')',
  5: ' ',
  9: '-'
};

// 1 (415) 555-1212
var NANP_PHONE_DELIMITERS_WITH_1 = {
  1:  ' ',
  2:  '(',
  6:  ')',
  7:  ' ',
  11: '-'
};

// +1 (415) 555-1212
var NANP_PHONE_DELIMITERS_WITH_PLUS = {
  2:  ' ',
  3:  '(',
  7:  ')',
  8:  ' ',
  12: '-'
};

// This should match any characters in the maps above.
var DELIMITER_PATTERN = /[-\(\) ]/g;

var PhoneFormatter = function() {
      function PhoneFormatter() {
        if (arguments.length !== 0) {
          throw new Error('were you trying to set a delimiter ('+arguments[0]+')?');
        }
      }

      PhoneFormatter.__proto__ = DelimitedTextFormatter;
      PhoneFormatter.prototype = Object.create(DelimitedTextFormatter.prototype);

      Object.defineProperty(PhoneFormatter.prototype, "constructor", {
        value: PhoneFormatter
      });

      PhoneFormatter.prototype.isDelimiter = function(chr) {
        var map = this.delimiterMap;
        for (var index in map) {
          if (map.hasOwnProperty(index)) {
            if (map[index] === chr) {
              return true;
            }
          }
        }
        return false;
      };

      PhoneFormatter.prototype.delimiterAt = function(index) {
        return this.delimiterMap[index];
      };

      PhoneFormatter.prototype.hasDelimiterAtIndex = function(index) {
        var delimiter = this.delimiterAt(index);
        return delimiter !== undefined && delimiter !== null;
      };

      PhoneFormatter.prototype.parse = function(text, error) {
        if (!error) { error = function(){}; }
        var digits = this.digitsWithoutCountryCode(text);
        // Source: http://en.wikipedia.org/wiki/North_American_Numbering_Plan
        //
        // Area Code
        if (text.length < 10) {
          error('phone-formatter.number-too-short');
        }
        if (digits[0] === '0') {
          error('phone-formatter.area-code-zero');
        }
        if (digits[0] === '1') {
          error('phone-formatter.area-code-one');
        }
        if (digits[1] === '9') {
          error('phone-formatter.area-code-n9n');
        }
        // Central Office Code
        if (digits[3] === '1') {
          error('phone-formatter.central-office-one');
        }
        if (digits.slice(4, 6) === '11') {
          error('phone-formatter.central-office-n11');
        }
        return Object.getPrototypeOf(PhoneFormatter.prototype).parse.call(this, text, error);
      };

      PhoneFormatter.prototype.format = function(value) {
        this.guessFormatFromText(value);
        return Object.getPrototypeOf(PhoneFormatter.prototype).format.call(this, this.removeDelimiterMapChars(value));
      };

      PhoneFormatter.prototype.isChangeValid = function(change, error) {
        this.guessFormatFromText(change.proposed.text);

        if (change.inserted.text.length > 1) {
          // handle pastes
          var text = change.current.text;
          var selectedRange = change.current.selectedRange;
          var toInsert = change.inserted.text;

          // Replace the selection with the new text, remove non-digits, then format.
          var formatted = this.format((
            text.slice(0, selectedRange.start) +
            toInsert +
            text.slice(selectedRange.start+selectedRange.length)
          ).replace(/[^\d]/g, ''));

          change.proposed = {
            text: formatted,
            selectedRange: {
              start: formatted.length - (text.length - (selectedRange.start + selectedRange.length)),
              length: 0
            }
          };

          return Object.getPrototypeOf(PhoneFormatter.prototype).isChangeValid.call(this, change, error);
        }

        if (/^\d*$/.test(change.inserted.text) || change.proposed.text.indexOf('+') === 0) {
          return Object.getPrototypeOf(PhoneFormatter.prototype).isChangeValid.call(this, change, error);
        } else {
          return false;
        }
      };

      PhoneFormatter.prototype.guessFormatFromText = function(text) {
        if (text && text[0] === '+') {
          this.delimiterMap = NANP_PHONE_DELIMITERS_WITH_PLUS;
          this.maximumLength = 1 + 1 + 10 + 5;
        } else if (text && text[0] === '1') {
          this.delimiterMap = NANP_PHONE_DELIMITERS_WITH_1;
          this.maximumLength = 1 + 10 + 5;
        } else {
          this.delimiterMap = NANP_PHONE_DELIMITERS;
          this.maximumLength = 10 + 4;
        }
      };

      PhoneFormatter.prototype.digitsWithoutCountryCode = function(text) {
        var digits = (text || '').replace(/[^\d]/g, '');
        var extraDigits = digits.length - 10;
        if (extraDigits > 0) {
          digits = digits.substr(extraDigits);
        }
        return digits;
      };

      PhoneFormatter.prototype.removeDelimiterMapChars = function(text) {
        return (text || '').replace(DELIMITER_PATTERN, '');
      };

      return PhoneFormatter;
    }();

module.exports = PhoneFormatter;

},{"./delimited_text_formatter":7}],15:[function(_dereq_,module,exports){
/* jshint esnext:true */

var DelimitedTextFormatter = _dereq_('./delimited_text_formatter');
var DIGITS_PATTERN = /^\d*$/;

var SocialSecurityNumberFormatter = function() {
      function SocialSecurityNumberFormatter() {
        Object.getPrototypeOf(SocialSecurityNumberFormatter.prototype).constructor.apply(this, arguments);
      }

      SocialSecurityNumberFormatter.__proto__ = DelimitedTextFormatter;
      SocialSecurityNumberFormatter.prototype = Object.create(DelimitedTextFormatter.prototype);

      Object.defineProperty(SocialSecurityNumberFormatter.prototype, "constructor", {
        value: SocialSecurityNumberFormatter
      });

      SocialSecurityNumberFormatter.prototype.hasDelimiterAtIndex = function(index) {
        return index === 3 || index === 6;
      };

      SocialSecurityNumberFormatter.prototype.isChangeValid = function(change) {
        if (DIGITS_PATTERN.test(change.inserted.text)) {
          return Object.getPrototypeOf(SocialSecurityNumberFormatter.prototype).isChangeValid.call(this, change);
        } else {
          return false;
        }
      };

      return SocialSecurityNumberFormatter;
    }();

SocialSecurityNumberFormatter.prototype.delimiter = '-';
SocialSecurityNumberFormatter.prototype.maximumLength = 9 + 2;
module.exports = SocialSecurityNumberFormatter;

},{"./delimited_text_formatter":7}],16:[function(_dereq_,module,exports){
/* jshint esnext:true, undef:true, node:true */

var Formatter = _dereq_('./formatter');
var UndoManager = _dereq_('./undo_manager');
var keys = _dereq_('./keybindings');
var KEYS = keys.KEYS;
var keyBindingsForPlatform = keys.keyBindingsForPlatform;
var bind = _dereq_('./utils').bind;

var AFFINITY = {
  UPSTREAM: 0,
  DOWNSTREAM: 1,
  NONE: null
};

function isWordChar(chr) {
  return chr && /^\w$/.test(chr);
}

function hasLeftWordBreakAtIndex(text, index) {
  if (index === 0) {
    return true;
  } else {
    return !isWordChar(text[index - 1]) && isWordChar(text[index]);
  }
}

function hasRightWordBreakAtIndex(text, index) {
  if (index === text.length) {
    return true;
  } else {
    return isWordChar(text[index]) && !isWordChar(text[index + 1]);
  }
}

var TextField = function() {
      function TextField(element, formatter) {
        this.element = element;
        this._formatter = formatter;
        this._enabled = true;
        this._placeholder = null;
        this._disabledPlaceholder = null;
        this._focusedPlaceholder = null;
        this._unfocusedPlaceholder = null;
        this._focusout = bind(this._focusout, this);
        this._focusin = bind(this._focusin, this);
        this.click = bind(this.click, this);
        this.paste = bind(this.paste, this);
        this.keyUp = bind(this.keyUp, this);
        this.keyPress = bind(this.keyPress, this);
        this.keyDown = bind(this.keyDown, this);
        if (this.element.data('field-kit-text-field')) {
          throw new Error("already attached a TextField to this element");
        } else {
          this.element.data('field-kit-text-field', this);
        }
        this._jQuery = this.element.constructor;
        this.element.on('keydown.field-kit', this.keyDown);
        this.element.on('keypress.field-kit', this.keyPress);
        this.element.on('keyup.field-kit', this.keyUp);
        this.element.on('click.field-kit', this.click);
        this.element.on('paste.field-kit', this.paste);
        this.element.on('focusin.field-kit', this._focusin);
        this.element.on('focusout.field-kit', this._focusout);
        this._buildKeybindings();
      }

      TextField.prototype.delegate = function() {
        return this._delegate;
      };

      TextField.prototype.setDelegate = function(delegate) {
        this._delegate = delegate;
        return null;
      };

      TextField.prototype.destroy = function() {
        this.element.off('.field-kit');
        this.element.data('field-kit-text-field', null);
        return null;
      };

      TextField.prototype.insertText = function(text) {
        var range;
        if (this.hasSelection()) {
          this.clearSelection();
        }
        this.replaceSelection(text);
        range = this.selectedRange();
        range.start += range.length;
        range.length = 0;
        return this.setSelectedRange(range);
      };

      TextField.prototype.insertNewline = function(event) {
        this._textFieldDidEndEditing();
        this._didEndEditingButKeptFocus = true;
      };

      TextField.prototype._textDidChange = function() {
        var delegate = this._delegate;
        this.textDidChange();
        if (delegate && typeof delegate.textDidChange === 'function') {
          delegate.textDidChange(this);
        }
      };

      TextField.prototype.textDidChange = function() {};

      TextField.prototype._textFieldDidEndEditing = function() {
        var delegate = this._delegate;
        this.textFieldDidEndEditing();
        if (delegate && typeof delegate.textFieldDidEndEditing === 'function') {
          delegate.textFieldDidEndEditing(this);
        }
      };

      TextField.prototype.textFieldDidEndEditing = function() {};

      TextField.prototype._textFieldDidBeginEditing = function() {
        var delegate = this._delegate;
        this.textFieldDidBeginEditing();
        if (delegate && typeof delegate.textFieldDidBeginEditing === 'function') {
          delegate.textFieldDidBeginEditing(this);
        }
      };

      TextField.prototype.textFieldDidBeginEditing = function() {};

      TextField.prototype.moveUp = function(event) {
        event.preventDefault();
        this.setSelectedRange({
          start: 0,
          length: 0
        });
      };

      TextField.prototype.moveToBeginningOfParagraph = function(event) {
        this.moveUp(event);
      };

      TextField.prototype.moveUpAndModifySelection = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        switch (this.selectionAffinity) {
          case AFFINITY.UPSTREAM:
          case AFFINITY.NONE:
            // 12<34 56|78  =>  <1234 56|78
            range.length += range.start;
            range.start = 0;
            break;
          case AFFINITY.DOWNSTREAM:
            // 12|34 56>78   =>   <12|34 5678
            range.length = range.start;
            range.start = 0;
            break;
        }
        this.setSelectedRangeWithAffinity(range, AFFINITY.UPSTREAM);
      };

      TextField.prototype.moveParagraphBackwardAndModifySelection = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        switch (this.selectionAffinity) {
          case AFFINITY.UPSTREAM:
          case AFFINITY.NONE:
            // 12<34 56|78  =>  <1234 56|78
            range.length += range.start;
            range.start = 0;
            break;
          case AFFINITY.DOWNSTREAM:
            // 12|34 56>78  =>  12|34 5678
            range.length = 0;
            break;
        }
        this.setSelectedRangeWithAffinity(range, AFFINITY.UPSTREAM);
      };

      TextField.prototype.moveToBeginningOfDocument = function(event) {
        // Since we only support a single line this is just an alias.
        this.moveToBeginningOfLine(event);
      };

      TextField.prototype.moveToBeginningOfDocumentAndModifySelection = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        range.length += range.start;
        range.start = 0;
        return this.setSelectedRangeWithAffinity(range, AFFINITY.UPSTREAM);
      };

      TextField.prototype.moveDown = function(event) {
        event.preventDefault();
        // 12|34 56|78  =>  1234 5678|
        var range = {
          start: this.text().length,
          length: 0
        };
        this.setSelectedRangeWithAffinity(range, AFFINITY.NONE);
      };

      TextField.prototype.moveToEndOfParagraph = function(event) {
        this.moveDown(event);
      };

      TextField.prototype.moveDownAndModifySelection = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        var end = this.text().length;
        if (this.selectionAffinity === AFFINITY.UPSTREAM) {
          range.start += range.length;
        }
        range.length = end - range.start;
        this.setSelectedRangeWithAffinity(range, AFFINITY.DOWNSTREAM);
      };

      TextField.prototype.moveParagraphForwardAndModifySelection = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        switch (this.selectionAffinity) {
          case AFFINITY.DOWNSTREAM:
          case AFFINITY.NONE:
            // 12|34 56>78  =>  12|34 5678>
            range.length = this.text().length - range.start;
            break;
          case AFFINITY.UPSTREAM:
            // 12<34 56|78  =>  12|34 5678
            range.start += range.length;
            range.length = 0;
            break;
        }
        this.setSelectedRangeWithAffinity(range, AFFINITY.DOWNSTREAM);
      };

      TextField.prototype.moveToEndOfDocument = function(event) {
        // Since we only support a single line this is just an alias.
        this.moveToEndOfLine(event);
      };

      TextField.prototype.moveToEndOfDocumentAndModifySelection = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        range.length = this.text().length - range.start;
        this.setSelectedRangeWithAffinity(range, AFFINITY.DOWNSTREAM);
      };

      TextField.prototype.moveLeft = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        if (range.length !== 0) {
          range.length = 0;
        } else {
          range.start--;
        }
        this.setSelectedRangeWithAffinity(range, AFFINITY.NONE);
      };

      TextField.prototype.moveLeftAndModifySelection = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        switch (this.selectionAffinity) {
          case AFFINITY.UPSTREAM:
          case AFFINITY.NONE:
            this.selectionAffinity = AFFINITY.UPSTREAM;
            range.start--;
            range.length++;
            break;
          case AFFINITY.DOWNSTREAM:
            range.length--;
            break;
        }
        this.setSelectedRange(range);
      };

      TextField.prototype.moveWordLeft = function(event) {
        event.preventDefault();
        var index = this.lastWordBreakBeforeIndex(this.selectedRange().start - 1);
        this.setSelectedRange({ start: index, length: 0 });
      };

      TextField.prototype.moveWordLeftAndModifySelection = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        switch (this.selectionAffinity) {
          case AFFINITY.UPSTREAM:
          case AFFINITY.NONE:
            this.selectionAffinity = AFFINITY.UPSTREAM;
            var start = this.lastWordBreakBeforeIndex(range.start - 1);
            range.length += range.start - start;
            range.start = start;
            break;
          case AFFINITY.DOWNSTREAM:
            var end = this.lastWordBreakBeforeIndex(range.start + range.length);
            if (end < range.start) {
              end = range.start;
            }
            range.length -= range.start + range.length - end;
            break;
        }
        this.setSelectedRange(range);
      };

      TextField.prototype.moveToBeginningOfLine = function(event) {
        event.preventDefault();
        this.setSelectedRange({ start: 0, length: 0 });
      };

      TextField.prototype.moveToBeginningOfLineAndModifySelection = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        range.length += range.start;
        range.start = 0;
        this.setSelectedRangeWithAffinity(range, AFFINITY.UPSTREAM);
      };

      TextField.prototype.moveRight = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        if (range.length !== 0) {
          range.start += range.length;
          range.length = 0;
        } else {
          range.start++;
        }
        this.setSelectedRangeWithAffinity(range, AFFINITY.NONE);
      };

      TextField.prototype.moveRightAndModifySelection = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        switch (this.selectionAffinity) {
          case AFFINITY.UPSTREAM:
            range.start++;
            range.length--;
            break;
          case AFFINITY.DOWNSTREAM:
          case AFFINITY.NONE:
            this.selectionAffinity = AFFINITY.DOWNSTREAM;
            range.length++;
            break;
        }
        this.setSelectedRange(range);
      };

      TextField.prototype.moveWordRight = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        var index = this.nextWordBreakAfterIndex(range.start + range.length);
        this.setSelectedRange({ start: index, length: 0 });
      };

      TextField.prototype.moveWordRightAndModifySelection = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        var start = range.start;
        var end = range.start + range.length;
        switch (this.selectionAffinity) {
          case AFFINITY.UPSTREAM:
            start = Math.min(this.nextWordBreakAfterIndex(start), end);
            break;
          case AFFINITY.DOWNSTREAM:
          case AFFINITY.NONE:
            this.selectionAffinity = AFFINITY.DOWNSTREAM;
            end = this.nextWordBreakAfterIndex(range.start + range.length);
            break;
        }
        this.setSelectedRange({ start: start, length: end - start });
      };

      TextField.prototype.moveToEndOfLine = function(event) {
        event.preventDefault();
        this.setSelectedRange({ start: this.text().length, length: 0 });
      };

      TextField.prototype.moveToEndOfLineAndModifySelection = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        range.length = this.text().length - range.start;
        this.setSelectedRangeWithAffinity(range, AFFINITY.DOWNSTREAM);
      };

      TextField.prototype.deleteBackward = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        if (range.length === 0) {
          range.start--;
          range.length++;
          this.setSelectedRange(range);
        }
        this.clearSelection();
      };

      TextField.prototype.deleteWordBackward = function(event) {
        if (this.hasSelection()) {
          this.deleteBackward(event);
        } else {
          event.preventDefault();
          var range = this.selectedRange();
          var start = this.lastWordBreakBeforeIndex(range.start);
          range.length += range.start - start;
          range.start = start;
          this.setSelectedRange(range);
          this.clearSelection();
        }
      };

      TextField.prototype.deleteBackwardByDecomposingPreviousCharacter = function(event) {
        this.deleteBackward(event);
      };

      TextField.prototype.deleteBackwardToBeginningOfLine = function(event) {
        if (this.hasSelection()) {
          this.deleteBackward(event);
        } else {
          event.preventDefault();
          var range = this.selectedRange();
          range.length = range.start;
          range.start = 0;
          this.setSelectedRange(range);
          this.clearSelection();
        }
      };

      TextField.prototype.deleteForward = function(event) {
        event.preventDefault();
        var range = this.selectedRange();
        if (range.length === 0) {
          range.length++;
          this.setSelectedRange(range);
        }
        return this.clearSelection();
      };

      TextField.prototype.deleteWordForward = function(event) {
        if (this.hasSelection()) {
          return this.deleteForward(event);
        } else {
          event.preventDefault();
          var range = this.selectedRange();
          var end = this.nextWordBreakAfterIndex(range.start + range.length);
          this.setSelectedRange({
            start: range.start,
            length: end - range.start
          });
          this.clearSelection();
        }
      };

      TextField.prototype.insertTab = function(event) {};
      TextField.prototype.insertBackTab = function(event) {};

      TextField.prototype.hasSelection = function() {
        return this.selectedRange().length !== 0;
      };

      TextField.prototype.lastWordBreakBeforeIndex = function(index) {
        var indexes = this.leftWordBreakIndexes();
        var result = indexes[0];
        for (var i = 0, l = indexes.length; i < l; i++) {
          var wordBreakIndex = indexes[i];
          if (index > wordBreakIndex) {
            result = wordBreakIndex;
          } else {
            break;
          }
        }
        return result;
      };

      TextField.prototype.leftWordBreakIndexes = function() {
        var result = [];
        var text = this.text();
        for (var i = 0, l = text.length; i < l; i++) {
          if (hasLeftWordBreakAtIndex(text, i)) {
            result.push(i);
          }
        }
        return result;
      };

      TextField.prototype.nextWordBreakAfterIndex = function(index) {
        var indexes = this.rightWordBreakIndexes().reverse();
        var result = indexes[0];
        for (var i = 0, l = indexes.length; i < l; i++) {
          var wordBreakIndex = indexes[i];
          if (index < wordBreakIndex) {
            result = wordBreakIndex;
          } else {
            break;
          }
        }
        return result;
      };

      TextField.prototype.rightWordBreakIndexes = function() {
        var result = [];
        var text = this.text();
        for (var i = 0, l = text.length; i <= l; i++) {
          if (hasRightWordBreakAtIndex(text, i)) {
            result.push(i + 1);
          }
        }
        return result;
      };

      TextField.prototype.clearSelection = function() {
        this.replaceSelection('');
      };

      TextField.prototype.replaceSelection = function(replacement) {
        var range = this.selectedRange();
        var end = range.start + range.length;
        var text = this.text();
        text = text.substring(0, range.start) + replacement + text.substring(end);
        range.length = replacement.length;
        this.setText(text);
        this.setSelectedRangeWithAffinity(range, AFFINITY.NONE);
      };

      TextField.prototype.selectAll = function(event) {
        event.preventDefault();
        this.setSelectedRangeWithAffinity({
          start: 0,
          length: this.text().length
        }, AFFINITY.NONE);
      };

      TextField.prototype.readSelectionFromPasteboard = function(pasteboard) {
        var range, text;
        text = pasteboard.getData('Text');
        this.replaceSelection(text);
        range = this.selectedRange();
        range.start += range.length;
        range.length = 0;
        this.setSelectedRange(range);
      };

      TextField.prototype.keyDown = function(event) {
        if (this._didEndEditingButKeptFocus) {
          this._textFieldDidBeginEditing();
          this._didEndEditingButKeptFocus = false;
        }

        var action = this._bindings.actionForEvent(event);
        if (action) {
          switch (action) {
            case 'undo':
            case 'redo':
              this[action](event);
              break;

            default:
              var self = this;
              this.rollbackInvalidChanges(function() {
                return self[action](event);
              });
              break;
          }
        }
      };

      TextField.prototype.keyPress = function(event) {
        var keyCode = event.keyCode;
        if (!event.metaKey && !event.ctrlKey &&
            keyCode !== KEYS.ENTER &&
            keyCode !== KEYS.TAB &&
            keyCode !== KEYS.BACKSPACE) {
          event.preventDefault();
          if (event.charCode !== 0) {
            var self = this;
            var charCode = event.charCode || event.keyCode;
            this.rollbackInvalidChanges(function() {
              self.insertText(String.fromCharCode(charCode));
            });
          }
        }
      };

      TextField.prototype.keyUp = function(event) {
        var self = this;
        this.rollbackInvalidChanges(function() {
          if (event.keyCode === KEYS.TAB) {
            self.selectAll(event);
          }
        });
      };

      TextField.prototype.paste = function(event) {
        var self = this;
        event.preventDefault();
        this.rollbackInvalidChanges(function() {
          self.readSelectionFromPasteboard(event.originalEvent.clipboardData);
        });
      };

      TextField.prototype.rollbackInvalidChanges = function(callback) {
        var result = null;
        var errorType = null;
        var change = TextFieldStateChange.build(this, function() {
          result = callback();
        });
        var error = function(type) { errorType = type; };
        if (change.hasChanges()) {
          var formatter = this.formatter();
          if (formatter && typeof formatter.isChangeValid === 'function') {
            if (formatter.isChangeValid(change, error)) {
              change.recomputeDiff();
              this.setText(change.proposed.text);
              this.setSelectedRange(change.proposed.selectedRange);
            } else {
              var delegate = this.delegate();
              if (delegate) {
                if (typeof delegate.textFieldDidFailToValidateChange === "function") {
                  delegate.textFieldDidFailToValidateChange(this, change, errorType);
                }
              }
              this.setText(change.current.text);
              this.setSelectedRange(change.current.selectedRange);
              return result;
            }
          }
          if (change.inserted.text.length || change.deleted.text.length) {
            this.undoManager().proxyFor(this)._applyChangeFromUndoManager(change);
            this._textDidChange();
          }
        }
        return result;
      };

      TextField.prototype.click = function(event) {
        this.selectionAffinity = AFFINITY.NONE;
      };

      TextField.prototype.on = function() {
        this.element.on.apply(this.element, arguments);
      };

      TextField.prototype.off = function() {
        this.element.off.apply(this.element, arguments);
      };

      TextField.prototype.text = function() {
        return this.element.val();
      };

      TextField.prototype.setText = function(text) {
        this.element.val(text);
      };

      TextField.prototype.value = function() {
        var self = this;
        var text = this.text();
        var delegate = this.delegate();
        var formatter = this.formatter();
        if (!formatter) { return value; }

        return formatter.parse(text, function(errorType) {
          if (delegate) {
            if (typeof delegate.textFieldDidFailToParseString === 'function') {
              delegate.textFieldDidFailToParseString(self, text, errorType);
            }
          }
        });
      };

      TextField.prototype.setValue = function(value) {
        if (this._formatter) {
          value = this._formatter.format(value);
        }
        this.setText("" + value);
        return this.element.trigger('change');
      };

      TextField.prototype.formatter = function() {
        if (!this._formatter) {
          this._formatter = new Formatter();
          var maximumLengthString = this.element.attr('maxlength');
          if (maximumLengthString !== undefined && maximumLengthString !== null) {
            this._formatter.maximumLength = parseInt(maximumLengthString, 10);
          }
        }

        return this._formatter;
      };

      TextField.prototype.setFormatter = function(formatter) {
        var value = this.value();
        this._formatter = formatter;
        this.setValue(value);
      };

      TextField.prototype.selectedRange = function() {
        var caret = this.element.caret();
        return {
          start: caret.start,
          length: caret.end - caret.start
        };
      };

      TextField.prototype.setSelectedRange = function(range) {
        return this.setSelectedRangeWithAffinity(range, this.selectionAffinity);
      };

      TextField.prototype.setSelectedRangeWithAffinity = function(range, affinity) {
        var min = 0;
        var max = this.text().length;
        var caret = {
          start: Math.max(min, Math.min(max, range.start)),
          end: Math.max(min, Math.min(max, range.start + range.length))
        };
        this.element.caret(caret);
        this.selectionAffinity = range.length === 0 ? AFFINITY.NONE : affinity;
      };

      TextField.prototype.selectionAnchor = function() {
        var range = this.selectedRange();
        switch (this.selectionAffinity) {
          case AFFINITY.UPSTREAM:
            return range.start + range.length;
          case AFFINITY.DOWNSTREAM:
            return range.start;
          default:
            return null;
        }
      };

      TextField.prototype.undo = function(event) {
        if (this.undoManager().canUndo()) {
          this.undoManager().undo();
        }
        event.preventDefault();
      };

      TextField.prototype.redo = function(event) {
        if (this.undoManager().canRedo()) {
          this.undoManager().redo();
        }
        event.preventDefault();
      };

      TextField.prototype.undoManager = function() {
        return this._undoManager || (this._undoManager = new UndoManager());
      };

      TextField.prototype.allowsUndo = function() {
        return this._allowsUndo;
      };

      TextField.prototype.setAllowsUndo = function(allowsUndo) {
        this._allowsUndo = allowsUndo;
      };

      TextField.prototype._applyChangeFromUndoManager = function(change) {
        this.undoManager().proxyFor(this)._applyChangeFromUndoManager(change);

        if (this.undoManager().isUndoing()) {
          this.setText(change.current.text);
          this.setSelectedRange(change.current.selectedRange);
        } else {
          this.setText(change.proposed.text);
          this.setSelectedRange(change.proposed.selectedRange);
        }

        this._textDidChange();
      };

      TextField.prototype.isEnabled = function() {
        return this._enabled;
      };

      TextField.prototype.setEnabled = function(enabled) {
        this._enabled = enabled;
        this._syncPlaceholder();
      };

      TextField.prototype.hasFocus = function() {
        return this.element.get(0).ownerDocument.activeElement === this.element.get(0);
      };

      TextField.prototype._focusin = function(event) {
        this._textFieldDidBeginEditing();
        return this._syncPlaceholder();
      };

      TextField.prototype._focusout = function(event) {
        this._textFieldDidEndEditing();
        return this._syncPlaceholder();
      };

      TextField.prototype.becomeFirstResponder = function(event) {
        var self = this;
        this.element.focus();
        this.rollbackInvalidChanges(function() {
          self.element.select();
          self._syncPlaceholder();
        });
      };

      TextField.prototype.resignFirstResponder = function(event) {
        if (event !== undefined && event !== null) {
          event.preventDefault();
        }
        this.element.blur();
        this._syncPlaceholder();
      };

      TextField.prototype.disabledPlaceholder = function() {
        return this._disabledPlaceholder;
      };

      TextField.prototype.setDisabledPlaceholder = function(_disabledPlaceholder) {
        this._disabledPlaceholder = _disabledPlaceholder;
        this._syncPlaceholder();
      };

      TextField.prototype.focusedPlaceholder = function() {
        return this._focusedPlaceholder;
      };

      TextField.prototype.setFocusedPlaceholder = function(_focusedPlaceholder) {
        this._focusedPlaceholder = _focusedPlaceholder;
        this._syncPlaceholder();
      };

      TextField.prototype.unfocusedPlaceholder = function() {
        return this._unfocusedPlaceholder;
      };

      TextField.prototype.setUnfocusedPlaceholder = function(_unfocusedPlaceholder) {
        this._unfocusedPlaceholder = _unfocusedPlaceholder;
        this._syncPlaceholder();
      };

      TextField.prototype.placeholder = function() {
        return this._placeholder;
      };

      TextField.prototype.setPlaceholder = function(_placeholder) {
        this._placeholder = _placeholder;
        this.element.attr('placeholder', this._placeholder);
      };

      TextField.prototype._syncPlaceholder = function() {
        if (!this._enabled) {
          var disabledPlaceholder = this._disabledPlaceholder;
          if (disabledPlaceholder !== undefined && disabledPlaceholder !== null) {
            this.setPlaceholder(disabledPlaceholder);
          }
        } else if (this.hasFocus()) {
          var focusedPlaceholder = this._focusedPlaceholder;
          if (focusedPlaceholder !== undefined && focusedPlaceholder !== null) {
            this.setPlaceholder(focusedPlaceholder);
          }
        } else {
          var unfocusedPlaceholder = this._unfocusedPlaceholder;
          if (unfocusedPlaceholder !== undefined && unfocusedPlaceholder !== null) {
            this.setPlaceholder(unfocusedPlaceholder);
          }
        }
      };

      TextField.prototype._buildKeybindings = function() {
        var doc = this.element.get(0).ownerDocument;
        var win = doc.defaultView || doc.parentWindow;
        var userAgent = win.navigator.userAgent;
        var osx = /^Mozilla\/[\d\.]+ \(Macintosh/.test(userAgent);
        this._bindings = keyBindingsForPlatform(osx ? 'OSX' : 'Default');
      };

      TextField.prototype.inspect = function() {
        return '#<TextField text="' + this.text() + '">';
      };

      return TextField;
    }();

/**
 * Contains one of the AFFINITY enum to indicate the preferred direction of
 * selection.
 *
 * @private
 */
TextField.prototype.selectionAffinity = AFFINITY.NONE;

var TextFieldStateChange = function() {
      function TextFieldStateChange(field) {
        this.field = field;
      }

      TextFieldStateChange.prototype.hasChanges = function() {
        this.recomputeDiff();
        return this.current.text !== this.proposed.text ||
          this.current.selectedRange.start !== this.proposed.selectedRange.start ||
          this.current.selectedRange.length !== this.proposed.selectedRange.length;
      };

      TextFieldStateChange.prototype.recomputeDiff = function() {
        if (this.proposed.text !== this.current.text) {
          var ctext = this.current.text;
          var ptext = this.proposed.text;
          var sharedPrefixLength = 0;
          var sharedSuffixLength = 0;
          var minTextLength = Math.min(ctext.length, ptext.length);
          var i;

          for (i = 0; i < minTextLength; i++) {
            if (ptext[i] === ctext[i]) {
              sharedPrefixLength = i + 1;
            } else {
              break;
            }
          }

          for (i = 0; i < minTextLength - sharedPrefixLength; i++) {
            if (ptext[ptext.length - 1 - i] === ctext[ctext.length - 1 - i]) {
              sharedSuffixLength = i + 1;
            } else {
              break;
            }
          }

          var inserted = {
            start: sharedPrefixLength,
            end: ptext.length - sharedSuffixLength
          };
          var deleted = {
            start: sharedPrefixLength,
            end: ctext.length - sharedSuffixLength
          };
          inserted.text = ptext.substring(inserted.start, inserted.end);
          deleted.text = ctext.substring(deleted.start, deleted.end);
          this.inserted = inserted;
          this.deleted = deleted;
        } else {
          this.inserted = {
            start: this.proposed.selectedRange.start,
            end: this.proposed.selectedRange.start + this.proposed.selectedRange.length,
            text: ''
          };
          this.deleted = {
            start: this.current.selectedRange.start,
            end: this.current.selectedRange.start + this.current.selectedRange.length,
            text: ''
          };
        }
        return null;
      };

      return TextFieldStateChange;
    }();

TextFieldStateChange.build = function(field, callback) {
  var change = new this(field);
  change.current = {
    text: field.text(),
    selectedRange: field.selectedRange()
  };
  callback();
  change.proposed = {
    text: field.text(),
    selectedRange: field.selectedRange()
  };
  change.recomputeDiff();
  return change;
};

module.exports = TextField;

},{"./formatter":10,"./keybindings":12,"./undo_manager":17,"./utils":18}],17:[function(_dereq_,module,exports){
/* jshint esnext:true */

function hasGetter(object, property) {
  // Skip if getOwnPropertyDescriptor throws (IE8)
  try {
    Object.getOwnPropertyDescriptor({}, 'sq');
  } catch (e) {
    return false;
  }

  var descriptor;

  if (object && object.constructor && object.constructor.prototype) {
    descriptor = Object.getOwnPropertyDescriptor(object.constructor.prototype, property);
  }

  if (!descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(object, property);
  }

  if (descriptor && descriptor.get) {
    return true;
  } else {
    return false;
  }
}

var UndoManager = function() {
      function UndoManager() {
        this._undos = [];
        this._redos = [];
        this._isUndoing = false;
        this._isRedoing = false;
      }

      UndoManager.prototype.canUndo = function() {
        return this._undos.length !== 0;
      };

      UndoManager.prototype.canRedo = function() {
        return this._redos.length !== 0;
      };

      UndoManager.prototype.isUndoing = function() {
        return this._isUndoing;
      };

      UndoManager.prototype.isRedoing = function() {
        return this._isRedoing;
      };

      UndoManager.prototype.registerUndo = function() {
        if (this._isUndoing) {
          this._appendRedo.apply(this, arguments);
        } else {
          if (!this._isRedoing) {
            this._redos.length = 0;
          }
          this._appendUndo.apply(this, arguments);
        }
        return null;
      };

      UndoManager.prototype._appendUndo = function(target, selector) {
        this._undos.push({
          target: target,
          selector: selector,
          args: [].slice.call(arguments, 2)
        });
      };

      UndoManager.prototype._appendRedo = function(target, selector) {
        this._redos.push({
          target: target,
          selector: selector,
          args: [].slice.call(arguments, 2)
        });
      };

      UndoManager.prototype.undo = function() {
        if (!this.canUndo()) {
          throw new Error('there are no registered undos');
        }
        var data = this._undos.pop();
        var target = data.target;
        var selector = data.selector;
        var args = data.args;
        this._isUndoing = true;
        target[selector].apply(target, args);
        this._isUndoing = false;
      };

      UndoManager.prototype.redo = function() {
        if (!this.canRedo()) {
          throw new Error('there are no registered redos');
        }
        var data = this._redos.pop();
        var target = data.target;
        var selector = data.selector;
        var args = data.args;
        this._isRedoing = true;
        target[selector].apply(target, args);
        this._isRedoing = false;
        return null;
      };

      UndoManager.prototype.proxyFor = function(target) {
        var proxy = {};
        var self = this;

        function proxyMethod(selector) {
          return function() {
            self.registerUndo.apply(
              self,
              [target, selector].concat([].slice.call(arguments))
            );
          };
        }

        for (var selector in target) {
          // don't trigger anything that has a getter
          if (hasGetter(target, selector)) { continue; }

          // don't try to proxy properties that aren't functions
          if (typeof target[selector] !== 'function') { continue; }

          // set up a proxy function to register an undo
          proxy[selector] = proxyMethod(selector);
        }
        return proxy;
      };

      return UndoManager;
    }();

module.exports = UndoManager;

},{}],18:[function(_dereq_,module,exports){
var DIGITS_PATTERN = /^\d*$/;
var SURROUNDING_SPACE_PATTERN = /(^\s+|\s+$)/;

function isDigits(string) {
  return DIGITS_PATTERN.test(string);
}

function startsWith(prefix, string) {
  return string.slice(0, prefix.length) === prefix;
}

function endsWith(suffix, string) {
  return string.slice(string.length - suffix.length) === suffix;
}

var trim;
if (typeof ''.trim === 'function') {
  trim = function(string) {
    return string.trim();
  };
} else {
  trim = function(string) {
    return string.replace(SURROUNDING_SPACE_PATTERN, '');
  };
}

function zpad(length, n) {
  var result = ''+n;
  while (result.length < length) {
    result = '0'+result;
  }
  return result;
}

function zpad2(n) {
  return zpad(2, n);
}

// PhantomJS 1.9 does not have Function#bind.
function bind(fn, context) {
  if (typeof fn.bind === 'function') {
    return fn.bind(context);
  } else {
    return function() {
      return fn.apply(context, arguments);
    };
  }
}

var hasOwnProp = Object.prototype.hasOwnProperty;
function forEach(iterable, iterator) {
  if (iterable && typeof iterable.forEach === 'function') {
    iterable.forEach(iterator);
  } else if ({}.toString.call(iterable) === '[object Array]') {
    for (var i = 0, l = iterable.length; i < l; i++) {
      iterator.call(null, iterable[i], i, iterable);
    }
  } else {
    for (var key in iterable) {
      if (hasOwnProp.call(iterable, key)) {
        iterator.call(null, iterable[key], key, iterable);
      }
    }
  }
}

module.exports = {
  isDigits: isDigits,
  startsWith: startsWith,
  endsWith: endsWith,
  trim: trim,
  zpad: zpad,
  zpad2: zpad2,
  bind: bind,
  forEach: forEach
};

},{}]},{},[11])
(11)
});
const Calculator = class {

	constructor(configObject) {

		let mem = {
			chain: [],
			current: '0',
			decimal: false,
			operator: false,
			percent: false,
			total: false
		};

		this.notifications = {
			'total': 'Result',
			'number-too-long': 'Number too long to display',
			'chain-too-long': 'Too many operations to display'
		}

		// We could of just send the keys directly to _shadowMemory.key() via update()
		// But that way we couldn't simulate a keypress on the interface
		// So instead we area calling triggering the click event.
		// See dashboard.key().press()
		this.config = {
			_keyboard: {
				zero: '0',
				one: '1',
				two: '2',
				three: '3',
				four: '4',
				five: '5',
				six: '6',
				seven: '7',
				eight: '8',
				nine: '9',
				decimal: 'dec',
				add: 'add',
				subtract: 'sub',
				multiply: 'mul',
				divide: 'div',
				percent: 'per',
				total: 'equ',
				backspace: 'back',
				clear: 'c'
			}
		};

		// Handle the shadow memmory i/o
		this.mem = {
			get current() {
				return mem.current;
			},
			set current(value) {
				mem.current = value;
			},
			get decimal() {
				return mem.decimal;
			},
			set decimal(bool) {
				mem.decimal = bool;
			},
			get chain() {
				return mem.chain;
			},
			set chain(value) {
				mem.chain.push(value);
			},
			chainReset() {
				mem.chain = [];
			},
			chainReplaceLast(value) {
				mem.chain.splice(-1, 1, value);
			},
			get operator() {
				return mem.operator;
			},
			set operator(bool) {
				mem.operator = bool;
			},
			get percent() {
				return mem.percent;
			},
			set percent(bool) {
				mem.percent = bool;
			},
			get total() {
				return mem.total;
			},
			set total(bool) {
				mem.total = bool;
			}
		};

		// Select the elements that were passed via CONFIG
		for (let prop in configObject) {
			if ((configObject[prop]) && (configObject[prop] !== '')) {
				this.config[prop] = $(configObject[prop]);
			}
		}

		// rewite this.config._keyboard object with the selected element (based on the initial value)
		// this value represent data-value
		for (let prop in this.config._keyboard) {
			if ((this.config._keyboard[prop]) && (this.config._keyboard[prop] !== '')) {
				this.config._keyboard[prop] = $('.key[data-value=' + this.config._keyboard[prop] + ']');
			}
		}

		// Set the click event handler for the elements
		this.config.keys.on('click', { Calculator: this }, function(e) {
			e.data.Calculator.update(this.dataset.value).mouseInteraction();
		});

		// Set the keydown event handler that will handle keyboard key presses
		// These will trigger clicks on the appropriate buttons
		$(document).keydown({ Calculator: this }, function(e) {
			e.data.Calculator.update().keyboardInteraction(e);
		});

	}

	update(input) {

		// Perfom actions on the Shadow Memmory
		const shadowMemory = function() {

			const _addCurrentMem = function(val, decimal = false) {
				if (this.mem.percent) {
					return;
				}
				if (this.mem.current !== '0') {
					if (decimal) {
						if (!this.mem.decimal) {
							this.mem.current += val;
							this.mem.decimal = true;
							dashboard.key(this.config.operators).off();
						}
					} else {
						this.mem.current += val;
						dashboard.key(this.config.operators).on();
						if (this.mem.chain.length < 1) {
							dashboard.key(this.config.equal).off();
						}
					}
				} else {
					if (!decimal) {
						this.mem.current = val;
						dashboard.key(this.config.operators).on();
						if (this.mem.chain.length < 1) {
							dashboard.key(this.config.equal).off();
						}
					} else {
						this.mem.current += val;
						this.mem.decimal = true;
						dashboard.key(this.config.operators).off();
					}
					if (val !== '0') {
						dashboard.key(this.config.backspace).on();
					}
				}
				// If the number doesn't fit on the screen add overflow visual que
				if (this.mem.current.length > 10) {
					dashboard.screen(this.config.overflow).on();
					dashboard.notify(this.config.error, this.notifications['number-too-long']).on();
				} else {
					dashboard.screen(this.config.overflow).off();
					dashboard.notify(this.config.error).off();
				}
				refresh.screen();
			}.bind(this);

			const _removeLastCurrent = function() {
				this.mem.current = this.mem.current.slice(0, -1);
				if ((this.mem.current === '') || (this.mem.current === '0')) {
					this.mem.current = '0';
					this.mem.decimal = false;
					dashboard.key(this.config.backspace).off();
				}
				if (this.mem.current.indexOf('.') === this.mem.current.length - 1) {
					dashboard.key(this.config.operators).off();
				}
				if (this.mem.current.indexOf('.') === -1) {
					this.mem.decimal = false;
					dashboard.key(this.config.operators).on();
					if (this.mem.chain.length < 1) {
						dashboard.key(this.config.equal).off();
					}
					if (this.mem.percent) {
						dashboard.key(this.config.percent).off();
					}
				}
				if (this.mem.total) {
					dashboard.notify(this.config.total).off();
					refresh.history();
					this.mem.chainReset();
					this.mem.total = false;
				}
				if (this.mem.current.length < 11) {
					dashboard.screen(this.config.overflow).off();
					if (this.mem.chain.join('').length < 24) {
						dashboard.notify(this.config.error).off();
					}
				}
				refresh.screen();
			}.bind(this);

			const _clearAll = function() {
				this.mem.chainReset();
				this.mem.current = '0';
				this.mem.decimal = false;
				this.mem.percent = false;
				this.mem.total = false;
				dashboard.key(this.config.backspace).off();
				dashboard.key(this.config.equal).off();
				dashboard.key(this.config.percent).on();
				dashboard.screen(this.config.overflow).off();
				dashboard.notify(this.config.error).off();
				dashboard.notify(this.config.total).off();
				dashboard.key(this.config.numbers).enable();
				refresh.history();
				refresh.screen();
			}.bind(this);

			const _addToChain = function(operator = '', percent = false) {
				if (this.mem.percent) {
					if (percent) {
						return;
					}
					this.mem.chain = operator;
					this.mem.percent = false;
					dashboard.key(this.config.percent).on();
					dashboard.key(this.config.numbers).enable();
				} else {
					if (this.mem.current.indexOf('.') === this.mem.current.length - 1) {
						return;
					}
					this.mem.chain = parseFloat(this.mem.current, 10);
					this.mem.chain = operator;
					this.mem.current = '0';
					this.mem.decimal = false;
					this.mem.percent = percent;
					if (this.mem.percent) {
						dashboard.key(this.config.percent).off();
						dashboard.key(this.config.numbers).disable();
						dashboard.key(this.config.equal).on();
					}
				}
				dashboard.screen(this.config.overflow).off();
				dashboard.notify(this.config.error).off();
				dashboard.key(this.config.backspace).off();
				if (this.mem.chain.length > 0) {
					this.mem.total = false;
					dashboard.notify(this.config.total).off();
					if (!this.mem.percent) {
						dashboard.key(this.config.equal).on();
					}
				}
				if (this.mem.chain.join('').length > 23) {
					dashboard.notify(this.config.error, this.notifications['chain-too-long']).on();
				}
				refresh.history();
				refresh.screen();
			}.bind(this);

			const _calculateTotal = function() {
				let resultChain = [];
				if (this.mem.chain.length < 1) {
					return;
				}
				if (this.mem.current.indexOf('.') === this.mem.current.length - 1) {
					dashboard.key(this.config.equal).off();
					return;
				}
				if (!this.mem.total) {
					if (!this.mem.percent) {
						this.mem.chain = parseFloat(this.mem.current, 10);
					} else {
						this.mem.chainReplaceLast('%');
						this.mem.percent = false;
						dashboard.key(this.config.numbers).enable();
						dashboard.key(this.config.percent).on();
					}
					resultChain = this.mem.chain.slice();
					refresh.result(resultChain);
					if (this.mem.chain.join('').length > 22) {
						dashboard.notify(this.config.error, this.notifications['chain-too-long']).on();
					}
					this.mem.chainReset();
					resultChain = resultChain.map((group) => {
						if (group === '×') {
							return '*';
						}
						if (group === '÷') {
							return '/';
						}
						if (group === '%') {
							return '/'+100;
						}
						return group;
					});
					this.mem.current = eval(resultChain.join('')).toString();
					this.mem.total = true;
					if (this.mem.current.indexOf('.') !== -1) {
						this.mem.decimal = true;
					}
					dashboard.key(this.config.equal).off();
					dashboard.key(this.config.backspace).on();
					if (this.mem.current.length > 10) {
						dashboard.screen(this.config.overflow).on();
						dashboard.notify(this.config.error, this.notifications['number-too-long']).on();
					}
					dashboard.notify(this.config.total, this.notifications.total).on();
					refresh.screen();
				}
			}.bind(this);

			return {
				clear: function() {
					_clearAll();
				},
				backspace: function() {
					_removeLastCurrent();
				},
				key: function() {
					_addCurrentMem(input);
				},
				decimal: function() {
					_addCurrentMem('.', true);
				},
				operator: function(operator, percent) {
					_addToChain(operator, percent);
				},
				equal: function() {
					_calculateTotal();
				}
			}
		}.bind(this);

		// Perfom actions on the calculator display
		const refresh = {
			screen: function() {
				this.config.screen.html(this.mem.current);
			}.bind(this),
			history: function() {
				if (this.mem.chain.length > 0) {
					this.config.history.html(this.mem.chain.join(' '));
				} else {
					this.config.history.html('0');
				}
			}.bind(this),
			result: function(array) {
				this.config.history.html(array.join(' ') + ' =');
			}.bind(this)
		}

		// Visuals of the calculator interface (functions / operators / screen / messages)
		const dashboard = {
			key: function(element) {
				return {
					on: function() {
						element.addClass('active');
					},
					off: function() {
						element.removeClass('active');
					},
					disable: function() {
						element.addClass('disabled');
					},
					enable: function() {
						element.removeClass('disabled');
					},
					press: function() {
						element.addClass('pressed');
						setTimeout(function() {
							element.trigger('click');
							element.removeClass('pressed');
						}, 100);
					}
				}
			},
			screen: function(element) {
				return {
					on: function() {
						element.addClass('overflow');
					},
					off: function() {
						element.removeClass('overflow');
					}
				}
			},
			notify: function(element, message = '') {
				return {
					on: function() {
						element.html(message);
					},
					off: function() {
						element.html('');
					}
				}
			}
		};

		return {
			mouseInteraction: function() {
				switch (input) {
					// Function: Clear all
					case 'c':
						shadowMemory().clear();
						break;
					// Function: Backspace
					case 'back':
						shadowMemory().backspace();
						break;
					// Operator: Addition
					case 'add':
						shadowMemory().operator('+');
						break;
					// Operator: Subtraction
					case 'sub':
						shadowMemory().operator('-');
						break;
					// Operator: Multiplication
					case 'mul':
						shadowMemory().operator('×');
						break;
					// Operator: Division
					case 'div':
						shadowMemory().operator('÷');
						break;
					// Operator: Percent
					case 'per':
						shadowMemory().operator('%', true);
						break;
					// Operator: Equal
					case 'equ':
						shadowMemory().equal();
						break;
					// Special: Decimal point
					case 'dec':
						shadowMemory().decimal();
						break;
					default:
						shadowMemory().key();
						break;
				}
			},
			keyboardInteraction: function(event) {
				switch (event.keyCode) {
					// BOTH KEYBOARD + KEYPAD
					// Keypress Enter (Return)
					case 13:
						dashboard.key(event.data.Calculator.config._keyboard.total).press();
						break;
					// Keypress Delete
					case 46:
						dashboard.key(event.data.Calculator.config._keyboard.backspace).press();
						break;
					// KEYBOARD
					// Keypress Backspace
					case 8:
						dashboard.key(event.data.Calculator.config._keyboard.backspace).press();
						event.preventDefault();
						break;
					// Keypress Esc (Escape)
					case 27:
						dashboard.key(event.data.Calculator.config._keyboard.clear).press();
						break;
					// Keypress 0 (Filter Closed Bracket)
					case 48:
						if (!event.shiftKey) {
							dashboard.key(event.data.Calculator.config._keyboard.zero).press();
						}
						break;
					// Keypress 1 (Filter Exclamation Mark)
					case 49:
						if (!event.shiftKey) {
							dashboard.key(event.data.Calculator.config._keyboard.one).press();
						}
						break;
					// Keypress 2 (Filter At)
					case 50:
						if (!event.shiftKey) {
							dashboard.key(event.data.Calculator.config._keyboard.two).press();
						}
						break;
					// Keypress 3 (Filter Pound)
					case 51:
						if (!event.shiftKey) {
							dashboard.key(event.data.Calculator.config._keyboard.three).press();
						}
						break;
					// Keypress 4 (Filter Dollar Sign)
					case 52:
						if (!event.shiftKey) {
							dashboard.key(event.data.Calculator.config._keyboard.four).press();
						}
						break;
					// Keypress 5 + Percent
					case 53:
						if (event.shiftKey) {
							// Percent
							dashboard.key(event.data.Calculator.config._keyboard.percent).press();
						} else {
							// Five
							dashboard.key(event.data.Calculator.config._keyboard.five).press();
						}
						break;
					// Keypress 6  (Filter Power Sign)
					case 54:
						if (!event.shiftKey) {
							dashboard.key(event.data.Calculator.config._keyboard.six).press();
						}
						break;
					// Keypress 7 (Filter Ampersand)
					case 55:
						if (!event.shiftKey) {
							dashboard.key(event.data.Calculator.config._keyboard.seven).press();
						}
						break;
					// Keypress 8 + Multiplication (*)
					case 56:
						if (event.shiftKey) {
							// Multiplication
							dashboard.key(event.data.Calculator.config._keyboard.multiply).press();
						} else {
							// Eight
							dashboard.key(event.data.Calculator.config._keyboard.eight).press();
						}
						break;
					// Keypress 9 (Filter Open Bracket)
					case 57:
						if (!event.shiftKey) {
							dashboard.key(event.data.Calculator.config._keyboard.nine).press();
						}
						break;
					// Keypress Add (+) + Equal (=)
					case 61:
					case 187: // Different keyCode on Chrome
						if (event.shiftKey) {
							dashboard.key(event.data.Calculator.config._keyboard.add).press();
						} else {
							dashboard.key(event.data.Calculator.config._keyboard.total).press();
						}
						break;
					// Keypress C or c (We use both versions)
					case 67:
						dashboard.key(event.data.Calculator.config._keyboard.clear).press();
						break;
					// Keypress Subtract (-)
					case 173:
					case 189: // Different keyCode on Chrome
						if (!event.shiftKey) {
							dashboard.key(event.data.Calculator.config._keyboard.subtract).press();
						}
						break;
					// Keypress Comma (,) + Decimal (.)
					case 188:
					case 190:
						if (!event.shiftKey) {
							dashboard.key(event.data.Calculator.config._keyboard.decimal).press();
						}
						break;
					// Keypress Division (/)
					case 191:
						if (!event.shiftKey) {
							dashboard.key(event.data.Calculator.config._keyboard.divide).press();
						}
						break;
					// KEYPAD
					// Keypress 0
					case 96:
						dashboard.key(event.data.Calculator.config._keyboard.zero).press();
						break;
					// Keypress 1
					case 97:
						dashboard.key(event.data.Calculator.config._keyboard.one).press();
						break;
					// Keypress 2
					case 98:
						dashboard.key(event.data.Calculator.config._keyboard.two).press();
						break;
					// Keypress 3
					case 99:
						dashboard.key(event.data.Calculator.config._keyboard.three).press();
						break;
					// Keypress 4
					case 100:
						dashboard.key(event.data.Calculator.config._keyboard.four).press();
						break;
					// Keypress 5
					case 101:
						dashboard.key(event.data.Calculator.config._keyboard.five).press();
						break;
					// Keypress 6
					case 102:
						dashboard.key(event.data.Calculator.config._keyboard.six).press();
						break;
					// Keypress 7
					case 103:
						dashboard.key(event.data.Calculator.config._keyboard.seven).press();
						break;
					// Keypress 8
					case 104:
						dashboard.key(event.data.Calculator.config._keyboard.eight).press();
						break;
					// Keypress 9
					case 105:
						dashboard.key(event.data.Calculator.config._keyboard.nine).press();
						break;
					// Keypress Multiplication (*)
					case 106:
						dashboard.key(event.data.Calculator.config._keyboard.multiply).press();
						break;
					// Keypress Subtract (-)
					case 109:
						dashboard.key(event.data.Calculator.config._keyboard.subtract).press();
						break;
					// Keypress Add (+)
					case 107:
						dashboard.key(event.data.Calculator.config._keyboard.add).press();
						break;
					// Keypress Decimal (.)
					case 110:
						dashboard.key(event.data.Calculator.config._keyboard.decimal).press();
						break;
					// Keypress Division (/)
					case 111:
						dashboard.key(event.data.Calculator.config._keyboard.divide).press();
						break;
					default:
						break;
				}
			}
		}
	}
};

(function () {

	new Calculator({

		// element hooks, will be passed to jquery's selector
		keys: '.key',
		screen: '#screen',
		history: '#history',
		overflow: '.current',
		numbers: '.number',
		backspace: '.backspace',
		operators: '.operator',
		percent: '.percent',
		equal: '.equal',
		error: '#error',
		total: '#total'

	});

}());

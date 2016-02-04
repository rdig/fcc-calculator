const Calculator = class {

	constructor(configObject) {

		let mem = {
			chain: [],
			current: '0',
			decimal: false,
			operator: false,
			multiply: false,
			percent: false,
			total: false
		};

		this.config = {};

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
			get multiply() {
				return mem.multiply;
			},
			set multiply(bool) {
				mem.multiply = bool;
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

		// Set the click event handler for the elements
		this.config.keys.on('click', { Calculator: this }, function(e) {
			e.data.Calculator.update(this.dataset.value).mouseInteraction();
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
						if (!this.mem.multiply) {
							dashboard.key(this.config.percent).off();
						}
					}
				} else {
					if (val === '0') {
						return;
					}
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
					dashboard.key(this.config.backspace).on();
					if (!this.mem.multiply) {
						dashboard.key(this.config.percent).off();
					}
				}
				// If the number doesn't fit on the screen add overflow visual que
				if (this.mem.current.length > 10) {
					dashboard.screen(this.config.overflow).on();
				} else {
					dashboard.screen(this.config.overflow).off();
				}
				refresh.screen();
			}.bind(this);

			const _removeLastCurrent = function() {
				if (this.mem.current !== '0') {
					this.mem.current = this.mem.current.slice(0, -1);
					if ((this.mem.current === '') || (this.mem.current === '0')) {
						this.mem.current = '0';
						this.mem.decimal = false;
						dashboard.key(this.config.backspace).off();
						dashboard.key(this.config.operators).off();
					}
					if (this.mem.current.indexOf('.') === this.mem.current.length - 1) {
						dashboard.key(this.config.operators).off();
					}
					if (this.mem.current.indexOf('.') === -1) {
						this.mem.decimal = false;
						if (this.mem.current !== '0') {
							dashboard.key(this.config.operators).on();
						}
						if (!this.mem.multiply) {
							dashboard.key(this.config.percent).off();
						}
					}
					if (this.mem.current.length < 11) {
						dashboard.screen(this.config.overflow).off();
					}
					refresh.screen();
				}
			}.bind(this);

			const _clearAll = function() {
				this.mem.chainReset();
				this.mem.current = '0';
				this.mem.decimal = false;
				this.mem.operator = false;
				this.mem.multiply = false;
				this.mem.percent = false;
				this.mem.total = false;
				dashboard.key(this.config.backspace).off();
				dashboard.key(this.config.operators).off();
				dashboard.screen(this.config.overflow).off();
				dashboard.key(this.config.numbers).enable();
				refresh.history();
				refresh.screen();
			}.bind(this);

			const _addToChain = function(operator = '', percent = false, multiply = this.mem.multiply) {
				if (percent && !multiply) {
					return;
				}
				if (this.mem.current !== '0') {
					if (this.mem.current.indexOf('.') === this.mem.current.length - 1) {
						return;
					}
					this.mem.operator = true;
					this.mem.chain = parseFloat(this.mem.current, 10);
					this.mem.chain = operator;
					this.mem.current = '0';
					this.mem.decimal = false;
					this.mem.multiply = multiply;
					this.mem.percent = percent;
					if (percent) {
						this.mem.multiply = false;
					}
				} else {
					if (!percent) {
						if (this.mem.operator) {
							if (this.mem.percent) {
								this.mem.chain = operator;
							} else {
								this.mem.chainReplaceLast(operator);
							}
							this.mem.multiply = multiply;
							this.mem.percent = percent;
						}
					}
				}
				dashboard.key(this.config.numbers).enable();
				dashboard.key(this.config.percent).off();
				if (this.mem.percent) {
					dashboard.key(this.config.numbers).disable();
				}
				if (this.mem.multiply) {
					dashboard.key(this.config.percent).on();
				}
				dashboard.screen(this.config.overflow).off();
				dashboard.key(this.config.backspace).off();
				if (this.mem.chain.length > 0) {
					this.mem.total = false;
					dashboard.key(this.config.equal).on();
				}
				refresh.history();
				refresh.screen();
			}.bind(this);

			const _calculateTotal = function() {
				let resultChain = [];
				if (this.mem.chain.length > 0) {
					if (this.mem.current.indexOf('.') === this.mem.current.length - 1) {
						dashboard.key(this.config.equal).off();
						return;
					}
					if (!this.mem.total) {
						if (this.mem.percent) {
							if (this.mem.current !== '0') {
								this.mem.chain = '+' + parseFloat(this.mem.current, 10);
								// TODO: If the chain is to long, show a warning
							}
						} else {
							if (this.mem.current !== '0') {
								this.mem.chain = parseFloat(this.mem.current, 10);
								// TODO: If the chain is to long, show a warning
							} else {
								this.mem.chainReplaceLast('');
							}
						}
						resultChain = this.mem.chain.slice();
						refresh.result(resultChain);
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
						this.mem.multiply = false;
						dashboard.key(this.config.equal).off();
						dashboard.key(this.config.percent).off();
						if (this.mem.current.length > 10) {
							dashboard.screen(this.config.overflow).on();
						}
						// TODO: If the current number is to long, show a warning
						// TODO: Show a message stating this is the result
						refresh.screen();
					}
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
				operator: function(operator, percent, multiply) {
					_addToChain(operator, percent, multiply);
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

		// Visuals of the calculator interface (functions / operators / screen)
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
						shadowMemory().operator('+', false, false);
						break;
					// Operator: Subtraction
					case 'sub':
						shadowMemory().operator('-', false, false);
						break;
					// Operator: Multiplication
					case 'mul':
						shadowMemory().operator('×', false, true);
						break;
					// Operator: Division
					case 'div':
						shadowMemory().operator('÷', false, false);
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
			keyboardInteraction: function() {}
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
		equal: '.equal'

	});

}());

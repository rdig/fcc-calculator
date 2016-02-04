const Calculator = class {

	constructor(configObject) {

		let mem = {
			chain: [],
			current: '0',
			decimal: false,
			operator: false
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
			get operator() {
				return mem.operator;
			},
			set operator(bool) {
				mem.operator = bool;
			},
			chainReset() {
				mem.chain = [];
			},
			chainReplaceLast(value) {
				mem.chain.splice(-1, 1, value);
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
				if (this.mem.current !== '0') {
					if (decimal) {
						if (!this.mem.decimal) {
							this.mem.current += val;
							this.mem.decimal = true;
						}
					} else {
						this.mem.current += val;
						dashboard.key();
					}
				} else {
					if (!decimal) {
						this.mem.current = val;
					}
					dashboard.key(this.config.backspace).on();
					dashboard.key(this.config.operators).on();
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
					if (this.mem.current === '') {
						this.mem.current = '0';
						dashboard.key(this.config.backspace).off();
						dashboard.key(this.config.operators).off();
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
				dashboard.key(this.config.backspace).off();
				dashboard.key(this.config.operators).off();
				dashboard.screen(this.config.overflow).off();
				refresh.history();
				refresh.screen();
			}.bind(this);

			const _addToChain = function(operator, percent = false) {
				if (percent) {
					console.log('Percent function not implemented yet');
					return;
				}
				if (this.mem.current !== '0') {
					this.mem.operator = true;
					this.mem.chain = this.mem.current;
					this.mem.chain = operator;
					this.mem.current = '0';
				} else {
					if (this.mem.operator) {
						this.mem.chainReplaceLast(operator);
					}
				}
				refresh.history();
				refresh.screen();
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
						console.log('percent of')
						break;
					// Operator: Equal
					case 'equ':
						console.log('equals')
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
		backspace: '.backspace',
		operators: '.operator'

	});

}());

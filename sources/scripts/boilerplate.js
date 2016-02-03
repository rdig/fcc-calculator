(function () {

	let keys = $('.key');
	let screen = $('#screen');
	let overflow = $('.current');
	let backspace = $('.backspace');
	let operators = $('.operator');
	// let history = $('#history');

	let update = function(newInput) {

		switch (newInput) {
			// Function: Clear all
			case 'c':
				updateShadowMemmory._clearAll();
				break;
			// Function: Backspace
			case 'back':
				updateShadowMemmory.backspace();
				break;
			// Operator: Addition
			case 'add':
				console.log('add')
				break;
			// Operator: Subtraction
			case 'sub':
				console.log('subtract')
				break;
			// Operator: Multiplication
			case 'mul':
				console.log('multiply')
				break;
			// Operator: Division
			case 'div':
				console.log('divide')
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
				updateShadowMemmory.decimal();
				break;
			default:
				updateShadowMemmory.key(newInput);
				break;
		}
	};

	let updateScreen = function(val, display = screen) {
		display.html(val);
	};

	// let updateHistory = function(val) {};

	let updateInterface = {
		key: function(keyElement) {
			return {
				_isOn: function() {
					return keyElement.hasClass('active');
				},
				on: function() {
					keyElement.addClass('active');
				},
				off: function() {
					keyElement.removeClass('active');
				}
			}
		},
		screenOverflow: {
			on: function() {
				overflow.addClass('overflow');
			},
			off: function() {
				overflow.removeClass('overflow');
			}
		}
	};

	let updateShadowMemmory = {
		memmory : {
			chain: [],
			current: '0',
			decCount: false
		},
		_addCurrentMem: function(val) {
			if (this.memmory.current !== '0') {
				this.memmory.current += val;
			} else {
				this.memmory.current = val;
				updateInterface.key(backspace).on();
				updateInterface.key(operators).on();
			}
			if (this.memmory.current.length > 10) {
				updateInterface.screenOverflow.on();
			} else {
				updateInterface.screenOverflow.off();
			}
			updateScreen(this.memmory.current);
		},
		_removeLastCurrent: function() {
			if (this.memmory.current !== '0') {
				this.memmory.current = this.memmory.current.slice(0, -1);
				if (this.memmory.current === '') {
					this.memmory.current = '0';
					updateInterface.key(backspace).off();
					updateInterface.key(operators).off();
					updateInterface.screenOverflow.off();
				}
				if (this.memmory.current.length < 11) {
					updateInterface.screenOverflow.off();
				}
			}
			updateScreen(this.memmory.current);
		},
		_clearAll: function() {
			this.memmory = {
				chain: [],
				current: '0',
				decCount: false
			};
			updateInterface.key(backspace).off();
			updateInterface.key(operators).off();
			updateInterface.screenOverflow.off();
			updateScreen(this.memmory.current);
		},
		backspace: function() {
			if (updateInterface.key(backspace)._isOn()) {
				this._removeLastCurrent();
			}
		},
		key: function(val) {
			this._addCurrentMem(val);
		},
		decimal: function() {
			if (!this.memmory.decCount) {
				this._addCurrentMem('.');
				this.memmory.decCount = true;
			}
		}
	};

	keys.on('click', function() {
		update(this.dataset.value);
	});

}());

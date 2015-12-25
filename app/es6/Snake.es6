'use strict';

require('./object-assign-polyfill.es6');

var defaultOptions = {
	parent: document.body,
	interval: 100,
	size: 20,
	spacing: 1,
	ai: false,
};

function getRandomIntInclusive(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*
 * Coordinates:
 * 	(0, 0) is at the top center
 * 	x increases towards the right
 * 	y increases towards the bottom
 */

module.exports = class Snake {
	constructor(options) {
		this.directions = {
			up: {
				delta: (x, y) => [x, y - 1],
				keycode: 38,
			},
			right: {
				delta: (x, y) => [x + 1, y],
				keycode: 39,
			},
			down: {
				delta: (x, y) => [x, y + 1],
				keycode: 40,
			},
			left: {
				delta: (x, y) => [x - 1, y],
				keycode: 37,
			},
		};
		this.options = Object.assign({}, defaultOptions, options);
		this.interval = setInterval(() => this.step(), this.options.interval);

		// Bind to events
		window.addEventListener('keydown', (e) => this.onKeyDown(e));

		this.start();
	}

	get boardSize() {
		var maxX = Math.floor((document.body.offsetWidth / this.options.size - 1) / 2);
		return {
			x: {
				min: -maxX,
				max: maxX,
			},
			y: {
				min: 0,
				max: Math.floor(document.body.offsetHeight / this.options.size) - 1,
			},
		};
	}

	get head() {
		return this.snake[this.snake.length - 1];
	}

	createFood() {
		var x, y;

		while (x === undefined || this.testCollision(x, y)) {
			x = getRandomIntInclusive(this.boardSize.x.min, this.boardSize.x.max);
			y = getRandomIntInclusive(this.boardSize.y.min, this.boardSize.y.max);
		}

		this.food.x = x;
		this.food.y = y;
		this.draw();
	}

	die() {
		console.log('You died');
		this.start(true);
	}

	draw() {
		// Create food element
		if (!this.food.elm) {
			this.food.elm = document.createElement('div');
			this.food.elm.className = 'snake__food';
			this.options.parent.appendChild(this.food.elm);
		}

		// Position food elements
		this.positionSquare(this.food.elm, this.food.x, this.food.y);

		// Create new snake elements
		this.snake.forEach((seg) => {
			if (!seg.elm) {
				seg.elm = document.createElement('div');
				seg.elm.className = 'snake__seg';
				this.positionSquare(seg.elm, seg.x, seg.y);
				this.options.parent.appendChild(seg.elm);
			}
		});

		// Delete old elements
		this.removalQueue.forEach((seg) => {
			if (seg.elm)
				this.options.parent.removeChild(seg.elm);
		});
		this.removalQueue = [];
	}

	onKeyDown(e) {
		var keyDirection;
		Object.keys(this.directions).forEach((direction) => {
			if (this.directions[direction].keycode === e.which)
				keyDirection = direction;
		});
		if (!keyDirection)
			return;

		e.preventDefault();

		if (this.testDirection(keyDirection))
			this.direction = keyDirection;

		this.ai = false;
	}

	start(clean) {
		if (clean) {
			// First clean up old elements
			this.removalQueue.push(this.food);
			this.snake.forEach(seg => this.removalQueue.push(seg));
			this.draw();
		}

		this.food = {x: null, y: null};
		this.snake = [{x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 2}];
		this.removalQueue = [];
		this.lastDirection = this.direction = 'down';

		this.createFood();

		if (this.options.ai) {
			this.ai = new this.options.ai(this);
		}
	}

	step() {
		var newSquare = {};
		[newSquare.x, newSquare.y] = this.directions[this.direction].delta(this.head.x, this.head.y);

		// Test for collision
		var collision = this.testCollision(newSquare.x, newSquare.y);
		if (!collision) {
			this.snake.push(newSquare);
			this.removalQueue.push(this.snake.shift());
		} else if (collision === 'food') {
			this.snake.push(newSquare);
			this.createFood();
		} else {
			this.die();
		}

		this.draw();
		this.lastDirection = this.direction;
		if (this.ai)
			this.direction = this.ai.getDirection();
	}

	testCollision(x, y) {
		// Food
		if (x === this.food.x && y === this.food.y)
			return 'food';

		// Snake
		for (var i = 0; i < this.snake.length; i++) {
			if (x === this.snake[i].x && y === this.snake[i].y)
				return 'snake';
		}

		// Edge
		if (
			x > this.boardSize.x.max || x < this.boardSize.x.min ||
			y > this.boardSize.y.max || y < this.boardSize.y.min
		) {
			return 'edge';
		}
		return null;
	}

	testDirection(direction) {
		var directionArr = Object.keys(this.directions);
		var oppositeDirection = directionArr[(directionArr.indexOf(direction) + 2) % 4];
		return this.lastDirection !== oppositeDirection;
	}

	positionSquare(element, x, y) {
		element.style.width  = this.options.size - this.options.spacing * 2 + 'px';
		element.style.height = this.options.size - this.options.spacing * 2 + 'px';
		element.style.marginTop  = y * this.options.size + 'px';
		element.style.marginLeft = (x - 0.5) * this.options.size + 'px';
	}
};

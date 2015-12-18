'use strict';

module.exports = class SnakeAI {
	constructor(game) {
		this.game = game;
	}

	calculateDistance(a, b) {
		return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
	}

	calculateDistanceAfterInstruction(direction) {
		var newPosition = {};
		[newPosition.x, newPosition.y] = this.game.directions[direction].delta(this.game.head.x, this.game.head.y);

		var collision = this.game.testCollision(newPosition.x, newPosition.y);
		if (collision && collision !== 'food')
			return Infinity;

		return this.calculateDistance(newPosition, this.game.food);
	}

	getDirection() {
		var directionArr = Object.keys(this.game.directions);
		var directionIndex = directionArr.indexOf(this.game.lastDirection);
		var distance = this.calculateDistance(this.game.head, this.game.food);

		var preference = [
			directionArr[(directionIndex + 1) % 4], // Turn right
			directionArr[directionIndex],           // Go forward
			directionArr[(directionIndex + 3) % 4], // Turn left
		];

		var i, direction;

		// First try to find the best direction
		for (i = 0; i < preference.length; i++) {
			direction = preference[i];
			if (this.calculateDistanceAfterInstruction(direction) < distance)
				return direction;
		}

		// If nothing gets the snake closer, just make any move that won't kill it
		for (i = 0; i < preference.length; i++) {
			direction = preference[i];
			if (this.calculateDistanceAfterInstruction(direction) < Infinity)
				return direction;
		}

		// If it's got this far in, it's dead
		return this.game.direction;
	}
};

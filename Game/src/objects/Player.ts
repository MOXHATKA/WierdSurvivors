import Actor from "./Actor";

export default class Player extends Actor {
    // declare body: Phaser.Physics.Arcade.Body;
	// static default: any;
    constructor(scene: any, x: number, y: number,  texture: string ){
        super(scene, x, y, texture);
    }
}